-- Admin transaction sync and manual settlement.
-- QRISGate listener misses leave a payment pending or expired even after the
-- money arrived. Admins can refresh provider status, and can mark a payment
-- paid locally without calling QRISGate. Manual settlement is audited.

ALTER TABLE public."Soulaide_payments"
  ADD COLUMN IF NOT EXISTS provider_status TEXT,
  ADD COLUMN IF NOT EXISTS provider_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS settlement_source TEXT,
  ADD COLUMN IF NOT EXISTS manual_settlement_reason TEXT,
  ADD COLUMN IF NOT EXISTS manual_settled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manual_settled_at TIMESTAMPTZ;

ALTER TABLE public."Soulaide_payments"
  DROP CONSTRAINT IF EXISTS "Soulaide_payments_settlement_source_check";

ALTER TABLE public."Soulaide_payments"
  ADD CONSTRAINT "Soulaide_payments_settlement_source_check"
  CHECK (settlement_source IS NULL OR settlement_source IN ('provider', 'manual'));

COMMENT ON COLUMN public."Soulaide_payments".provider_status IS
  'Last status read from QRISGate (PAID, PENDING, EXPIRED, ...). Null until a sync.';
COMMENT ON COLUMN public."Soulaide_payments".settlement_source IS
  'provider = QRISGate confirmed the payment. manual = an admin marked it paid because the listener missed it.';
COMMENT ON COLUMN public."Soulaide_payments".manual_settlement_reason IS
  'Why an admin marked this payment paid without a QRISGate confirmation.';

-- Replaces the webhook-miss check so expired rows are reconciled too, and the
-- last provider status is stored for the admin transaction page.
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
  v_slot_blocked BOOLEAN := FALSE;
  v_expected NUMERIC;
BEGIN
  SELECT id, customer_id, psychologist_id, session_date, session_start_time, status
  INTO v_booking
  FROM public."Soulaide_bookings" WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking tidak ditemukan');
  END IF;
  IF v_booking.customer_id <> auth.uid() AND NOT public."Soulaide_is_admin"(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Forbidden');
  END IF;

  SELECT id, status, total_amount, amount, provider_transaction_id, settlement_source, provider_status
  INTO v_payment
  FROM public."Soulaide_payments"
  WHERE booking_id = p_booking_id
  ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pembayaran tidak ditemukan');
  END IF;

  IF v_payment.provider_transaction_id IS NULL
     OR v_payment.status IN ('failed', 'refunded', 'partially_refunded')
     OR (v_payment.status = 'paid' AND v_payment.provider_status IS NOT NULL) THEN
    RETURN jsonb_build_object(
      'success', true, 'provider_checked', false,
      'payment_status', v_payment.status, 'booking_status', v_booking.status,
      'provider_status', v_payment.provider_status);
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
    RETURN jsonb_build_object(
      'success', true, 'provider_checked', false, 'provider_http', v_resp.status,
      'payment_status', v_payment.status, 'booking_status', v_booking.status,
      'provider_status', v_payment.provider_status);
  END IF;

  v_body := v_resp.content::jsonb;
  v_provider_status := upper(COALESCE(v_body->'data'->>'status', ''));
  v_new_payment := NULL;
  v_new_booking := NULL;

  IF v_provider_status = 'PAID' THEN
    v_expected := COALESCE(v_payment.total_amount, v_payment.amount);
    IF (v_body->'data'->>'total_amount')::numeric IS DISTINCT FROM v_expected THEN
      UPDATE public."Soulaide_payments"
      SET provider_status = v_provider_status,
          provider_checked_at = NOW(),
          updated_at = NOW()
      WHERE id = v_payment.id;
      RETURN jsonb_build_object(
        'success', true, 'provider_checked', true, 'amount_mismatch', true,
        'provider_status', v_provider_status,
        'payment_status', v_payment.status, 'booking_status', v_booking.status);
    END IF;
    IF v_payment.status IN ('pending', 'expired') THEN
      v_new_payment := 'paid';
      v_new_booking := 'confirmed';
    END IF;
  ELSIF v_provider_status = 'EXPIRED' AND v_payment.status = 'pending' THEN
    v_new_payment := 'expired';
    v_new_booking := 'cancelled';
  ELSIF v_provider_status IN ('CANCELLED', 'CANCELED', 'FAILED') AND v_payment.status = 'pending' THEN
    v_new_payment := 'failed';
    v_new_booking := 'cancelled';
  END IF;

  IF v_new_payment IS NOT NULL THEN
    UPDATE public."Soulaide_payments"
    SET status = v_new_payment,
        payment_time = CASE
          WHEN v_new_payment = 'paid' THEN COALESCE((v_body->'data'->>'paid_at')::timestamptz, NOW())
          ELSE payment_time
        END,
        provider_status = NULLIF(v_provider_status, ''),
        provider_checked_at = NOW(),
        settlement_source = CASE
          WHEN v_new_payment = 'paid' THEN COALESCE(settlement_source, 'provider')
          ELSE settlement_source
        END,
        updated_at = NOW()
    WHERE id = v_payment.id
      AND status IN ('pending', 'expired');

    IF v_new_booking IS NOT NULL AND v_booking.status IS DISTINCT FROM v_new_booking THEN
      IF v_new_booking = 'confirmed' AND v_booking.status = 'cancelled' AND EXISTS (
        SELECT 1 FROM public."Soulaide_bookings" b
        WHERE b.psychologist_id = v_booking.psychologist_id
          AND b.session_date = v_booking.session_date
          AND b.session_start_time = v_booking.session_start_time
          AND b.id <> p_booking_id
          AND b.status IN ('pending_payment', 'confirmed', 'reschedule_requested', 'rescheduled')
      ) THEN
        v_slot_blocked := TRUE;
      ELSE
        BEGIN
          UPDATE public."Soulaide_bookings"
          SET status = v_new_booking, updated_at = NOW()
          WHERE id = p_booking_id;
        EXCEPTION WHEN unique_violation THEN
          v_slot_blocked := TRUE;
        END;
      END IF;
    END IF;
  ELSE
    UPDATE public."Soulaide_payments"
    SET provider_status = NULLIF(v_provider_status, ''),
        provider_checked_at = NOW(),
        updated_at = NOW()
    WHERE id = v_payment.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'provider_checked', true,
    'provider_status', NULLIF(v_provider_status, ''),
    'amount_mismatch', false,
    'slot_blocked', v_slot_blocked,
    'payment_status', COALESCE(v_new_payment, v_payment.status),
    'booking_status', CASE
      WHEN v_slot_blocked THEN v_booking.status
      ELSE COALESCE(v_new_booking, v_booking.status)
    END);
END;
$$;

-- Local-only settlement. Does not call QRISGate.
CREATE OR REPLACE FUNCTION public."Soulaide_admin_mark_payment_paid"(
  p_payment_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reason TEXT := btrim(COALESCE(p_reason, ''));
  v_payment RECORD;
  v_booking RECORD;
  v_slot_blocked BOOLEAN := FALSE;
  v_booking_status TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public."Soulaide_is_admin"(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hanya admin yang dapat menandai lunas');
  END IF;

  IF char_length(v_reason) < 8 OR char_length(v_reason) > 500 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alasan wajib diisi, 8 sampai 500 karakter');
  END IF;

  SELECT id, booking_id, status, provider_order_id
  INTO v_payment
  FROM public."Soulaide_payments"
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pembayaran tidak ditemukan');
  END IF;

  IF v_payment.status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', true, 'already_paid', true, 'payment_status', 'paid', 'slot_blocked', false);
  END IF;

  IF v_payment.status NOT IN ('pending', 'expired') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Hanya transaksi menunggu atau kedaluwarsa yang dapat ditandai lunas');
  END IF;

  SELECT id, status, psychologist_id, session_date, session_start_time
  INTO v_booking
  FROM public."Soulaide_bookings"
  WHERE id = v_payment.booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking tidak ditemukan');
  END IF;

  UPDATE public."Soulaide_payments"
  SET status = 'paid',
      payment_time = COALESCE(payment_time, NOW()),
      settlement_source = 'manual',
      manual_settlement_reason = v_reason,
      manual_settled_by = auth.uid(),
      manual_settled_at = NOW(),
      updated_at = NOW()
  WHERE id = p_payment_id;

  v_booking_status := v_booking.status;

  IF v_booking.status IN ('pending_payment', 'cancelled') THEN
    IF v_booking.status = 'cancelled' AND EXISTS (
      SELECT 1 FROM public."Soulaide_bookings" b
      WHERE b.psychologist_id = v_booking.psychologist_id
        AND b.session_date = v_booking.session_date
        AND b.session_start_time = v_booking.session_start_time
        AND b.id <> v_booking.id
        AND b.status IN ('pending_payment', 'confirmed', 'reschedule_requested', 'rescheduled')
    ) THEN
      v_slot_blocked := TRUE;
    ELSE
      BEGIN
        UPDATE public."Soulaide_bookings"
        SET status = 'confirmed', updated_at = NOW()
        WHERE id = v_booking.id;
        v_booking_status := 'confirmed';
      EXCEPTION WHEN unique_violation THEN
        v_slot_blocked := TRUE;
      END;
    END IF;
  END IF;

  INSERT INTO public."Soulaide_audit_logs" (actor_id, action, entity_name, entity_id, metadata)
  VALUES (
    auth.uid(),
    'PAYMENT_MARKED_PAID_MANUAL',
    'payment',
    p_payment_id::text,
    jsonb_build_object(
      'reason', v_reason,
      'previous_status', v_payment.status,
      'booking_id', v_booking.id,
      'provider_order_id', v_payment.provider_order_id,
      'slot_blocked', v_slot_blocked,
      'qrisgate_called', false
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_paid', false,
    'payment_status', 'paid',
    'booking_status', v_booking_status,
    'slot_blocked', v_slot_blocked
  );
END;
$$;

REVOKE ALL ON FUNCTION public."Soulaide_admin_mark_payment_paid"(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public."Soulaide_admin_mark_payment_paid"(UUID, TEXT) TO authenticated, service_role;
