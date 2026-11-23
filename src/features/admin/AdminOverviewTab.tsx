import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  CreditCard,
  Users,
  Activity,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import type { AdminKpiSummary, AdminAuditLogItem, AdminTab } from './types';
import { formatIDR } from '@/lib/utils';

interface AdminOverviewTabProps {
  kpis: AdminKpiSummary;
  recentLogs: AdminAuditLogItem[];
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  kpis,
  recentLogs,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 border-slate-200">
          <span className="text-[11px] text-slate-400 block font-medium">Total Booking</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalBookings}</p>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[11px] text-slate-400 block font-medium">Sesi Terkonfirmasi</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{kpis.confirmedBookings}</p>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[11px] text-slate-400 block font-medium">Menunggu Bayar</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{kpis.pendingPayments}</p>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[11px] text-slate-400 block font-medium">Pendapatan Bersih</span>
          <p className="text-xl font-bold text-plum-800 mt-1">{formatIDR(kpis.totalRevenue)}</p>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[11px] text-slate-400 block font-medium">Psikolog Terdaftar</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">{kpis.verifiedPsychologists}</p>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[11px] text-slate-400 block font-medium">Katalog Layanan</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">{kpis.activeServices}</p>
        </Card>
      </div>

      {/* Operational Attention Required Banner */}
      {kpis.pendingPayments > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Terdapat <strong>{kpis.pendingPayments} reservasi</strong> yang menunggu konfirmasi pembayaran Midtrans.
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => onNavigateTab('bookings')}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white self-start sm:self-auto"
          >
            Lihat Antrean Booking
          </Button>
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateTab('bookings')}
          className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-plum-400 hover:shadow-md transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-plum-50 text-plum-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Kelola Reservasi</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Operasional status, jadwal & penugasan</p>
        </button>

        <button
          onClick={() => onNavigateTab('payments')}
          className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-plum-400 hover:shadow-md transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Rekonsiliasi Pembayaran</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Invoice Midtrans & proses refund</p>
        </button>

        <button
          onClick={() => onNavigateTab('staff')}
          className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-plum-400 hover:shadow-md transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Manajemen Staf & Role</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Otorisasi admin, psikolog, super admin</p>
        </button>

        <button
          onClick={() => onNavigateTab('audit-logs')}
          className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-plum-400 hover:shadow-md transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Jejak Audit Sistem</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Log histori perubahan state transaksi</p>
        </button>
      </div>

      {/* Live Recent Activity Stream */}
      <Card className="border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-plum-600" />
            <span>Aktivitas & Log Operasional Terkini</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateTab('audit-logs')}
            className="text-xs text-plum-700 hover:text-plum-900"
          >
            Lihat Semua Log
          </Button>
        </CardHeader>

        <CardContent className="p-4">
          {recentLogs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Belum ada aktivitas operasional yang tercatat di audit log.
            </p>
          ) : (
            <div className="space-y-3">
              {recentLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-100 rounded-xl text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 text-[11px]">
                        {log.action}
                      </span>
                      <Badge variant="outline" className="text-[9px]">
                        {log.resource_type}
                      </Badge>
                    </div>
                    {log.resource_id && (
                      <span className="text-[10px] text-slate-400 font-mono block">
                        ID: {log.resource_id}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
