/**
 * Schedule-aware slot computation for the chat booking flow.
 * Pure functions so they can be unit-tested without a database.
 *
 * Rules:
 * - Base slots come from the psychologist's weekly schedule when present,
 *   otherwise the platform default daily slots.
 * - Availability overrides can block a range (or whole day) or add extra hours.
 * - Already-booked intervals and the 24h WIB lead time disable slots.
 */

import type { DayAvailability } from './types.ts'
import { addMinutesToTime, hoursUntilSessionWib } from './wib.ts'

export const MINIMUM_LEAD_TIME_HOURS = 24
export const DEFAULT_DAILY_SLOTS = ['09:00', '10:30', '13:00', '14:30', '16:00', '19:00', '20:30']

export interface SlotOption {
  time: string
  endTime: string
  available: boolean
  reason?: string
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart
}

/** Generate candidate start times inside [start, end) so a session fits. */
function startsInRange(start: string, end: string, durationMinutes: number, stepMinutes = 60): string[] {
  const out: string[] = []
  const endMin = toMinutes(end)
  for (let t = toMinutes(start); t + durationMinutes <= endMin; t += stepMinutes) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`)
  }
  return out
}

export function computeDaySlots(params: {
  dateStr: string
  dayOfWeek: number
  durationMinutes: number
  availability: DayAvailability
  now?: Date
}): SlotOption[] {
  const { dateStr, dayOfWeek, durationMinutes, availability, now = new Date() } = params

  const dayOverrides = availability.overrides
  const fullDayBlock = dayOverrides.some((o) => !o.is_available && !o.start_time && !o.end_time)

  // Base candidate times.
  const candidates = new Set<string>()
  const daySchedules = availability.schedules.filter((s) => s.day_of_week === dayOfWeek)
  if (daySchedules.length > 0) {
    for (const s of daySchedules) {
      for (const t of startsInRange(s.start_time.slice(0, 5), s.end_time.slice(0, 5), durationMinutes)) {
        candidates.add(t)
      }
    }
  } else {
    for (const t of DEFAULT_DAILY_SLOTS) candidates.add(t)
  }

  // Extra availability windows.
  for (const o of dayOverrides) {
    if (o.is_available && o.start_time && o.end_time) {
      for (const t of startsInRange(o.start_time.slice(0, 5), o.end_time.slice(0, 5), durationMinutes)) {
        candidates.add(t)
      }
    }
  }

  const blockedRanges = dayOverrides
    .filter((o) => !o.is_available && o.start_time && o.end_time)
    .map((o) => [toMinutes(o.start_time!.slice(0, 5)), toMinutes(o.end_time!.slice(0, 5))] as const)

  const bookedRanges = availability.booked.map(
    (b) => [toMinutes(b.start_time.slice(0, 5)), toMinutes(b.end_time.slice(0, 5))] as const
  )

  const slots: SlotOption[] = []
  for (const time of Array.from(candidates).sort()) {
    const start = toMinutes(time)
    const end = start + durationMinutes
    const endTime = addMinutesToTime(time, durationMinutes)
    let available = true
    let reason: string | undefined

    if (fullDayBlock) {
      available = false
      reason = 'Psikolog tidak tersedia pada tanggal ini'
    } else if (blockedRanges.some(([bs, be]) => overlaps(start, end, bs, be))) {
      available = false
      reason = 'Di luar jam tersedia psikolog'
    } else if (bookedRanges.some(([bs, be]) => overlaps(start, end, bs, be))) {
      available = false
      reason = 'Slot sudah dipesan'
    } else if (hoursUntilSessionWib(dateStr, time, now) < MINIMUM_LEAD_TIME_HOURS) {
      available = false
      reason = 'Kurang dari 24 jam sebelum sesi'
    }

    slots.push({ time, endTime, available, reason })
  }

  return slots
}