import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/shared/LoadingState'
import { useAuth } from '@/features/auth/useAuth'
import { psychologistService } from './psychologistService'
import { PsychologistSessionsTab } from './PsychologistSessionsTab'
import { PsychologistCalendarTab } from './PsychologistCalendarTab'
import { PsychologistClinicalModal } from './PsychologistClinicalModal'
import { PsychologistPresenceControl } from './PsychologistPresenceControl'
import { CustomerChatModal } from '@/features/customer/CustomerChatModal'
import type { CustomerBookingRecord } from '@/features/booking/bookingService'
import type { BookingStatus } from '@/types'
import type { AssignedBookingItem, PresenceStatus, PsychologistTab } from './types'
import { Calendar, Clock, CheckCircle2, FileText } from 'lucide-react'

export const PsychologistDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<PsychologistTab>('sessions')
  const [clinicalModalBooking, setClinicalModalBooking] = useState<AssignedBookingItem | null>(null)
  const [chatBooking, setChatBooking] = useState<CustomerBookingRecord | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['psychologist-profile', user?.id],
    queryFn: () => (user ? psychologistService.fetchMyPsychologistProfile(user.id) : Promise.resolve(null)),
    enabled: !!user,
  })

  const psychologistId = profile?.id || ''

  const {
    data: bookings = [],
    isLoading: loadingBookings,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ['psychologist-assigned-bookings', psychologistId],
    queryFn: () => (psychologistId ? psychologistService.fetchMyAssignedBookings(psychologistId) : Promise.resolve([])),
    enabled: !!psychologistId,
  })

  const { data: presence = 'online', refetch: refetchPresence } = useQuery({
    queryKey: ['psychologist-presence', psychologistId],
    queryFn: () => (psychologistId ? psychologistService.fetchPresence(psychologistId) : Promise.resolve('online' as PresenceStatus)),
    enabled: !!psychologistId,
  })

  const { data: schedules = [], refetch: refetchSchedules } = useQuery({
    queryKey: ['psychologist-weekly-schedules', psychologistId],
    queryFn: () => (psychologistId ? psychologistService.fetchWeeklySchedules(psychologistId) : Promise.resolve([])),
    enabled: !!psychologistId,
  })

  const todayStr = new Date().toISOString().split('T')[0]
  const todayCount = bookings.filter((b) => b.session_date === todayStr).length
  const upcomingCount = bookings.filter(
    (b) => b.session_date >= todayStr && ['confirmed', 'rescheduled'].includes(b.status)
  ).length
  const pendingNotesCount = bookings.filter(
    (b) => !b.has_clinical_notes && ['confirmed', 'completed'].includes(b.status)
  ).length

  const handlePresenceChange = async (newStatus: PresenceStatus) => {
    if (!psychologistId) return
    await psychologistService.updatePresence(psychologistId, newStatus)
    refetchPresence()
    setNotice(`Status kehadiran diperbarui menjadi ${newStatus.toUpperCase()}.`)
    setTimeout(() => setNotice(null), 3000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Terkonfirmasi</Badge>
      case 'pending_payment':
        return <Badge variant="warning">Menunggu Pembayaran</Badge>
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

  if (loadingProfile || loadingBookings) {
    return <LoadingState message="Memuat portal dashboard psikolog..." />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-br from-plum-950 via-plum-900 to-plum-800 rounded-3xl p-7 sm:p-9 text-white shadow-[0_20px_50px_-20px_rgba(41,23,56,0.5)] relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-plum-400/20 blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/15 text-plum-100 text-[11px] font-semibold">
              Portal Praktik Klinis
            </span>
            {profile?.credentials && (
              <span className="text-xs text-plum-200 font-mono">{profile.credentials}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Bertugas,{' '}
            <span className="font-serif italic font-medium text-plum-200">
              {profile?.full_name || 'Psikolog Soulaide'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-plum-100/80 max-w-xl leading-relaxed">
            {profile?.credentials || 'Psikolog Klinis Terdaftar HIMPSI'} • Kelola sesi konsultasi, jadwal praktik, dan catatan rekam psikologis klien secara aman.
          </p>
        </div>

        {/* Presence Widget */}
        <div className="flex flex-col items-start md:items-end gap-2 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 relative z-10">
          <span className="text-[10px] text-plum-200 uppercase tracking-widest font-bold">
            Status Kehadiran Live
          </span>
          <PsychologistPresenceControl currentStatus={presence} onStatusChange={handlePresenceChange} />
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-medium rounded-2xl flex items-center gap-2.5 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#72677E] block font-semibold">Sesi Hari Ini</span>
            <p className="text-2xl font-extrabold text-plum-800 mt-1 tabular-nums">{todayCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-plum-50 border border-plum-100 text-plum-700 flex items-center justify-center">
            <Calendar className="w-4.5 h-4.5" />
          </div>
        </Card>
        <Card className="p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#72677E] block font-semibold">Sesi Mendatang</span>
            <p className="text-2xl font-extrabold text-[#1E1429] mt-1 tabular-nums">{upcomingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sanctuary-100 border border-[#EAE3DC] text-[#52475E] flex items-center justify-center">
            <Clock className="w-4.5 h-4.5" />
          </div>
        </Card>
        <Card className="p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#72677E] block font-semibold">Sesi Selesai</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">
              {bookings.filter((b) => b.status === 'completed').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </Card>
        <Card className="p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#72677E] block font-semibold">Catatan Perlu Diisi</span>
            <p className="text-2xl font-extrabold text-champagne-700 mt-1 tabular-nums">
              {pendingNotesCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-champagne-50 border border-champagne-200 text-champagne-700 flex items-center justify-center">
            <FileText className="w-4.5 h-4.5" />
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#EAE3DC] space-x-2 sm:space-x-6 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'sessions'
              ? 'border-plum-700 text-plum-900'
              : 'border-transparent text-[#645A70] hover:text-[#1E1429]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jadwal Sesi Konseling</span>
          <span className="ml-1 px-2 py-0.5 bg-plum-50 text-plum-800 rounded-full text-[10px] font-bold">
            {bookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'calendar'
              ? 'border-plum-700 text-plum-900'
              : 'border-transparent text-[#645A70] hover:text-[#1E1429]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pengaturan Ketersediaan (Availability)</span>
        </button>
      </div>

      {activeTab === 'sessions' && (
        <PsychologistSessionsTab
          bookings={bookings}
          onOpenClinicalNote={(b) => setClinicalModalBooking(b)}
          onOpenChat={(b) => {
            const adapted: CustomerBookingRecord = {
              id: b.id,
              bookingCode: b.booking_code,
              sessionDate: b.session_date,
              sessionStartTime: b.session_start_time,
              sessionEndTime: b.session_end_time,
              deliveryMethod: b.delivery_method,
              status: b.status as BookingStatus,
              notes: b.notes,
              meetingLink: b.meeting_link,
              locationAddress: b.location_address,
              createdAt: b.created_at,
              service: {
                id: b.service_id,
                name: b.service_name,
                durationMinutes: b.service_duration,
                priceOnline: null,
                priceOffline: null,
              },
              psychologist: {
                id: psychologistId,
                fullName: profile?.full_name || 'Psikolog',
                credentials: profile?.credentials || '',
                cardImageUrl: null,
              },
            }
            setChatBooking(adapted)
          }}
          getStatusBadge={getStatusBadge}
        />
      )}

      {activeTab === 'calendar' && (
        <PsychologistCalendarTab
          schedules={schedules}
          onSchedulesUpdated={() => refetchSchedules()}
        />
      )}

      {clinicalModalBooking && (
        <PsychologistClinicalModal
          booking={clinicalModalBooking}
          psychologistId={psychologistId}
          onClose={() => setClinicalModalBooking(null)}
          onSessionUpdated={() => refetchBookings()}
        />
      )}

      {chatBooking && (
        <CustomerChatModal booking={chatBooking} onClose={() => setChatBooking(null)} />
      )}
    </div>
  )
}
