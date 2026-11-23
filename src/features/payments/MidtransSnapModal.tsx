import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, ExternalLink, Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { paymentService } from './paymentService';
import type { MidtransSnapTransactionResponse } from './types';

interface MidtransSnapModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingCode: string;
  serviceName: string;
  amount: number;
  onPaymentSuccess?: () => void;
}

export const MidtransSnapModal: React.FC<MidtransSnapModalProps> = ({
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
  const [customError, setCustomError] = useState<string | null>(null);

  // Load Midtrans Snap client script dynamically
  useEffect(() => {
    if (!isOpen) return;

    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-mock';
    const isProd = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
    const scriptUrl = isProd
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    const existingScript = document.getElementById('midtrans-snap-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'midtrans-snap-script';
      script.src = scriptUrl;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen]);

  // Request payment session using TanStack Query
  const {
    data: snapData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<MidtransSnapTransactionResponse, Error>({
    queryKey: ['midtrans-snap-session', bookingId],
    queryFn: () => paymentService.createPaymentSession(bookingId),
    enabled: isOpen && !!bookingId,
    staleTime: 5 * 60 * 1000,
  });

  const activeError = customError || (queryError ? queryError.message : null);

  const handleOpenSnapPopup = () => {
    if (!snapData?.token) return;

    if (window.snap && typeof window.snap.pay === 'function') {
      window.snap.pay(snapData.token, {
        onSuccess: () => {
          checkStatus();
        },
        onPending: () => {
          checkStatus();
        },
        onError: () => {
          setCustomError('Pembayaran gagal atau dibatalkan.');
        },
        onClose: () => {
          checkStatus();
        },
      });
    } else if (snapData.redirect_url) {
      // Fallback if Snap JS is not loaded or popup blocked
      window.open(snapData.redirect_url, '_blank');
    }
  };

  const checkStatus = async () => {
    setVerifying(true);
    try {
      const status = await paymentService.verifyPaymentFromDatabase(bookingId);
      if (status.paymentStatus === 'paid' || status.bookingStatus === 'confirmed') {
        setVerifiedPaid(true);
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }
    } catch {
      // Ignore background check error
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-white shadow-2xl border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-plum-100 flex items-center justify-center text-plum-700">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">
                  Pembayaran Terproteksi
                </CardTitle>
                <p className="text-xs text-slate-500">Gateway Resmi Midtrans Snap</p>
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
                Menghubungkan ke gateway pembayaran...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Mengambil rincian invoice terverifikasi dari server
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
                {snapData?.order_id && (
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Order ID Midtrans</span>
                    <span className="font-mono text-slate-600">{snapData.order_id}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-slate-700">Total Tagihan</span>
                  <span className="text-xl font-bold text-plum-700">
                    Rp {amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Security notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-plum-50 border border-plum-100 text-plum-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-plum-600 shrink-0 mt-0.5" />
                <p>
                  Sistem kami memverifikasi pembayaran secara otomatis melalui webhook kriptografis.
                  Status sesi akan terupdate secara aman tanpa memerlukan bukti transfer manual.
                </p>
              </div>

              {snapData?.mode === 'mock' && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  {snapData.message || 'Mode simulasi pengujian (Midtrans Server Key belum diatur).'}
                </p>
              )}

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleOpenSnapPopup}
                  className="w-full bg-plum-600 hover:bg-plum-700 text-white font-semibold py-2.5 shadow-md"
                >
                  Buka Midtrans Snap Popup
                </Button>

                {snapData?.redirect_url && (
                  <a
                    href={snapData.redirect_url}
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
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="border-t border-slate-100 bg-slate-50/50 py-3 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={checkStatus}
            disabled={verifying}
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
