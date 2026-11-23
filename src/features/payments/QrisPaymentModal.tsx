import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, ExternalLink, Loader2, AlertCircle, CheckCircle2, QrCode, Copy, Check, TimerOff } from 'lucide-react';
import { paymentService } from './paymentService';
import type { QrisGatePaymentSession } from './types';

interface QrisPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingCode: string;
  serviceName: string;
  amount: number;
  onPaymentSuccess?: () => void;
}

const POLL_INTERVAL_MS = 5000;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const QrisPaymentModal: React.FC<QrisPaymentModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  bookingCode,
  serviceName,
  amount,
  onPaymentSuccess,
}) => {
  const [verifying, setVerifying] = useState(false);
  const [verifiedPaid, setVerifiedPaid] = useState(false);
  const [dbPaymentStatus, setDbPaymentStatus] = useState<string>('pending');
  const [customError, setCustomError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Request QRISGate payment session using TanStack Query
  const {
    data: session,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<QrisGatePaymentSession, Error>({
    queryKey: ['qrisgate-payment-session', bookingId],
    queryFn: () => paymentService.createPaymentSession(bookingId),
    enabled: isOpen && !!bookingId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const activeError = customError || (queryError ? queryError.message : null);

  const checkStatus = useCallback(async (manual = false) => {
    if (manual) setVerifying(true);
    try {
      const status = await paymentService.verifyPaymentStatus(bookingId);
      setDbPaymentStatus(status.paymentStatus);
      if (status.paymentStatus === 'paid' || status.bookingStatus === 'confirmed') {
        setVerifiedPaid(true);
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }
    } catch {
      // Ignore background check error
    } finally {
      if (manual) setVerifying(false);
    }
  }, [bookingId, onPaymentSuccess]);

  // Tick every second for the expiry countdown; poll payment status every 5 seconds.
  useEffect(() => {
    if (!isOpen || verifiedPaid) return;
    const ticker = setInterval(() => setNow(Date.now()), 1000);
    const poller = setInterval(() => { void checkStatus(false); }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(ticker);
      clearInterval(poller);
    };
  }, [isOpen, verifiedPaid, checkStatus]);

  // Reset transient state when the modal reopens for a different booking
  useEffect(() => {
    if (isOpen) {
      setVerifiedPaid(false);
      setDbPaymentStatus('pending');
      setCustomError(null);
      setCopied(false);
      setNow(Date.now());
    }
  }, [isOpen, bookingId]);

  const expiresAtMs = session?.expires_at ? new Date(session.expires_at).getTime() : null;
  const secondsLeft = expiresAtMs ? Math.max(0, Math.floor((expiresAtMs - now) / 1000)) : null;
  const isExpired = dbPaymentStatus === 'expired' || (secondsLeft !== null && secondsLeft === 0);
  const isFailed = dbPaymentStatus === 'failed';

  const exactTotal = session?.total_amount ?? amount;

  const handleCopyAmount = async () => {
    try {
      await navigator.clipboard.writeText(String(exactTotal));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context); the amount stays visible on screen
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200 max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-plum-100 flex items-center justify-center text-plum-700">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">
                  Pembayaran QRIS
                </CardTitle>
                <p className="text-xs text-slate-500">QR dinamis otomatis via QRISGate</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 animate-spin text-plum-600 mb-3" />
              <p className="text-sm font-medium text-slate-700">
                Menyiapkan QR pembayaran Anda...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Mengambil rincian tagihan terverifikasi dari server
              </p>
            </div>
          ) : activeError ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-900">Kendala Pembayaran</h4>
                <p className="text-xs text-rose-700 mt-1">{activeError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomError(null);
                    refetch();
                  }}
                  className="mt-3 text-xs"
                >
                  Coba Muat Ulang
                </Button>
              </div>
            </div>
          ) : verifiedPaid ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Pembayaran Berhasil Dikonfirmasi</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-sm">
                Status sesi Anda telah diperbarui menjadi dikonfirmasi di server kami.
              </p>
            </div>
          ) : isExpired || isFailed ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                <TimerOff className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {isFailed ? 'Pembayaran Dibatalkan' : 'Waktu Pembayaran Habis'}
              </h3>
              <p className="text-sm text-slate-600 mt-1 max-w-sm">
                QR ini sudah tidak berlaku. Buat QR baru untuk melanjutkan pembayaran sesi Anda.
              </p>
              <Button
                onClick={() => refetch()}
                className="mt-4 bg-plum-600 hover:bg-plum-700 text-white text-sm"
              >
                Buat QR Baru
              </Button>
            </div>
          ) : (
            <>
              {/* Invoice Summary */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Kode Booking</span>
                  <span className="font-mono font-bold text-slate-700">{bookingCode}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Layanan</span>
                  <span className="font-medium text-slate-800 text-right">{serviceName}</span>
                </div>
                {session?.order_id && (
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Order ID</span>
                    <span className="font-mono text-slate-600">{session.order_id}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Harga layanan</span>
                    <span className="tabular-nums">Rp {(session?.amount ?? amount).toLocaleString('id-ID')}</span>
                  </div>
                  {!!session?.unique_code && (
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Kode unik (wajib dibayar persis)</span>
                      <span className="tabular-nums">+ Rp {session.unique_code.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-sm font-semibold text-slate-700">Bayar Persis</span>
                    <span className="text-xl font-bold text-plum-700 tabular-nums">
                      Rp {exactTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR display */}
              {session?.qr_image_base64 ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white border-2 border-plum-100 rounded-2xl shadow-sm">
                    <img
                      src={session.qr_image_base64}
                      alt={`QRIS pembayaran ${bookingCode} sebesar Rp ${exactTotal.toLocaleString('id-ID')}`}
                      className="w-56 h-56 object-contain"
                    />
                  </div>
                  <p className="text-xs text-slate-600 text-center max-w-sm">
                    Scan dengan DANA, GoPay, OVO, ShopeePay, atau mobile banking apa pun yang mendukung QRIS.
                  </p>
                </div>
              ) : session?.checkout_url ? (
                <a
                  href={session.checkout_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-plum-600 hover:bg-plum-700 text-white font-semibold py-2.5 shadow-md">
                    <span>Buka Halaman Pembayaran QRIS</span>
                    <ExternalLink className="w-4 h-4 ml-1.5" />
                  </Button>
                </a>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
                  <QrCode className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">
                    QR belum tersedia. Pastikan Edge Function QRISGate aktif dan API key sudah diatur.
                  </p>
                </div>
              )}

              {/* Exact-amount notice + copy */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>
                    Nominal harus <strong>persis Rp {exactTotal.toLocaleString('id-ID')}</strong> — termasuk kode
                    unik — agar pembayaran terdeteksi otomatis. Jika kanal Anda meminta nominal diketik manual
                    (mis. GoPay), ketik angka yang sama persis.
                  </p>
                  <button
                    onClick={handleCopyAmount}
                    className="mt-2 inline-flex items-center gap-1.5 font-semibold text-amber-800 hover:text-amber-950 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Nominal disalin' : 'Salin nominal'}</span>
                  </button>
                </div>
              </div>

              {/* Countdown + security notice */}
              <div className="flex items-center justify-between text-xs">
                {secondsLeft !== null && (
                  <span className={`font-mono font-bold tabular-nums ${secondsLeft < 120 ? 'text-rose-600' : 'text-slate-600'}`}>
                    Berlaku {formatCountdown(secondsLeft)} lagi
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Memantau pembayaran otomatis...
                </span>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-plum-50 border border-plum-100 text-plum-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-plum-600 shrink-0 mt-0.5" />
                <p>
                  Dana masuk langsung ke rekening Soulaide. Sistem memverifikasi pembayaran secara otomatis
                  melalui webhook bertanda tangan kriptografis — tanpa perlu kirim bukti transfer manual.
                </p>
              </div>

              {session?.mode === 'mock' && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  {session.message || 'Mode simulasi pengujian (QRISGate API key belum diatur).'}
                </p>
              )}

              {session?.checkout_url && session?.qr_image_base64 && (
                <a
                  href={session.checkout_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center"
                >
                  <Button variant="outline" className="w-full text-xs text-slate-600">
                    <span>Buka di Tab Baru</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </a>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="border-t border-slate-100 bg-slate-50/50 py-3 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => checkStatus(true)}
            disabled={verifying || verifiedPaid}
            className="text-xs text-slate-600 hover:text-slate-800"
          >
            {verifying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Memeriksa Status...
              </>
            ) : (
              'Cek Status Pembayaran'
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-slate-500">
            Tutup
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};