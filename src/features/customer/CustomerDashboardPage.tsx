import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { useAuth } from '@/features/auth/useAuth'
import {
  fetchCustomerBookings,
  submitRescheduleRequest,
  cancelBooking,
  type CustomerBookingRecord,
} from '@/features/booking/bookingService'
import { validateRescheduleEligibility, getSelectableDates } from '@/features/booking/availability'
import { customerService } from './customerService'
import { CustomerSessionsTab } from './CustomerSessionsTab'
import { CustomerPaymentsTab } from './CustomerPaymentsTab'
import { CustomerProfileTab } from './CustomerProfileTab'
import { CustomerNotificationsTab } from './CustomerNotificationsTab'
import { notificationService } from '@/features/chat/notificationService'
import { CustomerReceiptModal } from './CustomerReceiptModal'
import { CustomerChatModal } from './CustomerChatModal'
import { MidtransSnapModal } from '@/features/payments/MidtransSnapModal'
import type { CustomerTab, CustomerPaymentItem } from './types'
import {
  Calendar,
  CreditCard,
  User,
  Bell,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

export const CustomerDashboardPage: React.FC = () => {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<CustomerTab>('sessions')
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [rescheduleBooking, setRescheduleBooking] = useState<CustomerBookingRecord | null>(null)
  const [paymentBooking, setPaymentBooking] = useState<CustomerBookingRecord | null>(null)
  const [chatBooking, setChatBooking] = useState<CustomerBookingRecord | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<CustomerPaymentItem | null>(null)

  const [proposedDate, setProposedDate] = useState('')
  const [proposedTime, setProposedTime] = useState('10:30')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false)

  const {
    data: bookings = [],
    isLoading: loadingBookings,
    refetch: loadBookings,
  } = useQuery({
    queryKey: ['customer-bookings', user?.id],
    queryFn: () => (user ? fetchCustomerBookings(user.id) : Promise.resolve([])),
    enabled: !!user,
  })

  const { data: clientProfile = null, refetch: loadProfile } = useQuery({
    queryKey: ['customer-client-profile', user?.id],
    queryFn: () => (user ? customerService.fetchCustomerClientProfile(user.id) : Promise.resolve(null)),
    enabled: !!user,
  })

  const { data: payments = [], refetch: loadPayments } = useQuery({
    queryKey: ['customer-payments', user?.id],
    queryFn: () => (user ? customerService.fetchCustomerPaymentHistory(user.id) : Promise.resolve([])),
    enabled: !!user,
  })

  const { data: consents = [] } = useQuery({
    queryKey: ['customer-consents', user?.id],
    queryFn: () => (user ? customerService.fetchCustomerConsents(user.id) : Promise.resolve([])),
    enabled: !!user,
  })

  const { data: notifications = [], refetch: loadNotifications } = useQuery({
    queryKey: ['customer-notifications', user?.id],
    queryFn: () => (user ? customerService.fetchCustomerNotifications(user.id) : Promise.resolve([])),
    enabled: !!user,
  })

  useEffect(() => {
    if (!user) return
    const unsubscribe = notificationService.subscribeToNotifications(user.id, () => {
      loadNotifications()
    })
    return () => unsubscribe()
  }, [user, loadNotifications])

  const unreadNotifCount = notifications.filter((n) => !n.is_read).length
  const upcomingCount = bookings.filter((b) =>
    ['confirmed', 'pending_payment', 'reschedule_requested', 'rescheduled'].includes(b.status)
  ).length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Terkonfirmasi</Badge>
      case 'pending_payment':
        return <Badge variant="warning">Menunggu Pembayaran</Badge>
      case 'reschedule_requested':
        return <Badge variant="secondary">Pengajuan Reschedule</Badge>
      case 'rescheduled':
        return <Badge variant="default">Jadwal Baru</Badge>
      case 'completed':
        return <Badge variant="outline">Selesai</Badge>
      case 'cancelled':
        return <Badge variant="secondary" className="text-rose-700 bg-rose-50 border-rose-200">Dibatalkan</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleCancelBooking = async (booking: CustomerBookingRecord) => {
    if (!user) return
    if (!window.confirm(`Apakah Anda yakin ingin membatalkan sesi ${booking.bookingCode}?`)) return

    const res = await cancelBooking(booking.id, user.id, booking.status, 'Dibatalkan oleh klien')
    if (res.success) {
      setActionNotice(`Sesi ${booking.bookingCode} berhasil dibatalkan.`)
      loadBookings()
    } else {
      setActionError(res.error || 'Gagal membatalkan sesi.')
    }
    setTimeout(() => {
      setActionNotice(null)
      setActionError(null)
    }, 4000)
  }

  const handleOpenReschedule = (booking: CustomerBookingRecord) => {
    const check = validateRescheduleEligibility(booking.sessionDate, booking.sessionStartTime)
    if (!check.isEligible) {
      alert(check.message)
      return
    }
    setRescheduleBooking(booking)
    const dates = getSelectableDates(7)
    if (dates.length > 0) setProposedDate(dates[0].dateStr)
  }

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !rescheduleBooking || !proposedDate) return

    setIsSubmittingReschedule(true)
    const res = await submitRescheduleRequest(
      rescheduleBooking,
      user.id,
      proposedDate,
      proposedTime,
      rescheduleReason || 'Klien berhalangan pada jadwal sebelumnya'
    )
    setIsSubmittingReschedule(false)

    if (res.success) {
      setRescheduleBooking(null)
      setActionNotice('Permintaan reschedule berhasil diajukan dan sedang diproses tim admin.')
      loadBookings()
    } else {
      setActionError(res.error || 'Gagal mengajukan reschedule.')
    }
    setTimeout(() => {
      setActionNotice(null)
      setActionError(null)
    }, 4000)
  }

  if (loadingBookings) {
    return <LoadingState message="Memuat portal dashboard klien..." />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-br from-plum-950 via-plum-900 to-plum-800 rounded-3xl p-7 sm:p-9 text-white shadow-[0_20px_50px_-20px_rgba(41,23,56,0.5)] relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-plum-400/20 blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/15 text-plum-100 text-[11px] font-semibold">
            Portal Klien Terintegrasi
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Halo, <span className="font-serif italic font-medium text-plum-200">{profile?.full_name || user?.email?.split('@')[0]}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-plum-100/80 max-w-xl leading-relaxed">
            Kelola jadwal sesi psikologi, status pembayaran Midtrans, dan data kontak darurat Anda secara aman dan rahasia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link to="/booking">
            <Button className="bg-white hover:bg-sanctuary-100 text-plum-900 font-bold gap-2 text-xs rounded-full px-5 h-11 shadow-lg">
              <Sparkles className="w-4 h-4 text-plum-700" />
              <span>Booking Sesi Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#72677E] block font-semibold">Sesi Aktif Mendatang</span>
            <p className="text-2xl font-extrabold text-plum-800 mt-1 tabular-nums">{upcomingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-plum-50 border border-plum-100 text-plum-700 flex items-center justify-center">
            <Calendar className="w-4.5 h-4.5" />
          </div>
        </Card>
        <Card className="p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#72677E] block font-semibold">Sesi Selesai</span>
            <p className="text-2xl font-extrabold text-[#1E1429] mt-1 tabular-nums">
              {bookings.filter((b) => b.status === 'completed').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sanctuary-100 border border-[#EAE3DC] text-[#52475E] flex items-center justify-center">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </Card>
        <Card className="p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#72677E] block font-semibold">Transaksi Lunas</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">
              {payments.filter((p) => p.status === 'paid').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center">
            <CreditCard className="w-4.5 h-4.5" />
          </div>
        </Card>
        <Card className="p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#72677E] block font-semibold">Notifikasi Baru</span>
            <p className="text-2xl font-extrabold text-champagne-700 mt-1 tabular-nums">{unreadNotifCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-champagne-50 border border-champagne-200 text-champagne-700 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5" />
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-medium rounded-2xl flex items-center gap-2.5 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 text-rose-800 text-xs sm:text-sm font-medium rounded-2xl flex items-center gap-2.5 border border-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Pill Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#EAE3DC]">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'sessions'
              ? 'border-plum-700 text-plum-900'
              : 'border-transparent text-[#645A70] hover:text-[#1E1429]'
            }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Sesi Konseling</span>
          <span className="ml-1 px-2 py-0.5 bg-plum-50 text-plum-800 rounded-full text-[10px] font-bold">
            {bookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'payments'
              ? 'border-plum-700 text-plum-900'
              : 'border-transparent text-[#645A70] hover:text-[#1E1429]'
            }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Riwayat Tagihan & Kwitansi</span>
          <span className="ml-1 px-2 py-0.5 bg-sanctuary-200 text-[#52475E] rounded-full text-[10px] font-bold">
            {payments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'profile'
              ? 'border-plum-700 text-plum-900'
              : 'border-transparent text-[#645A70] hover:text-[#1E1429]'
            }`}
        >
          <User className="w-4 h-4" />
          <span>Profil & Consent</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'notifications'
              ? 'border-plum-700 text-plum-900'
              : 'border-transparent text-[#645A70] hover:text-[#1E1429]'
            }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifikasi</span>
          {unreadNotifCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-champagne-100 text-champagne-700 font-bold rounded-full text-[10px]">
              {unreadNotifCount}
            </span>
          )}
        </button>
      </div>

      {/* Reschedule Inline Card */}
      {rescheduleBooking && (
        <Card className="border-plum-300 bg-plum-50/50 p-6 rounded-3xl">
          <form onSubmit={handleConfirmReschedule} className="space-y-4">
            <h3 className="text-base font-bold text-[#1E1429] flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-plum-700" />
              Ajukan Perubahan Jadwal (Reschedule) – {rescheduleBooking.bookingCode}
            </h3>
            <p className="text-xs text-[#5A5066]">
              Kebijakan reschedule: diajukan minimal 8 jam sebelum sesi berlangsung, maksimal 1 kali per pemesanan.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3C3148] block">Pilih Tanggal Baru</label>
                <select
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-[#DFD7CE] bg-white focus:ring-2 focus:ring-plum-500/30 focus:border-plum-500"
                >
                  {getSelectableDates(7).map((d) => (
                    <option key={d.dateStr} value={d.dateStr}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3C3148] block">Pilih Jam Sesi</label>
                <select
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-[#DFD7CE] bg-white focus:ring-2 focus:ring-plum-500/30 focus:border-plum-500"
                >
                  <option value="09:00">09:00 WIB</option>
                  <option value="10:30">10:30 WIB</option>
                  <option value="13:30">13:30 WIB</option>
                  <option value="15:00">15:00 WIB</option>
                  <option value="16:30">16:30 WIB</option>
                  <option value="19:00">19:00 WIB</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3C3148] block">Alasan Pengajuan</label>
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows={2}
                placeholder="Berikan alasan perubahan jadwal agar psikolog dan admin dapat mengonfirmasi slot alternatif..."
                className="w-full text-xs p-3 rounded-xl border border-[#DFD7CE] bg-white focus:ring-2 focus:ring-plum-500/30 focus:border-plum-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRescheduleBooking(null)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingReschedule} className="text-xs">
                {isSubmittingReschedule ? 'Mengirim...' : 'Kirim Pengajuan Reschedule'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab Content */}
      {activeTab === 'sessions' && (
        <CustomerSessionsTab
          bookings={bookings}
          onPayNow={(booking) => setPaymentBooking(booking)}
          onOpenChat={(booking) => setChatBooking(booking)}
          onReschedule={(booking) => handleOpenReschedule(booking)}
          onCancel={(booking) => handleCancelBooking(booking)}
          getStatusBadge={getStatusBadge}
        />
      )}

      {activeTab === 'payments' && (
        <CustomerPaymentsTab
          payments={payments}
          onViewReceipt={(payment) => setSelectedReceipt(payment)}
        />
      )}

      {activeTab === 'profile' && (
        <CustomerProfileTab
          userId={user?.id || ''}
          initialFullName={profile?.full_name || ''}
          initialPhone={profile?.phone_number || ''}
          userEmail={user?.email || ''}
          clientProfile={clientProfile}
          consents={consents}
          onProfileUpdated={() => loadProfile()}
        />
      )}

      {activeTab === 'notifications' && (
        <CustomerNotificationsTab
          notifications={notifications}
          onMarkAsRead={async (id) => {
            await customerService.markNotificationRead(id)
            loadNotifications()
          }}
          onMarkAllAsRead={async () => {
            if (user?.id) {
              await customerService.markAllNotificationsRead(user.id)
              loadNotifications()
            }
          }}
        />
      )}

      {paymentBooking && (
        <MidtransSnapModal
          isOpen={Boolean(paymentBooking)}
          onClose={() => setPaymentBooking(null)}
          bookingId={paymentBooking.id}
          bookingCode={paymentBooking.bookingCode}
          serviceName={paymentBooking.service.name}
          amount={
            paymentBooking.deliveryMethod === 'offline'
              ? (paymentBooking.service.priceOffline || 0)
              : (paymentBooking.service.priceOnline || 0)
          }
          onPaymentSuccess={() => {
            setPaymentBooking(null)
            setActionNotice('Pembayaran berhasil diverifikasi. Status sesi kini dikonfirmasi.')
            loadBookings()
            loadPayments()
          }}
        />
      )}

      {selectedReceipt && (
        <CustomerReceiptModal
          payment={selectedReceipt}
          customerName={profile?.full_name || user?.email?.split('@')[0] || 'Klien Soulaide'}
          customerEmail={user?.email || ''}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {chatBooking && (
        <CustomerChatModal booking={chatBooking} onClose={() => setChatBooking(null)} />
      )}
    </div>
  )
}
