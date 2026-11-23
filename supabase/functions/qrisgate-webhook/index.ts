// Supabase Edge Function: qrisgate-webhook
// Description: Securely handles asynchronous payment notifications from QRISGate.
// Enforces:
// 1. HMAC-SHA256 signature verification over `timestamp + "." + rawBody` with QRISGATE_WEBHOOK_SECRET
// 2. Replay protection (reject timestamps older than 5 minutes) and constant-time comparison
// 3. Strict idempotency via X-QRISGate-Delivery-Id (same id across retries)
// 4. Status synchronization between Soulaide_payments and Soulaide_bookings
// 5. Audit logging into Soulaide_audit_logs
//
// QRISGate payload is FLAT (no `data` wrapper):
// { event, transaction_id, external_order_id, base_amount, unique_code, total_amount,
//   customer_name, paid_at, created_at }
// Events: payment.paid | payment.expired | payment.cancelled

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REPLAY_WINDOW_SECONDS = 300;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time comparison of two hex digests (length check first, then XOR accumulate).
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return toHex(signature);
}

interface QrisGateWebhookPayload {
  event: string;
  transaction_id?: string;
  external_order_id?: string;
  base_amount?: number;
  unique_code?: number;
  total_amount?: number;
  customer_name?: string;
  paid_at?: string;
  created_at?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const webhookSecret = Deno.env.get('QRISGATE_WEBHOOK_SECRET') || '';
    if (!webhookSecret) {
      console.error('QRISGATE_WEBHOOK_SECRET is not configured; refusing webhook.');
      return jsonResponse({ error: 'Webhook secret not configured' }, 500);
    }

    // Read the RAW body bytes first — the signature covers the exact serialization QRISGate sent.
    const rawBody = await req.text();

    const event = req.headers.get('X-QRISGate-Event') || '';
    const timestamp = req.headers.get('X-QRISGate-Timestamp') || '';
    const signature = (req.headers.get('X-QRISGate-Signature') || '').replace(/^sha256=/, '');
    const deliveryId = req.headers.get('X-QRISGate-Delivery-Id') || '';

    if (!timestamp || !signature || !deliveryId) {
      return jsonResponse({ error: 'Missing required webhook headers' }, 400);
    }

    // 1. Replay window — reject anything signed more than 5 minutes ago.
    const timestampSeconds = Number(timestamp);
    if (!Number.isFinite(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > REPLAY_WINDOW_SECONDS) {
      return jsonResponse({ error: 'Stale timestamp' }, 401);
    }

    // 2. HMAC over the RAW body, constant-time comparison.
    const expectedSignature = await hmacSha256Hex(webhookSecret, `${timestamp}.${rawBody}`);
    if (!timingSafeEqualHex(expectedSignature, signature.toLowerCase())) {
      console.error('QRISGate signature verification failed for delivery', deliveryId);
      return jsonResponse({ error: 'Invalid signature' }, 401);
    }

    let payload: QrisGateWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ error: 'Invalid JSON payload' }, 400);
    }

    const eventName = payload.event || event;
    const orderId = payload.external_order_id;
    if (!eventName || !orderId) {
      return jsonResponse({ error: 'Missing required notification fields' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Idempotency check — delivery id is stable across retries of the same event.
    const { data: existingEvent } = await supabaseAdmin
      .from('Soulaide_payment_webhook_events')
      .select('id, status')
      .eq('event_id', deliveryId)
      .maybeSingle();

    if (existingEvent) {
      return jsonResponse({
        status: 'ok',
        message: 'Notification already processed (idempotent duplicate skipped)',
      });
    }

    // Record webhook event in audit table
    await supabaseAdmin
      .from('Soulaide_payment_webhook_events')
      .insert({
        event_id: deliveryId,
        order_id: orderId,
        raw_payload: payload,
        status: 'processed',
      });

    // 4. Find corresponding payment record by our external order id
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('Soulaide_payments')
      .select('id, booking_id, status, amount, total_amount, provider_transaction_id')
      .eq('provider_order_id', orderId)
      .maybeSingle();

    if (paymentError || !payment) {
      console.warn(`Payment record not found for external_order_id: ${orderId}`);
      return jsonResponse({
        status: 'warning',
        message: 'Payment record not found, recorded webhook only',
      });
    }

    // Cross-check the provider transaction id when both sides have one.
    if (
      payload.transaction_id &&
      payment.provider_transaction_id &&
      payload.transaction_id !== payment.provider_transaction_id
    ) {
      console.error('QRISGate transaction_id mismatch for order', orderId);
      return jsonResponse({ error: 'Transaction id mismatch' }, 400);
    }

    // 5. Determine state transitions from the QRISGate event
    let newPaymentStatus: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'partially_refunded' = payment.status;
    let newBookingStatus: 'confirmed' | 'cancelled' | 'pending_payment' | null = null;

    if (eventName === 'payment.paid') {
      // Only mark paid when the detected amount matches the exact expected total.
      const expectedTotal = Number(payment.total_amount ?? payment.amount);
      if (payload.total_amount !== undefined && Number(payload.total_amount) !== expectedTotal) {
        console.error('QRISGate paid amount mismatch for order', orderId, {
          received: payload.total_amount,
          expected: expectedTotal,
        });
        return jsonResponse({
          status: 'warning',
          message: 'Paid amount does not match expected total; payment left pending',
        });
      }
      newPaymentStatus = 'paid';
      newBookingStatus = 'confirmed';
    } else if (eventName === 'payment.expired') {
      newPaymentStatus = 'expired';
      newBookingStatus = 'cancelled';
    } else if (eventName === 'payment.cancelled') {
      newPaymentStatus = 'failed';
      newBookingStatus = 'cancelled';
    }

    // 6. Update public."Soulaide_payments"
    await supabaseAdmin
      .from('Soulaide_payments')
      .update({
        status: newPaymentStatus,
        provider_transaction_id: payload.transaction_id || payment.provider_transaction_id || null,
        payment_type: 'qris',
        payment_time: payload.paid_at ? new Date(payload.paid_at).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // 7. Update public."Soulaide_bookings" if state changed
    if (newBookingStatus) {
      await supabaseAdmin
        .from('Soulaide_bookings')
        .update({
          status: newBookingStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.booking_id);
    }

    // 8. Audit Log entry (live schema: entity_name / entity_id / metadata NOT NULL)
    await supabaseAdmin
      .from('Soulaide_audit_logs')
      .insert({
        action: 'QRISGATE_WEBHOOK_PROCESSED',
        entity_name: 'payment',
        entity_id: payment.id,
        metadata: {
          order_id: orderId,
          event: eventName,
          delivery_id: deliveryId,
          total_amount: payload.total_amount ?? null,
          new_payment_status: newPaymentStatus,
          new_booking_status: newBookingStatus,
        },
      });

    return jsonResponse({
      status: 'ok',
      payment_status: newPaymentStatus,
      booking_status: newBookingStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonResponse({ error: message }, 500);
  }
});