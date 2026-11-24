/**
 * Live countdown to a session slot (WIB). Ticks from a shared `now` so a whole
 * list re-renders on one interval.
 */

import React from 'react'
import { cn } from '@/lib/utils'

export function sessionStartIso(date: string, startTime: string): string {
  return `${date}T${startTime.slice(0, 5)}:00+07:00`
}

export function formatCountdown(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `${d} hr ${h} j`
  if (h > 0) return `${h} j ${m} m`
  return `${m} m`
}

export const SessionCountdown: React.FC<{
  date: string
  startTime: string
  endTime: string
  now: number
  className?: string
}> = ({ date, startTime, endTime, now, className }) => {
  const start = new Date(sessionStartIso(date, startTime)).getTime()
  const end = new Date(sessionStartIso(date, endTime)).getTime()

  if (now >= start && now <= end) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700',
          className
        )}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        Berlangsung
      </span>
    )
  }
  if (now > end) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-700',
        className
      )}
      title="Hitung mundur menuju sesi"
    >
      {formatCountdown(start - now)}
    </span>
  )
}
