/**
 * Chat-centric client experience: shared types.
 * Threads are the unit of the client area: one assistant thread plus one
 * thread per psychologist, carrying every booking/payment activity as cards.
 */

export type ThreadKind = 'assistant' | 'psychologist' | 'booking'
export type SenderKind = 'user' | 'bot' | 'system'

export interface ThreadMessage {
  id: string
  conversation_id: string
  sender_id: string | null
  sender_kind: SenderKind
  content: string
  meta: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface ThreadPsychologist {
  id: string
  fullName: string
  credentials: string
  cardImage: string
  isBot: boolean
  userId: string | null
}

export interface ThreadSummary {
  id: string
  kind: ThreadKind
  psychologistId: string | null
  psychologist: ThreadPsychologist | null
  updatedAt: string
  lastMessage: { content: string; senderKind: SenderKind; createdAt: string } | null
  unreadCount: number
}

export interface DayAvailability {
  schedules: Array<{ day_of_week: number; start_time: string; end_time: string }>
  overrides: Array<{ start_time: string | null; end_time: string | null; is_available: boolean }>
  booked: Array<{ start_time: string; end_time: string }>
}

/** Catalog service as used by the assistant booking flow (DB prices only). */
export interface ChatService {
  id: string
  name: string
  slug: string
  description: string
  durationMinutes: number
  deliveryMethods: Array<'online' | 'offline'>
  priceOnline: number | null
  priceOffline: number | null
}

/** Catalog psychologist as used by the assistant booking flow. */
export interface ChatPsychologist {
  id: string
  fullName: string
  credentials: string
  bio: string
  cardImage: string
  isBot: boolean
  userId: string | null
}

export interface ChatCatalog {
  services: ChatService[]
  psychologists: ChatPsychologist[]
  /** serviceId -> psychologistIds allowed for that service (empty = unrestricted). */
  mappings: Record<string, string[]>
}