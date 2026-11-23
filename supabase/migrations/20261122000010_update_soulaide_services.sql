-- Migration: 20261122000010_update_soulaide_services.sql
-- Description: Revisi katalog layanan menjadi 3 layanan utama (Individual Counseling, MHCU, Bundle Packet),
-- dengan dukungan penuh untuk metode online dan offline pada setiap layanan.

-- 1. Deactivate or clean up obsolete legacy services
UPDATE public."Soulaide_services"
SET is_active = FALSE
WHERE slug IN ('mhcu-assessment-online', 'individual-counseling-60m-offline', 'individual-counseling-60m-online', 'bundle-mhcu-counseling-online');

-- 2. Upsert the 3 revised canonical services
INSERT INTO public."Soulaide_services" (
  id,
  category_id,
  name,
  slug,
  description,
  duration_minutes,
  delivery_methods,
  price_online,
  price_offline,
  is_active
) VALUES
  (
    's1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Individual Counseling',
    'individual-counseling',
    'Sesi konseling 1-on-1 dengan psikolog profesional untuk mengeksplorasi tantangan emosional, stres, quarter-life crisis, karier, atau dinamika relasi.',
    60,
    ARRAY['online', 'offline'],
    110000,
    350000,
    TRUE
  ),
  (
    's2000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'MHCU (Mental Health Check Up)',
    'mhcu',
    'Pemeriksaan status kesehatan mental menyeluruh untuk memahami kondisi emosional, profil psikologis, dan tingkat kesejahteraan psikologis secara objektif.',
    45,
    ARRAY['online', 'offline'],
    89000,
    200000,
    TRUE
  ),
  (
    's3000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000001',
    'Bundle Packet',
    'bundle-packet',
    'Paket terlengkap: pemeriksaan MHCU komprehensif, sesi pembahasan hasil evaluasi, dan 1 sesi konseling individual mendalam.',
    90,
    ARRAY['online', 'offline'],
    169000,
    450000,
    TRUE
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes,
  delivery_methods = EXCLUDED.delivery_methods,
  price_online = EXCLUDED.price_online,
  price_offline = EXCLUDED.price_offline,
  is_active = TRUE;
