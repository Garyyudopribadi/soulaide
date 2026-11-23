/**
 * Assistant booking conversation.
 * A guided flow (method -> service -> psychologist -> date -> time -> notes ->
 * consent -> confirm -> booking) rendered as chat. Works before login; the
 * booking itself requires an account (gate at confirm). Drafts survive reload
 * via localStorage; the transcript persists to the assistant thread when logged in.
 */

import React, { useEffect, useReducer, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, Send } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { createBookingAtomic } from '@/features/booking/bookingService'
import {
  openThread,
  fetchMessages,
  sendMessage,
  appendThreadMessage,
  markThreadRead,
  fetchChatCatalog,
  fetchDayAvailability,
  psychologistsForService,
  servicePriceForMethod,
} from './chatApi.ts'
import { flowReducer, initialFlowState, isFlowComplete, type FlowState, type FlowAction } from './assistantFlow.ts'
import { computeDaySlots } from './slots.ts'
import { getSelectableDatesWib, formatRupiah } from './wib.ts'
import { MessageBubble, ChoiceChip, TypingDots, BotAvatar } from './ChatBits.tsx'
import {
  greetReply,
  methodReply,
  serviceReply,
  psychologistReply,
  dateReply,
  timeReply,
  noSlotsReply,
  notesReply,
  consentReply,
  confirmReply,
  bookingCreatedReply,
  bookingErrorReply,
  doneReply,
  freeformReply,
  crisisReply,
} from './botReplies.ts'

interface LocalMsg {
  id: string
  role: 'user' | 'bot'
  content: string
  createdAt: string
}

interface AssistantChatProps {
  seed?: { serviceId?: string; psychologistId?: string }
}

const CRISIS_PATTERN = /bunuh diri|ingin mati|mengakhiri hidup|menyakiti diri|self.?harm|suicide|tidak ingin hidup|darurat/i

function loadDraft(key: string): FlowState {
  try {
    const raw = localStorage.getItem(key) ?? localStorage.getItem('soulaide-assistant-draft:anon')
    if (!raw) return initialFlowState
    const parsed = JSON.parse(raw) as FlowState
    if (!parsed || typeof parsed.step !== 'string' || !parsed.selections) return initialFlowState
    if (parsed.step === 'booking') return { ...parsed, step: 'confirm' }
    return parsed
  } catch {
    return initialFlowState
  }
}

export const AssistantChat: React.FC<AssistantChatProps> = ({ seed }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const draftKey = `soulaide-assistant-draft:${user?.id ?? 'anon'}`
  const [flow, dispatch] = useReducer(flowReducer, draftKey, loadDraft)
  const [messages, setMessages] = useState<LocalMsg[]>([])
  const [inputText, setInputText] = useState('')
  const [transcriptLoaded, setTranscriptLoaded] = useState(false)
  const bookingStarted = useRef(false)
  const seeded = useRef(false)
  const greeted = useRef(false)
  const endRef = useRef<HTMLDivElement>(null)

  // Persist draft on every transition.
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(flow))
    } catch {
      // storage unavailable; flow still works in-memory
    }
  }, [flow, draftKey])

  const { data: catalog } = useQuery({
    queryKey: ['chat-catalog'],
    queryFn: fetchChatCatalog,
    staleTime: 5 * 60 * 1000,
  })

  const { data: conversationId } = useQuery({
    queryKey: ['assistant-thread', user?.id],
    queryFn: () => openThread(null),
    enabled: Boolean(user),
    staleTime: Infinity,
    retry: false,
  })

  // Load persisted transcript once the thread is known.
  useEffect(() => {
    if (!conversationId) {
      setTranscriptLoaded(true)
      return
    }
    let cancelled = false
    void (async () => {
      const history = await fetchMessages(conversationId)
      if (cancelled) return
      setMessages(
        history
          .filter((m) => m.sender_kind !== 'system' || m.content)
          .map((m) => ({
            id: m.id,
            role: m.sender_kind === 'user' ? 'user' : 'bot',
            content: m.content,
            createdAt: m.created_at,
          }))
      )
      setTranscriptLoaded(true)
      void markThreadRead(conversationId, user!.id)
    })()
    return () => {
      cancelled = true
    }
  }, [conversationId, user])

  const pushLocal = (role: 'user' | 'bot', content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role, content, createdAt: new Date().toISOString() },
    ])
  }

  const botSay = (content: string, meta: Record<string, unknown> = {}) => {
    pushLocal('bot', content)
    if (conversationId) {
      void appendThreadMessage(conversationId, content, 'bot', meta).catch(() => {})
    }
  }

  const userSay = (content: string) => {
    pushLocal('user', content)
    if (conversationId) {
      void sendMessage(conversationId, content).catch(() => {})
    }
  }

  const promptFor = (state: FlowState) => {
    if (!catalog) return
    const s = state.selections
    const service = catalog.services.find((x) => x.id === s.serviceId)
    const psych = catalog.psychologists.find((x) => x.id === s.psychologistId)
    switch (state.step) {
      case 'method':
        botSay(methodReply())
        break
      case 'service':
        botSay(
          serviceReply(
            s.method!,
            catalog.services.filter((x) => s.method && x.deliveryMethods.includes(s.method))
          )
        )
        break
      case 'psychologist':
        if (service) botSay(psychologistReply(service, psychologistsForService(catalog, service.id)))
        break
      case 'date':
        if (psych) botSay(dateReply(psych))
        break
      case 'time':
        if (s.dateStr) botSay(timeReply(s.dateStr))
        break
      case 'notes':
        botSay(notesReply())
        break
      case 'consent':
        botSay(consentReply())
        break
      case 'confirm':
        botSay(confirmReply(s, catalog))
        break
      default:
        break
    }
  }

  const advance = (action: FlowAction, userLabel?: string) => {
    if (userLabel) userSay(userLabel)
    const next = flowReducer(flow, action)
    dispatch(action)
    promptFor(next)
  }

  // First greeting for a brand-new conversation.
  useEffect(() => {
    if (!transcriptLoaded || greeted.current || !catalog) return
    greeted.current = true
    if (flow.step === 'greet' && messages.length === 0 && !seed?.psychologistId && !seed?.serviceId) {
      botSay(greetReply(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcriptLoaded, catalog])

  // Deep-link seed: /booking?psychologist=... or ?service=...
  useEffect(() => {
    if (!catalog || seeded.current || !seed) return
    if (flow.step !== 'greet' || flow.selections.serviceId) return
    seeded.current = true

    if (seed.psychologistId) {
      const psych = catalog.psychologists.find((p) => p.id === seed.psychologistId)
      if (!psych) return
      const service = catalog.services.find((sv) =>
        psychologistsForService(catalog, sv.id).some((p) => p.id === psych.id)
      )
      if (!service) return
      const method = service.deliveryMethods[0]
      const selections = { method, serviceId: service.id, psychologistId: psych.id }
      dispatch({ type: 'seed', step: 'date', selections })
      botSay(dateReply(psych))
      return
    }

    if (seed.serviceId) {
      const service = catalog.services.find((sv) => sv.id === seed.serviceId)
      if (!service) return
      const method = service.deliveryMethods[0]
      dispatch({ type: 'seed', step: 'psychologist', selections: { method, serviceId: service.id } })
      botSay(psychologistReply(service, psychologistsForService(catalog, service.id)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, seed])

  // Execute the booking once the flow reaches the booking step.
  useEffect(() => {
    if (flow.step !== 'booking' || !user || bookingStarted.current) return
    bookingStarted.current = true
    const s = flow.selections
    if (!isFlowComplete(s)) {
      dispatch({ type: 'booking_error', error: 'Pilihan belum lengkap.' })
      bookingStarted.current = false
      return
    }
    void (async () => {
      const res = await createBookingAtomic({
        customerId: user.id,
        psychologistId: s.psychologistId!,
        serviceId: s.serviceId!,
        sessionDate: s.dateStr!,
        sessionStartTime: `${s.time}:00`,
        deliveryMethod: s.method!,
        notes: s.notes,
        consent: true,
      })
      if (res.success && res.bookingId && res.bookingCode && res.threadId) {
        dispatch({
          type: 'booking_success',
          bookingId: res.bookingId,
          bookingCode: res.bookingCode,
          threadId: res.threadId,
        })
        botSay(bookingCreatedReply(res.bookingCode), {
          event: 'booking_handoff',
          booking_id: res.bookingId,
          thread_id: res.threadId,
        })
        botSay(doneReply())
        void queryClient.invalidateQueries({ queryKey: ['client-threads'] })
        void queryClient.invalidateQueries({ queryKey: ['customer-bookings'] })
      } else {
        const err = res.error || 'Terjadi kendala saat membuat booking.'
        dispatch({ type: 'booking_error', error: err })
        botSay(bookingErrorReply(err))
      }
      bookingStarted.current = false
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.step, user])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, flow.step])

  // Availability for the time step.
  const selectedService = catalog?.services.find((sv) => sv.id === flow.selections.serviceId)
  const { data: availability, isLoading: availabilityLoading } = useQuery({
    queryKey: ['assistant-availability', flow.selections.psychologistId, flow.selections.dateStr],
    queryFn: () => fetchDayAvailability(flow.selections.psychologistId!, flow.selections.dateStr!),
    enabled: flow.step === 'time' && Boolean(flow.selections.psychologistId) && Boolean(flow.selections.dateStr),
  })

  const dates = getSelectableDatesWib(14)
  const selectedDate = dates.find((d) => d.dateStr === flow.selections.dateStr)
  const slots =
    availability && selectedDate && selectedService
      ? computeDaySlots({
          dateStr: flow.selections.dateStr!,
          dayOfWeek: selectedDate.dayOfWeek,
          durationMinutes: selectedService.durationMinutes,
          availability,
        })
      : []

  const handleChooseDate = async (dateStr: string, label: string) => {
    if (!flow.selections.psychologistId || !selectedService) return
    userSay(label)
    const avail = await fetchDayAvailability(flow.selections.psychologistId, dateStr)
    const day = dates.find((d) => d.dateStr === dateStr)
    const daySlots = computeDaySlots({
      dateStr,
      dayOfWeek: day?.dayOfWeek ?? 0,
      durationMinutes: selectedService.durationMinutes,
      availability: avail,
    })
    if (!daySlots.some((sl) => sl.available)) {
      dispatch({ type: 'choose_date', dateStr })
      dispatch({ type: 'back' })
      botSay(noSlotsReply(dateStr))
      return
    }
    dispatch({ type: 'choose_date', dateStr })
    botSay(timeReply(dateStr))
  }

  const handleFreeform = (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputText.trim()
    if (!text) return
    setInputText('')
    if (flow.step === 'notes') {
      advance({ type: 'set_notes', notes: text }, text)
      return
    }
    userSay(text)
    if (CRISIS_PATTERN.test(text)) {
      botSay(crisisReply())
    } else {
      botSay(freeformReply())
    }
  }

  const servicesForMethod =
    catalog && flow.selections.method
      ? catalog.services.filter((sv) => sv.deliveryMethods.includes(flow.selections.method!))
      : []

  const renderControls = () => {
    if (!catalog) {
      return (
        <div className="flex items-center gap-2 text-[11px] text-[#72677E]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Menyiapkan katalog layanan
        </div>
      )
    }

    switch (flow.step) {
      case 'greet':
        return (
          <div className="flex flex-wrap gap-2">
            <ChoiceChip label="Mulai pemesanan" tone="primary" onClick={() => advance({ type: 'begin' })} />
          </div>
        )

      case 'method':
        return (
          <div className="flex flex-wrap gap-2">
            <ChoiceChip
              label="Online (video call)"
              onClick={() => advance({ type: 'choose_method', method: 'online' }, 'Online (video call)')}
            />
            <ChoiceChip
              label="Tatap muka di klinik"
              onClick={() => advance({ type: 'choose_method', method: 'offline' }, 'Tatap muka di klinik')}
            />
          </div>
        )

      case 'service':
        return servicesForMethod.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            <ChoiceChip label="Ganti metode" onClick={() => advance({ type: 'back' })} />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {servicesForMethod.map((sv) => {
              const price = servicePriceForMethod(sv, flow.selections.method!)
              return (
                <ChoiceChip
                  key={sv.id}
                  label={sv.name}
                  sublabel={`${sv.durationMinutes} menit${price !== null ? ` · ${formatRupiah(price)}` : ''}`}
                  onClick={() => advance({ type: 'choose_service', serviceId: sv.id }, sv.name)}
                />
              )
            })}
            <ChoiceChip label="Kembali" className="self-start" onClick={() => advance({ type: 'back' })} />
          </div>
        )

      case 'psychologist': {
        const psychs = flow.selections.serviceId
          ? psychologistsForService(catalog, flow.selections.serviceId)
          : []
        return (
          <div className="flex flex-col gap-1.5">
            {psychs.map((p) => (
              <ChoiceChip
                key={p.id}
                label={p.fullName}
                sublabel={p.isBot ? 'Bot uji coba pembayaran · Rp1.000' : p.credentials}
                onClick={() => advance({ type: 'choose_psychologist', psychologistId: p.id }, p.fullName)}
              />
            ))}
            <ChoiceChip label="Kembali" className="self-start" onClick={() => advance({ type: 'back' })} />
          </div>
        )
      }

      case 'date':
        return (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {dates.map((d) => (
              <ChoiceChip
                key={d.dateStr}
                label={d.label}
                className="shrink-0"
                onClick={() => void handleChooseDate(d.dateStr, d.label)}
              />
            ))}
          </div>
        )

      case 'time':
        return (
          <div className="space-y-2">
            {availabilityLoading ? (
              <div className="flex items-center gap-2 text-[11px] text-[#72677E]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memeriksa jadwal psikolog
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {slots.map((sl) => (
                  <ChoiceChip
                    key={sl.time}
                    label={`${sl.time} WIB`}
                    disabled={!sl.available}
                    className="font-mono"
                    onClick={() => advance({ type: 'choose_time', time: sl.time }, `${sl.time} WIB`)}
                  />
                ))}
              </div>
            )}
            <ChoiceChip label="Ganti tanggal" className="self-start" onClick={() => advance({ type: 'back' })} />
          </div>
        )

      case 'notes':
        return (
          <div className="flex flex-wrap gap-2">
            <ChoiceChip label="Lewati, tanpa catatan" onClick={() => advance({ type: 'skip_notes' }, 'Lewati')} />
          </div>
        )

      case 'consent':
        return (
          <div className="flex flex-wrap gap-2">
            <ChoiceChip
              label="Setuju, lanjutkan"
              tone="primary"
              onClick={() => advance({ type: 'set_consent', consent: true }, 'Saya setuju dengan ketentuan booking')}
            />
            <ChoiceChip
              label="Tidak setuju"
              onClick={() => {
                dispatch({ type: 'set_consent', consent: false })
                botSay(
                  'Tanpa persetujuan ketentuan, booking belum bisa dilanjutkan. Jika ada yang ingin ditanyakan, tim kami siap membantu via WhatsApp.'
                )
              }}
            />
          </div>
        )

      case 'confirm':
        if (!user) {
          return (
            <div className="rounded-xl border border-plum-200 bg-plum-50 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-bold text-plum-900">
                <Lock className="h-3.5 w-3.5" />
                Masuk untuk menyelesaikan booking
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#5A5066]">
                Pilihan Anda tersimpan. Masuk atau daftar sebentar, lalu lanjutkan dari sini.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Link to="/login" state={{ from: { pathname: location.pathname } }}>
                  <Button size="sm" className="text-xs">Masuk</Button>
                </Link>
                <Link to="/register" state={{ from: { pathname: location.pathname } }}>
                  <Button variant="outline" size="sm" className="text-xs">Daftar akun baru</Button>
                </Link>
              </div>
            </div>
          )
        }
        return (
          <div className="flex flex-wrap gap-2">
            <ChoiceChip
              label="Konfirmasi & buat booking"
              tone="primary"
              disabled={!conversationId}
              onClick={() => advance({ type: 'confirm' }, 'Konfirmasi, buat booking')}
            />
            <ChoiceChip label="Ubah pilihan" onClick={() => advance({ type: 'back' })} />
          </div>
        )

      case 'booking':
        return (
          <div className="flex items-center gap-2 text-[11px] font-semibold text-plum-800">
            <TypingDots />
            Membuat booking dan menyiapkan pembayaran
          </div>
        )

      case 'done':
        return (
          <div className="flex flex-wrap gap-2">
            {flow.threadId && (
              <ChoiceChip
                label="Buka thread & bayar"
                tone="primary"
                onClick={() => navigate(`/dashboard/thread/${flow.threadId}`)}
              />
            )}
            <ChoiceChip label="Pesan sesi lagi" onClick={() => dispatch({ type: 'restart' })} />
          </div>
        )

      case 'error':
        return (
          <div className="flex flex-wrap gap-2">
            <ChoiceChip label="Coba lagi" tone="primary" onClick={() => dispatch({ type: 'retry' })} />
            <ChoiceChip label="Ubah pilihan" onClick={() => dispatch({ type: 'back' })} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Transcript */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {!transcriptLoaded && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-plum-400" />
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            content={m.content}
            senderKind={m.role}
            isOwn={m.role === 'user'}
            createdAt={m.createdAt}
          />
        ))}
        <div ref={endRef} />
      </div>

      {/* Controls + composer */}
      <div className="space-y-2.5 border-t border-[#E8E1D9] bg-sanctuary-50 px-4 py-3">
        {renderControls()}
        <form onSubmit={handleFreeform} className="flex items-center gap-2">
          <BotAvatar className="h-9 w-9" />
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              flow.step === 'notes'
                ? 'Tulis catatan untuk psikolog, atau lewati...'
                : 'Tulis pesan ke asisten...'
            }
            className="h-10 min-w-0 flex-1 rounded-xl border border-[#DDD5CC] bg-white px-3.5 text-[13px] text-plum-950 placeholder:text-[#A79BB5] focus:border-plum-400 focus:outline-none focus:ring-2 focus:ring-plum-100"
            aria-label="Pesan ke asisten Soulaide"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!inputText.trim()}
            className="h-10 w-10 shrink-0 rounded-xl p-0"
            aria-label="Kirim pesan"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}