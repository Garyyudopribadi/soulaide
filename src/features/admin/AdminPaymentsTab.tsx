import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { PaymentStatusBadge } from '@/features/payments/PaymentStatusBadge';
import {
  CreditCard,
  RotateCcw,
  Search,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { AdminPaymentItem } from './types';
import { adminService } from './adminService';
import { formatIDR } from '@/lib/utils';

interface AdminPaymentsTabProps {
  payments: AdminPaymentItem[];
  onRefresh: () => void;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchOrder = p.midtrans_order_id.toLowerCase().includes(q);
        const matchCode = p.booking_code.toLowerCase().includes(q);
        const matchCust = p.customer_name.toLowerCase().includes(q);
        if (!matchOrder && !matchCode && !matchCust) return false;
      }

      return true;
    });
  }, [payments, statusFilter, searchQuery]);

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = payments
    .filter((p) => ['refunded', 'partially_refunded'].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0);

  const handleOpenRefund = (payment: AdminPaymentItem) => {
    setRefundPayment(payment);
    setRefundAmount(payment.amount);
    setRefundReason('');
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
      setActionNotice(`Refund sebesar ${formatIDR(refundAmount)} untuk ${refundPayment.midtrans_order_id} berhasil diproses.`);
      setRefundPayment(null);
      onRefresh();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Gagal memproses refund');
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

      {/* KPI Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200">
          <span className="text-xs text-slate-400 block font-medium">Total Transaksi Masuk</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{payments.length}</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <span className="text-xs text-slate-400 block font-medium">Total Pembayaran Lunas</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatIDR(totalPaid)}</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <span className="text-xs text-slate-400 block font-medium">Total Dana Direfund</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{formatIDR(totalRefunded)}</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {['all', 'paid', 'pending', 'failed', 'refunded'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize ${
                statusFilter === st
                  ? 'bg-white text-plum-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? `Semua (${payments.length})` : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari order ID / booking..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-plum-500"
          />
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          title="Tidak ada transaksi yang cocok"
          message="Tidak ditemukan riwayat pembayaran yang sesuai dengan kriteria filter Anda."
        />
      ) : (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-plum-600" />
              <span>Daftar Transaksi Midtrans & Rekonsiliasi ({filteredPayments.length})</span>
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order ID & Booking</th>
                  <th className="py-3 px-4">Klien</th>
                  <th className="py-3 px-4">Layanan</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Tanggal Transaksi</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-800 block text-[11px]">
                        {p.midtrans_order_id}
                      </span>
                      <span className="font-mono text-plum-700 text-[10px]">
                        Booking: {p.booking_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{p.customer_name}</span>
                      <span className="text-[10px] text-slate-400">{p.customer_email || '-'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{p.service_name}</td>
                    <td className="py-3.5 px-4 capitalize text-slate-600">{p.payment_type || 'Midtrans Snap'}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(p.payment_time || p.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatIDR(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <PaymentStatusBadge status={p.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRefund(p)}
                          className="text-[10px] text-amber-700 hover:text-amber-900 hover:bg-amber-50 h-7 px-2 gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Refund
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Refund Modal */}
      {refundPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white shadow-2xl border-slate-200">
            <CardHeader className="p-5 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Proses Pengembalian Dana (Refund)
              </CardTitle>
              <p className="text-xs text-slate-500">
                Order ID: <strong className="font-mono">{refundPayment.midtrans_order_id}</strong>
              </p>
            </CardHeader>
            <form onSubmit={handleConfirmRefund} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nominal Refund (Maksimal {formatIDR(refundPayment.amount)}):
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
                <label className="font-semibold text-slate-700 block mb-1">
                  Alasan Pengembalian Dana:
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                  rows={2}
                  placeholder="Contoh: Pembatalan sesi atas kesepakatan psikolog dan klien..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-plum-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRefundPayment(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isProcessing}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isProcessing ? 'Memproses...' : 'Konfirmasi Refund'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
