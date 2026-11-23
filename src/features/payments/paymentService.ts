import { supabase } from '@/lib/supabase/client.ts';
import type { QrisGatePaymentSession, PaymentRecord } from './types';

export const paymentService = {
  /**
   * Request payment creation via Supabase Edge Function 'create-payment' (QRISGate).
   * Price is resolved on the backend from Soulaide_services, never passed from client.
   * The backend returns the exact total (base price + unique code) and the QR payload.
   * There is no client-side fallback: a real QR must come from the server, or we fail loudly.
   */
  async createPaymentSession(bookingId: string): Promise<QrisGatePaymentSession> {
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: { booking_id: bookingId },
    });

    if (error) {
      let detail = 'Layanan pembayaran sedang tidak tersedia. Coba beberapa saat lagi.';
      try {
        const body = await (error as unknown as { context?: Response }).context?.json();
        if (body && typeof body.error === 'string') detail = body.error;
      } catch {
        // keep default message
      }
      throw new Error(detail);
    }

    if (!data || !data.order_id) {
      throw new Error('Respons pembayaran tidak valid dari server.');
    }

    return data as QrisGatePaymentSession;
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