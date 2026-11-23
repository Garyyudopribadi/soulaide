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
  midtrans_order_id: string;
  midtrans_transaction_id: string | null;
  payment_type: string | null;
  payment_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface MidtransSnapTransactionResponse {
  token: string;
  redirect_url: string;
  order_id: string;
  amount: number;
  mode?: 'live' | 'mock';
  message?: string;
}

export interface MidtransWebhookPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
  settlement_time?: string;
  transaction_time?: string;
}

export interface MidtransSnapOptions {
  onSuccess?: (result: Record<string, unknown>) => void;
  onPending?: (result: Record<string, unknown>) => void;
  onError?: (result: Record<string, unknown>) => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: MidtransSnapOptions) => void;
      embed: (token: string, options: { embedId: string } & MidtransSnapOptions) => void;
    };
  }
}
