/**
 * Psychologist-side chat API: the client list with thread previews, and the
 * thread with one client. Reads/writes reuse the chat-centric RPCs and RLS
 * (participant-based), so integrity rules stay server-side.
 */

import { supabase } from '@/lib/supabase/client.ts'
import type { ThreadMessage } from '@/features/client-chat/types.ts'

const rpcUntyped = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args: Record<string, unknown>
) => PromiseLike<{ data: unknown; error: { message: string } | null }>

/** Open (or create) the thread with one client, as the signed-in psychologist. */
export async function openClientThread(customerId: string): Promise<string> {
  const { data, error } = await rpcUntyped('Soulaide_open_thread', {
    p_psychologist_id: null,
    p_customer_id: customerId,
  })
  const result = (data as { success?: boolean; conversation_id?: string; error?: string }) ?? {}
  if (error || !result.success || typeof result.conversation_id !== 'string') {
    throw new Error(result.error || error?.message || 'Gagal membuka percakapan klien')
  }
  return result.conversation_id
}

export interface ClientThreadSummary {
  id: string
  customerId: string
  customerName: string
  updatedAt: string
  lastMessage: { content: string; createdAt: string } | null
  unreadCount: number
}

/** All psychologist threads of this practice, with client names and previews. */
export async function fetchClientThreads(
  psychologistId: string,
  viewerId: string
): Promise<ClientThreadSummary[]> {
  const { data: convs, error } = await supabase
    .from('Soulaide_conversations')
    .select(`
      id, customer_id, updated_at,
      customer:Soulaide_profiles(id, full_name)
    `)
    .eq('psychologist_id', psychologistId)
    .eq('kind', 'psychologist')
    .order('updated_at', { ascending: false })

  if (error || !convs || convs.length === 0) return []

  const ids = convs.map((c) => c.id)
  const { data: messages } = await supabase
    .from('Soulaide_messages')
    .select('id, conversation_id, sender_id, content, is_read, created_at')
    .in('conversation_id', ids)
    .order('created_at', { ascending: true })

  const lastByConv = new Map<string, { content: string; createdAt: string }>()
  const unreadByConv = new Map<string, number>()
  for (const m of messages ?? []) {
    lastByConv.set(m.conversation_id, { content: m.content, createdAt: m.created_at })
    // Unread for the practice = incoming client messages not yet read.
    if (!m.is_read && m.sender_id && m.sender_id !== viewerId) {
      unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1)
    }
  }

  return convs.map((c) => {
    const customer = (c as unknown as { customer: { id: string; full_name: string } | null }).customer
    return {
      id: c.id,
      customerId: c.customer_id as string,
      customerName: customer?.full_name || 'Klien Soulaide',
      updatedAt: c.updated_at,
      lastMessage: lastByConv.get(c.id) ?? null,
      unreadCount: unreadByConv.get(c.id) ?? 0,
    }
  })
}

export type { ThreadMessage }
