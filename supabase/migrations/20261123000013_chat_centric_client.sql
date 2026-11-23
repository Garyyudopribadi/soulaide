-- ==============================================================================
-- SOULAIDE PSYCHOLOGY PLATFORM - CHAT-CENTRIC CLIENT EXPERIENCE
-- Migration: 20261123000013_chat_centric_client.sql
--
-- 1. Threads: one assistant thread per client + one thread per (client, psychologist).
--    All booking/payment activity is recorded as system messages inside the thread.
-- 2. Messages gain sender_kind (user/bot/system) + meta JSONB for activity cards.
-- 3. Booking RPC: consent persistence, delivery-method & service-mapping validation,
--    stale pending_payment slot release (30 minutes), thread activity + notifications.
-- 4. Booking status changes (any source: webhook, admin, client) automatically write
--    status history, a thread activity message, and notifications.
-- 5. RLS fixes: clients can write booking status history for their own bookings.
-- 6. Soul Bot test psychologist + Rp1.000 test service for real QRIS payment testing.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SCHEMA EXTENSIONS
-- ------------------------------------------------------------------------------

ALTER TABLE public."Soulaide_psychologists"
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public."Soulaide_conversations"
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'booking',
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS psychologist_id UUID REFERENCES public."Soulaide_psychologists"(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Soulaide_conversations_kind_check'
  ) THEN
    ALTER TABLE public."Soulaide_conversations"
      ADD CONSTRAINT "Soulaide_conversations_kind_check"
      CHECK (kind IN ('assistant', 'psychologist', 'booking'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Soulaide_conversations_assistant_unique"
  ON public."Soulaide_conversations" (customer_id)
  WHERE kind = 'assistant';

CREATE UNIQUE INDEX IF NOT EXISTS "Soulaide_conversations_psychologist_unique"
  ON public."Soulaide_conversations" (customer_id, psychologist_id)
  WHERE kind = 'psychologist';

ALTER TABLE public."Soulaide_messages"
  ALTER COLUMN sender_id DROP NOT NULL;

ALTER TABLE public."Soulaide_messages"
  ADD COLUMN IF NOT EXISTS sender_kind TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Soulaide_messages_sender_kind_check'
  ) THEN
    ALTER TABLE public."Soulaide_messages"
      ADD CONSTRAINT "Soulaide_messages_sender_kind_check"
      CHECK (sender_kind IN ('user', 'bot', 'system'));
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. THREAD HELPER (SECURITY DEFINER, no auth check: also used by triggers)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public."Soulaide_find_or_create_thread"(
  p_customer_id UUID,
  p_psychologist_id UUID DEFAULT NULL,
  p_kind TEXT DEFAULT 'psychologist'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
  v_psych_user_id UUID;
  v_is_bot BOOLEAN;
  v_psych_name TEXT;
BEGIN
  IF p_kind = 'assistant' THEN
    SELECT id INTO v_conversation_id
    FROM public."Soulaide_conversations"
    WHERE customer_id = p_customer_id AND kind = 'assistant'
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
      BEGIN
        INSERT INTO public."Soulaide_conversations" (kind, customer_id)
        VALUES ('assistant', p_customer_id)
        RETURNING id INTO v_conversation_id;
      EXCEPTION WHEN unique_violation THEN
        SELECT id INTO v_conversation_id
        FROM public."Soulaide_conversations"
        WHERE customer_id = p_customer_id AND kind = 'assistant'
        LIMIT 1;
      END;

      INSERT INTO public."Soulaide_conversation_participants" (conversation_id, user_id, role)
      VALUES (v_conversation_id, p_customer_id, 'client')
      ON CONFLICT (conversation_id, user_id) DO NOTHING;

      INSERT INTO public."Soulaide_messages" (conversation_id, sender_id, sender_kind, content, is_read, meta)
      VALUES (
        v_conversation_id, NULL, 'bot',
        'Halo! Saya asisten Soulaide. Saya bisa membantu Anda memesan sesi konseling, memilih psikolog, dan menyelesaikan pembayaran, semuanya lewat percakapan ini.',
        TRUE, '{"event":"assistant_welcome"}'::jsonb
      );
    END IF;

    RETURN v_conversation_id;
  END IF;

  -- Psychologist thread
  SELECT user_id, is_bot, full_name INTO v_psych_user_id, v_is_bot, v_psych_name
  FROM public."Soulaide_psychologists"
  WHERE id = p_psychologist_id;

  IF v_psych_name IS NULL THEN
    RAISE EXCEPTION 'Psikolog tidak ditemukan';
  END IF;

  SELECT id INTO v_conversation_id
  FROM public."Soulaide_conversations"
  WHERE customer_id = p_customer_id AND psychologist_id = p_psychologist_id AND kind = 'psychologist'
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    BEGIN
      INSERT INTO public."Soulaide_conversations" (kind, customer_id, psychologist_id)
      VALUES ('psychologist', p_customer_id, p_psychologist_id)
      RETURNING id INTO v_conversation_id;
    EXCEPTION WHEN unique_violation THEN
      SELECT id INTO v_conversation_id
      FROM public."Soulaide_conversations"
      WHERE customer_id = p_customer_id AND psychologist_id = p_psychologist_id AND kind = 'psychologist'
      LIMIT 1;
    END;

    INSERT INTO public."Soulaide_conversation_participants" (conversation_id, user_id, role)
    VALUES (v_conversation_id, p_customer_id, 'client')
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    -- Only register the psychologist as participant when they have a real auth account
    -- and are not the test bot. (Fixes the old FK bug that broke all chat.)
    IF v_psych_user_id IS NOT NULL AND NOT v_is_bot THEN
      INSERT INTO public."Soulaide_conversation_participants" (conversation_id, user_id, role)
      VALUES (v_conversation_id, v_psych_user_id, 'psychologist')
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;

    IF v_is_bot THEN
      INSERT INTO public."Soulaide_messages" (conversation_id, sender_id, sender_kind, content, is_read, meta)
      VALUES (
        v_conversation_id, NULL, 'bot',
        'Halo! Saya Soul Bot, kanal uji coba Soulaide. Di sini Anda bisa mencoba alur booking dan pembayaran QRIS Rp1.000 dengan aman. Ini bukan sesi konseling sungguhan.',
        TRUE, '{"event":"bot_welcome"}'::jsonb
      );
    ELSIF v_psych_user_id IS NOT NULL THEN
      INSERT INTO public."Soulaide_messages" (conversation_id, sender_id, sender_kind, content, is_read, meta)
      VALUES (
        v_conversation_id, NULL, 'system',
        'Kanal koordinasi dengan ' || v_psych_name || ' aktif. Gunakan chat ini untuk konfirmasi kesiapan, tautan pertemuan, atau hal teknis sebelum sesi. Bukan untuk konseling/diagnosis.',
        TRUE, '{"event":"thread_opened"}'::jsonb
      );
    ELSE
      INSERT INTO public."Soulaide_messages" (conversation_id, sender_id, sender_kind, content, is_read, meta)
      VALUES (
        v_conversation_id, NULL, 'system',
        'Kanal aktivitas untuk ' || v_psych_name || '. Psikolog ini belum terhubung ke chat langsung; koordinasi tersedia via WhatsApp. Semua status booking dan pembayaran tetap muncul di sini.',
        TRUE, '{"event":"thread_opened"}'::jsonb
      );
    END IF;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. CLIENT-FACING RPCs
-- ------------------------------------------------------------------------------

-- Open (or create) a thread. Role-aware:
--  * customer: p_psychologist_id for a psychologist thread, nothing for assistant.
--  * psychologist: p_customer_id to open the thread with a client.
CREATE OR REPLACE FUNCTION public."Soulaide_open_thread"(
  p_psychologist_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_caller_psych_id UUID;
  v_conversation_id UUID;
  v_kind TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  v_caller_psych_id := public."Soulaide_get_psychologist_id"(v_uid);

  IF v_caller_psych_id IS NOT NULL AND p_customer_id IS NOT NULL THEN
    v_kind := 'psychologist';
    v_conversation_id := public."Soulaide_find_or_create_thread"(p_customer_id, v_caller_psych_id, 'psychologist');
  ELSIF p_psychologist_id IS NOT NULL THEN
    v_kind := 'psychologist';
    v_conversation_id := public."Soulaide_find_or_create_thread"(v_uid, p_psychologist_id, 'psychologist');
  ELSE
    v_kind := 'assistant';
    v_conversation_id := public."Soulaide_find_or_create_thread"(v_uid, NULL, 'assistant');
  END IF;

  RETURN jsonb_build_object('success', true, 'conversation_id', v_conversation_id, 'kind', v_kind);
END;
$$;

-- Open the thread belonging to a booking (client, assigned psychologist, or admin).
CREATE OR REPLACE FUNCTION public."Soulaide_open_booking_thread"(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_booking RECORD;
  v_conversation_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT customer_id, psychologist_id INTO v_booking
  FROM public."Soulaide_bookings"
  WHERE id = p_booking_id;

  IF v_booking.customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking tidak ditemukan');
  END IF;

  IF v_booking.customer_id <> v_uid
     AND v_booking.psychologist_id <> public."Soulaide_get_psychologist_id"(v_uid)
     AND NOT public."Soulaide_is_admin"(v_uid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Forbidden');
  END IF;

  v_conversation_id := public."Soulaide_find_or_create_thread"(v_booking.customer_id, v_booking.psychologist_id, 'psychologist');
  RETURN jsonb_build_object('success', true, 'conversation_id', v_conversation_id);
END;
$$;

-- Send a human message (integrity enforced server-side).
CREATE OR REPLACE FUNCTION public."Soulaide_send_chat"(
  p_conversation_id UUID,
  p_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_message_id UUID;
  v_trimmed TEXT := btrim(COALESCE(p_content, ''));
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF v_trimmed = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pesan tidak boleh kosong');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."Soulaide_conversation_participants"
    WHERE conversation_id = p_conversation_id AND user_id = v_uid
  ) AND NOT public."Soulaide_is_admin"(v_uid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Anda bukan peserta percakapan ini');
  END IF;

  INSERT INTO public."Soulaide_messages" (conversation_id, sender_id, sender_kind, content, is_read)
  VALUES (p_conversation_id, v_uid, 'user', left(v_trimmed, 4000), FALSE)
  RETURNING id INTO v_message_id;

  UPDATE public."Soulaide_conversations" SET updated_at = NOW() WHERE id = p_conversation_id;

  RETURN jsonb_build_object('success', true, 'message_id', v_message_id);
END;
$$;

-- Append a bot/system message (assistant transcript, bot replies, activity cards).
CREATE OR REPLACE FUNCTION public."Soulaide_append_thread_message"(
  p_conversation_id UUID,
  p_content TEXT,
  p_sender_kind TEXT DEFAULT 'system',
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_message_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_sender_kind NOT IN ('bot', 'system') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Jenis pesan tidak valid');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."Soulaide_conversation_participants"
    WHERE conversation_id = p_conversation_id AND user_id = v_uid
  ) AND NOT public."Soulaide_is_admin"(v_uid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Anda bukan peserta percakapan ini');
  END IF;

  INSERT INTO public."Soulaide_messages" (conversation_id, sender_id, sender_kind, content, is_read, meta)
  VALUES (p_conversation_id, NULL, p_sender_kind, left(btrim(COALESCE(p_content, '')), 4000), TRUE, COALESCE(p_meta, '{}'::jsonb))
  RETURNING id INTO v_message_id;

  UPDATE public."Soulaide_conversations" SET updated_at = NOW() WHERE id = p_conversation_id;

  RETURN jsonb_build_object('success', true, 'message_id', v_message_id);
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. ATOMIC BOOKING RPC (upgraded)
-- ------------------------------------------------------------------------------

-- Remove the pre-consent overload so every call resolves to the upgraded RPC.
DROP FUNCTION IF EXISTS public."Soulaide_reserve_slot_atomic"(UUID, UUID, UUID, DATE, TIME, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public."Soulaide_reserve_slot_atomic"(
  p_customer_id UUID,
  p_psychologist_id UUID,
  p_service_id UUID,
  p_session_date DATE,
  p_session_start_time TIME,
  p_delivery_method TEXT,
  p_notes TEXT DEFAULT NULL,
  p_consent BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
  v_booking_code TEXT;
  v_service RECORD;
  v_session_end_time TIME;
  v_conflict_count INTEGER;
  v_lead_time_hours NUMERIC;
  v_thread_id UUID;
  v_psych RECORD;
  v_mapping_count INTEGER;
  v_mapped_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized booking request');
  END IF;

  -- Lead time is evaluated in Asia/Jakarta regardless of DB/session timezone.
  v_lead_time_hours := EXTRACT(EPOCH FROM (
    (p_session_date + p_session_start_time) AT TIME ZONE 'Asia/Jakarta' - NOW()
  )) / 3600.0;

  IF v_lead_time_hours < 24.0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking lead time minimal 24 jam sebelum sesi berlangsung');
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext(p_psychologist_id::text),
    p_session_date - '2020-01-01'::date
  );

  SELECT id, duration_minutes, delivery_methods INTO v_service
  FROM public."Soulaide_services"
  WHERE id = p_service_id AND is_active = TRUE;

  IF v_service.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Layanan tidak ditemukan atau tidak aktif');
  END IF;

  IF NOT (p_delivery_method = ANY (v_service.delivery_methods)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Metode sesi tidak tersedia untuk layanan ini');
  END IF;

  SELECT id, full_name, user_id, is_bot INTO v_psych
  FROM public."Soulaide_psychologists"
  WHERE id = p_psychologist_id AND is_active = TRUE;

  IF v_psych.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Psikolog tidak ditemukan atau tidak aktif');
  END IF;

  -- When a service has explicit psychologist mappings, enforce them.
  SELECT COUNT(*) INTO v_mapping_count
  FROM public."Soulaide_service_psychologists"
  WHERE service_id = p_service_id;

  IF v_mapping_count > 0 THEN
    SELECT COUNT(*) INTO v_mapped_count
    FROM public."Soulaide_service_psychologists"
    WHERE service_id = p_service_id AND psychologist_id = p_psychologist_id;

    IF v_mapped_count = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Psikolog ini tidak tersedia untuk layanan yang dipilih');
    END IF;
  END IF;

  v_session_end_time := p_session_start_time + (v_service.duration_minutes || ' minutes')::interval;

  -- Release stale unpaid bookings (30 minutes) so their slots become bookable again.
  -- The status-change trigger records history, thread activity, and notifications.
  UPDATE public."Soulaide_bookings"
  SET status = 'cancelled'
  WHERE psychologist_id = p_psychologist_id
    AND session_date = p_session_date
    AND status = 'pending_payment'
    AND created_at < NOW() - INTERVAL '30 minutes';

  -- Active bookings hold their slot.
  SELECT COUNT(*) INTO v_conflict_count
  FROM public."Soulaide_bookings"
  WHERE psychologist_id = p_psychologist_id
    AND session_date = p_session_date
    AND status IN ('pending_payment', 'confirmed', 'reschedule_requested', 'rescheduled')
    AND (
      (session_start_time <= p_session_start_time AND session_end_time > p_session_start_time) OR
      (session_start_time < v_session_end_time AND session_end_time >= v_session_end_time) OR
      (session_start_time >= p_session_start_time AND session_end_time <= v_session_end_time)
    );

  IF v_conflict_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Slot waktu tersebut sudah dipesan. Silakan pilih slot lain.');
  END IF;

  v_booking_code := 'SLD-' || TO_CHAR(p_session_date, 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 4));

  INSERT INTO public."Soulaide_bookings" (
    booking_code, customer_id, psychologist_id, service_id,
    session_date, session_start_time, session_end_time,
    delivery_method, status, notes
  ) VALUES (
    v_booking_code, p_customer_id, p_psychologist_id, p_service_id,
    p_session_date, p_session_start_time, v_session_end_time,
    p_delivery_method, 'pending_payment', p_notes
  ) RETURNING id INTO v_booking_id;

  INSERT INTO public."Soulaide_booking_status_history" (booking_id, from_status, to_status, changed_by, reason)
  VALUES (v_booking_id, NULL, 'pending_payment', p_customer_id, 'Inisiasi reservasi sesi awal');

  IF p_consent THEN
    INSERT INTO public."Soulaide_consent_records" (customer_id, consent_type, version)
    VALUES (p_customer_id, 'booking_terms', '2026-11-23');
  END IF;

  -- Activity in the psychologist thread + notifications.
  v_thread_id := public."Soulaide_find_or_create_thread"(p_customer_id, p_psychologist_id, 'psychologist');

  INSERT INTO public."Soulaide_messages" (conversation_id, sender_id, sender_kind, content, is_read, meta)
  VALUES (
    v_thread_id, NULL, 'system',
    'Booking ' || v_booking_code || ' dibuat: ' || v_psych.full_name || ', ' ||
    TO_CHAR(p_session_date, 'DD Mon YYYY') || ' ' || TO_CHAR(p_session_start_time, 'HH24:MI') || ' WIB (' || p_delivery_method || '). Menunggu pembayaran.',
    TRUE,
    jsonb_build_object('event', 'booking_created', 'booking_id', v_booking_id, 'booking_code', v_booking_code)
  );

  INSERT INTO public."Soulaide_notifications" (user_id, title, message, type, link)
  VALUES (
    p_customer_id, 'Booking dibuat',
    'Booking ' || v_booking_code || ' berhasil dibuat. Selesaikan pembayaran untuk mengonfirmasi sesi Anda.',
    'booking', '/dashboard/thread/' || v_thread_id
  );

  IF v_psych.user_id IS NOT NULL AND NOT v_psych.is_bot THEN
    INSERT INTO public."Soulaide_notifications" (user_id, title, message, type, link)
    VALUES (
      v_psych.user_id, 'Booking baru',
      'Ada booking baru ' || v_booking_code || ' menunggu pembayaran klien.',
      'booking', '/psychologist'
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id, 'booking_code', v_booking_code, 'thread_id', v_thread_id);
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. BOOKING STATUS CHANGE -> HISTORY + THREAD ACTIVITY + NOTIFICATIONS
--    Covers every source: QRISGate webhook, admin actions, client actions.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public."Soulaide_handle_booking_status_change"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread_id UUID;
  v_label TEXT;
  v_content TEXT;
  v_psych_user_id UUID;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public."Soulaide_booking_status_history" (booking_id, from_status, to_status, changed_by, reason)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(),
      CASE
        WHEN NEW.status = 'cancelled' AND OLD.status = 'pending_payment' AND OLD.created_at < NOW() - INTERVAL '30 minutes'
          THEN 'Kedaluwarsa: tidak dibayar dalam 30 menit'
        ELSE 'Perubahan status otomatis'
      END);

    v_label := CASE NEW.status
      WHEN 'confirmed' THEN 'Terkonfirmasi'
      WHEN 'pending_payment' THEN 'Menunggu pembayaran'
      WHEN 'reschedule_requested' THEN 'Pengajuan reschedule'
      WHEN 'rescheduled' THEN 'Jadwal baru'
      WHEN 'completed' THEN 'Selesai'
      WHEN 'cancelled' THEN 'Dibatalkan'
      WHEN 'no_show' THEN 'Tidak hadir'
      ELSE NEW.status
    END;

    v_content := CASE NEW.status
      WHEN 'confirmed' THEN 'Pembayaran diterima, sesi ' || NEW.booking_code || ' terkonfirmasi. Sampai jumpa di sesi Anda!'
      WHEN 'cancelled' THEN
        CASE
          WHEN OLD.status = 'pending_payment' AND OLD.created_at < NOW() - INTERVAL '30 minutes'
            THEN 'Booking ' || NEW.booking_code || ' kedaluwarsa: pembayaran tidak diselesaikan dalam 30 menit. Slot dilepas kembali.'
          ELSE 'Sesi ' || NEW.booking_code || ' dibatalkan. Slot waktu dilepas kembali.'
        END
      WHEN 'reschedule_requested' THEN 'Permintaan perubahan jadwal untuk ' || NEW.booking_code || ' sedang ditinjau tim Soulaide.'
      WHEN 'rescheduled' THEN 'Jadwal ' || NEW.booking_code || ' diperbarui menjadi ' || TO_CHAR(NEW.session_date, 'DD Mon YYYY') || ' ' || TO_CHAR(NEW.session_start_time, 'HH24:MI') || ' WIB.'
      WHEN 'completed' THEN 'Sesi ' || NEW.booking_code || ' telah selesai. Terima kasih telah mempercayakan perjalanan Anda pada Soulaide.'
      WHEN 'no_show' THEN 'Sesi ' || NEW.booking_code || ' ditandai tidak hadir.'
      ELSE 'Status ' || NEW.booking_code || ' berubah menjadi: ' || v_label || '.'
    END;

    v_thread_id := public."Soulaide_find_or_create_thread"(NEW.customer_id, NEW.psychologist_id, 'psychologist');

    INSERT INTO public."Soulaide_messages" (conversation_id, sender_id, sender_kind, content, is_read, meta)
    VALUES (
      v_thread_id, NULL, 'system', v_content, TRUE,
      jsonb_build_object('event', 'booking_status', 'booking_id', NEW.id, 'booking_code', NEW.booking_code, 'status', NEW.status)
    );

    INSERT INTO public."Soulaide_notifications" (user_id, title, message, type, link)
    VALUES (NEW.customer_id, 'Status sesi: ' || v_label, v_content, 'booking', '/dashboard/thread/' || v_thread_id);

    SELECT user_id INTO v_psych_user_id FROM public."Soulaide_psychologists" WHERE id = NEW.psychologist_id;
    IF v_psych_user_id IS NOT NULL THEN
      INSERT INTO public."Soulaide_notifications" (user_id, title, message, type, link)
      VALUES (v_psych_user_id, 'Status sesi: ' || v_label, v_content, 'booking', '/psychologist');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "Soulaide_bookings_status_change" ON public."Soulaide_bookings";
CREATE TRIGGER "Soulaide_bookings_status_change"
AFTER UPDATE ON public."Soulaide_bookings"
FOR EACH ROW EXECUTE FUNCTION public."Soulaide_handle_booking_status_change"();

-- ------------------------------------------------------------------------------
-- 6. RLS FIXES
-- ------------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'Soulaide_booking_status_history' AND policyname = 'Booking parties can insert status history'
  ) THEN
    CREATE POLICY "Booking parties can insert status history"
    ON public."Soulaide_booking_status_history" FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public."Soulaide_bookings" b
        WHERE b.id = booking_id
          AND (
            b.customer_id = auth.uid()
            OR b.psychologist_id = public."Soulaide_get_psychologist_id"(auth.uid())
            OR public."Soulaide_is_admin"(auth.uid())
          )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'Soulaide_booking_status_history' AND policyname = 'Booking parties can view status history'
  ) THEN
    CREATE POLICY "Booking parties can view status history"
    ON public."Soulaide_booking_status_history" FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public."Soulaide_bookings" b
        WHERE b.id = booking_id
          AND (
            b.customer_id = auth.uid()
            OR b.psychologist_id = public."Soulaide_get_psychologist_id"(auth.uid())
            OR public."Soulaide_is_admin"(auth.uid())
          )
      )
    );
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 7. REALTIME: live activity updates for threads
-- ------------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'Soulaide_bookings'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public."Soulaide_bookings";
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'Soulaide_payments'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public."Soulaide_payments";
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'Soulaide_conversations'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public."Soulaide_conversations";
    END IF;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 8. SOUL BOT + Rp1.000 TEST SERVICE (real QRIS payment testing)
-- ------------------------------------------------------------------------------

DO $$
DECLARE
  v_category_id UUID;
  v_bot_id UUID := 'b0000000-0000-0000-0000-000000000005';
  v_service_id UUID := '55000000-0000-0000-0000-000000000005';
BEGIN
  SELECT id INTO v_category_id FROM public."Soulaide_service_categories" WHERE slug = 'soul-guidance' LIMIT 1;
  IF v_category_id IS NULL THEN
    INSERT INTO public."Soulaide_service_categories" (name, slug, description)
    VALUES ('Soul Guidance', 'soul-guidance', 'Pendampingan psikologis awal')
    RETURNING id INTO v_category_id;
  END IF;

  INSERT INTO public."Soulaide_psychologists" (
    id, slug, full_name, credentials, bio, experience_years,
    practice_areas, approaches, card_image_url, profile_image_url, is_active, is_bot
  ) VALUES (
    v_bot_id, 'soul-bot', 'Soul Bot (Uji Coba)', 'Asisten Virtual Soulaide',
    'Kanal uji coba resmi Soulaide untuk mencoba alur booking dan pembayaran QRIS Rp1.000 (+kode unik). Bukan psikolog manusia dan bukan sesi konseling sungguhan.',
    'Bot uji coba',
    ARRAY['Uji Coba Pembayaran'], ARRAY['Chat Otomatis'],
    '/bot-avatar.svg', '/bot-avatar.svg', TRUE, TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    credentials = EXCLUDED.credentials,
    bio = EXCLUDED.bio,
    is_bot = TRUE,
    is_active = TRUE,
    card_image_url = EXCLUDED.card_image_url,
    profile_image_url = EXCLUDED.profile_image_url;

  INSERT INTO public."Soulaide_services" (
    id, category_id, name, slug, description, duration_minutes,
    delivery_methods, price_online, price_offline, is_active
  ) VALUES (
    v_service_id, v_category_id,
    'Sesi Uji Coba Bot (Tes Pembayaran)', 'test-bot-session',
    'Layanan khusus uji coba alur pembayaran QRIS: Rp1.000 + kode unik. Dana nyata diproses QRISGate; gunakan untuk memastikan pembayaran terdeteksi otomatis. Bukan sesi konseling.',
    15, ARRAY['online'], 1000, NULL, TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_online = 1000,
    is_active = TRUE;

  INSERT INTO public."Soulaide_service_psychologists" (service_id, psychologist_id)
  VALUES (v_service_id, v_bot_id)
  ON CONFLICT (service_id, psychologist_id) DO NOTHING;

  INSERT INTO public."Soulaide_psychologist_presence" (psychologist_id, status)
  VALUES (v_bot_id, 'available')
  ON CONFLICT (psychologist_id) DO UPDATE SET status = 'available';
END $$;

-- ------------------------------------------------------------------------------
-- 9. PUBLIC DAY AVAILABILITY (no personal data; usable before login)
--    Returns schedule windows, overrides, and occupied intervals for one day.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public."Soulaide_day_availability"(
  p_psychologist_id UUID,
  p_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedules JSONB;
  v_overrides JSONB;
  v_booked JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'day_of_week', day_of_week, 'start_time', start_time, 'end_time', end_time
  )), '[]'::jsonb) INTO v_schedules
  FROM public."Soulaide_psychologist_schedules"
  WHERE psychologist_id = p_psychologist_id AND is_active = TRUE;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'start_time', start_time, 'end_time', end_time, 'is_available', is_available
  )), '[]'::jsonb) INTO v_overrides
  FROM public."Soulaide_availability_overrides"
  WHERE psychologist_id = p_psychologist_id AND override_date = p_date;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'start_time', session_start_time, 'end_time', session_end_time
  )), '[]'::jsonb) INTO v_booked
  FROM public."Soulaide_bookings"
  WHERE psychologist_id = p_psychologist_id
    AND session_date = p_date
    AND status IN ('pending_payment', 'confirmed', 'reschedule_requested', 'rescheduled')
    AND NOT (status = 'pending_payment' AND created_at < NOW() - INTERVAL '30 minutes');

  RETURN jsonb_build_object('schedules', v_schedules, 'overrides', v_overrides, 'booked', v_booked);
END;
$$;