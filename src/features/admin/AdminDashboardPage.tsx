import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LoadingState } from '@/components/shared/LoadingState'
import { useAuth } from '@/features/auth/useAuth'
import { adminService } from './adminService'
import { AdminOverviewTab } from './AdminOverviewTab'
import { AdminBookingsTab } from './AdminBookingsTab'
import { AdminPaymentsTab } from './AdminPaymentsTab'
import { AdminStaffTab } from './AdminStaffTab'
import { AdminAuditLogsTab } from './AdminAuditLogsTab'
import { AdminCmsServices } from './AdminCmsServices'
import { AdminCmsPsychologists } from './AdminCmsPsychologists'
import { AdminCmsFaqs } from './AdminCmsFaqs'
import { AdminCmsSettings } from './AdminCmsSettings'
import type { AdminTab } from './types'
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  FileText,
  Users,
  Shield,
  Activity,
  HelpCircle,
  Settings,
} from 'lucide-react'

export const AdminDashboardPage: React.FC = () => {
  const { user, role } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  const {
    data: kpis = {
      totalBookings: 0,
      confirmedBookings: 0,
      pendingPayments: 0,
      totalRevenue: 0,
      verifiedPsychologists: 4,
      activeServices: 4,
    },
    isLoading: loadingKpis,
    refetch: refetchKpis,
  } = useQuery({
    queryKey: ['admin-kpis'],
    queryFn: () => adminService.fetchAdminKpis(),
    enabled: !!user,
  })

  const { data: bookings = [], refetch: refetchBookings } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => adminService.fetchAdminBookings(),
    enabled: !!user,
  })

  const { data: payments = [], refetch: refetchPayments } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => adminService.fetchAdminPayments(),
    enabled: !!user,
  })

  const { data: staffMembers = [], refetch: refetchStaff } = useQuery({
    queryKey: ['admin-staff'],
    queryFn: () => adminService.fetchStaffMembers(),
    enabled: !!user,
  })

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminService.fetchAuditLogs(50),
    enabled: !!user,
  })

  const allPsychologists = Array.from(
    new Map(bookings.map((b) => [b.psychologist.id, b.psychologist])).values()
  ).map((p) => ({
    id: p.id,
    fullName: p.full_name,
  }))

  const tabs = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'bookings', label: 'Reservasi & Operasional', icon: Calendar, badge: bookings.length },
    { id: 'payments', label: 'Pembayaran & Refund', icon: CreditCard, badge: payments.length },
    { id: 'services', label: 'Layanan & Tarif', icon: FileText },
    { id: 'psychologists', label: 'Psikolog', icon: Users },
    { id: 'staff', label: 'Staf & Otoritas', icon: Shield },
    { id: 'audit-logs', label: 'Jejak Audit', icon: Activity },
    { id: 'faqs', label: 'Pusat Bantuan (FAQ)', icon: HelpCircle },
    { id: 'settings', label: 'Pengaturan Situs', icon: Settings },
  ] as const

  if (loadingKpis) {
    return <LoadingState message="Memuat portal dashboard administrator..." />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-br from-plum-950 via-plum-900 to-plum-800 rounded-3xl p-7 sm:p-9 text-white shadow-[0_20px_50px_-20px_rgba(41,23,56,0.45)] relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-champagne-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/15 text-plum-100 text-[11px] font-semibold">
              Portal Manajemen Operasional
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-champagne-500/20 border border-champagne-200/30 text-champagne-100 text-[10px] font-mono font-bold">
              Otoritas: {role ? role.toUpperCase() : 'ADMIN'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard <span className="font-serif italic font-medium text-plum-200">Administrator</span>
          </h1>
          <p className="text-xs sm:text-sm text-plum-100/80 max-w-2xl leading-relaxed">
            Pantau ketersediaan slot, operasional reservasi, rekonsiliasi gateway Midtrans, dan jejak audit sistem Soulaide.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-1.5 shadow-2xs">
        <nav className="flex gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl font-semibold text-xs whitespace-nowrap cursor-pointer transition-all ${isActive
                    ? 'bg-plum-700 text-white shadow-xs'
                    : 'text-[#5A5066] hover:text-plum-900 hover:bg-plum-50/70'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-plum-200' : 'text-[#8E81A1]'}`} />
                <span>{tab.label}</span>
                {'badge' in tab && tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-sanctuary-200 text-[#52475E]'
                      }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <AdminOverviewTab
          kpis={kpis}
          recentLogs={auditLogs}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'bookings' && (
        <AdminBookingsTab
          bookings={bookings}
          allPsychologists={allPsychologists}
          onRefresh={() => {
            refetchBookings()
            refetchKpis()
          }}
        />
      )}

      {activeTab === 'payments' && (
        <AdminPaymentsTab
          payments={payments}
          onRefresh={() => {
            refetchPayments()
            refetchKpis()
          }}
        />
      )}

      {activeTab === 'services' && <AdminCmsServices />}
      {activeTab === 'psychologists' && <AdminCmsPsychologists />}

      {activeTab === 'staff' && (
        <AdminStaffTab
          staffMembers={staffMembers}
          currentUserRole={role || 'admin'}
          onRefresh={() => refetchStaff()}
        />
      )}

      {activeTab === 'audit-logs' && <AdminAuditLogsTab logs={auditLogs} />}
      {activeTab === 'faqs' && <AdminCmsFaqs />}
      {activeTab === 'settings' && <AdminCmsSettings />}
    </div>
  )
}
