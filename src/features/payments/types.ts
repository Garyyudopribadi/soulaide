export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'refunded'
  | 'partially_refunded';

export interface PaymentRecord {
  id: string;
  booking_id: string;
  amount: number;
  status: PaymentStatus;
  provider: string;
  provider_order_id: string;
  provider_transaction_id: string | null;
  unique_code: number | null;
  total_amount: number | null;
  qr_string: string | null;
  qr_image: string | null;
  checkout_url: string | null;
  expires_at: string | null;
  payment_type: string | null;
  payment_time: string | null;
  created_at: string;
  updated_at: string;
}

/** Response of the 'create-payment' edge function (QRISGate session). */
export interface QrisGatePaymentSession {
  order_id: string;
  transaction_id: string | null;
  /** Base service price, before the unique code. */
  amount: number;
  unique_code: number;
  /** Exact amount the buyer must pay: amount + unique_code. */
  total_amount: number;
  qr_string: string | null;
  qr_image_base64: string | null;
  checkout_url: string | null;
  expires_at: string | null;
  mode?: 'live' | 'mock';
  reused?: boolean;
  message?: string;
}

/** Flat webhook payload sent by QRISGate (no `data` wrapper). */
export interface QrisGateWebhookPayload {
  event: 'payment.paid' | 'payment.expired' | 'payment.cancelled' | string;
  transaction_id?: string;
  external_order_id: string;
  base_amount?: number;
  unique_code?: number;
  total_amount?: number;
  customer_name?: string;
  paid_at?: string;
  created_at?: string;
}