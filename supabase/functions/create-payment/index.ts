// Supabase Edge Function: create-payment
// Description: Securely creates a dynamic QRIS payment session for a Soulaide booking.
// Enforces:
// 1. JWT authentication and customer ownership check
// 2. Booking status validation (must be 'pending_payment')
// 3. Price validation directly from database (Soulaide_services.price), never trusting client-sent amount
// 4. Server-side communication with API using QRISGATE_API_KEY (never exposed to client)
// 5. Reuse of an existing unexpired pending payment instead of allocating a new unique code

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const QRISGATE_API_BASE = 'https://qrisgate.web.id';
const SESSION_TTL_MINUTES = 15;

interface CreatePaymentRequest {
  booking_id: string;
}

interface QrisGateTransactionData {
  transaction_id: string;
  external_order_id: string;
  merchant_name?: string;
  base_amount: number;
  unique_code: number;
  total_amount: number;
  qr_string: string;
  qr_image_base64: string | null;
  checkout_url: string;
  expires_at: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const qrisgateApiKey = Deno.env.get('QRISGATE_API_KEY') || '';

    // Create admin Supabase client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized user token' }, 401);
    }

    const { booking_id }: CreatePaymentRequest = await req.json();
    if (!booking_id) {
      return jsonResponse({ error: 'Missing booking_id parameter' }, 400);
    }

    // 1. Fetch booking and verify ownership
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('Soulaide_bookings')
      .select('id, booking_code, customer_id, service_id, psychologist_id, status, delivery_method')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return jsonResponse({ error: 'Booking not found' }, 404);
    }

    if (booking.customer_id !== user.id) {
      return jsonResponse({ error: 'Forbidden: You do not own this booking' }, 403);
    }

    if (booking.status !== 'pending_payment') {
      return jsonResponse({ error: `Cannot pay for booking with status: ${booking.status}` }, 400);
    }

    // 2. Reuse an existing unexpired pending payment session for this booking.
    const { data: existingPayment } = await supabaseAdmin
      .from('Soulaide_payments')
      .select('*')
      .eq('booking_id', booking.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPayment && existingPayment.expires_at && new Date(existingPayment.expires_at) > new Date()) {
      return jsonResponse({
        order_id: existingPayment.provider_order_id,
        transaction_id: existingPayment.provider_transaction_id,
        amount: Number(existingPayment.amount),
        unique_code: existingPayment.unique_code ?? 0,
        total_amount: Number(existingPayment.total_amount ?? existingPayment.amount),
        qr_string: existingPayment.qr_string,
        qr_image_base64: existingPayment.qr_image,
        checkout_url: existingPayment.checkout_url,
        expires_at: existingPayment.expires_at,
        mode: existingPayment.provider_transaction_id ? 'live' : 'mock',
        reused: true,
      });
    }

    // 3. Fetch trusted service price directly from Soulaide_services
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('Soulaide_services')
      .select('id, name, price_online, price_offline')
      .eq('id', booking.service_id)
      .single();

    if (serviceError || !service) {
      return jsonResponse({ error: 'Service details not found' }, 404);
    }

    // Fetch customer profile for payment details
    const { data: profile } = await supabaseAdmin
      .from('Soulaide_profiles')
      .select('full_name, phone_number')
      .eq('id', user.id)
      .single();

    const baseAmount = Math.round(Number(
      booking.delivery_method === 'offline'
        ? (service.price_offline || 0)
        : (service.price_online || 0)
    ));
    const orderId = `SLD-${booking.booking_code}-${Date.now().toString().slice(-6)}`;

    // 4. Local dev / test mock mode when API key is not configured
    if (!qrisgateApiKey) {
      const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000).toISOString();

      await supabaseAdmin
        .from('Soulaide_payments')
        .insert({
          booking_id: booking.id,
          amount: baseAmount,
          status: 'pending',
          provider: 'qrisgate',
          provider_order_id: orderId,
          unique_code: 0,
          total_amount: baseAmount,
          expires_at: expiresAt,
          payment_type: 'qris',
        });

      return jsonResponse({
        order_id: orderId,
        transaction_id: null,
        amount: baseAmount,
        unique_code: 0,
        total_amount: baseAmount,
        qr_string: null,
        qr_image_base64: null,
        checkout_url: null,
        expires_at: expiresAt,
        mode: 'mock',
        message: 'Kunci pembayaran belum diatur. Mode simulasi.',
      });
    }

    // 5. Payment gateway API call
    const origin = req.headers.get('origin') || Deno.env.get('SITE_URL') || '';
    const qrisgateResponse = await fetch(`${QRISGATE_API_BASE}/api/v1/transactions`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${qrisgateApiKey}`,
      },
      body: JSON.stringify({
        external_order_id: orderId,
        amount: baseAmount,
        customer_name: profile?.full_name || user.email || 'Pelanggan Soulaide',
        return_url: origin ? `${origin}/dashboard` : undefined,
        include_qr_image: true,
      }),
    });

    if (!qrisgateResponse.ok) {
      const errorBody = await qrisgateResponse.text();
      console.error('Payment transaction creation failed:', qrisgateResponse.status, errorBody);
      return jsonResponse({
        error: 'Failed to create payment transaction',
        details: errorBody,
      }, 502);
    }

    const qrisgateBody = await qrisgateResponse.json();
    const trx: QrisGateTransactionData | undefined = qrisgateBody?.data;

    if (!qrisgateBody?.success || !trx?.transaction_id || !trx.total_amount) {
      return jsonResponse({ error: 'Unexpected payment gateway response shape' }, 502);
    }

    // 6. Save payment entry into public."Soulaide_payments"
    const { error: paymentInsertError } = await supabaseAdmin
      .from('Soulaide_payments')
      .insert({
        booking_id: booking.id,
        amount: trx.base_amount,
        status: 'pending',
        provider: 'qrisgate',
        provider_order_id: trx.external_order_id,
        provider_transaction_id: trx.transaction_id,
        unique_code: trx.unique_code,
        total_amount: trx.total_amount,
        qr_string: trx.qr_string,
        qr_image: trx.qr_image_base64,
        checkout_url: trx.checkout_url,
        expires_at: trx.expires_at,
        payment_type: 'qris',
      });

    if (paymentInsertError) {
      console.error('Error inserting payment record:', paymentInsertError);
    }

    return jsonResponse({
      order_id: trx.external_order_id,
      transaction_id: trx.transaction_id,
      amount: trx.base_amount,
      unique_code: trx.unique_code,
      total_amount: trx.total_amount,
      qr_string: trx.qr_string,
      qr_image_base64: trx.qr_image_base64,
      checkout_url: trx.checkout_url,
      expires_at: trx.expires_at,
      mode: 'live',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return jsonResponse({ error: message }, 500);
  }
});
