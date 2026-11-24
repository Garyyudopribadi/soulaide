import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { PaymentStatusBadge } from '@/features/payments/PaymentStatusBadge';
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
import type { AdminPaymentItem } from './types';
import { adminService } from './adminService';
import {
  canMarkPaidManually,
  filterTransactions,
  needsQrisSync,
  providerStatusLabel,
  settlementLabel,
  validateManualSettlementReason,
} from './transactionRules';
import { formatIDR } from '@/lib/utils';

interface AdminPaymentsTabProps {
  payments: AdminPaymentItem[];
  onRefresh: () => void | Promise<void>;
}

const STATUS_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'expired', label: 'Kedaluwarsa' },
  { key: 'paid', label: 'Lunas' },
  { key: 'failed', label: 'Gagal' },
  { key: 'refunded', label: 'Refund' },
] as const;

function formatWhen(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const AdminPaymentsTab: React.FC<AdminPaymentsTabProps> = ({
  payments,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refundPayment, setRefundPayment] = useState<AdminPaymentItem | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [settlePayment, setSettlePayment] = useState<AdminPaymentItem | null>(null);
  const [settleReason, setSettleReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredPayments = useMemo(
    () => filterTransactions(payments, statusFilter, searchQuery),
    [payments, statusFilter, searchQuery]
  );

  const syncTargets = useMemo(() => payments.filter(needsQrisSync), [payments]);

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.total_amount ?? p.amount), 0);

  const awaitingListener = payments.filter((p) => canMarkPaidManually(p.status)).length;

  const showNotice = (message: string) => {
    setActionNotice(message);
    setTimeout(() => setActionNotice(null), 6000);
  };

  const handleOpenRefund = (payment: AdminPaymentItem) => {
    setRefundPayment(payment);
    setRefundAmount(payment.amount);
    setRefundReason('');
    setActionError(null);
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundPayment) return;

    if (refundAmount <= 0 || refundAmount > refundPayment.amount) {
      setActionError('Nominal refund tidak valid');
      return;
    }

    if (!refundReason.trim()) {
      setActionError('Alasan pengembalian dana wajib diisi');
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      await adminService.processRefund(refundPayment.id, refundAmount, refundReason);
      showNotice(`Refund sebesar ${formatIDR(refundAmount)} untuk ${refundPayment.provider_order_id} berhasil diproses.`);
      setRefundPayment(null);
      await onRefresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Gagal memproses refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncOne = async (payment: AdminPaymentItem) => {
    setSyncingId(payment.id);
    setActionError(null);
    try {
      const result = await adminService.syncPaymentWithQrisGate(payment.booking_id);
      if (result.amount_mismatch) {
        showNotice(`${payment.provider_order_id}: QRISGate lunas, tetapi nominal tidak cocok. Status lokal tidak diubah.`);
      } else if (result.slot_blocked) {
        showNotice(`${payment.provider_order_id} lunas di QRISGate, tetapi slot sudah dipakai booking lain.`);
      } else if (result.payment_status === 'paid' && payment.status !== 'paid') {
        showNotice(`${payment.provider_order_id} sudah lunas di QRISGate. Booking dikonfirmasi.`);
      } else if (result.provider_checked) {
        showNotice(`${payment.provider_order_id}: QRISGate ${providerStatusLabel(result.provider_status)}.`);
      } else {
        showNotice(`${payment.provider_order_id}: QRISGate tidak dapat dicek saat ini.`);
      }
      await onRefresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Gagal menyinkronkan QRISGate');
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    if (syncTargets.length === 0) {
      showNotice('Tidak ada transaksi yang perlu disinkronkan.');
      return;
    }
    setIsSyncingAll(true);
    setActionError(null);
    let becamePaid = 0;
    let mismatches = 0;
    let failed = 0;
    try {
      for (const payment of syncTargets) {
        try {
          const result = await adminService.syncPaymentWithQrisGate(payment.booking_id);
          if (result.amount_mismatch) mismatches += 1;
          else if (result.payment_status === 'paid' && payment.status !== 'paid') becamePaid += 1;
        } catch {
          failed += 1;
        }
      }
      await onRefresh();
      showNotice(
        `Sinkron QRISGate selesai. ${syncTargets.length - failed} dicek, ${becamePaid} menjadi lunas, ${mismatches} nominal tidak cocok, ${failed} gagal dihubungi.`
      );
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlePayment) return;
    const reasonError = validateManualSettlementReason(settleReason);
    if (reasonError) {
      setActionError(reasonError);
      return;
    }

    setIsProcessing(true);
    setActionError(null);
    try {
      const result = await adminService.markPaymentPaidManually(settlePayment.id, settleReason);
      if (result.slot_blocked) {
        showNotice(
          `${settlePayment.provider_order_id} ditandai lunas, tetapi slot sudah dipakai booking lain sehingga sesi tidak dikonfirmasi ulang.`
        );
      } else {
        showNotice(`${settlePayment.provider_order_id} ditandai lunas. QRISGate tidak dihubungi.`);
      }
      setSettlePayment(null);
      setSettleReason('');
      await onRefresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Gagal menandai lunas');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {actionNotice && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-2 border border-emerald-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 text-red-700 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200">
          <span className="text-xs text-slate-400 block font-medium">Total Transaksi</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{payments.length}</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <span className="text-xs text-slate-400 block font-medium">Total Lunas</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatIDR(totalPaid)}</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <span className="text-xs text-slate-400 block font-medium">Menunggu listener</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{awaitingListener}</p>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === filter.key
                  ? 'bg-white text-plum-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter.key === 'all' ? `${filter.label} (${payments.length})` : filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari order, klien, psikolog..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-plum-500"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            {isSyncingAll ? 'Menyinkronkan...' : `Sinkronkan QRISGate (${syncTargets.length})`}
          </Button>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <EmptyState
          title="Tidak ada transaksi yang cocok"
          message="Tidak ditemukan pembayaran yang sesuai dengan filter ini."
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {filteredPayments.map((payment) => (
              <TransactionCard
                key={payment.id}
                payment={payment}
                busy={syncingId === payment.id || isSyncingAll}
                onSync={() => handleSyncOne(payment)}
                onSettle={() => {
                  setSettlePayment(payment);
                  setSettleReason('');
                  setActionError(null);
                }}
                onRefund={() => handleOpenRefund(payment)}
              />
            ))}
          </div>

          <Card className="hidden md:block overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="p-4 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-plum-600" />
                <span>Transaksi ({filteredPayments.length})</span>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order & booking</th>
                    <th className="py-3 px-4">Klien</th>
                    <th className="py-3 px-4">Psikolog</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 px-4">QRISGate</th>
                    <th className="py-3 px-4">Soulaide</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50/60 align-top">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-800 block text-[11px]">
                          {payment.provider_order_id}
                        </span>
                        <span className="font-mono text-plum-700 text-[10px]">
                          {payment.booking_code}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1">
                          {formatWhen(payment.created_at)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{payment.customer_name}</span>
                        <span className="text-[10px] text-slate-400">{payment.service_name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{payment.psychologist_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">
                          {formatIDR(payment.total_amount ?? payment.amount)}
                        </span>
                        {payment.unique_code != null && (
                          <span className="text-[10px] text-slate-400">kode unik {payment.unique_code}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {providerStatusLabel(payment.provider_status)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {payment.provider_checked_at
                            ? `dicek ${formatWhen(payment.provider_checked_at)}`
                            : 'belum disinkronkan'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <PaymentStatusBadge status={payment.status} />
                        <span className="mt-1 block text-[10px] text-slate-500">
                          {settlementLabel(payment.settlement_source, payment.status)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <TransactionActions
                          payment={payment}
                          busy={syncingId === payment.id || isSyncingAll}
                          onSync={() => handleSyncOne(payment)}
                          onSettle={() => {
                            setSettlePayment(payment);
                            setSettleReason('');
                            setActionError(null);
                          }}
                          onRefund={() => handleOpenRefund(payment)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {refundPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white shadow-2xl border-slate-200">
            <CardHeader className="p-5 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Proses pengembalian dana
              </CardTitle>
              <p className="text-xs text-slate-500">
                Order ID: <strong className="font-mono">{refundPayment.provider_order_id}</strong>
              </p>
            </CardHeader>
            <form onSubmit={handleConfirmRefund} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nominal refund (maksimal {formatIDR(refundPayment.amount)}):
                </label>
                <input
                  type="number"
                  max={refundPayment.amount}
                  min={1000}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-plum-500 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alasan:</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                  rows={2}
                  placeholder="Contoh: pembatalan sesi atas kesepakatan psikolog dan klien"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-plum-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setRefundPayment(null)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isProcessing} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {isProcessing ? 'Memproses...' : 'Konfirmasi refund'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {settlePayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white shadow-2xl border-slate-200">
            <CardHeader className="p-5 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">Tandai lunas manual</CardTitle>
              <p className="text-xs text-slate-500">
                Order <strong className="font-mono">{settlePayment.provider_order_id}</strong> sebesar{' '}
                <strong>{formatIDR(settlePayment.total_amount ?? settlePayment.amount)}</strong>
              </p>
            </CardHeader>
            <form onSubmit={handleConfirmSettle} className="p-5 space-y-4 text-xs">
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                Ini hanya mengubah Soulaide. QRISGate tidak dibuka dan tidak diubah. Pakai saat pembayaran sudah masuk tetapi listener tidak mengirim status.
              </p>
              <div>
                <label className="font-semibold text-slate-700 block mb-1" htmlFor="settle-reason">
                  Alasan
                </label>
                <textarea
                  id="settle-reason"
                  value={settleReason}
                  onChange={(e) => setSettleReason(e.target.value)}
                  required
                  minLength={8}
                  maxLength={500}
                  rows={3}
                  placeholder="Contoh: dana masuk di DANA, listener tidak mendeteksi"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-plum-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setSettlePayment(null)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isProcessing}>
                  {isProcessing ? 'Menyimpan...' : 'Tandai lunas'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

function TransactionActions({
  payment,
  busy,
  onSync,
  onSettle,
  onRefund,
}: {
  payment: AdminPaymentItem;
  busy: boolean;
  onSync: () => void;
  onSettle: () => void;
  onRefund: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {needsQrisSync(payment) && (
        <Button type="button" size="sm" variant="outline" onClick={onSync} disabled={busy} className="h-7 px-2 text-[10px] gap-1">
          <RefreshCw className={`w-3 h-3 ${busy ? 'animate-spin' : ''}`} />
          Cek QRISGate
        </Button>
      )}
      {canMarkPaidManually(payment.status) && (
        <Button type="button" size="sm" onClick={onSettle} disabled={busy} className="h-7 px-2 text-[10px]">
          Tandai lunas
        </Button>
      )}
      {payment.status === 'paid' && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRefund}
          className="text-[10px] text-amber-700 hover:text-amber-900 hover:bg-amber-50 h-7 px-2 gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Refund
        </Button>
      )}
    </div>
  );
}

function TransactionCard({
  payment,
  busy,
  onSync,
  onSettle,
  onRefund,
}: {
  payment: AdminPaymentItem;
  busy: boolean;
  onSync: () => void;
  onSettle: () => void;
  onRefund: () => void;
}) {
  return (
    <Card className="p-4 border-slate-200 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-bold text-slate-900">{payment.provider_order_id}</p>
          <p className="text-[11px] text-slate-500">{payment.customer_name} · {payment.psychologist_name}</p>
        </div>
        <PaymentStatusBadge status={payment.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-slate-400">Nominal</p>
          <p className="font-semibold text-slate-900">{formatIDR(payment.total_amount ?? payment.amount)}</p>
        </div>
        <div>
          <p className="text-slate-400">QRISGate</p>
          <p className="font-semibold text-slate-900">{providerStatusLabel(payment.provider_status)}</p>
        </div>
        <div>
          <p className="text-slate-400">Sumber lunas</p>
          <p className="font-semibold text-slate-900">{settlementLabel(payment.settlement_source, payment.status)}</p>
        </div>
        <div>
          <p className="text-slate-400">Layanan</p>
          <p className="font-semibold text-slate-900">{payment.service_name}</p>
        </div>
      </div>
      <TransactionActions payment={payment} busy={busy} onSync={onSync} onSettle={onSettle} onRefund={onRefund} />
    </Card>
  );
}
