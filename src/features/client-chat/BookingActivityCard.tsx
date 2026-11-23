/**
 * Activity card rendered inside a psychologist thread for booking events.
 * Live status via realtime; actions: pay (inline QRIS), reschedule request,
 * cancel, and receipt. All mutations go through services whose DB triggers
 * write the follow-up activity messages automatically.
 */

import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  CalendarClock,
  MapPin,
  Video,
  Loader2,
  Receipt,
  XCircle,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import {
  fetchBookingById,
  submitRescheduleRequest,
  cancelBooking,
} from '@/features/booking/bookingService'
import { validateRescheduleEligibility } from '@/features/booking/availability'
import { paymentService } from '@/features/payments/paymentService'
import { fetchDayAvailability, subscribeToBookings } from './chatApi.ts'
import { computeDaySlots } from './slots.ts'
import { getSelectableDatesWib, formatSessionDate, formatRupiah } from './wib.ts'
import { BookingStatusBadge } from './ChatBits.tsx'
import { PaymentCard } from './PaymentCard.tsx'

interface BookingActivityCardProps {
  bookingId: string
  currentUserId: string
  onOpenReceipt: (bookingId: string) => void
}

export const BookingActivityCard: React.FC<BookingActivityCardProps> = ({
  bookingId,
  currentUserId,
  onOpenReceipt,
}) => {
  const queryClient = useQueryClient()
  const [showReschedule, setShowReschedule] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionDate, setActionDate] = useState('')
  const [actionTime, setActionTime] = useState('')
  const [actionReason, setActionReason] = useState('')

  const { data: booking, refetch } = useQuery({
    queryKey: ['booking-card', bookingId],
    queryFn: () => fetchBookingById(bookingId),
  })

  const { data: payment } = useQuery({
    queryKey: ['booking-card-payment', bookingId],
    queryFn: () => paymentService.getPaymentForBooking(bookingId),
    enabled: Boolean(booking),
  })

  // Live status updates (webhook, admin, other device).
  useEffect(() => {
    const unsubscribe = subscribeToBookings([bookingId], () => {
      void refetch()
      void queryClient.invalidateQueries({ queryKey: ['booking-card-payment', bookingId] })
    })
    return unsubscribe
  }, [bookingId, refetch, queryClient])

  const dates = getSelectableDatesWib(14)
  const selectedDate = dates.find((d) => d.dateStr === actionDate)

  const { data: availability } = useQuery({
    queryKey: ['reschedule-availability', booking?.psychologist.id, actionDate],
    queryFn: () => fetchDayAvailability(booking!.psychologist.id, actionDate),
    enabled: showReschedule && Boolean(booking) && Boolean(actionDate),
  })

  if (!booking) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-[#E8E1D9] bg-white px-4 py-3 text-[11px] text-[#72677E]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Memuat detail booking
      </div>
    )
  }

  const price =
    booking.deliveryMethod === 'offline'
      ? booking.service.priceOffline
      : booking.service.priceOnline

  const rescheduleEligible =
    (booking.status === 'confirmed' || booking.status === 'rescheduled') &&
    validateRescheduleEligibility(booking.sessionDate, booking.sessionStartTime).isEligible

  const canCancel =
    booking.status === 'pending_payment' ||
    booking.status === 'confirmed' ||
    booking.status === 'rescheduled'

  const slots =
    availability && selectedDate && booking
      ? computeDaySlots({
          dateStr: actionDate,
          dayOfWeek: selectedDate.dayOfWeek,
          durationMinutes: booking.service.durationMinutes,
          availability,
        })
      : []

  const handleReschedule = async () => {
    if (!actionDate || !actionTime || !actionReason.trim()) {
      setActionError('Lengkapi tanggal, jam, dan alasan perubahan jadwal.')
      return
    }
    setBusy(true)
    setActionError(null)
    const res = await submitRescheduleRequest(
      booking,
      currentUserId,
      actionDate,
      actionTime,
      actionReason.trim()
    )
    setBusy(false)
    if (!res.success) {
      setActionError(res.error || 'Gagal mengajukan reschedule.')
      return
    }
    setShowReschedule(false)
    setActionDate('')
    setActionTime('')
    setActionReason('')
    void refetch()
  }

  const handleCancel = async () => {
    setBusy(true)
    setActionError(null)
    const res = await cancelBooking(booking.id)
    setBusy(false)
    if (!res.success) {
      setActionError(res.error || 'Gagal membatalkan sesi.')
      return
    }
    setConfirmCancel(false)
    void refetch()
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E3DACF] bg-white shadow-2xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0EAE2] bg-sanctuary-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-plum-600" />
          <span className="font-mono text-xs font-bold text-plum-950">{booking.bookingCode}</span>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="space-y-3 p-4">
        {/* Summary */}
        <div className="space-y-1 text-[12px]">
          <p className="font-bold text-plum-950">{booking.service.name}</p>
          <p className="text-[#72677E]">
            {booking.psychologist.fullName}
            {booking.psychologist.isBot ? ' (bot uji coba)' : ''}
          </p>
          <p className="text-plum-900">
            {formatSessionDate(booking.sessionDate)} · {booking.sessionStartTime.slice(0, 5)} WIB
            {' · '}
            {booking.deliveryMethod === 'online' ? 'Online' : 'Tatap muka'}
            {price !== null && (
              <span className="font-semibold"> · {formatRupiah(price)}</span>
            )}
          </p>
        </div>

        {/* Confirmed logistics */}
        {booking.status === 'confirmed' || booking.status === 'rescheduled' ? (
          booking.deliveryMethod === 'online' && booking.meetingLink ? (
            <a
              href={booking.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-plum-200 bg-plum-50 px-3 py-2.5 text-xs font-bold text-plum-800 transition-colors hover:bg-plum-100"
            >
              <Video className="h-4 w-4" />
              Buka tautan sesi
              <ExternalLink className="ml-auto h-3.5 w-3.5" />
            </a>
          ) : booking.deliveryMethod === 'offline' && booking.locationAddress ? (
            <div className="flex items-start gap-2 rounded-xl border border-[#E8E1D9] bg-sanctuary-100 px-3 py-2.5 text-[11px] text-plum-900">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" />
              {booking.locationAddress}
            </div>
          ) : null
        ) : null}

        {/* Payment */}
        {booking.status === 'pending_payment' && (
          <PaymentCard
            booking={booking}
            onPaid={() => {
              void refetch()
              void queryClient.invalidateQueries({ queryKey: ['booking-card-payment', bookingId] })
            }}
            onOpenReceipt={() => onOpenReceipt(bookingId)}
          />
        )}

        {booking.status === 'reschedule_requested' && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
            Permintaan perubahan jadwal sedang ditinjau tim Soulaide. Anda akan menerima notifikasi begitu
            jadwal baru disetujui.
          </p>
        )}

        {actionError && (
          <p className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {actionError}
          </p>
        )}

        {/* Actions */}
        {(canCancel || rescheduleEligible || payment?.status === 'paid') && (
          <div className="flex flex-wrap gap-2 border-t border-[#F0EAE2] pt-3">
            {payment?.status === 'paid' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenReceipt(bookingId)}
                className="gap-1.5 text-[11px]"
              >
                <Receipt className="h-3.5 w-3.5" />
                Struk
              </Button>
            )}
            {rescheduleEligible && !showReschedule && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowReschedule(true)
                  setConfirmCancel(false)
                  setActionError(null)
                }}
                className="gap-1.5 text-[11px]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Ubah jadwal
              </Button>
            )}
            {canCancel && !confirmCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setConfirmCancel(true)
                  setShowReschedule(false)
                  setActionError(null)
                }}
                className="gap-1.5 text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <XCircle className="h-3.5 w-3.5" />
                Batalkan
              </Button>
            )}
          </div>
        )}

        {/* Cancel confirmation */}
        {confirmCancel && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-[11px] font-semibold text-rose-900">
              Batalkan sesi {booking.bookingCode}? Slot waktu akan dilepas kembali.
              {payment?.status === 'paid' && ' Pembayaran yang sudah masuk mengikuti kebijakan refund Soulaide.'}
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                disabled={busy}
                className="text-[11px]"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Ya, batalkan'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmCancel(false)}
                disabled={busy}
                className="text-[11px]"
              >
                Kembali
              </Button>
            </div>
          </div>
        )}

        {/* Reschedule form */}
        {showReschedule && (
          <div className="space-y-2.5 rounded-xl border border-plum-200 bg-plum-50/50 p-3">
            <p className="text-[11px] font-bold text-plum-900">Ajukan jadwal baru (min. 8 jam sebelum sesi)</p>
            <div className="flex flex-wrap gap-1.5">
              {dates.slice(0, 10).map((d) => (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => {
                    setActionDate(d.dateStr)
                    setActionTime('')
                  }}
                  className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
                    actionDate === d.dateStr
                      ? 'border-plum-700 bg-plum-700 text-white'
                      : 'border-[#DDD5CC] bg-white text-plum-900 hover:border-plum-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {actionDate && (
              <div className="flex flex-wrap gap-1.5">
                {slots.length === 0 && (
                  <p className="text-[10px] text-[#72677E]">Tidak ada slot pada tanggal ini.</p>
                )}
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    title={s.reason}
                    onClick={() => setActionTime(s.time)}
                    className={`rounded-lg border px-2.5 py-1.5 font-mono text-[10px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      actionTime === s.time
                        ? 'border-plum-700 bg-plum-700 text-white'
                        : 'border-[#DDD5CC] bg-white text-plum-900 hover:border-plum-300'
                    }`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Alasan perubahan jadwal (wajib)"
              rows={2}
              className="w-full rounded-lg border border-[#DDD5CC] bg-white px-2.5 py-2 text-[11px] text-plum-950 placeholder:text-[#A79BB5] focus:border-plum-400 focus:outline-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleReschedule}
                disabled={busy || !actionDate || !actionTime || !actionReason.trim()}
                className="text-[11px]"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Kirim pengajuan'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReschedule(false)}
                disabled={busy}
                className="text-[11px]"
              >
                Batal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}