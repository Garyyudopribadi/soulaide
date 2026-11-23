/**
 * Client home: the thread list. One assistant thread (pinned) plus one thread
 * per psychologist, each carrying its booking/payment activity.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Loader2, MessageCirclePlus, ChevronRight, Sparkles } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { fetchThreads } from './chatApi.ts'
import { BotAvatar, formatThreadTime } from './ChatBits.tsx'

export const ThreadList: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['client-threads', user?.id],
    queryFn: () => (user ? fetchThreads(user.id) : Promise.resolve([])),
    enabled: Boolean(user),
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  })

  const assistant = threads.find((t) => t.kind === 'assistant')
  const psychThreads = threads.filter((t) => t.kind === 'psychologist')

  const openAssistant = async () => {
    if (assistant) {
      navigate(`/dashboard/thread/${assistant.id}`)
    } else {
      navigate('/booking')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-plum-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-plum-950">Percakapan Anda</h1>
          <p className="mt-1 text-xs leading-relaxed text-[#72677E]">
            Booking, pembayaran, dan koordinasi sesi hidup dalam satu thread per psikolog.
          </p>
        </div>
        <Button size="sm" onClick={() => void openAssistant()} className="shrink-0 gap-1.5 text-xs">
          <MessageCirclePlus className="h-3.5 w-3.5" />
          Pesan sesi
        </Button>
      </div>

      {/* Assistant thread */}
      <button
        type="button"
        onClick={() => void openAssistant()}
        className="flex w-full items-center gap-3 rounded-2xl border border-plum-200 bg-gradient-to-r from-plum-50 to-white p-4 text-left shadow-2xs transition-all hover:border-plum-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-plum-300"
      >
        <BotAvatar className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-plum-950">Asisten Soulaide</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-champagne-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-champagne-700">
              <Sparkles className="h-2.5 w-2.5" />
              Booking
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-[#72677E]">
            {assistant?.lastMessage?.content || 'Mulai pemesanan sesi: layanan, psikolog, jadwal, bayar QRIS.'}
          </p>
        </div>
        {assistant && assistant.unreadCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-plum-700 px-1.5 text-[10px] font-extrabold text-white">
            {assistant.unreadCount}
          </span>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-plum-300" />
      </button>

      {/* Psychologist threads */}
      {psychThreads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DDD5CC] bg-white/60 p-6 text-center">
          <p className="text-sm font-semibold text-plum-900">Belum ada thread psikolog</p>
          <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-[#72677E]">
            Setelah booking pertama dibuat, thread dengan psikolog Anda muncul di sini beserta kartu
            pembayaran dan status sesi.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {psychThreads.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => navigate(`/dashboard/thread/${t.id}`)}
              className="flex w-full items-center gap-3 rounded-2xl border border-[#E8E1D9] bg-white p-3.5 text-left shadow-2xs transition-all hover:border-plum-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-plum-300"
            >
              {t.psychologist?.isBot ? (
                <BotAvatar className="h-11 w-11" />
              ) : (
                <img
                  src={t.psychologist?.cardImage || '/Soulaide Psi Arc Logo.png'}
                  alt=""
                  className="h-11 w-11 rounded-xl border border-[#E8E1D9] object-cover"
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
              <ChevronRight className="h-4 w-4 shrink-0 text-plum-300" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}