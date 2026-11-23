/**
 * Asia/Jakarta (WIB, UTC+7) time helpers.
 * All booking math is pinned to WIB so a client abroad and the server agree
 * on the same slot. Session wall-clock times are converted to an epoch by
 * treating them as UTC+7, independent of the browser timezone.
 */

const WIB_UTC_OFFSET_HOURS = 7

export interface WibParts {
  year: number
  month: number // 1-12
  day: number
  hour: number
  minute: number
  weekday: number // 0 = Sunday
}

const wibFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  weekday: 'short',
})

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

export function getWibParts(now: Date = new Date()): WibParts {
  const parts = wibFormatter.formatToParts(now)
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '0'
  let hour = Number(get('hour'))
  if (hour === 24) hour = 0 // en-GB renders midnight as 24 in some engines
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour,
    minute: Number(get('minute')),
    weekday: WEEKDAY_INDEX[get('weekday')] ?? 0,
  }
}

export function wibDateStr(now: Date = new Date()): string {
  const p = getWibParts(now)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

/** Epoch (ms) of a WIB wall-clock date + HH:mm time. */
export function sessionEpochWib(dateStr: string, timeStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  return Date.UTC(y, m - 1, d, hh - WIB_UTC_OFFSET_HOURS, mm, 0, 0)
}

export function hoursUntilSessionWib(
  dateStr: string,
  timeStr: string,
  now: Date = new Date()
): number {
  return (sessionEpochWib(dateStr, timeStr) - now.getTime()) / 3_600_000
}

export interface SelectableDate {
  dateStr: string
  label: string
  dayOfWeek: number
}

/** Selectable dates starting tomorrow (WIB), labeled in Indonesian. */
export function getSelectableDatesWib(count = 14, now: Date = new Date()): SelectableDate[] {
  const p = getWibParts(now)
  const startNoonUtc = Date.UTC(p.year, p.month - 1, p.day, 12)
  const labelFmt = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const out: SelectableDate[] = []
  for (let i = 1; i <= count; i++) {
    const d = new Date(startNoonUtc + i * 86_400_000)
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    out.push({
      dateStr: `${year}-${month}-${day}`,
      label: labelFmt.format(d),
      dayOfWeek: d.getUTCDay(),
    })
  }
  return out
}

/** "HH:mm" + minutes -> "HH:mm" (wraps within a day; callers stay in range). */
export function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

export function formatSessionDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, d, 12)))
}