import { describe, it, expect } from 'vitest';
import {
  calculateQrisGateSignature,
  verifyQrisGateSignature,
  timingSafeEqualHex,
  mapQrisGateEventToPaymentState,
} from './qrisgateCrypto';

describe('QRISGate Webhook Signature (HMAC-SHA256)', () => {
  const timestamp = 1763880000;
  const rawBody = JSON.stringify({
    event: 'payment.paid',
    transaction_id: 'trx_8f2c4b1a05c67e1f7294b3d0',
    external_order_id: 'SLD-20261122-0001-123456',
    base_amount: 110000,
    unique_code: 7,
    total_amount: 110007,
    customer_name: 'Budi',
    paid_at: '2026-11-23T09:15:22.000Z',
    created_at: '2026-11-23T09:12:40.000Z',
  });
  const secret = 'whsec_TEST_SECRET_123456';
  const nowSeconds = timestamp + 10;

  it('computes a consistent 64-char hex HMAC-SHA256 digest', async () => {
    const signature = await calculateQrisGateSignature(timestamp, rawBody, secret);

    expect(typeof signature).toBe('string');
    expect(signature.length).toBe(64); // 256 bits = 32 bytes = 64 hex chars
    expect(/^[0-9a-f]{64}$/.test(signature)).toBe(true);

    const repeat = await calculateQrisGateSignature(timestamp, rawBody, secret);
    expect(repeat).toBe(signature);
  });

  it('verifies a valid webhook signature', async () => {
    const signature = await calculateQrisGateSignature(timestamp, rawBody, secret);

    const isValid = await verifyQrisGateSignature({
      timestamp,
      rawBody,
      webhookSecret: secret,
      providedSignature: signature,
      nowSeconds,
    });

    expect(isValid).toBe(true);
  });

  it('accepts a signature carrying the sha256= prefix', async () => {
    const signature = await calculateQrisGateSignature(timestamp, rawBody, secret);

    const isValid = await verifyQrisGateSignature({
      timestamp,
      rawBody,
      webhookSecret: secret,
      providedSignature: `sha256=${signature}`,
      nowSeconds,
    });

    expect(isValid).toBe(true);
  });

  it('rejects tampered body, wrong secret, and forged signatures', async () => {
    const signature = await calculateQrisGateSignature(timestamp, rawBody, secret);

    // Tampered body (e.g. attacker inflates total_amount)
    const tamperedBody = rawBody.replace('110007', '999999');
    expect(
      await verifyQrisGateSignature({
        timestamp,
        rawBody: tamperedBody,
        webhookSecret: secret,
        providedSignature: signature,
        nowSeconds,
      })
    ).toBe(false);

    // Wrong webhook secret
    expect(
      await verifyQrisGateSignature({
        timestamp,
        rawBody,
        webhookSecret: 'whsec_DIFFERENT_FAKE_SECRET',
        providedSignature: signature,
        nowSeconds,
      })
    ).toBe(false);

    // Forged signature
    const forged = signature.slice(0, -4) + '0000';
    expect(
      await verifyQrisGateSignature({
        timestamp,
        rawBody,
        webhookSecret: secret,
        providedSignature: forged,
        nowSeconds,
      })
    ).toBe(false);
  });

  it('rejects signatures outside the 5-minute replay window', async () => {
    const signature = await calculateQrisGateSignature(timestamp, rawBody, secret);

    expect(
      await verifyQrisGateSignature({
        timestamp,
        rawBody,
        webhookSecret: secret,
        providedSignature: signature,
        nowSeconds: timestamp + 301,
      })
    ).toBe(false);

    // Future-dated timestamps are rejected too
    expect(
      await verifyQrisGateSignature({
        timestamp,
        rawBody,
        webhookSecret: secret,
        providedSignature: signature,
        nowSeconds: timestamp - 301,
      })
    ).toBe(false);
  });

  it('returns false for empty or missing components', async () => {
    expect(
      await verifyQrisGateSignature({
        timestamp: '',
        rawBody,
        webhookSecret: secret,
        providedSignature: 'abc',
        nowSeconds,
      })
    ).toBe(false);
    expect(
      await verifyQrisGateSignature({
        timestamp,
        rawBody: '',
        webhookSecret: secret,
        providedSignature: 'abc',
        nowSeconds,
      })
    ).toBe(false);
    expect(
      await verifyQrisGateSignature({
        timestamp,
        rawBody,
        webhookSecret: '',
        providedSignature: 'abc',
        nowSeconds,
      })
    ).toBe(false);
  });

  it('compares hex digests constant-time and rejects length mismatches', () => {
    expect(timingSafeEqualHex('abcd', 'abcd')).toBe(true);
    expect(timingSafeEqualHex('abcd', 'abce')).toBe(false);
    expect(timingSafeEqualHex('abcd', 'abc')).toBe(false);
    expect(timingSafeEqualHex('', '')).toBe(true);
  });
});

describe('QRISGate Event → Payment State Mapping', () => {
  it('maps payment.paid to paid and confirmed', () => {
    const res = mapQrisGateEventToPaymentState('payment.paid');
    expect(res.paymentStatus).toBe('paid');
    expect(res.bookingStatus).toBe('confirmed');
  });

  it('maps payment.expired to expired and cancelled', () => {
    const res = mapQrisGateEventToPaymentState('payment.expired');
    expect(res.paymentStatus).toBe('expired');
    expect(res.bookingStatus).toBe('cancelled');
  });

  it('maps payment.cancelled to failed and cancelled', () => {
    const res = mapQrisGateEventToPaymentState('payment.cancelled');
    expect(res.paymentStatus).toBe('failed');
    expect(res.bookingStatus).toBe('cancelled');
  });

  it('leaves unknown events pending without touching the booking', () => {
    const res = mapQrisGateEventToPaymentState('payment.something_else');
    expect(res.paymentStatus).toBe('pending');
    expect(res.bookingStatus).toBeNull();
  });
});