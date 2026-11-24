-- ==============================================================================
-- SOULAIDE - PRACTICE DEMO DATA
-- File: supabase/seed/seed_practice_demo.sql
-- ------------------------------------------------------------------------------
-- Sample clients, bookings (paid upcoming + completed history + one pending),
-- coordination threads with chat history, and clinical notes — so every
-- psychologist login sees a lived-in practice. Dates are relative to
-- CURRENT_DATE so countdowns stay live. Idempotent: fixed UUIDs + DO NOTHING.
-- Run after seed.sql and seed_accounts.sql.
-- ==============================================================================

DO $$
DECLARE
  v_klien UUID := 'a0000000-0000-0000-0000-000000000004';
  v_sari  UUID := 'a0000000-0000-0000-0000-000000000007';
  v_dimas UUID := 'a0000000-0000-0000-0000-000000000008';
  v_fin UUID := 'a0000000-0000-0000-0000-000000000002';
  v_ama UUID := 'a0000000-0000-0000-0000-000000000003';
  v_fil UUID := 'a0000000-0000-0000-0000-000000000005';
  v_nar UUID := 'a0000000-0000-0000-0000-000000000006';

  p_fin UUID := 'd1000000-0000-0000-0000-000000000001';
  p_ama UUID := 'd2000000-0000-0000-0000-000000000002';
  p_fil UUID := 'd3000000-0000-0000-0000-000000000003';
  p_nar UUID := 'd4000000-0000-0000-0000-000000000004';
  s1    UUID := '51000000-0000-0000-0000-000000000001';

  v_klien_pwd TEXT := extensions.crypt('KlienSoulaide2026!', extensions.gen_salt('bf'));

  d1 DATE := CURRENT_DATE + 2;  -- Budi - Finandita, confirmed
  d2 DATE := CURRENT_DATE - 6;  -- Budi - Amanda, completed
  d3 DATE := CURRENT_DATE + 1;  -- Sari - Finandita, confirmed
  d4 DATE := CURRENT_DATE - 3;  -- Sari - Amanda, completed
  d5 DATE := CURRENT_DATE + 3;  -- Dimas - Filza, confirmed
  d6 DATE := CURRENT_DATE + 4;  -- Dimas - Narissa, pending payment
  d7 DATE := CURRENT_DATE - 8;  -- Sari - Narissa, completed

  c1 TEXT := 'SLD-' || to_char(d1, 'YYYYMMDD') || '-D001';
  c2 TEXT := 'SLD-' || to_char(d2, 'YYYYMMDD') || '-D002';
  c3 TEXT := 'SLD-' || to_char(d3, 'YYYYMMDD') || '-D003';
  c4 TEXT := 'SLD-' || to_char(d4, 'YYYYMMDD') || '-D004';
  c5 TEXT := 'SLD-' || to_char(d5, 'YYYYMMDD') || '-D005';
  c6 TEXT := 'SLD-' || to_char(d6, 'YYYYMMDD') || '-D006';
  c7 TEXT := 'SLD-' || to_char(d7, 'YYYYMMDD') || '-D007';
BEGIN
  -- 1. Sample client accounts -------------------------------------------------
  DELETE FROM auth.identities WHERE user_id IN (v_sari, v_dimas);

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token,
    reauthentication_token, email_change_confirm_status, is_super_admin, is_sso_user, is_anonymous
  ) VALUES
    (v_sari, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'sari@soulaide.id', v_klien_pwd, NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     '{"full_name": "Sari Wulandari"}'::jsonb, NOW(), NOW(),
     '', '', '', '', '', '', '', '', 0, FALSE, FALSE, FALSE),
    (v_dimas, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'dimas@soulaide.id', v_klien_pwd, NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     '{"full_name": "Dimas Saputra"}'::jsonb, NOW(), NOW(),
     '', '', '', '', '', '', '', '', 0, FALSE, FALSE, FALSE)
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email = EXCLUDED.email,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), u.id, u.id::text,
         jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', NOW(), NOW(), NOW()
  FROM auth.users u WHERE u.id IN (v_sari, v_dimas);

  INSERT INTO public."Soulaide_profiles" (id, email, full_name, phone_number, created_at, updated_at)
  VALUES
    (v_sari, 'sari@soulaide.id', 'Sari Wulandari', '+6281122334455', NOW(), NOW()),
    (v_dimas, 'dimas@soulaide.id', 'Dimas Saputra', '+6281122334456', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, full_name = EXCLUDED.full_name, phone_number = EXCLUDED.phone_number, updated_at = NOW();

  DELETE FROM public."Soulaide_user_roles" WHERE user_id IN (v_sari, v_dimas);
  INSERT INTO public."Soulaide_user_roles" (user_id, role, created_at)
  VALUES (v_sari, 'customer', NOW()), (v_dimas, 'customer', NOW());

  -- 2. Bookings: paid upcoming, completed history, one pending ----------------
  INSERT INTO public."Soulaide_bookings" (
    id, booking_code, customer_id, psychologist_id, service_id,
    session_date, session_start_time, session_end_time, delivery_method, status, notes, created_at, updated_at
  ) VALUES
    ('b1000000-0000-0000-0000-000000000001', c1, v_klien, p_fin, s1, d1, '10:00', '11:00', 'online', 'confirmed',
     'Ingin membahas tekanan kerja dan pola tidur.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('b1000000-0000-0000-0000-000000000002', c2, v_klien, p_ama, s1, d2, '19:30', '20:30', 'online', 'completed',
     'Overthinking menjelang presentasi kerja.', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'),
    ('b1000000-0000-0000-0000-000000000003', c3, v_sari, p_fin, s1, d3, '16:00', '17:00', 'online', 'confirmed',
     'Dinamika keluarga dan batasan dengan orang tua.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    ('b1000000-0000-0000-0000-000000000004', c4, v_sari, p_ama, s1, d4, '19:30', '20:30', 'online', 'completed',
     'Pembahasan hasil MHCU.', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
    ('b1000000-0000-0000-0000-000000000005', c5, v_dimas, p_fil, s1, d5, '13:00', '14:00', 'online', 'confirmed',
     'Sesi pertama; burnout dan konflik interpersonal di kantor.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('b1000000-0000-0000-0000-000000000006', c6, v_dimas, p_nar, s1, d6, '18:30', '19:30', 'online', 'pending_payment',
     'Regulasi emosi dan adaptasi lingkungan baru.', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
    ('b1000000-0000-0000-0000-000000000007', c7, v_sari, p_nar, s1, d7, '18:30', '19:30', 'online', 'completed',
     'Latihan regulasi emosi harian.', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days')
  ON CONFLICT (id) DO NOTHING;

  -- 3. Coordination threads + participants ------------------------------------
  INSERT INTO public."Soulaide_conversations" (id, kind, customer_id, psychologist_id, updated_at)
  VALUES
    ('f1000000-0000-0000-0000-000000000001', 'psychologist', v_klien, p_fin, NOW() - INTERVAL '10 minutes'),
    ('f1000000-0000-0000-0000-000000000002', 'psychologist', v_klien, p_ama, NOW() - INTERVAL '6 days'),
    ('f1000000-0000-0000-0000-000000000003', 'psychologist', v_sari, p_fin, NOW() - INTERVAL '2 hours'),
    ('f1000000-0000-0000-0000-000000000004', 'psychologist', v_sari, p_ama, NOW() - INTERVAL '3 days'),
    ('f1000000-0000-0000-0000-000000000005', 'psychologist', v_dimas, p_fil, NOW() - INTERVAL '20 minutes'),
    ('f1000000-0000-0000-0000-000000000006', 'psychologist', v_dimas, p_nar, NOW() - INTERVAL '2 hours'),
    ('f1000000-0000-0000-0000-000000000007', 'psychologist', v_sari, p_nar, NOW() - INTERVAL '8 days')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public."Soulaide_conversation_participants" (conversation_id, user_id, role)
  VALUES
    ('f1000000-0000-0000-0000-000000000001', v_klien, 'client'),
    ('f1000000-0000-0000-0000-000000000001', v_fin, 'psychologist'),
    ('f1000000-0000-0000-0000-000000000002', v_klien, 'client'),
    ('f1000000-0000-0000-0000-000000000002', v_ama, 'psychologist'),
    ('f1000000-0000-0000-0000-000000000003', v_sari, 'client'),
    ('f1000000-0000-0000-0000-000000000003', v_fin, 'psychologist'),
    ('f1000000-0000-0000-0000-000000000004', v_sari, 'client'),
    ('f1000000-0000-0000-0000-000000000004', v_ama, 'psychologist'),
    ('f1000000-0000-0000-0000-000000000005', v_dimas, 'client'),
    ('f1000000-0000-0000-0000-000000000005', v_fil, 'psychologist'),
    ('f1000000-0000-0000-0000-000000000006', v_dimas, 'client'),
    ('f1000000-0000-0000-0000-000000000006', v_nar, 'psychologist'),
    ('f1000000-0000-0000-0000-000000000007', v_sari, 'client'),
    ('f1000000-0000-0000-0000-000000000007', v_nar, 'psychologist')
  ON CONFLICT DO NOTHING;

  -- 4. Chat history + booking activity notes ----------------------------------
  INSERT INTO public."Soulaide_messages" (id, conversation_id, sender_id, sender_kind, content, is_read, created_at)
  VALUES
    -- Budi - Finandita (upcoming, paid)
    ('e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', NULL, 'system',
     'Booking ' || c1 || ' dibuat: Finandita Utari, ' || to_char(d1, 'DD Mon YYYY') || ' 10:00 WIB (online). Menunggu pembayaran.', TRUE, NOW() - INTERVAL '1 day'),
    ('e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', NULL, 'system',
     'Pembayaran diterima, sesi ' || c1 || ' terkonfirmasi. Sampai jumpa di sesi Anda!', TRUE, NOW() - INTERVAL '1 day' + INTERVAL '5 minutes'),
    ('e1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000001', v_klien, 'user',
     'Halo Bu Finandita, untuk sesi lusa apakah saya perlu menyiapkan sesuatu?', FALSE, NOW() - INTERVAL '2 hours'),
    ('e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000001', v_fin, 'user',
     'Halo Budi, cukup datang dengan keadaan diri apa adanya. Kita mulai dari cerita Anda.', TRUE, NOW() - INTERVAL '1 hour'),
    ('e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000001', v_klien, 'user',
     'Baik, terima kasih. Sampai jumpa di sesi!', FALSE, NOW() - INTERVAL '10 minutes'),
    -- Budi - Amanda (completed history)
    ('e1000000-0000-0000-0000-000000000006', 'f1000000-0000-0000-0000-000000000002', NULL, 'system',
     'Booking ' || c2 || ' dibuat: Amanda Natasanti, ' || to_char(d2, 'DD Mon YYYY') || ' 19:30 WIB (online). Menunggu pembayaran.', TRUE, NOW() - INTERVAL '7 days'),
    ('e1000000-0000-0000-0000-000000000007', 'f1000000-0000-0000-0000-000000000002', NULL, 'system',
     'Pembayaran diterima, sesi ' || c2 || ' terkonfirmasi. Sampai jumpa di sesi Anda!', TRUE, NOW() - INTERVAL '7 days' + INTERVAL '5 minutes'),
    ('e1000000-0000-0000-0000-000000000008', 'f1000000-0000-0000-0000-000000000002', v_klien, 'user',
     'Kak, saya sering overthinking soal kerjaan menjelang sesi ini.', TRUE, NOW() - INTERVAL '6 days' - INTERVAL '2 hours'),
    ('e1000000-0000-0000-0000-000000000009', 'f1000000-0000-0000-0000-000000000002', v_ama, 'user',
     'Kita bahas pelan-pelan ya. Bawa catatan pola tidurmu kalau ada.', TRUE, NOW() - INTERVAL '6 days' - INTERVAL '1 hour'),
    ('e1000000-0000-0000-0000-000000000010', 'f1000000-0000-0000-0000-000000000002', NULL, 'system',
     'Sesi ' || c2 || ' selesai. Ringkasan dan catatan klinis tersimpan aman.', TRUE, NOW() - INTERVAL '6 days' + INTERVAL '1 hour'),
    ('e1000000-0000-0000-0000-000000000011', 'f1000000-0000-0000-0000-000000000002', v_klien, 'user',
     'Terima kasih Kak, sesi kemarin sangat membantu.', TRUE, NOW() - INTERVAL '6 days' + INTERVAL '2 hours'),
    -- Sari - Finandita (upcoming, paid)
    ('e1000000-0000-0000-0000-000000000012', 'f1000000-0000-0000-0000-000000000003', NULL, 'system',
     'Booking ' || c3 || ' dibuat: Finandita Utari, ' || to_char(d3, 'DD Mon YYYY') || ' 16:00 WIB (online). Menunggu pembayaran.', TRUE, NOW() - INTERVAL '2 days'),
    ('e1000000-0000-0000-0000-000000000013', 'f1000000-0000-0000-0000-000000000003', NULL, 'system',
     'Pembayaran diterima, sesi ' || c3 || ' terkonfirmasi. Sampai jumpa di sesi Anda!', TRUE, NOW() - INTERVAL '2 days' + INTERVAL '5 minutes'),
    ('e1000000-0000-0000-0000-000000000014', 'f1000000-0000-0000-0000-000000000003', v_sari, 'user',
     'Selamat siang, sesi besok jadi kan Bu? Saya ada rapat sampai jam 3.', FALSE, NOW() - INTERVAL '2 hours'),
    ('e1000000-0000-0000-0000-000000000015', 'f1000000-0000-0000-0000-000000000003', v_fin, 'user',
     'Jadi, Sari. Sesi mulai 16.00 WIB, tautan video saya kirim 15 menit sebelumnya.', TRUE, NOW() - INTERVAL '1 hour'),
    -- Sari - Amanda (completed history)
    ('e1000000-0000-0000-0000-000000000016', 'f1000000-0000-0000-0000-000000000004', NULL, 'system',
     'Booking ' || c4 || ' dibuat: Amanda Natasanti, ' || to_char(d4, 'DD Mon YYYY') || ' 19:30 WIB (online). Menunggu pembayaran.', TRUE, NOW() - INTERVAL '4 days'),
    ('e1000000-0000-0000-0000-000000000017', 'f1000000-0000-0000-0000-000000000004', NULL, 'system',
     'Pembayaran diterima, sesi ' || c4 || ' terkonfirmasi. Sampai jumpa di sesi Anda!', TRUE, NOW() - INTERVAL '4 days' + INTERVAL '5 minutes'),
    ('e1000000-0000-0000-0000-000000000018', 'f1000000-0000-0000-0000-000000000004', v_sari, 'user',
     'Kak Amanda, hasil MHCU saya sudah keluar, mau bahas di sesi.', TRUE, NOW() - INTERVAL '3 days' - INTERVAL '2 hours'),
    ('e1000000-0000-0000-0000-000000000019', 'f1000000-0000-0000-0000-000000000004', v_ama, 'user',
     'Siap, kita baca bersama dan susun langkah kecilnya.', TRUE, NOW() - INTERVAL '3 days' - INTERVAL '1 hour'),
    ('e1000000-0000-0000-0000-000000000020', 'f1000000-0000-0000-0000-000000000004', NULL, 'system',
     'Sesi ' || c4 || ' selesai. Ringkasan dan catatan klinis tersimpan aman.', TRUE, NOW() - INTERVAL '3 days' + INTERVAL '1 hour'),
    -- Dimas - Filza (upcoming, paid)
    ('e1000000-0000-0000-0000-000000000021', 'f1000000-0000-0000-0000-000000000005', NULL, 'system',
     'Booking ' || c5 || ' dibuat: Filza Ayska Syabina, ' || to_char(d5, 'DD Mon YYYY') || ' 13:00 WIB (online). Menunggu pembayaran.', TRUE, NOW() - INTERVAL '1 day'),
    ('e1000000-0000-0000-0000-000000000022', 'f1000000-0000-0000-0000-000000000005', NULL, 'system',
     'Pembayaran diterima, sesi ' || c5 || ' terkonfirmasi. Sampai jumpa di sesi Anda!', TRUE, NOW() - INTERVAL '1 day' + INTERVAL '5 minutes'),
    ('e1000000-0000-0000-0000-000000000023', 'f1000000-0000-0000-0000-000000000005', v_dimas, 'user',
     'Kak Filza, ini pertama kali saya konsul. Agak gugup, normal ya?', FALSE, NOW() - INTERVAL '3 hours'),
    ('e1000000-0000-0000-0000-000000000024', 'f1000000-0000-0000-0000-000000000005', v_fil, 'user',
     'Normal sekali, Dimas. Tidak ada yang harus disiapkan khusus, hadir saja dulu.', TRUE, NOW() - INTERVAL '2 hours'),
    ('e1000000-0000-0000-0000-000000000025', 'f1000000-0000-0000-0000-000000000005', v_dimas, 'user',
     'Oke kak, saya usahakan hadir tepat waktu.', FALSE, NOW() - INTERVAL '20 minutes'),
    -- Dimas - Narissa (pending payment)
    ('e1000000-0000-0000-0000-000000000026', 'f1000000-0000-0000-0000-000000000006', NULL, 'system',
     'Booking ' || c6 || ' dibuat: Narissa Qurrata Ayunin, ' || to_char(d6, 'DD Mon YYYY') || ' 18:30 WIB (online). Menunggu pembayaran.', TRUE, NOW() - INTERVAL '3 hours'),
    ('e1000000-0000-0000-0000-000000000027', 'f1000000-0000-0000-0000-000000000006', v_dimas, 'user',
     'Kak, pembayaran QRIS saya pending terus, nanti saya coba lagi malam ini.', FALSE, NOW() - INTERVAL '2 hours'),
    -- Sari - Narissa (completed history)
    ('e1000000-0000-0000-0000-000000000028', 'f1000000-0000-0000-0000-000000000007', NULL, 'system',
     'Booking ' || c7 || ' dibuat: Narissa Qurrata Ayunin, ' || to_char(d7, 'DD Mon YYYY') || ' 18:30 WIB (online). Menunggu pembayaran.', TRUE, NOW() - INTERVAL '9 days'),
    ('e1000000-0000-0000-0000-000000000029', 'f1000000-0000-0000-0000-000000000007', NULL, 'system',
     'Pembayaran diterima, sesi ' || c7 || ' terkonfirmasi. Sampai jumpa di sesi Anda!', TRUE, NOW() - INTERVAL '9 days' + INTERVAL '5 minutes'),
    ('e1000000-0000-0000-0000-000000000030', 'f1000000-0000-0000-0000-000000000007', v_sari, 'user',
     'Terima kasih Kak Narissa, latihan regulasi emosinya saya coba tiap hari.', TRUE, NOW() - INTERVAL '8 days' + INTERVAL '2 hours'),
    ('e1000000-0000-0000-0000-000000000031', 'f1000000-0000-0000-0000-000000000007', v_nar, 'user',
     'Bagus, Sari. Catat ya mana yang paling terasa membantu, kita evaluasi sesi depan.', TRUE, NOW() - INTERVAL '8 days' + INTERVAL '3 hours'),
    ('e1000000-0000-0000-0000-000000000032', 'f1000000-0000-0000-0000-000000000007', NULL, 'system',
     'Sesi ' || c7 || ' selesai. Ringkasan dan catatan klinis tersimpan aman.', TRUE, NOW() - INTERVAL '8 days' + INTERVAL '1 hour')
  ON CONFLICT (id) DO NOTHING;

  -- 5. Clinical notes for completed sessions ----------------------------------
  INSERT INTO public."Soulaide_clinical_notes" (
    booking_id, psychologist_id, customer_id,
    session_summary, clinical_observations, interventions_used, recommendations, is_confidential
  ) VALUES
    ('b1000000-0000-0000-0000-000000000002', p_ama, v_klien,
     'Sesi pertama membahas pola overthinking terkait performa kerja.',
     'Klien hadir tepat waktu, kooperatif, afek sesuai. Tidur 5-6 jam, kafein sore hari.',
     'Psikoedukansi siklus cemas, thought recording sederhana.',
     'Latihan thought recording 1x/hari; batasi kafein setelah 14.00; evaluasi sesi depan.', TRUE),
    ('b1000000-0000-0000-0000-000000000004', p_ama, v_sari,
     'Pembahasan hasil MHCU dan langkah kecil regulasi stres.',
     'Klien memahami hasil asesmen; motivasi baik, dukungan keluarga terbatas.',
     'SFBT scaling question, penyusunan tujuan mingguan.',
     'Satu langkah kecil per minggu; journaling 5 menit; sesi lanjutan 2 minggu.', TRUE),
    ('b1000000-0000-0000-0000-000000000007', p_nar, v_sari,
     'Evaluasi latihan regulasi emosi harian dan penerimaan diri.',
     'Klien konsisten menjalankan latihan; toleransi distress meningkat.',
     'Grounding 5-4-3-2-1, self-compassion break.',
     'Lanjutkan latihan harian; tambah variasi grounding saat situasi sosial.', TRUE)
  ON CONFLICT (booking_id) DO NOTHING;

  -- 6. Presence for the practice ----------------------------------------------
  INSERT INTO public."Soulaide_psychologist_presence" (psychologist_id, status, last_active_at)
  VALUES
    (p_fin, 'available', NOW()),
    (p_ama, 'online', NOW()),
    (p_fil, 'online', NOW()),
    (p_nar, 'away', NOW())
  ON CONFLICT (psychologist_id) DO UPDATE SET status = EXCLUDED.status, last_active_at = NOW();
END $$;
