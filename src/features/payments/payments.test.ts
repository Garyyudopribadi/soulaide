import { describe, it, expect } from 'vitest';
import {
  calculateMidtransSignature,
  verifyMidtransSignature,
  mapMidtransStatusToPaymentState,
} from './midtransCrypto';

describe('Midtrans Cryptographic Signature & Webhook Verification', () => {
  const sampleOrderId = 'SLD-20261122-0001-123456';
  const sampleStatusCode = '200';
  const sampleGrossAmount = '250000.00';
  const sampleServerKey = 'SB-Mid-server-TESTKEY123456';

  it('computes consistent SHA-512 signature hash matching formula', async () => {
    const signature = await calculateMidtransSignature(
      sampleOrderId,
      sampleStatusCode,
      sampleGrossAmount,
      sampleServerKey
    );

    expect(typeof signature).toBe('string');
    expect(signature.length).toBe(128); // 512 bits = 64 bytes = 128 hex chars
    expect(/^[0-9a-f]{128}$/.test(signature)).toBe(true);

    // Re-calculating with exact same inputs must yield identical hash
    const signatureRepeat = await calculateMidtransSignature(
      sampleOrderId,
      sampleStatusCode,
      sampleGrossAmount,
      sampleServerKey
    );
    expect(signatureRepeat).toBe(signature);
  });

  it('verifies valid incoming webhook signature accurately', async () => {
    const validSignature = await calculateMidtransSignature(
      sampleOrderId,
      sampleStatusCode,
      sampleGrossAmount,
      sampleServerKey
    );

    const isValid = await verifyMidtransSignature(
      sampleOrderId,
      sampleStatusCode,
      sampleGrossAmount,
      sampleServerKey,
      validSignature
    );

    expect(isValid).toBe(true);
  });

  it('rejects tampered or forged signature from unauthorized sources', async () => {
    const validSignature = await calculateMidtransSignature(
      sampleOrderId,
      sampleStatusCode,
      sampleGrossAmount,
      sampleServerKey
    );

    // Tampered signature
    const tamperedSig = validSignature.slice(0, -4) + '0000';
    const isValidTampered = await verifyMidtransSignature(
      sampleOrderId,
      sampleStatusCode,
      sampleGrossAmount,
      sampleServerKey,
      tamperedSig
    );
    expect(isValidTampered).toBe(false);

    // Different server key (attacker spoofing server key)
    const isValidWrongKey = await verifyMidtransSignature(
      sampleOrderId,
      sampleStatusCode,
      sampleGrossAmount,
      'SB-Mid-server-DIFFERENT_FAKE_KEY',
      validSignature
    );
    expect(isValidWrongKey).toBe(false);

    // Tampered amount (e.g. paying Rp 10.000 instead of Rp 250.000)
    const isValidTamperedAmount = await verifyMidtransSignature(
      sampleOrderId,
      sampleStatusCode,
      '10000.00',
      sampleServerKey,
      validSignature
    );
    expect(isValidTamperedAmount).toBe(false);
  });

  it('verifies signatures when grossAmount is passed as number or string', async () => {
    const signature = await calculateMidtransSignature(
      sampleOrderId,
      sampleStatusCode,
      250000,
      sampleServerKey
    );

    const isValid = await verifyMidtransSignature(
      sampleOrderId,
      sampleStatusCode,
      250000,
      sampleServerKey,
      signature
    );

    expect(isValid).toBe(true);
  });

  it('returns false for empty or missing signature components', async () => {
    const isValid = await verifyMidtransSignature('', '200', '100000', sampleServerKey, 'abc');
    expect(isValid).toBe(false);
  });
});

describe('Midtrans State Machine & Status Mapping', () => {
  it('maps "settlement" status to paid and confirmed', () => {
    const res = mapMidtransStatusToPaymentState('settlement');
    expect(res.paymentStatus).toBe('paid');
    expect(res.bookingStatus).toBe('confirmed');
  });

  it('maps "capture" with accept fraud_status to paid and confirmed', () => {
    const res = mapMidtransStatusToPaymentState('capture', 'accept');
    expect(res.paymentStatus).toBe('paid');
    expect(res.bookingStatus).toBe('confirmed');
  });

  it('maps "capture" with challenge fraud_status to pending', () => {
    const res = mapMidtransStatusToPaymentState('capture', 'challenge');
    expect(res.paymentStatus).toBe('pending');
    expect(res.bookingStatus).toBe('pending_payment');
  });

  it('maps "pending" status to pending and pending_payment', () => {
    const res = mapMidtransStatusToPaymentState('pending');
    expect(res.paymentStatus).toBe('pending');
    expect(res.bookingStatus).toBe('pending_payment');
  });

  it('maps "deny" and "cancel" to failed and cancelled', () => {
    const denyRes = mapMidtransStatusToPaymentState('deny');
    expect(denyRes.paymentStatus).toBe('failed');
    expect(denyRes.bookingStatus).toBe('cancelled');

    const cancelRes = mapMidtransStatusToPaymentState('cancel');
    expect(cancelRes.paymentStatus).toBe('failed');
    expect(cancelRes.bookingStatus).toBe('cancelled');
  });

  it('maps "expire" status to expired and cancelled', () => {
    const res = mapMidtransStatusToPaymentState('expire');
    expect(res.paymentStatus).toBe('expired');
    expect(res.bookingStatus).toBe('cancelled');
  });

  it('maps "refund" and "partial_refund" accurately without cancelling booking', () => {
    const refundRes = mapMidtransStatusToPaymentState('refund');
    expect(refundRes.paymentStatus).toBe('refunded');
    expect(refundRes.bookingStatus).toBeNull();

    const partialRefundRes = mapMidtransStatusToPaymentState('partial_refund');
    expect(partialRefundRes.paymentStatus).toBe('partially_refunded');
    expect(partialRefundRes.bookingStatus).toBeNull();
  });
});
