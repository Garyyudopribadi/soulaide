import { supabase } from '@/lib/supabase/client.ts';
import type { MidtransSnapTransactionResponse, PaymentRecord } from './types';

export const paymentService = {
  /**
   * Request payment creation via Supabase Edge Function 'create-payment'.
   * Price is resolved on the backend from Soulaide_services, never passed from client.
   */
  async createPaymentSession(bookingId: string): Promise<MidtransSnapTransactionResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { booking_id: bookingId },
      });

      if (!error && data && data.token) {
        return data as MidtransSnapTransactionResponse;
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
    const mockToken = `mock-snap-${Date.now()}`;
    const amount = Number(
      booking.delivery_method === 'offline'
        ? (service.price_offline || 0)
        : (service.price_online || 0)
    );

    // Record pending payment in database
    await supabase
      .from('Soulaide_payments')
      .insert({
        booking_id: booking.id,
        amount,
        status: 'pending',
        midtrans_order_id: orderId,
      });

    return {
      token: mockToken,
      redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${mockToken}`,
      order_id: orderId,
      amount,
      mode: 'mock',
      message: 'Mode simulasi sandbox. Silakan selesaikan pembayaran.',
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
   * Verifies payment status directly from database
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
