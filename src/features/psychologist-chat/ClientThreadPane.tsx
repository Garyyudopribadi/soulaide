/**
 * One client thread in the practice workspace: coordination chat plus every
 * booking as a card (status, schedule, clinical note, completion). Logistics
 * only — never therapy or diagnosis in chat.
 */

import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, FileText, Loader2, Send } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { psychologistService } from '@/features/psychologist/psychologistService'
import type { AssignedBookingItem } from '@/features/psychologist/types'
import {
  fetchMessages,
  sendMessage,
  markThreadRead,
  subscribeToThread,
} from '@/features/client-chat/chatApi.ts'
import type { ThreadMessage } from '@/features/client-chat/types.ts'
import {
  BookingStatusBadge,
  InitialsAvatar,
  MessageBubble,
} from '@/features/client-chat/ChatBits.tsx'
import type { BookingStatus } from '@/types/index.ts'
import { openClientThread } from './psychChatApi.ts'
import { SessionCountdown, sessionStartIso } from './SessionCountdown.tsx'

interface ClientThreadPaneProps {
  customerId: string
  psychologistId: string
  bookings: AssignedBookingItem[]
  onOpenClinical: (booking: AssignedBookingItem) => void
  onSessionUpdated: () => void
}

function formatSessionDate(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00+07:00`))
}

export const ClientThreadPane: React.FC<ClientThreadPaneProps> = ({
  customerId,
  psychologistId,
  bookings,
  onOpenClinical,
  onSessionUpdated,
}) => {
  const { user } = useAuth()
  const viewerId = user?.id ?? ''
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [now, setNow] = useState(() => Date.now())
  const endRef = useRef<HTMLDivElement>(null)

  const clientName = bookings[0]?.client.full_name || 'Klien Soulaide'

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const { data: threadId } = useQuery({
    queryKey: ['psych-client-thread', psychologistId, customerId],
    queryFn: () => openClientThread(customerId),
    enabled: Boolean(psychologistId && customerId),
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!threadId || !viewerId) return
    let mounted = true
    setLoadingMessages(true)
    void fetchMessages(threadId).then((msgs) => {
      if (!mounted) return
      setMessages(msgs)
      setLoadingMessages(false)
      void markThreadRead(threadId, viewerId)
    })
    const unsubscribe = subscribeToThread(threadId, {
      onInsert: (msg) => {
        if (!mounted) return
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
        if (msg.sender_id && msg.sender_id !== viewerId) void markThreadRead(threadId, viewerId)
      },
      onUpdate: (msg) => {
        if (!mounted) return
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)))
      },
    })
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [threadId, viewerId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  const sorted = [...bookings].sort((a, b) => b.session_date.localeCompare(a.session_date))
  const next = sorted
    .filter((b) => ['confirmed', 'rescheduled', 'pending_payment'].includes(b.status))
    .sort((a, b) => sessionStartIso(a.session_date, a.session_start_time).localeCompare(sessionStartIso(b.session_date, b.session_start_time)))
    .find((b) => new Date(sessionStartIso(b.session_date, b.session_end_time)).getTime() > now)
  const focusBooking = next ?? sorted.find((b) => b.status === 'completed') ?? sorted[0]

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || !threadId || sending) return
    setInput('')
    setSending(true)
    try {
      await sendMessage(threadId, text)
    } catch (err) {
      console.error('Gagal mengirim pesan:', err)
    } finally {
      setSending(false)
    }
  }

  const handleComplete = async (booking: AssignedBookingItem) => {
    await psychologistService.markSessionCompleted(booking.id)
    onSessionUpdated()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#E8E1D9] bg-white/70 px-4 py-3">
        <Link
          to="/psychologist"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-plum-700 transition-colors hover:bg-plum-50 md:hidden"
          aria-label="Kembali ke daftar klien"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <InitialsAvatar name={clientName} className="h-10 w-10 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-plum-950">{clientName}</p>
          <p className="truncate text-[10px] font-medium text-[#72677E]">
            {next
              ? `${formatSessionDate(next.session_date)} · ${next.session_start_time.slice(0, 5)} WIB · ${next.delivery_method}`
              : 'Riwayat koordinasi & sesi'}
          </p>
        </div>
        {next && (
          <SessionCountdown
            date={next.session_date}
            startTime={next.session_start_time}
            endTime={next.session_end_time}
            now={now}
          />
        )}
        {focusBooking && (
          <button
            type="button"
            onClick={() => onOpenClinical(focusBooking)}
            aria-label="Catatan klinis"
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#DDD5CC] bg-white px-3 text-xs font-semibold text-plum-700 shadow-2xs transition-colors hover:border-plum-300 hover:bg-plum-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-plum-300"
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Catatan klinis</span>
          </button>
        )}
      </div>

      {/* Booking cards */}
      {sorted.length > 0 && (
        <div className="scrollbar-thin flex gap-2 overflow-x-auto border-b border-[#E8E1D9] bg-sanctuary-50 px-4 py-2.5">
          {sorted.map((b) => {
            const ended = new Date(sessionStartIso(b.session_date, b.session_end_time)).getTime() < now
            return (
              <div
                key={b.id}
                className="w-[240px] shrink-0 rounded-xl border border-[#E8E1D9] bg-white p-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[10px] font-bold text-plum-900">{b.booking_code}</span>
                  <BookingStatusBadge status={b.status as BookingStatus} />
                </div>
                <p className="mt-1 truncate text-[11px] font-semibold text-plum-950">{b.service_name}</p>
                <p className="mt-0.5 text-[10px] tabular-nums text-[#72677E]">
                  {formatSessionDate(b.session_date)} · {b.session_start_time.slice(0, 5)}–{b.session_end_time.slice(0, 5)} WIB
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenClinical(b)}
                    className="rounded-lg border border-[#DDD5CC] bg-white px-2 py-1 text-[10px] font-semibold text-plum-700 transition-colors hover:bg-plum-50"
                  >
                    {b.has_clinical_notes ? 'Lihat catatan' : 'Tulis catatan'}
                  </button>
                  {b.status === 'confirmed' && ended && (
                    <button
                      type="button"
                      onClick={() => void handleComplete(b)}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      Tandai selesai
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Transcript */}
      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto bg-sanctuary-100/60 px-4 py-4">
        {loadingMessages ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-plum-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-xs text-[#72677E]">
            Belum ada pesan koordinasi. Kirim pesan pertama untuk konfirmasi sesi.
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              content={m.content}
              senderKind={m.sender_kind}
              isOwn={m.sender_id === viewerId}
              createdAt={m.created_at}
              fallbackAvatar={<InitialsAvatar name={clientName} />}
            />
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-[#E8E1D9] bg-white px-4 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Tulis pesan koordinasi ke ${clientName.split(' ')[0]}...`}
          aria-label={`Pesan ke ${clientName}`}
          disabled={!threadId || sending}
          className="h-10 min-w-0 flex-1 rounded-xl border border-[#DDD5CC] bg-sanctuary-50 px-3.5 text-xs text-plum-950 placeholder:text-[#A79BB5] focus:border-plum-400 focus:outline-none focus:ring-2 focus:ring-plum-100 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || !threadId || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-plum-700 text-white shadow-2xs transition-colors hover:bg-plum-800 disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus-visible:ring-2 focus-visible:ring-plum-300"
          aria-label="Kirim pesan"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
