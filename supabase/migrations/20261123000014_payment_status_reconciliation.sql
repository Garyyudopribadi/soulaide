-- ==============================================================================
-- Soulaide: payment status reconciliation (webhook miss recovery)
-- ==============================================================================
-- Webhooks can be missed (endpoint registered after a payment, provider retry
-- exhausted, downtime). This RPC lets the payment card reconcile a pending
-- payment directly against QRISGate, server-side, so a paid order is never
-- stuck at "pending" just because a notification did not arrive.
--
-- Requires:
--   * extension `http` in schema extensions
--   * private config row 'qrisgate_api_key' in "Soulaide_provider_config"
--     (inserted out-of-band, never in git; RLS denies all API reads)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Server-only provider secrets. No RLS policies: anon/authenticated read
-- nothing; SECURITY DEFINER functions (table owner) and service_role can read.
CREATE TABLE IF NOT EXISTS public."Soulaide_provider_config" (
  name TEXT PRIMARY KEY,
  secret TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public."Soulaide_provider_config" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Soulaide_provider_config" FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public."Soulaide_check_payment_status"(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_booking RECORD;
  v_payment RECORD;
  v_key TEXT;
  v_resp RECORD;
  v_body JSONB;
  v_provider_status TEXT;
  v_new_payment TEXT;
  v_new_booking TEXT;
BEGIN
  SELECT id, customer_id, status INTO v_booking
  FROM public."Soulaide_bookings" WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking tidak ditemukan');
  END IF;
  IF v_booking.customer_id <> auth.uid() AND NOT public."Soulaide_is_admin"(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Forbidden');
  END IF;

  SELECT id, status, total_amount, amount, provider_transaction_id INTO v_payment
  FROM public."Soulaide_payments"
  WHERE booking_id = p_booking_id
  ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pembayaran tidak ditemukan');
  END IF;

  -- Terminal states and pre-provider rows need no external call.
  IF v_payment.status IN ('paid', 'expired', 'failed', 'refunded', 'partially_refunded')
     OR v_payment.provider_transaction_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', true, 'provider_checked', false,
      'payment_status', v_payment.status, 'booking_status', v_booking.status);
  END IF;

  SELECT secret INTO v_key
  FROM public."Soulaide_provider_config" WHERE name = 'qrisgate_api_key' LIMIT 1;
  IF v_key IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Konfigurasi provider tidak tersedia');
  END IF;

  SELECT status, content INTO v_resp
  FROM http((
    'GET',
    'https://qrisgate.web.id/api/v1/transactions/' || v_payment.provider_transaction_id,
    ARRAY[http_header('Authorization', 'Bearer ' || v_key), http_header('Accept', 'application/json')],
    NULL, NULL
  )::http_request);

  IF v_resp.status <> 200 THEN
    -- Provider unreachable: keep local state, let the next poll retry.
    RETURN jsonb_build_object(
      'success', true, 'provider_checked', false, 'provider_http', v_resp.status,
      'payment_status', v_payment.status, 'booking_status', v_booking.status);
  END IF;

  v_body := v_resp.content::jsonb;
  v_provider_status := upper(COALESCE(v_body->'data'->>'status', ''));
  v_new_payment := NULL;
  v_new_booking := NULL;

  IF v_provider_status = 'PAID' THEN
    -- Only mark paid when the detected amount matches the exact expected total.
    IF (v_body->'data'->>'total_amount')::numeric <> COALESCE(v_payment.total_amount, v_payment.amount) THEN
      RETURN jsonb_build_object(
        'success', true, 'provider_checked', true, 'amount_mismatch', true,
        'payment_status', v_payment.status, 'booking_status', v_booking.status);
    END IF;
    v_new_payment := 'paid';
    v_new_booking := 'confirmed';
  ELSIF v_provider_status = 'EXPIRED' THEN
    v_new_payment := 'expired';
    v_new_booking := 'cancelled';
  ELSIF v_provider_status IN ('CANCELLED', 'FAILED') THEN
    v_new_payment := 'failed';
    v_new_booking := 'cancelled';
  END IF;

  IF v_new_payment IS NOT NULL THEN
    UPDATE public."Soulaide_payments"
    SET status = v_new_payment,
        payment_time = COALESCE((v_body->'data'->>'paid_at')::timestamptz, NOW()),
        updated_at = NOW()
    WHERE id = v_payment.id;

    IF v_new_booking IS NOT NULL AND v_booking.status <> v_new_booking THEN
      -- Status-change trigger writes the activity message + notifications.
      UPDATE public."Soulaide_bookings"
      SET status = v_new_booking, updated_at = NOW()
      WHERE id = p_booking_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 'provider_checked', true, 'provider_status', v_provider_status,
    'payment_status', COALESCE(v_new_payment, v_payment.status),
    'booking_status', COALESCE(v_new_booking, v_booking.status));
END;
$$;

REVOKE ALL ON FUNCTION public."Soulaide_check_payment_status"(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public."Soulaide_check_payment_status"(UUID) TO authenticated, service_role;
