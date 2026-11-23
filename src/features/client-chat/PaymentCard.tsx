/**
 * Inline QRIS payment card for the chat thread.
 * Adapted from QrisPaymentModal: server-created dynamic QR, exact total with
 * unique code, 1s countdown tick, 15s provider reconciliation poll (recovers
 * missed webhooks), session reuse on retry.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  TimerOff,
  Receipt,
} from 'lucide-react'
import { paymentService } from '@/features/payments/paymentService'
import type { QrisGatePaymentSession } from '@/features/payments/types'
import type { CustomerBookingRecord } from '@/features/booking/bookingService'
import { formatRupiah } from './wib.ts'

const POLL_INTERVAL_MS = 15000

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

interface PaymentCardProps {
  booking: CustomerBookingRecord
  onPaid?: () => void
  onOpenReceipt?: () => void
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ booking, onPaid, onOpenReceipt }) => {
  const [verifying, setVerifying] = useState(false)
  const [verifiedPaid, setVerifiedPaid] = useState(false)
  const [dbPaymentStatus, setDbPaymentStatus] = useState<string>('pending')
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const baseAmount =
    booking.deliveryMethod === 'offline'
      ? booking.service.priceOffline ?? 0
      : booking.service.priceOnline ?? 0

  const {
    data: session,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<QrisGatePaymentSession, Error>({
    queryKey: ['qrisgate-payment-session', booking.id],
    queryFn: () => paymentService.createPaymentSession(booking.id),
    enabled: !verifiedPaid,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const checkStatus = useCallback(
    async (manual = false) => {
      if (manual) setVerifying(true)
      try {
        const status = await paymentService.verifyPaymentStatus(booking.id)
        setDbPaymentStatus(status.paymentStatus)
        if (status.paymentStatus === 'paid' || status.bookingStatus === 'confirmed') {
          setVerifiedPaid(true)
          onPaid?.()
        }
      } catch {
        // background check errors are non-fatal
      } finally {
        if (manual) setVerifying(false)
      }
    },
    [booking.id, onPaid]
  )

  useEffect(() => {
    if (verifiedPaid) return
    const ticker = setInterval(() => setNow(Date.now()), 1000)
    const poller = setInterval(() => {
      void checkStatus(false)
    }, POLL_INTERVAL_MS)
    return () => {
      clearInterval(ticker)
      clearInterval(poller)
    }
  }, [verifiedPaid, checkStatus])

  const expiresAtMs = session?.expires_at ? new Date(session.expires_at).getTime() : null
  const secondsLeft = expiresAtMs ? Math.max(0, Math.floor((expiresAtMs - now) / 1000)) : null
  const isExpired = dbPaymentStatus === 'expired' || (secondsLeft !== null && secondsLeft === 0)
  const isFailed = dbPaymentStatus === 'failed'
  const exactTotal = session?.total_amount ?? baseAmount

  const handleCopyAmount = async () => {
    try {
      await navigator.clipboard.writeText(String(exactTotal))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable; amount stays visible
    }
  }

  if (verifiedPaid) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-emerald-900">Pembayaran diterima</p>
            <p className="text-[11px] text-emerald-700">
              Sesi {booking.bookingCode} terkonfirmasi otomatis.
            </p>
          </div>
          {onOpenReceipt && (
            <Button variant="outline" size="sm" onClick={onOpenReceipt} className="shrink-0 gap-1.5 text-xs">
              <Receipt className="h-3.5 w-3.5" />
              Struk
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-plum-200 bg-white shadow-2xs">
      <div className="flex items-center justify-between border-b border-plum-100 bg-plum-50/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-plum-100 text-plum-700">
            <QrCode className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold text-plum-950">Pembayaran QRIS</p>
            <p className="font-mono text-[10px] text-[#72677E]">{booking.bookingCode}</p>
          </div>
        </div>
        {secondsLeft !== null && !isExpired && (
          <span
            className={`font-mono text-xs font-bold tabular-nums ${secondsLeft < 120 ? 'text-rose-600' : 'text-plum-700'}`}
          >
            {formatCountdown(secondsLeft)}
          </span>
        )}
      </div>

      <div className="space-y-4 p-4">
        {loading ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Loader2 className="mb-2 h-7 w-7 animate-spin text-plum-600" />
            <p className="text-xs font-semibold text-plum-900">Menyiapkan QR pembayaran Anda</p>
            <p className="mt-0.5 text-[11px] text-[#72677E]">Nominal terverifikasi dari server</p>
          </div>
        ) : queryError ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="flex-1">
              <p className="text-xs font-bold text-rose-900">Kendala pembayaran</p>
              <p className="mt-0.5 text-[11px] text-rose-700">{queryError.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2 text-[11px]">
                Coba lagi
              </Button>
            </div>
          </div>
        ) : isExpired || isFailed ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-champagne-100 text-champagne-600">
              <TimerOff className="h-5 w-5" />
            </span>
            <p className="text-sm font-bold text-plum-950">
              {isFailed ? 'Pembayaran dibatalkan' : 'Waktu pembayaran habis'}
            </p>
            <p className="mt-1 max-w-xs text-[11px] text-[#72677E]">
              QR ini sudah tidak berlaku. Buat QR baru untuk melanjutkan.
            </p>
            <Button size="sm" onClick={() => refetch()} className="mt-3 text-xs">
              Buat QR baru
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5 rounded-xl border border-[#EEE7DE] bg-sanctuary-100 p-3 text-[11px]">
              <div className="flex justify-between text-[#72677E]">
                <span>{booking.service.name}</span>
              </div>
              <div className="flex justify-between text-[#72677E]">
                <span>Harga layanan</span>
                <span className="tabular-nums">{formatRupiah(session?.amount ?? baseAmount)}</span>
              </div>
              {!!session?.unique_code && (
                <div className="flex justify-between text-[#72677E]">
                  <span>Kode unik</span>
                  <span className="tabular-nums">+ {formatRupiah(session.unique_code)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-[#E7DFD6] pt-1.5">
                <span className="text-xs font-bold text-plum-950">Bayar persis</span>
                <span className="text-lg font-extrabold tabular-nums text-plum-700">
                  {formatRupiah(exactTotal)}
                </span>
              </div>
            </div>

            {session?.qr_image_base64 ? (
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-2xl border-2 border-plum-100 bg-white p-2.5">
                  <img
                    src={session.qr_image_base64}
                    alt={`QRIS pembayaran ${booking.bookingCode} sebesar ${formatRupiah(exactTotal)}`}
                    className="h-48 w-48 object-contain"
                  />
                </div>
                <p className="max-w-xs text-center text-[10px] leading-relaxed text-[#72677E]">
                  Scan dengan DANA, GoPay, OVO, ShopeePay, atau mobile banking pendukung QRIS.
                </p>
              </div>
            ) : session?.checkout_url ? (
              <a href={session.checkout_url} target="_blank" rel="noreferrer" className="block">
                <Button className="w-full gap-1.5 text-xs">
                  Buka halaman pembayaran QRIS
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            ) : (
              <div className="rounded-xl border border-dashed border-[#DDD5CC] bg-sanctuary-100 p-4 text-center">
                <QrCode className="mx-auto mb-1.5 h-6 w-6 text-[#C9BFB2]" />
                <p className="text-[11px] text-[#72677E]">QR belum tersedia. Coba muat ulang.</p>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg border border-champagne-200 bg-champagne-50 p-2.5 text-[11px] text-champagne-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="flex-1">
                <p>
                  Nominal harus <strong>persis {formatRupiah(exactTotal)}</strong> termasuk kode unik agar
                  terdeteksi otomatis.
                </p>
                <button
                  type="button"
                  onClick={handleCopyAmount}
                  className="mt-1.5 inline-flex items-center gap-1 font-bold transition-colors hover:text-champagne-600"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Nominal disalin' : 'Salin nominal'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#72677E]">
              <button
                type="button"
                onClick={() => checkStatus(true)}
                disabled={verifying}
                className="inline-flex items-center gap-1 font-bold text-plum-700 transition-colors hover:text-plum-900 disabled:opacity-50"
              >
                {verifying && <Loader2 className="h-3 w-3 animate-spin" />}
                {verifying ? 'Memeriksa...' : 'Cek status pembayaran'}
              </button>
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Memantau otomatis
              </span>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-plum-100 bg-plum-50 p-2.5 text-[10px] leading-relaxed text-plum-900">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-plum-600" />
              <p>
                Dana masuk langsung ke rekening Soulaide. Verifikasi otomatis lewat webhook bertanda tangan
                kriptografis, tanpa kirim bukti transfer manual.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}