-- Migration: 20261123000012_switch_payments_to_qrisgate.sql
-- Description: Switch payment provider from Midtrans to QRISGate (dynamic QRIS + unique code).
-- 1. Rename provider-specific columns to neutral names.
-- 2. Add QRISGate session fields (unique code, exact total, QR payload, checkout URL, expiry).
-- Existing rows keep provider = 'midtrans'; new rows default to 'qrisgate'.

-- 1. Neutral column names (UNIQUE constraint on the order id follows the rename)
ALTER TABLE public."Soulaide_payments"
  RENAME COLUMN midtrans_order_id TO provider_order_id;

ALTER TABLE public."Soulaide_payments"
  RENAME COLUMN midtrans_transaction_id TO provider_transaction_id;

-- 2. Provider discriminator: historical rows are Midtrans, new inserts default to QRISGate
ALTER TABLE public."Soulaide_payments"
  ADD COLUMN provider TEXT NOT NULL DEFAULT 'midtrans';

ALTER TABLE public."Soulaide_payments"
  ALTER COLUMN provider SET DEFAULT 'qrisgate';

-- 3. QRISGate session fields
ALTER TABLE public."Soulaide_payments"
  ADD COLUMN unique_code INTEGER,
  ADD COLUMN total_amount BIGINT,
  ADD COLUMN qr_string TEXT,
  ADD COLUMN qr_image TEXT,
  ADD COLUMN checkout_url TEXT,
  ADD COLUMN expires_at TIMESTAMPTZ;

-- Historical rows: the amount charged equalled the stored amount (no unique code).
UPDATE public."Soulaide_payments"
SET total_amount = amount
WHERE total_amount IS NULL;

-- 4. Lookup index for webhook reconciliation by provider transaction id
CREATE INDEX IF NOT EXISTS "Soulaide_payments_provider_tx_idx"
  ON public."Soulaide_payments" (provider_transaction_id);

COMMENT ON COLUMN public."Soulaide_payments".provider_order_id IS
  'Merchant-side order id sent to the provider (QRISGate external_order_id), e.g. SLD-<booking_code>-<suffix>.';
COMMENT ON COLUMN public."Soulaide_payments".provider_transaction_id IS
  'Provider-side transaction id (QRISGate trx_...).';
COMMENT ON COLUMN public."Soulaide_payments".total_amount IS
  'Exact amount the buyer must pay: base amount + QRISGate unique code.';