/**
 * One psychologist thread: live chat + every booking/payment activity as cards.
 * Coordination only (logistics, links, readiness) — never therapy or diagnosis.
 */

import React, { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Loader2, MessageCircle, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase/client.ts'
import { useAuth } from '@/features/auth/useAuth'
import { fetchBookingById } from '@/features/booking/bookingService'
import { paymentService } from '@/features/payments/paymentService'
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_NUMBER } from '@/features/chat/whatsappService'
import { CustomerReceiptModal } from '@/features/customer/CustomerReceiptModal'
import type { CustomerPaymentItem } from '@/features/customer/types'
import {
  fetchMessages,
  sendMessage,
  appendThreadMessage,
  markThreadRead,
  subscribeToThread,
} from './chatApi.ts'
import type { ThreadMessage, ThreadPsychologist } from './types.ts'
import { MessageBubble, BotAvatar } from './ChatBits.tsx'
import { BookingActivityCard } from './BookingActivityCard.tsx'
import { AssistantChat } from './AssistantChat.tsx'

interface ThreadViewProps {
  conversationId: string
}

interface ThreadMeta {
  kind: 'assistant' | 'psychologist' | 'booking'
  psychologist: ThreadPsychologist | null
}

async function fetchThreadMeta(conversationId: string): Promise<ThreadMeta | null> {
  const { data, error } = await supabase
    .from('Soulaide_conversations')
    .select(`
      kind,
      psychologist:Soulaide_psychologists(id, full_name, credentials, card_image_url, is_bot, user_id)
    `)
    .eq('id', conversationId)
    .maybeSingle()

  if (error || !data) return null
  const p = (data as unknown as {
    psychologist: {
      id: string
      full_name: string
      credentials: string | null
      card_image_url: string | null
      is_bot: boolean | null
      user_id: string | null
    } | null
  }).psychologist

  return {
    kind: data.kind as ThreadMeta['kind'],
    psychologist: p
      ? {
          id: p.id,
          fullName: p.full_name,
          credentials: p.credentials || 'Psikolog',
          cardImage: p.card_image_url || '/Soulaide Psi Arc Logo.png',
          isBot: Boolean(p.is_bot),
          userId: p.user_id,
        }
      : null,
  }
}

const BOT_COORDINATION_REPLY =
  'Pesan Anda sudah tercatat di kanal uji coba ini. Untuk membuat booking atau menyelesaikan pembayaran, ' +
  'kembali ke asisten Soulaide dan pilih layanan uji coba Rp1.000. Saya tidak memberikan konseling atau diagnosis.'

export const ThreadView: React.FC<ThreadViewProps> = ({ conversationId }) => {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [receipt, setReceipt] = useState<CustomerPaymentItem | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const { data: meta } = useQuery({
    queryKey: ['thread-meta', conversationId],
    queryFn: () => fetchThreadMeta(conversationId),
    staleTime: Infinity,
  })

  // History + realtime.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      const history = await fetchMessages(conversationId)
      if (cancelled) return
      setMessages(history)
      setLoading(false)
      if (user) void markThreadRead(conversationId, user.id)
    })()

    const unsubscribe = subscribeToThread(conversationId, {
      onInsert: (msg) => {
        if (cancelled) return
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
        if (user && msg.sender_id !== user.id) {
          void markThreadRead(conversationId, user.id)
        }
      },
      onUpdate: (msg) => {
        if (cancelled) return
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)))
      },
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [conversationId, user])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, loading])

  const openReceipt = async (bookingId: string) => {
    const [booking, payment] = await Promise.all([
      fetchBookingById(bookingId),
      paymentService.getPaymentForBooking(bookingId),
    ])
    if (!booking || !payment) return
    setReceipt({
      id: payment.id,
      booking_id: bookingId,
      booking_code: booking.bookingCode,
      service_name: booking.service.name,
      delivery_method: booking.deliveryMethod,
      amount: Number(payment.amount),
      status: payment.status,
      provider_order_id: payment.provider_order_id,
      provider_transaction_id: payment.provider_transaction_id,
      unique_code: payment.unique_code,
      total_amount: payment.total_amount,
      payment_type: payment.payment_type,
      payment_time: payment.payment_time,
      created_at: payment.created_at,
    })
  }

  if (meta?.kind === 'assistant') {
    return <AssistantChat />
  }

  const psych = meta?.psychologist ?? null
  const canChat = Boolean(psych && (psych.isBot || psych.userId))

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputText.trim()
    if (!text || !user || sending || !canChat) return
    setSending(true)
    setInputText('')
    try {
      await sendMessage(conversationId, text)
      if (psych?.isBot) {
        await appendThreadMessage(conversationId, BOT_COORDINATION_REPLY, 'bot', { event: 'bot_reply' })
      }
    } catch {
      setInputText(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Thread header */}
      <div className="flex items-center gap-3 border-b border-[#E8E1D9] bg-white/70 px-4 py-3">
        {psych?.isBot ? (
          <BotAvatar className="h-10 w-10" />
        ) : psych ? (
          <img
            src={psych.cardImage}
            alt=""
            className="h-10 w-10 rounded-xl border border-[#E8E1D9] object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-plum-100 text-plum-700">
            <MessageCircle className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-plum-950">
            {psych?.fullName || 'Percakapan'}
          </p>
          <p className="truncate text-[10px] font-medium text-[#72677E]">
            {psych?.isBot
              ? 'Kanal uji coba pembayaran · bukan konseling'
              : psych?.userId
                ? 'Koordinasi pra-sesi · bukan untuk konseling atau diagnosis'
                : 'Kanal aktivitas · koordinasi via WhatsApp'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-plum-400" />
          </div>
        ) : (
          messages.map((m) => {
            const bookingId = typeof m.meta?.booking_id === 'string' ? m.meta.booking_id : null
            if (m.sender_kind === 'system' && bookingId) {
              return (
                <div key={m.id} className="space-y-1.5">
                  <p className="px-1 text-[10px] font-medium text-[#A79BB5]">
                    {new Intl.DateTimeFormat('id-ID', {
                      timeZone: 'Asia/Jakarta',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(m.created_at))} WIB
                  </p>
                  <BookingActivityCard
                    bookingId={bookingId}
                    currentUserId={user?.id ?? ''}
                    onOpenReceipt={(id) => void openReceipt(id)}
                  />
                </div>
              )
            }
            return (
              <MessageBubble
                key={m.id}
                content={m.content}
                senderKind={m.sender_kind}
                isOwn={m.sender_kind === 'user' && m.sender_id === user?.id}
                createdAt={m.created_at}
                avatarUrl={m.sender_kind === 'user' && m.sender_id !== user?.id ? psych?.cardImage : null}
              />
            )
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-[#E8E1D9] bg-sanctuary-50 px-4 py-3">
        {canChat ? (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tulis pesan koordinasi (jadwal, tautan, kesiapan)..."
              className="h-10 min-w-0 flex-1 rounded-xl border border-[#DDD5CC] bg-white px-3.5 text-[13px] text-plum-950 placeholder:text-[#A79BB5] focus:border-plum-400 focus:outline-none focus:ring-2 focus:ring-plum-100"
              aria-label={`Pesan ke ${psych?.fullName || 'psikolog'}`}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputText.trim() || sending}
              className="h-10 w-10 shrink-0 rounded-xl p-0"
              aria-label="Kirim pesan"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] leading-relaxed text-[#72677E]">
              Psikolog ini belum terhubung ke chat langsung. Semua aktivitas sesi tetap tercatat di sini.
            </p>
            <a
              href={buildWhatsAppUrl(
                DEFAULT_WHATSAPP_NUMBER,
                `Halo Soulaide, saya ingin berkoordinasi dengan ${psych?.fullName || 'psikolog'} terkait sesi saya.`
              )}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <MessageCircle className="h-3.5 w-3.5" />
                Koordinasi via WhatsApp
              </Button>
            </a>
          </div>
        )}
      </div>

      {receipt && (
        <CustomerReceiptModal
          payment={receipt}
          customerName={profile?.full_name || user?.email || 'Klien Soulaide'}
          customerEmail={user?.email || ''}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  )
}