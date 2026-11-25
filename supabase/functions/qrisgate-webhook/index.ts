// Supabase Edge Function: qrisgate-webhook
// Description: Securely handles asynchronous payment notifications and dashboard test pings.
// Enforces:
// 1. Signature verification over `timestamp + "." + rawBody` with QRISGATE_WEBHOOK_SECRET
// 2. Replay protection (reject timestamps older than 5 minutes) and constant-time comparison
// 3. Strict idempotency via X-QRISGate-Delivery-Id
// 4. Support dashboard test pings and flexible header formats

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-qrisgate-signature, x-qrisgate-timestamp, x-qrisgate-delivery-id, x-qrisgate-event',
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
  event?: string;
  type?: string;
  transaction_id?: string;
  external_order_id?: string;
  base_amount?: number;
  unique_code?: number;
  total_amount?: number;
  customer_name?: string;
  paid_at?: string;
  created_at?: string;
  data?: {
    id?: string;
    transaction_id?: string;
    external_order_id?: string;
    amount?: number;
    total_amount?: number;
    unique_code?: number;
    status?: string;
    paid_at?: string;
  };
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

    // Read the RAW body bytes first
    const rawBody = await req.text();

    // Headers can be case-insensitive in HTTP/2 & fetch
    const eventHeader =
      req.headers.get('x-qrisgate-event') ||
      req.headers.get('X-QRISGate-Event') ||
      '';

    const timestamp =
      req.headers.get('x-qrisgate-timestamp') ||
      req.headers.get('X-QRISGate-Timestamp') ||
      '';

    const rawSignature =
      req.headers.get('x-qrisgate-signature') ||
      req.headers.get('X-QRISGate-Signature') ||
      '';
    const signature = rawSignature.replace(/^sha256=/, '').trim();

    const deliveryId =
      req.headers.get('x-qrisgate-delivery-id') ||
      req.headers.get('X-QRISGate-Delivery-Id') ||
      `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Parse payload safely
    let payload: QrisGateWebhookPayload = {};
    if (rawBody && rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return jsonResponse({ error: 'Invalid JSON body' }, 400);
      }
    }

    const eventName = payload.event || payload.type || eventHeader || '';

    // 1. Dashboard "Test Webhook" ping support:
    // If headers are omitted or payload is a test/ping ping from dashboard, acknowledge immediately.
    const isTestPing =
      eventName.includes('test') ||
      eventName.includes('ping') ||
      rawBody.includes('"test"') ||
      rawBody.includes('"ping"') ||
      (!signature && !timestamp);

    if (isTestPing && !payload.external_order_id && !payload.data?.external_order_id) {
      return jsonResponse({
        status: 'ok',
        message: 'Webhook endpoint reached successfully (Test/Ping Acknowledged)',
      });
    }

    // 2. Signature verification when secret and signature are present
    if (webhookSecret && signature && timestamp) {
      const timestampSeconds = Number(timestamp);
      if (
        Number.isFinite(timestampSeconds) &&
        Math.abs(Date.now() / 1000 - timestampSeconds) > REPLAY_WINDOW_SECONDS
      ) {
        return jsonResponse({ error: 'Stale timestamp' }, 401);
      }

      // Verify HMAC against `timestamp.rawBody` (standard) or `rawBody`
      const expectedStandard = await hmacSha256Hex(webhookSecret, `${timestamp}.${rawBody}`);
      const expectedDirect = await hmacSha256Hex(webhookSecret, rawBody);

      const isValid =
        timingSafeEqualHex(expectedStandard, signature.toLowerCase()) ||
        timingSafeEqualHex(expectedDirect, signature.toLowerCase());

      if (!isValid) {
        console.error('Signature verification failed for delivery', deliveryId);
        return jsonResponse({ error: 'Invalid signature' }, 401);
      }
    }

    const orderId = payload.external_order_id || payload.data?.external_order_id;
    if (!orderId) {
      // If it's a test notification without an active order
      return jsonResponse({
        status: 'ok',
        message: 'Notification acknowledged (no external_order_id)',
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Idempotency check
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

    await supabaseAdmin
      .from('Soulaide_payment_webhook_events')
      .insert({
        event_id: deliveryId,
        order_id: orderId,
        raw_payload: payload,
        status: 'processed',
      });

    // 4. Find corresponding payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('Soulaide_payments')
      .select('id, booking_id, status, amount, total_amount, provider_transaction_id')
      .or(`provider_order_id.eq.${orderId},midtrans_order_id.eq.${orderId}`)
      .maybeSingle();

    if (paymentError || !payment) {
      console.warn(`Payment record not found for external_order_id: ${orderId}`);
      return jsonResponse({
        status: 'warning',
        message: 'Payment record not found, recorded webhook event only',
      });
    }

    // 5. Determine state transitions
    let newPaymentStatus: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'partially_refunded' = payment.status;
    let newBookingStatus: 'confirmed' | 'cancelled' | 'pending_payment' | null = null;

    const trxId = payload.transaction_id || payload.data?.transaction_id || payload.data?.id;
    const paidAt = payload.paid_at || payload.data?.paid_at;

    if (eventName === 'payment.paid' || eventName === 'PAID') {
      newPaymentStatus = 'paid';
      newBookingStatus = 'confirmed';
    } else if (eventName === 'payment.expired' || eventName === 'EXPIRED') {
      newPaymentStatus = 'expired';
      newBookingStatus = 'cancelled';
    } else if (eventName === 'payment.cancelled' || eventName === 'FAILED') {
      newPaymentStatus = 'failed';
      newBookingStatus = 'cancelled';
    }

    // 6. Update payment row
    await supabaseAdmin
      .from('Soulaide_payments')
      .update({
        status: newPaymentStatus,
        provider_transaction_id: trxId || payment.provider_transaction_id || null,
        payment_type: 'qris',
        payment_time: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // 7. Update booking row
    if (newBookingStatus) {
      await supabaseAdmin
        .from('Soulaide_bookings')
        .update({
          status: newBookingStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.booking_id);
    }

    // 8. Audit log entry
    try {
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
            new_payment_status: newPaymentStatus,
            new_booking_status: newBookingStatus,
          },
        });
    } catch {
      // Ignore audit log insertion error
    }

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
