/**
 * Chat-centric client API: threads, messages, realtime, catalog, availability.
 * All writes go through SECURITY DEFINER RPCs so integrity rules (participants,
 * sender kinds, thread uniqueness) are enforced server-side, not in the browser.
 */

import { supabase } from '@/lib/supabase/client.ts'
import type {
  ThreadMessage,
  ThreadSummary,
  ThreadPsychologist,
  DayAvailability,
  ChatCatalog,
  ChatService,
  ChatPsychologist,
} from './types.ts'

type RpcResult = { success: boolean; error?: string; [key: string]: unknown }

// The typed client only knows a union of RPC names; this wrapper accepts any
// Soulaide RPC and normalizes the JSONB result shape.
const rpcUntyped = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args: Record<string, unknown>
) => PromiseLike<{ data: unknown; error: { message: string } | null }>

async function callRpc(fn: string, args: Record<string, unknown>): Promise<RpcResult> {
  const { data, error } = await rpcUntyped(fn, args)
  if (error) {
    return { success: false, error: error.message }
  }
  return (data as RpcResult) ?? { success: false, error: 'Respons server tidak valid' }
}

/** Open (or create) the assistant thread, or a thread with a psychologist. */
export async function openThread(psychologistId?: string | null): Promise<string> {
  const result = await callRpc('Soulaide_open_thread', {
    p_psychologist_id: psychologistId ?? null,
    p_customer_id: null,
  })
  if (!result.success || typeof result.conversation_id !== 'string') {
    throw new Error(result.error || 'Gagal membuka percakapan')
  }
  return result.conversation_id
}

/** Open the thread that carries a booking's activity. */
export async function openBookingThread(bookingId: string): Promise<string> {
  const result = await callRpc('Soulaide_open_booking_thread', { p_booking_id: bookingId })
  if (!result.success || typeof result.conversation_id !== 'string') {
    throw new Error(result.error || 'Gagal membuka percakapan booking')
  }
  return result.conversation_id
}

export async function sendMessage(conversationId: string, content: string): Promise<void> {
  const result = await callRpc('Soulaide_send_chat', {
    p_conversation_id: conversationId,
    p_content: content,
  })
  if (!result.success) {
    throw new Error(result.error || 'Gagal mengirim pesan')
  }
}

/** Append a bot/system message (assistant transcript persistence, activity notes). */
export async function appendThreadMessage(
  conversationId: string,
  content: string,
  senderKind: 'bot' | 'system',
  meta: Record<string, unknown> = {}
): Promise<void> {
  const result = await callRpc('Soulaide_append_thread_message', {
    p_conversation_id: conversationId,
    p_content: content,
    p_sender_kind: senderKind,
    p_meta: meta,
  })
  if (!result.success) {
    throw new Error(result.error || 'Gagal menyimpan pesan')
  }
}

function mapPsychologist(row: {
  id: string
  full_name: string
  credentials: string | null
  card_image_url: string | null
  is_bot: boolean | null
  user_id: string | null
}): ThreadPsychologist {
  return {
    id: row.id,
    fullName: row.full_name,
    credentials: row.credentials || 'Psikolog',
    cardImage: row.card_image_url || '/Soulaide Psi Arc Logo.png',
    isBot: Boolean(row.is_bot),
    userId: row.user_id,
  }
}

/** All threads for a client: assistant first, then psychologist threads by recency. */
export async function fetchThreads(customerId: string): Promise<ThreadSummary[]> {
  const { data: convs, error } = await supabase
    .from('Soulaide_conversations')
    .select(`
      id, kind, psychologist_id, updated_at,
      psychologist:Soulaide_psychologists(id, full_name, credentials, card_image_url, is_bot, user_id)
    `)
    .eq('customer_id', customerId)
    .in('kind', ['assistant', 'psychologist'])
    .order('updated_at', { ascending: false })

  if (error || !convs || convs.length === 0) {
    return []
  }

  const ids = convs.map((c) => c.id)
  const { data: messages } = await supabase
    .from('Soulaide_messages')
    .select('id, conversation_id, sender_kind, content, is_read, created_at')
    .in('conversation_id', ids)
    .order('created_at', { ascending: true })

  const lastByConv = new Map<string, { content: string; senderKind: ThreadMessage['sender_kind']; createdAt: string }>()
  const unreadByConv = new Map<string, number>()
  for (const m of messages ?? []) {
    lastByConv.set(m.conversation_id, {
      content: m.content,
      senderKind: m.sender_kind as ThreadMessage['sender_kind'],
      createdAt: m.created_at,
    })
    if (!m.is_read) {
      unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1)
    }
  }

  const summaries: ThreadSummary[] = convs.map((c) => {
    const psychRow = (c as unknown as { psychologist: Parameters<typeof mapPsychologist>[0] | null }).psychologist
    return {
      id: c.id,
      kind: c.kind as ThreadSummary['kind'],
      psychologistId: c.psychologist_id,
      psychologist: psychRow ? mapPsychologist(psychRow) : null,
      updatedAt: c.updated_at,
      lastMessage: lastByConv.get(c.id) ?? null,
      unreadCount: unreadByConv.get(c.id) ?? 0,
    }
  })

  // Assistant thread pinned first; the rest already sorted by recency.
  return summaries.sort((a, b) => {
    if (a.kind === 'assistant' && b.kind !== 'assistant') return -1
    if (b.kind === 'assistant' && a.kind !== 'assistant') return 1
    return 0
  })
}

export async function fetchMessages(conversationId: string): Promise<ThreadMessage[]> {
  const { data, error } = await supabase
    .from('Soulaide_messages')
    .select('id, conversation_id, sender_id, sender_kind, content, meta, is_read, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500)

  if (error || !data) return []
  return data as unknown as ThreadMessage[]
}

/** Mark incoming messages read (own messages and bot/system rows stay untouched). */
export async function markThreadRead(conversationId: string, userId: string): Promise<void> {
  await supabase
    .from('Soulaide_messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', userId)
}

/**
 * Live updates for one thread. Returns an unsubscribe function.
 * INSERT drives new bubbles/cards; UPDATE drives read receipts and payment state.
 */
export function subscribeToThread(
  conversationId: string,
  handlers: { onInsert?: (msg: ThreadMessage) => void; onUpdate?: (msg: ThreadMessage) => void }
): () => void {
  const channel = supabase
    .channel(`thread:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'Soulaide_messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => handlers.onInsert?.(payload.new as ThreadMessage)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'Soulaide_messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => handlers.onUpdate?.(payload.new as ThreadMessage)
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

/** Live booking updates (webhook-driven status changes) for a set of bookings. */
export function subscribeToBookings(
  bookingIds: string[],
  onUpdate: (row: { id: string; status: string }) => void
): () => void {
  if (bookingIds.length === 0) return () => {}
  const channel = supabase
    .channel(`bookings:${bookingIds.join(',')}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'Soulaide_bookings' },
      (payload) => {
        const row = payload.new as { id: string; status: string }
        if (bookingIds.includes(row.id)) onUpdate(row)
      }
    )
    .subscribe()
  return () => {
    void supabase.removeChannel(channel)
  }
}

/** Schedule windows, overrides, and occupied intervals for one psychologist-day. */
export async function fetchDayAvailability(
  psychologistId: string,
  dateStr: string
): Promise<DayAvailability> {
  const { data, error } = await supabase.rpc('Soulaide_day_availability', {
    p_psychologist_id: psychologistId,
    p_date: dateStr,
  })
  if (error || !data) {
    return { schedules: [], overrides: [], booked: [] }
  }
  return data as unknown as DayAvailability
}

/** Services + psychologists + service mappings for the assistant flow. */
export async function fetchChatCatalog(): Promise<ChatCatalog> {
  const [servicesRes, psychsRes, mappingsRes] = await Promise.all([
    supabase
      .from('Soulaide_services')
      .select('id, name, slug, description, duration_minutes, delivery_methods, price_online, price_offline')
      .eq('is_active', true),
    supabase
      .from('Soulaide_psychologists')
      .select('id, full_name, credentials, bio, card_image_url, is_bot, user_id')
      .eq('is_active', true),
    supabase.from('Soulaide_service_psychologists').select('service_id, psychologist_id'),
  ])

  const services: ChatService[] = (servicesRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description ?? '',
    durationMinutes: s.duration_minutes,
    deliveryMethods: (s.delivery_methods ?? ['online']) as ChatService['deliveryMethods'],
    priceOnline: s.price_online,
    priceOffline: s.price_offline,
  }))

  const psychologists: ChatPsychologist[] = (psychsRes.data ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    credentials: p.credentials ?? 'Psikolog',
    bio: p.bio ?? '',
    cardImage: p.card_image_url || '/Soulaide Psi Arc Logo.png',
    isBot: Boolean(p.is_bot),
    userId: p.user_id,
  }))

  const mappings: Record<string, string[]> = {}
  for (const m of mappingsRes.data ?? []) {
    if (!mappings[m.service_id]) mappings[m.service_id] = []
    mappings[m.service_id].push(m.psychologist_id)
  }

  return { services, psychologists, mappings }
}

/** Psychologists eligible for a service (mapping enforced server-side too). */
export function psychologistsForService(catalog: ChatCatalog, serviceId: string): ChatPsychologist[] {
  const allowed = catalog.mappings[serviceId]
  if (!allowed || allowed.length === 0) return catalog.psychologists
  return catalog.psychologists.filter((p) => allowed.includes(p.id))
}

export function servicePriceForMethod(service: ChatService, method: 'online' | 'offline'): number | null {
  return method === 'offline' ? service.priceOffline : service.priceOnline
}