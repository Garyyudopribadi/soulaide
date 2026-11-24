/**
 * People pane of the practice workspace: one row per client, grouped into
 * upcoming sessions (paid clients carry a live countdown) and history.
 * Rows open the coordination thread; unread client messages badge the row.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CrisisDisclaimerBanner } from '@/features/chat/CrisisDisclaimerBanner.tsx'
import { PsychologistPresenceControl } from '@/features/psychologist/PsychologistPresenceControl'
import type { AssignedBookingItem, PresenceStatus } from '@/features/psychologist/types'
import { InitialsAvatar, formatThreadTime } from '@/features/client-chat/ChatBits.tsx'
import { fetchClientThreads } from './psychChatApi.ts'
import { SessionCountdown, sessionStartIso } from './SessionCountdown.tsx'

const ACTIVE_STATUSES = ['confirmed', 'rescheduled', 'pending_payment', 'reschedule_requested']
const PAID_STATUSES = ['confirmed', 'rescheduled']

interface PeopleListPaneProps {
  psychologistId: string
  viewerId: string
  bookings: AssignedBookingItem[]
  activeCustomerId?: string | null
  presence: PresenceStatus
  onPresenceChange: (s: PresenceStatus) => void
}

interface PersonGroup {
  customerId: string
  name: string
  bookings: AssignedBookingItem[]
  next: AssignedBookingItem | null
  last: AssignedBookingItem | null
}

export const PeopleListPane: React.FC<PeopleListPaneProps> = ({
  psychologistId,
  viewerId,
  bookings,
  activeCustomerId,
  presence,
  onPresenceChange,
}) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['psych-client-threads', psychologistId, viewerId],
    queryFn: () => fetchClientThreads(psychologistId, viewerId),
    enabled: Boolean(psychologistId),
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  })
  const threadByCustomer = useMemo(() => {
    const m = new Map<string, (typeof threads)[number]>()
    for (const t of threads) m.set(t.customerId, t)
    return m
  }, [threads])

  const groups = useMemo<PersonGroup[]>(() => {
    const byCustomer = new Map<string, PersonGroup>()
    for (const b of bookings) {
      const g =
        byCustomer.get(b.customer_id) ??
        ({
          customerId: b.customer_id,
          name: b.client.full_name,
          bookings: [],
          next: null,
          last: null,
        } as PersonGroup)
      g.bookings.push(b)
      byCustomer.set(b.customer_id, g)
    }
    for (const g of byCustomer.values()) {
      const active = g.bookings
        .filter((b) => ACTIVE_STATUSES.includes(b.status))
        .sort((a, b) => sessionStartIso(a.session_date, a.session_start_time).localeCompare(sessionStartIso(b.session_date, b.session_start_time)))
      g.next = active.find((b) => new Date(sessionStartIso(b.session_date, b.session_end_time)).getTime() > now) ?? null
      g.last = [...g.bookings].sort((a, b) => b.session_date.localeCompare(a.session_date))[0] ?? null
    }
    const q = query.trim().toLowerCase()
    const all = [...byCustomer.values()].filter((g) => !q || g.name.toLowerCase().includes(q))
    return all
  }, [bookings, query, now])

  const upcoming = groups
    .filter((g) => g.next)
    .sort((a, b) => sessionStartIso(a.next!.session_date, a.next!.session_start_time).localeCompare(sessionStartIso(b.next!.session_date, b.next!.session_start_time)))
  const history = groups
    .filter((g) => !g.next)
    .sort((a, b) => (b.last?.session_date || '').localeCompare(a.last?.session_date || ''))

  const row = (g: PersonGroup) => {
    const thread = threadByCustomer.get(g.customerId)
    const paidNext = g.next && PAID_STATUSES.includes(g.next.status)
    return (
      <button
        key={g.customerId}
        type="button"
        onClick={() => navigate(`/psychologist/client/${g.customerId}`)}
        aria-current={activeCustomerId === g.customerId ? 'page' : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-sanctuary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-plum-300',
          activeCustomerId === g.customerId && 'bg-plum-50 hover:bg-plum-50'
        )}
      >
        <InitialsAvatar name={g.name} className="h-12 w-12 rounded-full text-xs" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-bold text-plum-950">{g.name}</p>
            {thread && (
              <span className="shrink-0 text-[10px] font-medium tabular-nums text-[#A79BB5]">
                {formatThreadTime(thread.updatedAt)}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            {g.next ? (
              paidNext ? (
                <SessionCountdown
                  date={g.next.session_date}
                  startTime={g.next.session_start_time}
                  endTime={g.next.session_end_time}
                  now={now}
                />
              ) : (
                <span className="inline-flex shrink-0 items-center rounded-full border border-champagne-200 bg-champagne-100 px-2 py-0.5 text-[10px] font-bold text-champagne-700">
                  Menunggu bayar
                </span>
              )
            ) : (
              <span className="inline-flex shrink-0 items-center rounded-full border border-[#DDD5CC] bg-white px-2 py-0.5 text-[10px] font-bold text-[#72677E]">
                {g.last?.status === 'completed' ? 'Selesai' : 'Riwayat'}
              </span>
            )}
            <p className="truncate text-[11px] text-[#72677E]">
              {thread?.lastMessage?.content ||
                (g.next
                  ? `Sesi ${g.next.service_name}`
                  : g.last
                    ? `${g.last.service_name} · ${g.last.session_date}`
                    : 'Belum ada pesan')}
            </p>
          </div>
        </div>
        {thread && thread.unreadCount > 0 && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-plum-700 px-1.5 text-[10px] font-extrabold text-white">
            {thread.unreadCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
        <h1 className="font-serif text-lg font-bold text-plum-950">Klien</h1>
        <span className="text-[10px] font-semibold tabular-nums text-[#72677E]">
          {upcoming.length} mendatang · {history.length} riwayat
        </span>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A79BB5]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari klien..."
            aria-label="Cari klien"
            className="h-9 w-full rounded-xl border border-[#DDD5CC] bg-sanctuary-50 pl-9 pr-3 text-xs text-plum-950 placeholder:text-[#A79BB5] focus:border-plum-400 focus:outline-none focus:ring-2 focus:ring-plum-100"
          />
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-plum-400" />
          </div>
        ) : groups.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs font-semibold text-plum-900">
              {query.trim() ? 'Tidak ada hasil untuk pencarian ini' : 'Belum ada klien'}
            </p>
            <p className="mx-auto mt-1 max-w-[240px] text-[11px] leading-relaxed text-[#72677E]">
              {query.trim()
                ? 'Coba nama lain.'
                : 'Booking yang masuk lewat asisten Soulaide akan muncul di sini beserta status pembayaran dan jadwal sesinya.'}
            </p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-[#72677E]">
                Sesi mendatang
              </p>
            )}
            {upcoming.map(row)}
            {history.length > 0 && (
              <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wide text-[#72677E]">
                Riwayat
              </p>
            )}
            {history.map(row)}
          </>
        )}
      </div>

      <div className="space-y-3 border-t border-[#E8E1D9] px-4 py-3">
        <PsychologistPresenceControl currentStatus={presence} onStatusChange={onPresenceChange} />
        <CrisisDisclaimerBanner compact />
      </div>
    </div>
  )
}
