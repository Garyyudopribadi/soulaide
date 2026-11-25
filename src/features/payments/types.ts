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
  provider?: string;
  provider_order_id?: string;
  provider_transaction_id?: string | null;
  unique_code?: number | null;
  total_amount?: number | null;
  qr_string?: string | null;
  qr_image?: string | null;
  checkout_url?: string | null;
  expires_at?: string | null;
  midtrans_order_id?: string; // Legacy alias
  midtrans_transaction_id?: string | null;
  payment_type: string | null;
  payment_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface QrisgateCheckoutResponse {
  checkout_url?: string | null;
  order_id?: string;
  amount?: number;
  total_amount: number;
  unique_code?: number;
  qr_string?: string | null;
  qr_image_base64?: string | null;
  expires_at?: string | null;
  external_order_id?: string;
  transaction_id?: string | null;
  mode?: 'live' | 'mock';
  reused?: boolean;
  message?: string;
}

export type QrisGatePaymentSession = QrisgateCheckoutResponse;

export interface QrisgateTransactionDetails {
  id: string;
  external_order_id: string;
  amount: number;
  total_amount: number;
  unique_code?: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'FAILED';
  payment_method?: 'QRIS' | 'BANK_TRANSFER' | 'ANY';
  bank_code?: string;
  checkout_url?: string;
  qr_string?: string;
  paid_at?: string | null;
  expires_at?: string;
  created_at?: string;
}

export interface QrisgateWebhookPayload {
  event: 'payment.paid' | 'payment.expired' | 'payment.failed';
  event_id: string;
  timestamp: number | string;
  data: {
    id: string;
    external_order_id: string;
    amount: number;
    total_amount: number;
    unique_code?: number;
    status: 'PAID' | 'EXPIRED' | 'FAILED';
    payment_method?: string;
    bank_code?: string;
    paid_at?: string;
    customer_name?: string;
  };
}

// Deprecated alias for backwards compatibility
export type MidtransSnapTransactionResponse = {
  token: string;
  redirect_url: string;
  order_id: string;
  amount: number;
  mode?: 'live' | 'mock';
  message?: string;
};
