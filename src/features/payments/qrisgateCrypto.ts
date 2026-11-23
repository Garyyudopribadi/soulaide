import type { PaymentStatus } from './types';

/**
 * QRISGate webhook signature helpers.
 * Signature = hex HMAC_SHA256(timestamp + "." + rawBody, webhook_secret).
 * The HMAC must cover the RAW request bytes, never a re-serialized JSON object.
 */

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Computes the hex HMAC-SHA256 digest QRISGate sends in X-QRISGate-Signature. */
export async function calculateQrisGateSignature(
  timestamp: string | number,
  rawBody: string,
  webhookSecret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${timestamp}.${rawBody}`)
  );
  return toHex(signature);
}

/** Constant-time comparison of two hex digests (length check first, then XOR accumulate). */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export interface VerifyQrisGateSignatureInput {
  timestamp: string | number;
  rawBody: string;
  webhookSecret: string;
  /** Value of X-QRISGate-Signature; a `sha256=` prefix is tolerated. */
  providedSignature: string;
  /** Current unix time in seconds; defaults to Date.now() / 1000. */
  nowSeconds?: number;
  /** Maximum accepted signature age in seconds (QRISGate recommends 300). */
  maxAgeSeconds?: number;
}

/**
 * Verifies a QRISGate webhook signature:
 * 1. Rejects missing components.
 * 2. Rejects timestamps outside the replay window (default 5 minutes).
 * 3. Recomputes HMAC over `timestamp + "." + rawBody` and compares constant-time.
 */
export async function verifyQrisGateSignature({
  timestamp,
  rawBody,
  webhookSecret,
  providedSignature,
  nowSeconds = Date.now() / 1000,
  maxAgeSeconds = 300,
}: VerifyQrisGateSignatureInput): Promise<boolean> {
  if (!timestamp || !rawBody || !webhookSecret || !providedSignature) {
    return false;
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }
  if (Math.abs(nowSeconds - timestampSeconds) > maxAgeSeconds) {
    return false;
  }

  const expected = await calculateQrisGateSignature(timestamp, rawBody, webhookSecret);
  const provided = providedSignature.replace(/^sha256=/, '').toLowerCase();
  return timingSafeEqualHex(expected, provided);
}

export interface QrisGateStatusMapping {
  paymentStatus: PaymentStatus;
  bookingStatus: 'confirmed' | 'cancelled' | 'pending_payment' | null;
}

/**
 * Pure function mapping a QRISGate webhook event to Soulaide internal
 * payment status and booking status.
 */
export function mapQrisGateEventToPaymentState(event: string): QrisGateStatusMapping {
  switch (event) {
    case 'payment.paid':
      return { paymentStatus: 'paid', bookingStatus: 'confirmed' };
    case 'payment.expired':
      return { paymentStatus: 'expired', bookingStatus: 'cancelled' };
    case 'payment.cancelled':
      return { paymentStatus: 'failed', bookingStatus: 'cancelled' };
    default:
      return { paymentStatus: 'pending', bookingStatus: null };
  }
}