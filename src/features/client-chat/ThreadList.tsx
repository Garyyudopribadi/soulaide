/**
 * Thread list pane of the client workspace: pinned assistant thread plus one
 * thread per psychologist, with search and unread badges. Rows navigate; the
 * active row is highlighted by the parent route.
 */

import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, MessageCirclePlus, Search, Sparkles } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/utils'
import { CrisisDisclaimerBanner } from '@/features/chat/CrisisDisclaimerBanner.tsx'
import { fetchThreads } from './chatApi.ts'
import { BotAvatar, formatThreadTime } from './ChatBits.tsx'

interface ThreadListPaneProps {
  activeThreadId?: string | null
  assistantActive?: boolean
}

const rowBase =
  'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-sanctuary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-plum-300'

export const ThreadListPane: React.FC<ThreadListPaneProps> = ({
  activeThreadId,
  assistantActive,
}) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['client-threads', user?.id],
    queryFn: () => (user ? fetchThreads(user.id) : Promise.resolve([])),
    enabled: Boolean(user),
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  })

  const assistant = threads.find((t) => t.kind === 'assistant')
  const psychThreads = threads.filter((t) => t.kind === 'psychologist')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return psychThreads
    return psychThreads.filter(
      (t) =>
        (t.psychologist?.fullName || '').toLowerCase().includes(q) ||
        (t.lastMessage?.content || '').toLowerCase().includes(q)
    )
  }, [psychThreads, query])

  const openAssistant = () => navigate('/dashboard/assistant')

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Pane header */}
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
        <h1 className="font-serif text-lg font-bold text-plum-950">Percakapan</h1>
        <button
          type="button"
          onClick={openAssistant}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-plum-700 text-white shadow-2xs transition-colors hover:bg-plum-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-plum-300"
          aria-label="Pesan sesi baru lewat asisten"
          title="Pesan sesi"
        >
          <MessageCirclePlus className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A79BB5]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari psikolog atau pesan..."
            aria-label="Cari percakapan"
            className="h-9 w-full rounded-xl border border-[#DDD5CC] bg-sanctuary-50 pl-9 pr-3 text-xs text-plum-950 placeholder:text-[#A79BB5] focus:border-plum-400 focus:outline-none focus:ring-2 focus:ring-plum-100"
          />
        </div>
      </div>

      {/* Rows */}
      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-plum-400" />
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={openAssistant}
              aria-current={assistantActive ? 'page' : undefined}
              className={cn(rowBase, assistantActive && 'bg-plum-50 hover:bg-plum-50')}
            >
              <BotAvatar className="h-12 w-12 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-bold text-plum-950">
                    Asisten Soulaide
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-champagne-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-champagne-700">
                      <Sparkles className="h-2.5 w-2.5" />
                      Booking
                    </span>
                  </p>
                  {assistant && (
                    <span className="shrink-0 text-[10px] font-medium tabular-nums text-[#A79BB5]">
                      {formatThreadTime(assistant.updatedAt)}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-[#72677E]">
                  {assistant?.lastMessage?.content || 'Mulai pemesanan sesi: layanan, psikolog, jadwal, bayar QRIS.'}
                </p>
              </div>
              {assistant && assistant.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-plum-700 px-1.5 text-[10px] font-extrabold text-white">
                  {assistant.unreadCount}
                </span>
              )}
            </button>

            {filtered.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-xs font-semibold text-plum-900">
                  {query.trim() ? 'Tidak ada hasil untuk pencarian ini' : 'Belum ada thread psikolog'}
                </p>
                <p className="mx-auto mt-1 max-w-[240px] text-[11px] leading-relaxed text-[#72677E]">
                  {query.trim()
                    ? 'Coba nama psikolog atau kata lain dari pesan terakhir.'
                    : 'Setelah booking pertama dibuat, thread dengan psikolog Anda muncul di sini beserta kartu pembayaran dan status sesi.'}
                </p>
              </div>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/thread/${t.id}`)}
                  aria-current={activeThreadId === t.id ? 'page' : undefined}
                  className={cn(rowBase, activeThreadId === t.id && 'bg-plum-50 hover:bg-plum-50')}
                >
                  {t.psychologist?.isBot ? (
                    <BotAvatar className="h-12 w-12 rounded-full" />
                  ) : (
                    <img
                      src={t.psychologist?.cardImage || '/Soulaide Psi Arc Logo.png'}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full border border-[#E8E1D9] object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-bold text-plum-950">
                        {t.psychologist?.fullName || 'Psikolog Soulaide'}
                      </p>
                      <span className="shrink-0 text-[10px] font-medium tabular-nums text-[#A79BB5]">
                        {formatThreadTime(t.updatedAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-[#72677E]">
                      {t.lastMessage?.content || 'Thread aktif'}
                    </p>
                  </div>
                  {t.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-plum-700 px-1.5 text-[10px] font-extrabold text-white">
                      {t.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </>
        )}
      </div>

      {/* Crisis line stays visible while browsing */}
      <div className="border-t border-[#E8E1D9] px-4 py-3">
        <CrisisDisclaimerBanner compact />
      </div>
    </div>
  )
}
