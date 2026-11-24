/**
 * Chat-centric practice workspace, mirroring the client app frame:
 * icon rail + people list + conversation pane on desktop; single-pane swap
 * with bottom tabs on mobile. The people list carries paid clients with a
 * live session countdown plus history; each client thread holds chat and
 * every booking as a card. Sessions and availability remain as panes.
 */

import React, { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, Clock, MessagesSquare, Users } from 'lucide-react'
import { WorkspaceShell } from '@/components/dashboard/WorkspaceShell'
import { useAuth } from '@/features/auth/useAuth'
import { psychologistService } from './psychologistService'
import { PsychologistSessionsTab } from './PsychologistSessionsTab'
import { PsychologistCalendarTab } from './PsychologistCalendarTab'
import { PsychologistClinicalModal } from './PsychologistClinicalModal'
import { PeopleListPane } from '@/features/psychologist-chat/PeopleListPane'
import { ClientThreadPane } from '@/features/psychologist-chat/ClientThreadPane'
import type { AssignedBookingItem, PresenceStatus } from './types'
import { toDateKey } from '@/lib/dashboard'

const ClientRoute: React.FC<{
  bookings: AssignedBookingItem[]
  psychologistId: string
  onOpenClinical: (b: AssignedBookingItem) => void
  onSessionUpdated: () => void
}> = ({ bookings, psychologistId, onOpenClinical, onSessionUpdated }) => {
  const { customerId } = useParams<{ customerId: string }>()
  if (!customerId) return <Navigate to="/psychologist" replace />
  const clientBookings = bookings.filter((b) => b.customer_id === customerId)
  return (
    <ClientThreadPane
      customerId={customerId}
      psychologistId={psychologistId}
      bookings={clientBookings}
      onOpenClinical={onOpenClinical}
      onSessionUpdated={onSessionUpdated}
    />
  )
}

const PaneHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="flex items-center gap-3 border-b border-[#E8E1D9] bg-white/70 px-4 py-3">
    <Link
      to="/psychologist"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-plum-700 transition-colors hover:bg-plum-50 md:hidden"
      aria-label="Kembali ke daftar klien"
    >
      <ArrowLeft className="h-4 w-4" />
    </Link>
    <div className="min-w-0">
      <p className="truncate text-sm font-bold text-plum-950">{title}</p>
      <p className="truncate text-[10px] font-medium text-[#72677E]">{subtitle}</p>
    </div>
  </div>
)

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmed':
      return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">Terkonfirmasi</span>
    case 'pending_payment':
      return <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">Menunggu Pembayaran</span>
    case 'rescheduled':
      return <span className="rounded-full border border-plum-200 bg-plum-50 px-2.5 py-0.5 text-[10px] font-bold text-plum-800">Jadwal Baru</span>
    case 'completed':
      return <span className="rounded-full border border-[#DDD5CC] bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#4B3F59]">Selesai</span>
    case 'cancelled':
      return <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">Dibatalkan</span>
    default:
      return <span className="rounded-full border border-[#DDD5CC] bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#4B3F59]">{status}</span>
  }
}

export const PsychologistDashboardPage: React.FC = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [clinicalModalBooking, setClinicalModalBooking] = useState<AssignedBookingItem | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { data: psychologistProfile } = useQuery({
    queryKey: ['psychologist-profile', user?.id],
    queryFn: () => (user ? psychologistService.fetchMyPsychologistProfile(user.id) : Promise.resolve(null)),
    enabled: !!user,
  })
  const psychologistId = psychologistProfile?.id || ''

  const { data: bookings = [], refetch: refetchBookings } = useQuery({
    queryKey: ['psychologist-assigned-bookings', psychologistId],
    queryFn: () => (psychologistId ? psychologistService.fetchMyAssignedBookings(psychologistId) : Promise.resolve([])),
    enabled: !!psychologistId,
    refetchInterval: 30000,
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

  const todayKey = toDateKey(new Date())
  const todayCount = bookings.filter((b) => b.session_date === todayKey).length

  const handlePresenceChange = async (newStatus: PresenceStatus) => {
    if (!psychologistId) return
    await psychologistService.updatePresence(psychologistId, newStatus)
    refetchPresence()
    setNotice(`Status kehadiran diperbarui menjadi ${newStatus.toUpperCase()}.`)
    setTimeout(() => setNotice(null), 3000)
  }

  const section = location.pathname.startsWith('/psychologist/sessions')
    ? 'sessions'
    : location.pathname.startsWith('/psychologist/calendar')
      ? 'calendar'
      : 'people'
  const detailActive = location.pathname.startsWith('/psychologist/client/')
  const activeCustomerId = detailActive ? location.pathname.split('/').pop() ?? null : null

  const displayName = psychologistProfile?.full_name || profile?.full_name || 'Psikolog Soulaide'

  const handleNavigate = (key: string) => {
    if (key === 'people') navigate('/psychologist')
    else navigate(`/psychologist/${key}`)
  }

  return (
    <WorkspaceShell
      sections={[
        { key: 'people', label: 'Klien', icon: Users },
        { key: 'sessions', label: 'Jadwal', icon: CalendarDays, badge: todayCount },
        { key: 'calendar', label: 'Ketersediaan', icon: Clock },
      ]}
      activeKey={section}
      detailActive={detailActive}
      userName={displayName}
      userEmail={user?.email || ''}
      avatarUrl={psychologistProfile?.profile_image_url}
      onNavigate={handleNavigate}
      list={
        <PeopleListPane
          psychologistId={psychologistId}
          viewerId={user?.id ?? ''}
          bookings={bookings}
          activeCustomerId={activeCustomerId}
          presence={presence}
          onPresenceChange={(s) => void handlePresenceChange(s)}
        />
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 shadow-2xs">
          {notice}
        </div>
      )}
      <Routes>
        <Route
          index
          element={
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-plum-100 bg-plum-50 text-plum-700">
                <MessagesSquare className="h-6 w-6" />
              </span>
              <p className="mt-4 font-serif text-lg font-bold text-plum-950">Ruang koordinasi praktik</p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#72677E]">
                Pilih klien di daftar untuk membuka percakapan, kartu booking, dan catatan klinis.
                Klien yang sudah bayar menampilkan hitung mundur menuju jadwal sesinya.
              </p>
            </div>
          }
        />
        <Route
          path="client/:customerId"
          element={
            <ClientRoute
              bookings={bookings}
              psychologistId={psychologistId}
              onOpenClinical={setClinicalModalBooking}
              onSessionUpdated={() => void refetchBookings()}
            />
          }
        />
        <Route
          path="sessions"
          element={
            <div className="flex h-full min-h-0 flex-col">
              <PaneHeader title="Jadwal sesi" subtitle="Kelola catatan klinis dan koordinasi klien" />
              <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 md:px-8">
                <PsychologistSessionsTab
                  bookings={bookings}
                  onOpenClinicalNote={setClinicalModalBooking}
                  onOpenChat={(b) => navigate(`/psychologist/client/${b.customer_id}`)}
                  getStatusBadge={getStatusBadge}
                />
              </div>
            </div>
          }
        />
        <Route
          path="calendar"
          element={
            <div className="flex h-full min-h-0 flex-col">
              <PaneHeader title="Ketersediaan & jam praktik" subtitle="Atur jam buka mingguan (zona waktu WIB)" />
              <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 md:px-8">
                <PsychologistCalendarTab schedules={schedules} onSchedulesUpdated={() => void refetchSchedules()} />
              </div>
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/psychologist" replace />} />
      </Routes>

      {clinicalModalBooking && (
        <PsychologistClinicalModal
          booking={clinicalModalBooking}
          psychologistId={psychologistId}
          onClose={() => setClinicalModalBooking(null)}
          onSessionUpdated={() => void refetchBookings()}
        />
      )}
    </WorkspaceShell>
  )
}
