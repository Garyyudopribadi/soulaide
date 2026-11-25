import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, ExternalLink, Loader2, AlertCircle, CheckCircle2, QrCode, Copy, Check, TimerOff } from 'lucide-react';
import { paymentService } from './paymentService';
import type { QrisgateCheckoutResponse } from './types';
import { formatIDR } from '@/lib/utils';

interface QrisgatePaymentModalProps {
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

export const QrisgatePaymentModal: React.FC<QrisgatePaymentModalProps> = ({
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

  // Request payment session via TanStack Query
  const {
    data: session,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<QrisgateCheckoutResponse, Error>({
    queryKey: ['qrisgate-checkout-session', bookingId],
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

  // Tick countdown every second and poll status every 5 seconds
  useEffect(() => {
    if (!isOpen || verifiedPaid) return;
    const ticker = setInterval(() => setNow(Date.now()), 1000);
    const poller = setInterval(() => { void checkStatus(false); }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(ticker);
      clearInterval(poller);
    };
  }, [isOpen, verifiedPaid, checkStatus]);

  const [activeBookingKey, setActiveBookingKey] = useState<string>('');

  if (isOpen && activeBookingKey !== bookingId) {
    setActiveBookingKey(bookingId);
    setVerifiedPaid(false);
    setDbPaymentStatus('pending');
    setCustomError(null);
    setCopied(false);
  }

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
      // Clipboard unavailable
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-plum-100 text-plum-900 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Pembayaran QRIS & Transfer Bank
                </CardTitle>
                <p className="text-xs text-slate-500">QR Otomatis & Terverifikasi Real-Time</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-plum-700" />
              <p className="text-xs text-slate-500 font-medium">
                Menyiapkan QR pembayaran Anda...
              </p>
            </div>
          ) : activeError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div className="space-y-1">
                <p className="font-semibold">Gagal memproses pembayaran</p>
                <p>{activeError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCustomError(null);
                    refetch();
                  }}
                  className="mt-2 text-xs border-red-300 text-red-800 hover:bg-red-100"
                >
                  Coba Lagi
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
                className="mt-4 bg-plum-700 hover:bg-plum-800 text-white text-sm"
              >
                Buat QR Baru
              </Button>
            </div>
          ) : (
            <>
              {/* Order summary */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Nomor Booking</span>
                  <span className="font-mono font-semibold text-slate-800">{bookingCode}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Layanan</span>
                  <span className="font-semibold text-slate-800">{serviceName}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                  <span className="text-slate-600 font-medium">Harga Layanan</span>
                  <span className="tabular-nums font-semibold text-slate-800">
                    {formatIDR(session?.amount ?? amount)}
                  </span>
                </div>
                {!!session?.unique_code && (
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Kode unik verifikasi</span>
                    <span className="tabular-nums text-plum-700 font-bold">
                      +{session.unique_code}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                  <span className="text-sm font-semibold text-slate-700">Total Wajib Bayar</span>
                  <span className="text-xl font-extrabold text-plum-950 font-mono">
                    {formatIDR(exactTotal)}
                  </span>
                </div>
              </div>

              {/* QR Image or Checkout button */}
              {session?.qr_image_base64 ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white border-2 border-plum-100 rounded-2xl shadow-sm">
                    <img
                      src={session.qr_image_base64}
                      alt={`QRIS pembayaran ${bookingCode} sebesar ${formatIDR(exactTotal)}`}
                      className="w-56 h-56 object-contain"
                    />
                  </div>
                  <p className="text-xs text-slate-600 text-center max-w-sm">
                    Scan dengan DANA, GoPay, OVO, ShopeePay, BCA, Mandiri, atau mobile banking apa pun.
                  </p>
                </div>
              ) : session?.checkout_url ? (
                <a
                  href={session.checkout_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-plum-800 hover:bg-plum-900 text-white font-semibold py-3 shadow-md gap-2 rounded-xl">
                    <span>Buka Halaman Pembayaran</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              ) : null}

              {/* Exact-amount notice with copy button */}
              <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Harap transfer nominal <strong>tepat persis {formatIDR(exactTotal)}</strong> termasuk kode unik agar pembayaran terdeteksi otomatis seketika.
                  </p>
                </div>
                <button
                  onClick={handleCopyAmount}
                  className="inline-flex items-center gap-1.5 font-bold text-amber-800 hover:text-amber-950 transition-colors pl-6"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Nominal Berhasil Disalin' : 'Salin Nominal Tepat'}</span>
                </button>
              </div>

              {/* Countdown and live polling notice */}
              <div className="flex items-center justify-between text-xs px-1">
                {secondsLeft !== null && (
                  <span className={`font-mono font-bold tabular-nums ${secondsLeft < 120 ? 'text-rose-600' : 'text-slate-600'}`}>
                    Berlaku {formatCountdown(secondsLeft)} lagi
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin text-plum-600" />
                  Mengecek otomatis...
                </span>
              </div>

              {/* Trust guarantee */}
              <div className="p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-2.5 text-xs text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Dana masuk langsung ke rekening bank merchant Soulaide. Verifikasi berlangsung otomatis tanpa perlu kirim bukti struk manual.
                </p>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="bg-slate-50/60 border-t border-slate-100 p-4 sm:p-5 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => checkStatus(true)}
            disabled={verifying || verifiedPaid}
            className="text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
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
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold rounded-xl"
          >
            Tutup
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// Aliased export for backwards compatibility
export { QrisgatePaymentModal as MidtransSnapModal };
export { QrisgatePaymentModal as QrisPaymentModal };
