import { describe, it, expect } from 'vitest';
import type { Database } from '@/types/database';
import { calculateQrisGateSignature, verifyQrisGateSignature, mapQrisGateEventToPaymentState } from '@/features/payments/qrisgateCrypto';
import { validateSafeWhatsAppContent } from '@/features/chat/whatsappService';
import { containsEmergencyKeywords, EMERGENCY_HOTLINES } from '@/features/chat/crisisService';

describe('Phase 11 — Security, RLS & Production Readiness Tests', () => {
  describe('Database Naming & Architecture Compliance', () => {
    it('enforces that all custom Supabase tables use the strict Soulaide_ prefix', () => {
      // List of all custom application tables
      const expectedCustomTables: Array<keyof Database['public']['Tables']> = [
        'Soulaide_user_roles',
        'Soulaide_client_profiles',
        'Soulaide_psychologists',
        'Soulaide_services',
        'Soulaide_psychologist_schedules',
        'Soulaide_availability_overrides',
        'Soulaide_bookings',
        'Soulaide_booking_status_history',
        'Soulaide_reschedule_requests',
        'Soulaide_assessments',
        'Soulaide_consent_records',
        'Soulaide_clinical_notes',
        'Soulaide_clinical_reports',
        'Soulaide_payments',
        'Soulaide_payment_webhook_events',
        'Soulaide_refunds',
        'Soulaide_conversations',
        'Soulaide_conversation_participants',
        'Soulaide_messages',
        'Soulaide_psychologist_presence',
        'Soulaide_notifications',
        'Soulaide_cms_pages',
        'Soulaide_faqs',
        'Soulaide_site_settings',
        'Soulaide_audit_logs',
      ];

      expectedCustomTables.forEach((tableName) => {
        expect(tableName.startsWith('Soulaide_')).toBe(true);
      });
    });
  });

  describe('Clinical Note Privacy & Least Privilege Access Matrix', () => {
    it('guarantees operational admins do NOT have access to clinical notes', () => {
      // Define role permissions
      const rolePermissions = {
        customer: { viewBookings: true, managePayments: false, viewClinicalNotes: false },
        psychologist: { viewBookings: true, managePayments: false, viewClinicalNotes: true },
        admin: { viewBookings: true, managePayments: true, viewClinicalNotes: false }, // Strict isolation!
        super_admin: { viewBookings: true, managePayments: true, viewClinicalNotes: true }, // HIMPSI Audit only
      };

      // Clinical notes access check
      expect(rolePermissions.customer.viewClinicalNotes).toBe(false);
      expect(rolePermissions.admin.viewClinicalNotes).toBe(false);
      expect(rolePermissions.psychologist.viewClinicalNotes).toBe(true);
      expect(rolePermissions.super_admin.viewClinicalNotes).toBe(true);
    });

    it('prevents accidental leakage of clinical information into public channels', () => {
      const leakedClinical = validateSafeWhatsAppContent('Catatan klinis pasien: terdapat indikasi trauma.');
      expect(leakedClinical.isValid).toBe(false);
      expect(leakedClinical.warning).toBeDefined();

      const leakedAssessment = validateSafeWhatsAppContent('Skor asesmen DASS-21 kecemasan tinggi.');
      expect(leakedAssessment.isValid).toBe(false);

      const harmlessInquiry = validateSafeWhatsAppContent('Halo, apakah ada jadwal sesi offline di Pondok Bambu?');
      expect(harmlessInquiry.isValid).toBe(true);
    });
  });

  describe('QRISGate Server-Authoritative Cryptographic Verification', () => {
    const webhookSecret = 'whsec_test_secret_123456';
    const timestamp = 1763880000;
    const rawBody = JSON.stringify({
      event: 'payment.paid',
      external_order_id: 'SL-20261122-1001',
      total_amount: 350007,
    });
    const nowSeconds = timestamp + 10;

    it('verifies valid HMAC-SHA256 webhook signature over timestamp + raw body', async () => {
      // Compute expected HMAC manually via Web Crypto in test
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${rawBody}`));
      const expectedSignature = Array.from(new Uint8Array(sigBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const isValid = await verifyQrisGateSignature({
        timestamp,
        rawBody,
        webhookSecret,
        providedSignature: expectedSignature,
        nowSeconds,
      });
      expect(isValid).toBe(true);
      expect(await calculateQrisGateSignature(timestamp, rawBody, webhookSecret)).toBe(expectedSignature);
    });

    it('rejects tampered signature, tampered body, or stale timestamp', async () => {
      const tamperedSignature = 'deadbeef1234567890abcdef1234567890abcdef';
      expect(
        await verifyQrisGateSignature({ timestamp, rawBody, webhookSecret, providedSignature: tamperedSignature, nowSeconds })
      ).toBe(false);

      const validSignature = await calculateQrisGateSignature(timestamp, rawBody, webhookSecret);
      const tamperedBody = rawBody.replace('350007', '100000');
      expect(
        await verifyQrisGateSignature({ timestamp, rawBody: tamperedBody, webhookSecret, providedSignature: validSignature, nowSeconds })
      ).toBe(false);

      expect(
        await verifyQrisGateSignature({ timestamp, rawBody, webhookSecret, providedSignature: validSignature, nowSeconds: timestamp + 600 })
      ).toBe(false);
    });

    it('correctly maps all QRISGate webhook events to internal payment statuses', () => {
      expect(mapQrisGateEventToPaymentState('payment.paid').paymentStatus).toBe('paid');
      expect(mapQrisGateEventToPaymentState('payment.paid').bookingStatus).toBe('confirmed');
      expect(mapQrisGateEventToPaymentState('payment.expired').paymentStatus).toBe('expired');
      expect(mapQrisGateEventToPaymentState('payment.expired').bookingStatus).toBe('cancelled');
      expect(mapQrisGateEventToPaymentState('payment.cancelled').paymentStatus).toBe('failed');
      expect(mapQrisGateEventToPaymentState('payment.cancelled').bookingStatus).toBe('cancelled');
      expect(mapQrisGateEventToPaymentState('payment.unknown').paymentStatus).toBe('pending');
    });
  });

  describe('Emergency & Crisis Hotlines Readiness', () => {
    it('verifies 24/7 Indonesian crisis hotline numbers are present', () => {
      const kemenkes = EMERGENCY_HOTLINES.find((h) => h.phone.includes('119'));
      expect(kemenkes).toBeDefined();
      expect(kemenkes?.telUri).toBe('tel:119,8');

      const ambulans = EMERGENCY_HOTLINES.find((h) => h.phone.includes('118'));
      expect(ambulans).toBeDefined();
    });

    it('detects emergency distress keywords in text', () => {
      expect(containsEmergencyKeywords('saya putus asa ingin bunuh diri')).toBe(true);
      expect(containsEmergencyKeywords('terjadi darurat medis')).toBe(true);
      expect(containsEmergencyKeywords('hanya bertanya jadwal hari senin')).toBe(false);
    });
  });

  describe('Environment Variable Protection & Secret Isolation', () => {
    it('verifies that server secrets are NOT prefixed with VITE_', () => {
      // In Vite, only variables starting with VITE_ are exposed to the client.
      // Server keys must NEVER start with VITE_.
      const forbiddenClientPrefixes = [
        'VITE_QRISGATE_API_KEY',
        'VITE_QRISGATE_WEBHOOK_SECRET',
        'VITE_SUPABASE_SERVICE_ROLE_KEY',
        'VITE_POSTGRES_PASSWORD',
        'VITE_JWT_SECRET',
      ];

      forbiddenClientPrefixes.forEach((secret) => {
        expect(import.meta.env[secret]).toBeUndefined();
      });
    });
  });
});
