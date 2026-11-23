/**
 * Shared chat primitives: bubbles, chips, avatars, status badges.
 * Brand: plum primary, sanctuary neutrals, champagne accents.
 */

import React from 'react'
import { cn } from '@/lib/utils'
import type { BookingStatus } from '@/types/index.ts'
import type { SenderKind } from './types.ts'

export function formatMessageTime(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatThreadTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return formatMessageTime(iso)
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
  }).format(d)
}

export const BotAvatar: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src="/bot-avatar.svg"
    alt=""
    className={cn('h-8 w-8 shrink-0 rounded-xl border border-plum-100 object-cover', className)}
  />
)

export const TypingDots: React.FC = () => (
  <span className="inline-flex items-center gap-1 px-1 py-1.5" aria-label="Asisten sedang mengetik">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-plum-300"
        style={{ animationDelay: `${i * 150}ms` }}
      />
    ))}
  </span>
)

/** One chat bubble. System messages without activity meta render as centered notes. */
export const MessageBubble: React.FC<{
  content: string
  senderKind: SenderKind
  isOwn: boolean
  createdAt: string
  avatarUrl?: string | null
}> = ({ content, senderKind, isOwn, createdAt, avatarUrl }) => {
  if (senderKind === 'system') {
    return (
      <div className="flex justify-center py-1">
        <p className="max-w-[85%] rounded-full border border-[#E8E1D9] bg-white/70 px-3.5 py-1.5 text-center text-[11px] leading-relaxed text-[#72677E]">
          {content}
        </p>
      </div>
    )
  }

  const isBot = senderKind === 'bot'
  return (
    <div className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        isBot || !avatarUrl ? (
          <BotAvatar />
        ) : (
          <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-xl border border-[#E8E1D9] object-cover" />
        )
      )}
      <div
        className={cn(
          'max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-2xs',
          isOwn
            ? 'rounded-br-md bg-plum-700 text-white'
            : 'rounded-bl-md border border-[#E8E1D9] bg-white text-plum-950'
        )}
      >
        {content}
        <span
          className={cn(
            'mt-1 block text-right text-[9px] font-medium tabular-nums',
            isOwn ? 'text-plum-200' : 'text-[#A79BB5]'
          )}
        >
          {formatMessageTime(createdAt)} WIB
        </span>
      </div>
    </div>
  )
}

export const ChoiceChip: React.FC<{
  label: string
  sublabel?: string
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'primary' | 'danger'
  className?: string
}> = ({ label, sublabel, onClick, disabled, tone = 'default', className }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'rounded-xl border px-3.5 py-2 text-left text-xs font-semibold transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-plum-300',
      'disabled:cursor-not-allowed disabled:opacity-45',
      tone === 'primary' &&
        'border-plum-700 bg-plum-700 text-white shadow-2xs hover:bg-plum-800 active:scale-[0.98]',
      tone === 'danger' &&
        'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 active:scale-[0.98]',
      tone === 'default' &&
        'border-[#DDD5CC] bg-white text-plum-900 shadow-2xs hover:border-plum-300 hover:bg-plum-50 active:scale-[0.98]',
      className
    )}
  >
    <span className="block">{label}</span>
    {sublabel && (
      <span className={cn('mt-0.5 block text-[10px] font-medium', tone === 'primary' ? 'text-plum-200' : 'text-[#72677E]')}>
        {sublabel}
      </span>
    )}
  </button>
)

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: 'Menunggu Pembayaran',
  confirmed: 'Terkonfirmasi',
  reschedule_requested: 'Reschedule Ditinjau',
  rescheduled: 'Jadwal Baru',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  no_show: 'Tidak Hadir',
}

const STATUS_CLASSES: Record<BookingStatus, string> = {
  pending_payment: 'bg-champagne-100 text-champagne-700 border-champagne-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reschedule_requested: 'bg-amber-50 text-amber-700 border-amber-200',
  rescheduled: 'bg-plum-50 text-plum-700 border-plum-200',
  completed: 'bg-plum-50 text-plum-700 border-plum-200',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
  no_show: 'bg-rose-50 text-rose-600 border-rose-200',
}

export const BookingStatusBadge: React.FC<{ status: BookingStatus; className?: string }> = ({ status, className }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
      STATUS_CLASSES[status],
      className
    )}
  >
    {STATUS_LABEL[status]}
  </span>
)

export function bookingStatusLabel(status: BookingStatus): string {
  return STATUS_LABEL[status]
}