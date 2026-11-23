import { supabase } from '@/lib/supabase/client.ts';
import type { QrisGatePaymentSession, PaymentRecord } from './types';

export const paymentService = {
  /**
   * Request payment creation via Supabase Edge Function 'create-payment' (QRISGate).
   * Price is resolved on the backend from Soulaide_services, never passed from client.
   * The backend returns the exact total (base price + unique code) and the QR payload.
   */
  async createPaymentSession(bookingId: string): Promise<QrisGatePaymentSession> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { booking_id: bookingId },
      });

      if (!error && data && data.order_id) {
        return data as QrisGatePaymentSession;
      }
    } catch {
      // Edge Function unavailable in local-only / static mock environment; proceed to fallback
    }

    // Fallback for preview / dev environments without Supabase Edge Runtime active
    // 1. Fetch booking and verified service price from database
    const { data: booking, error: bookingErr } = await supabase
      .from('Soulaide_bookings')
      .select('id, booking_code, service_id, status, delivery_method')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      throw new Error('Sesi konseling tidak ditemukan');
    }

    const { data: service, error: serviceErr } = await supabase
      .from('Soulaide_services')
      .select('id, name, price_online, price_offline')
      .eq('id', booking.service_id)
      .single();

    if (serviceErr || !service) {
      throw new Error('Informasi tarif layanan tidak ditemukan');
    }

    const orderId = `SLD-${booking.booking_code}-${Date.now().toString().slice(-6)}`;
    const amount = Math.round(Number(
      booking.delivery_method === 'offline'
        ? (service.price_offline || 0)
        : (service.price_online || 0)
    ));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Record pending payment in database (simulation only — no real QR is allocated)
    await supabase
      .from('Soulaide_payments')
      .insert({
        booking_id: booking.id,
        amount,
        status: 'pending',
        provider: 'qrisgate',
        provider_order_id: orderId,
        unique_code: 0,
        total_amount: amount,
        expires_at: expiresAt,
        payment_type: 'qris',
      });

    return {
      order_id: orderId,
      transaction_id: null,
      amount,
      unique_code: 0,
      total_amount: amount,
      qr_string: null,
      qr_image_base64: null,
      checkout_url: null,
      expires_at: expiresAt,
      mode: 'mock',
      message: 'Mode simulasi (Edge Function QRISGate tidak aktif). Tidak ada QR asli yang dibuat.',
    };
  },

  /**
   * Fetches latest payment entry for a booking
   */
  async getPaymentForBooking(bookingId: string): Promise<PaymentRecord | null> {
    const { data, error } = await supabase
      .from('Soulaide_payments')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching payment for booking:', error);
      return null;
    }

    return (data as unknown) as PaymentRecord | null;
  },

  /**
   * Verifies payment status directly from database.
   * The QRISGate webhook updates these rows server-side; the client only reads them.
   */
  async verifyPaymentFromDatabase(bookingId: string): Promise<{
    paymentStatus: string;
    bookingStatus: string;
  }> {
    const { data: booking } = await supabase
      .from('Soulaide_bookings')
      .select('status')
      .eq('id', bookingId)
      .single();

    const { data: payment } = await supabase
      .from('Soulaide_payments')
      .select('status')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      paymentStatus: payment?.status || 'pending',
      bookingStatus: booking?.status || 'pending_payment',
    };
  },
};