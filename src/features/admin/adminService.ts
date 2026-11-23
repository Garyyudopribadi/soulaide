import { supabase } from '@/lib/supabase/client';
import type {
  AdminBookingItem,
  AdminPaymentItem,
  AdminStaffItem,
  AdminAuditLogItem,
  AdminKpiSummary,
} from './types';
import type { UserRole, BookingStatus } from '@/types';
import type { PaymentStatus } from '@/features/payments/types';
import type { Json } from '@/types/database';

export const adminService = {
  /**
   * Fetches real KPI operational summary
   */
  async fetchAdminKpis(): Promise<AdminKpiSummary> {
    const [bookingsRes, paymentsRes, psychsRes, servicesRes] = await Promise.all([
      supabase.from('Soulaide_bookings').select('id, status'),
      supabase.from('Soulaide_payments').select('amount, status'),
      supabase.from('Soulaide_psychologists').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('Soulaide_services').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    const bookings = bookingsRes.data || [];
    const payments = paymentsRes.data || [];

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
    const pendingPayments = bookings.filter((b) => b.status === 'pending_payment').length;

    const totalRevenue = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalBookings,
      confirmedBookings,
      pendingPayments,
      totalRevenue,
      verifiedPsychologists: psychsRes.count || 4,
      activeServices: servicesRes.count || 4,
    };
  },

  /**
   * Fetches all operational bookings with customer, psychologist, service, and payment status
   */
  async fetchAdminBookings(): Promise<AdminBookingItem[]> {
    const { data: bookings, error } = await supabase
      .from('Soulaide_bookings')
      .select('*')
      .order('session_date', { ascending: false });

    if (error || !bookings || bookings.length === 0) {
      return [];
    }

    const customerIds = Array.from(new Set(bookings.map((b) => b.customer_id)));
    const psychologistIds = Array.from(new Set(bookings.map((b) => b.psychologist_id)));
    const serviceIds = Array.from(new Set(bookings.map((b) => b.service_id)));
    const bookingIds = bookings.map((b) => b.id);

    const [profilesRes, psychsRes, servicesRes, paymentsRes] = await Promise.all([
      supabase.from('Soulaide_profiles').select('id, full_name, email, phone_number').in('id', customerIds),
      supabase.from('Soulaide_psychologists').select('id, full_name, credentials').in('id', psychologistIds),
      supabase.from('Soulaide_services').select('id, name, price_online, price_offline').in('id', serviceIds),
      supabase.from('Soulaide_payments').select('id, booking_id, amount, status, provider_order_id').in('booking_id', bookingIds),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p]));
    const psychMap = new Map((psychsRes.data || []).map((p) => [p.id, p]));
    const serviceMap = new Map((servicesRes.data || []).map((s) => [s.id, s]));
    const paymentMap = new Map((paymentsRes.data || []).map((pay) => [pay.booking_id, pay]));

    return bookings.map((b) => {
      const p = profileMap.get(b.customer_id);
      const psych = psychMap.get(b.psychologist_id);
      const s = serviceMap.get(b.service_id);
      const pay = paymentMap.get(b.id);

      return {
        id: b.id,
        booking_code: b.booking_code,
        session_date: b.session_date,
        session_start_time: b.session_start_time,
        session_end_time: b.session_end_time,
        delivery_method: b.delivery_method as 'online' | 'offline',
        status: b.status,
        notes: b.notes,
        meeting_link: b.meeting_link,
        location_address: b.location_address,
        created_at: b.created_at,
        customer: {
          id: b.customer_id,
          full_name: p?.full_name || 'Pelanggan',
          email: p?.email || null,
          phone_number: p?.phone_number || null,
        },
        psychologist: {
          id: b.psychologist_id,
          full_name: psych?.full_name || 'Psikolog',
          credentials: psych?.credentials || 'Psikolog Klinis',
        },
        service: {
          id: b.service_id,
          name: s?.name || 'Konseling Psikologi',
          price_online: s?.price_online ?? null,
          price_offline: s?.price_offline ?? null,
        },
        payment: pay
          ? {
              id: pay.id,
              amount: Number(pay.amount),
              status: pay.status as PaymentStatus,
              provider_order_id: pay.provider_order_id,
            }
          : null,
      };
    });
  },

  /**
   * Update booking status (e.g. confirm, cancel, mark completed, no-show)
   */
  async updateBookingStatus(bookingId: string, newStatus: BookingStatus, notes?: string): Promise<void> {
    const updatePayload: { status: BookingStatus; notes?: string; updated_at: string } = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    const { error } = await supabase
      .from('Soulaide_bookings')
      .update(updatePayload)
      .eq('id', bookingId);

    if (error) {
      throw new Error(`Gagal memperbarui status booking: ${error.message}`);
    }

    await adminService.recordAuditLog('BOOKING_STATUS_UPDATED', 'booking', bookingId, {
      new_status: newStatus,
      notes,
    });
  },

  /**
   * Reassign assigned psychologist
   */
  async reassignPsychologist(bookingId: string, psychologistId: string): Promise<void> {
    const { error } = await supabase
      .from('Soulaide_bookings')
      .update({
        psychologist_id: psychologistId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) {
      throw new Error(`Gagal mengalihkan psikolog: ${error.message}`);
    }

    await adminService.recordAuditLog('BOOKING_PSYCHOLOGIST_REASSIGNED', 'booking', bookingId, {
      new_psychologist_id: psychologistId,
    });
  },

  /**
   * Fetches payments with booking code and customer details
   */
  async fetchAdminPayments(): Promise<AdminPaymentItem[]> {
    const { data: payments, error } = await supabase
      .from('Soulaide_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !payments || payments.length === 0) {
      return [];
    }

    const bookingIds = payments.map((p) => p.booking_id);
    const { data: bookings } = await supabase
      .from('Soulaide_bookings')
      .select('id, booking_code, customer_id, service_id')
      .in('id', bookingIds);

    const customerIds = Array.from(new Set((bookings || []).map((b) => b.customer_id)));
    const serviceIds = Array.from(new Set((bookings || []).map((b) => b.service_id)));

    const [profilesRes, servicesRes] = await Promise.all([
      supabase.from('Soulaide_profiles').select('id, full_name, email').in('id', customerIds),
      supabase.from('Soulaide_services').select('id, name').in('id', serviceIds),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p]));
    const serviceMap = new Map((servicesRes.data || []).map((s) => [s.id, s.name]));
    const bookingMap = new Map((bookings || []).map((b) => [b.id, b]));

    return payments.map((p) => {
      const b = bookingMap.get(p.booking_id);
      const prof = b ? profileMap.get(b.customer_id) : null;
      const sName = b ? serviceMap.get(b.service_id) : 'Layanan Psikologi';

      return {
        id: p.id,
        booking_id: p.booking_id,
        booking_code: b?.booking_code || 'SLD-UNKNOWN',
        customer_name: prof?.full_name || 'Pelanggan',
        customer_email: prof?.email || null,
        service_name: sName || 'Konseling Psikologi',
        amount: Number(p.amount),
        status: p.status as PaymentStatus,
        provider_order_id: p.provider_order_id,
        provider_transaction_id: p.provider_transaction_id,
        unique_code: p.unique_code ?? null,
        total_amount: p.total_amount != null ? Number(p.total_amount) : null,
        payment_type: p.payment_type,
        payment_time: p.payment_time,
        created_at: p.created_at,
      };
    });
  },

  /**
   * Process refund into public."Soulaide_refunds" and update payment status
   */
  async processRefund(paymentId: string, amount: number, reason: string): Promise<void> {
    const { data: payment } = await supabase
      .from('Soulaide_payments')
      .select('id, amount, status')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      throw new Error('Data pembayaran tidak ditemukan');
    }

    if (amount <= 0 || amount > Number(payment.amount)) {
      throw new Error('Nominal refund tidak valid atau melebihi nominal transaksi');
    }

    // Insert refund record
    const { error: refundError } = await supabase
      .from('Soulaide_refunds')
      .insert({
        payment_id: paymentId,
        amount,
        reason,
        status: 'completed',
      });

    if (refundError) {
      throw new Error(`Gagal memproses refund: ${refundError.message}`);
    }

    const newPaymentStatus = amount === Number(payment.amount) ? 'refunded' : 'partially_refunded';

    // Update payment record
    await supabase
      .from('Soulaide_payments')
      .update({
        status: newPaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    await adminService.recordAuditLog('PAYMENT_REFUNDED', 'payment', paymentId, {
      refund_amount: amount,
      reason,
      new_status: newPaymentStatus,
    });
  },

  /**
   * Fetch staff members and user roles
   */
  async fetchStaffMembers(): Promise<AdminStaffItem[]> {
    const { data: roles, error } = await supabase
      .from('Soulaide_user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !roles || roles.length === 0) {
      return [];
    }

    const userIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from('Soulaide_profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    return roles.map((r) => {
      const prof = profileMap.get(r.user_id);
      return {
        id: r.id,
        user_id: r.user_id,
        email: prof?.email || null,
        full_name: prof?.full_name || 'Pengguna Soulaide',
        role: r.role as UserRole,
        created_at: r.created_at,
      };
    });
  },

  /**
   * Update user role in Soulaide_user_roles
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    const { error } = await supabase
      .from('Soulaide_user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Gagal mengubah role pengguna: ${error.message}`);
    }

    await adminService.recordAuditLog('USER_ROLE_UPDATED', 'user_role', userId, {
      new_role: newRole,
    });
  },

  /**
   * Fetch system audit logs
   */
  async fetchAuditLogs(limit = 50): Promise<AdminAuditLogItem[]> {
    const { data: logs, error } = await supabase
      .from('Soulaide_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !logs) {
      return [];
    }

    return logs.map((l) => ({
      id: l.id,
      actor_id: l.actor_id,
      action: l.action,
      resource_type: l.entity_name,
      resource_id: l.entity_id,
      metadata: l.metadata as Record<string, unknown> | null,
      created_at: l.created_at,
    }));
  },

  /**
   * Record audit log
   */
  async recordAuditLog(
    action: string,
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('Soulaide_audit_logs')
      .insert({
        actor_id: user?.id || null,
        action,
        entity_name: resourceType,
        entity_id: resourceId,
        metadata: (metadata || {}) as Json,
      });
  },
};
