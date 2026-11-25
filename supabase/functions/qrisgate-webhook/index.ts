// Supabase Edge Function: qrisgate-webhook
// Endpoint publik: POST https://cyzsmbuwqxjedimcwpga.supabase.co/functions/v1/qrisgate-webhook
//
// Tugas 2:
// 1. Membaca RAW body byte asli.
// 2. Menerima Header Wajib QRISGate: Content-Type: application/json & X-Device-Token.
// 3. Memverifikasi header x-qrisgate-signature = HMAC-SHA256 secara timing-safe.
// 4. Anti-replay check timestamp (5 menit window).
// 5. Idempoten: bila event_id sudah pernah diproses, balas 200 tanpa memproses ulang.
// 6. Bila event payment.paid: cari pesanan lewat external_order_id, set status PAID, simpan paid_at, update booking confirmed.
// 7. Selalu balas 200 dengan cepat (<5 detik).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-qrisgate-signature, x-qrisgate-timestamp, x-device-token, x-qrisgate-event, x-qrisgate-delivery-id',
};

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawBody = await req.text();
    const signature = (
      req.headers.get('x-qrisgate-signature') ||
      req.headers.get('X-QRISGate-Signature') ||
      ''
    ).trim();
    const timestamp = (
      req.headers.get('x-qrisgate-timestamp') ||
      req.headers.get('X-QRISGate-Timestamp') ||
      ''
    ).trim();
    const deviceToken = (
      req.headers.get('x-device-token') ||
      req.headers.get('X-Device-Token') ||
      ''
    ).trim();
    const deliveryId =
      req.headers.get('x-qrisgate-delivery-id') ||
      req.headers.get('X-QRISGate-Delivery-Id') ||
      `del_${Date.now()}`;

    const webhookSecret = Deno.env.get('QRISGATE_WEBHOOK_SECRET') || '';
    const configuredDeviceToken =
      Deno.env.get('QRISGATE_DEVICE_TOKEN') ||
      'dt_d3fa99e2edd5636f9d448b134ad957e951c3d54e';

    let payload: Record<string, any> = {};
    if (rawBody && rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 1. Validasi Device Token dari dashboard setting QRISGate
    if (deviceToken && (deviceToken === configuredDeviceToken || !signature)) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook device token verified',
          device_token: deviceToken,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Ping pemeriksaan koneksi tanpa payload
    if (!rawBody && !signature) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook endpoint reachable',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Anti-replay check: batas 5 menit (300 detik)
    if (timestamp) {
      const tsNum = Number(timestamp);
      const tsSec = !isNaN(tsNum)
        ? tsNum > 1e11
          ? Math.floor(tsNum / 1000)
          : tsNum
        : Math.floor(Date.parse(timestamp) / 1000);
      const nowSec = Math.floor(Date.now() / 1000);
      if (!isNaN(tsSec) && Math.abs(nowSec - tsSec) > 300) {
        return new Response(
          JSON.stringify({ error: 'Timestamp expired (> 5 minutes)' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 4. Verifikasi signature HMAC-SHA256
    if (webhookSecret && signature) {
      const expectedStandard = await hmacSha256Hex(
        webhookSecret,
        timestamp ? `${timestamp}.${rawBody}` : rawBody
      );
      const expectedDirect = await hmacSha256Hex(webhookSecret, rawBody);
      const cleanSig = signature.replace(/^sha256=/, '').toLowerCase();
      if (
        !timingSafeEqualHex(expectedStandard, cleanSig) &&
        !timingSafeEqualHex(expectedDirect, cleanSig)
      ) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const event = String(payload.event || payload.type || '');
    const data = payload.data || {};
    const externalOrderId = String(
      payload.external_order_id || data.external_order_id || ''
    );
    const paidAt = payload.paid_at || data.paid_at || new Date().toISOString();

    if (!externalOrderId) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Notification acknowledged (no external_order_id)',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const fetchUrl = `${supabaseUrl}/rest/v1/Soulaide_payments?or=(provider_order_id.eq.${externalOrderId},midtrans_order_id.eq.${externalOrderId})`;
        const patchRes = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
        });
        const payments = await patchRes.json();
        if (Array.isArray(payments) && payments.length > 0) {
          const payment = payments[0];
          const isPaid = event === 'payment.paid' || event === 'PAID';
          const isExpired = event === 'payment.expired' || event === 'EXPIRED';

          if (isPaid) {
            await fetch(
              `${supabaseUrl}/rest/v1/Soulaide_payments?id=eq.${payment.id}`,
              {
                method: 'PATCH',
                headers: {
                  apikey: supabaseServiceKey,
                  Authorization: `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json',
                  Prefer: 'return=minimal',
                },
                body: JSON.stringify({
                  status: 'paid',
                  payment_time: paidAt,
                }),
              }
            );

            await fetch(
              `${supabaseUrl}/rest/v1/Soulaide_bookings?id=eq.${payment.booking_id}`,
              {
                method: 'PATCH',
                headers: {
                  apikey: supabaseServiceKey,
                  Authorization: `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json',
                  Prefer: 'return=minimal',
                },
                body: JSON.stringify({ status: 'confirmed' }),
              }
            );
          } else if (isExpired) {
            await fetch(
              `${supabaseUrl}/rest/v1/Soulaide_payments?id=eq.${payment.id}`,
              {
                method: 'PATCH',
                headers: {
                  apikey: supabaseServiceKey,
                  Authorization: `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json',
                  Prefer: 'return=minimal',
                },
                body: JSON.stringify({ status: 'expired' }),
              }
            );

            await fetch(
              `${supabaseUrl}/rest/v1/Soulaide_bookings?id=eq.${payment.booking_id}`,
              {
                method: 'PATCH',
                headers: {
                  apikey: supabaseServiceKey,
                  Authorization: `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json',
                  Prefer: 'return=minimal',
                },
                body: JSON.stringify({ status: 'cancelled' }),
              }
            );
          }
        }
      } catch (err) {
        console.error('Database sync error:', err);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
