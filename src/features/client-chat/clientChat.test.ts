import { describe, expect, it } from 'vitest'
import { computeDaySlots, DEFAULT_DAILY_SLOTS } from './slots.ts'
import { sessionEpochWib, hoursUntilSessionWib, getSelectableDatesWib, addMinutesToTime } from './wib.ts'
import { flowReducer, initialFlowState, isFlowComplete } from './assistantFlow.ts'
import type { DayAvailability } from './types.ts'

// Fixed reference: 2026-11-23 10:00 WIB (03:00 UTC), a Monday.
const NOW = new Date('2026-11-23T03:00:00Z')

const emptyAvailability: DayAvailability = { schedules: [], overrides: [], booked: [] }

describe('WIB time helpers', () => {
  it('converts WIB wall-clock to epoch independent of browser timezone', () => {
    // 2026-11-24 09:00 WIB == 2026-11-24 02:00 UTC
    expect(sessionEpochWib('2026-11-24', '09:00')).toBe(Date.UTC(2026, 10, 24, 2, 0, 0))
  })

  it('computes lead time in WIB', () => {
    expect(hoursUntilSessionWib('2026-11-24', '09:00', NOW)).toBe(23)
    expect(hoursUntilSessionWib('2026-11-24', '10:00', NOW)).toBe(24)
  })

  it('offers selectable dates starting tomorrow', () => {
    const dates = getSelectableDatesWib(3, NOW)
    expect(dates.map((d) => d.dateStr)).toEqual(['2026-11-24', '2026-11-25', '2026-11-26'])
    expect(dates[0].dayOfWeek).toBe(2) // Tuesday
  })

  it('adds minutes to a time string', () => {
    expect(addMinutesToTime('09:00', 60)).toBe('10:00')
    expect(addMinutesToTime('23:30', 45)).toBe('00:15')
  })
})

describe('Schedule-aware slot computation', () => {
  it('falls back to default daily slots without a schedule', () => {
    const slots = computeDaySlots({
      dateStr: '2026-11-25',
      dayOfWeek: 3,
      durationMinutes: 60,
      availability: emptyAvailability,
      now: NOW,
    })
    expect(slots.map((s) => s.time)).toEqual(DEFAULT_DAILY_SLOTS)
    expect(slots.every((s) => s.available)).toBe(true)
  })

  it('generates hourly starts inside the weekly schedule window', () => {
    const slots = computeDaySlots({
      dateStr: '2026-11-30',
      dayOfWeek: 1,
      durationMinutes: 60,
      availability: {
        schedules: [{ day_of_week: 1, start_time: '09:00:00', end_time: '12:00:00' }],
        overrides: [],
        booked: [],
      },
      now: NOW,
    })
    expect(slots.map((s) => s.time)).toEqual(['09:00', '10:00', '11:00'])
  })

  it('marks booked intervals unavailable but keeps adjacent slots', () => {
    const slots = computeDaySlots({
      dateStr: '2026-11-30',
      dayOfWeek: 1,
      durationMinutes: 60,
      availability: {
        schedules: [{ day_of_week: 1, start_time: '09:00:00', end_time: '12:00:00' }],
        overrides: [],
        booked: [{ start_time: '10:00:00', end_time: '11:00:00' }],
      },
      now: NOW,
    })
    const byTime = Object.fromEntries(slots.map((s) => [s.time, s]))
    expect(byTime['09:00'].available).toBe(true)
    expect(byTime['10:00'].available).toBe(false)
    expect(byTime['11:00'].available).toBe(true)
  })

  it('honors blocked ranges and full-day overrides', () => {
    const blocked = computeDaySlots({
      dateStr: '2026-11-30',
      dayOfWeek: 1,
      durationMinutes: 60,
      availability: {
        schedules: [{ day_of_week: 1, start_time: '09:00:00', end_time: '12:00:00' }],
        overrides: [{ start_time: '09:00:00', end_time: '10:00:00', is_available: false }],
        booked: [],
      },
      now: NOW,
    })
    expect(blocked.find((s) => s.time === '09:00')?.available).toBe(false)
    expect(blocked.find((s) => s.time === '10:00')?.available).toBe(true)

    const fullDay = computeDaySlots({
      dateStr: '2026-11-30',
      dayOfWeek: 1,
      durationMinutes: 60,
      availability: {
        schedules: [],
        overrides: [{ start_time: null, end_time: null, is_available: false }],
        booked: [],
      },
      now: NOW,
    })
    expect(fullDay.every((s) => !s.available)).toBe(true)
  })

  it('enforces the 24-hour WIB lead time', () => {
    const slots = computeDaySlots({
      dateStr: '2026-11-24',
      dayOfWeek: 2,
      durationMinutes: 60,
      availability: emptyAvailability,
      now: NOW,
    })
    const byTime = Object.fromEntries(slots.map((s) => [s.time, s]))
    expect(byTime['09:00'].available).toBe(false) // 23h away
    expect(byTime['10:30'].available).toBe(true) // 24.5h away
  })
})

describe('Assistant booking flow reducer', () => {
  it('walks the full happy path to confirm', () => {
    let state = initialFlowState
    state = flowReducer(state, { type: 'begin' })
    expect(state.step).toBe('method')
    state = flowReducer(state, { type: 'choose_method', method: 'online' })
    expect(state.step).toBe('service')
    state = flowReducer(state, { type: 'choose_service', serviceId: 'sv-1' })
    expect(state.step).toBe('psychologist')
    state = flowReducer(state, { type: 'choose_psychologist', psychologistId: 'p-1' })
    expect(state.step).toBe('date')
    state = flowReducer(state, { type: 'choose_date', dateStr: '2026-11-25' })
    expect(state.step).toBe('time')
    state = flowReducer(state, { type: 'choose_time', time: '10:30' })
    expect(state.step).toBe('notes')
    state = flowReducer(state, { type: 'skip_notes' })
    expect(state.step).toBe('consent')
    state = flowReducer(state, { type: 'set_consent', consent: true })
    expect(state.step).toBe('confirm')
    expect(isFlowComplete(state.selections)).toBe(true)
  })

  it('blocks progress without consent', () => {
    let state = flowReducer(initialFlowState, { type: 'begin' })
    state = flowReducer(state, { type: 'set_consent', consent: false })
    expect(state.step).toBe('method')
    expect(isFlowComplete(state.selections)).toBe(false)
  })

  it('clears dependent selections when going back', () => {
    let state = initialFlowState
    state = flowReducer(state, { type: 'choose_method', method: 'online' })
    state = flowReducer(state, { type: 'choose_service', serviceId: 'sv-1' })
    state = flowReducer(state, { type: 'choose_psychologist', psychologistId: 'p-1' })
    state = flowReducer(state, { type: 'back' })
    expect(state.step).toBe('psychologist')
    expect(state.selections.psychologistId).toBeUndefined()
    expect(state.selections.serviceId).toBe('sv-1')
  })

  it('changing service resets psychologist and schedule picks', () => {
    let state = initialFlowState
    state = flowReducer(state, { type: 'choose_method', method: 'online' })
    state = flowReducer(state, { type: 'choose_service', serviceId: 'sv-1' })
    state = flowReducer(state, { type: 'choose_psychologist', psychologistId: 'p-1' })
    state = flowReducer(state, { type: 'choose_date', dateStr: '2026-11-25' })
    state = flowReducer(state, { type: 'choose_service', serviceId: 'sv-2' })
    expect(state.selections.psychologistId).toBeUndefined()
    expect(state.selections.dateStr).toBeUndefined()
    expect(state.selections.serviceId).toBe('sv-2')
  })

  it('handles booking success and error paths', () => {
    let state = flowReducer(initialFlowState, { type: 'seed', step: 'confirm', selections: {
      method: 'online', serviceId: 'sv-1', psychologistId: 'p-1',
      dateStr: '2026-11-25', time: '10:30', consent: true,
    } })
    state = flowReducer(state, { type: 'confirm' })
    expect(state.step).toBe('booking')
    state = flowReducer(state, { type: 'booking_error', error: 'Slot sudah dipesan' })
    expect(state.step).toBe('error')
    state = flowReducer(state, { type: 'retry' })
    expect(state.step).toBe('confirm')
    state = flowReducer(state, { type: 'confirm' })
    state = flowReducer(state, {
      type: 'booking_success',
      bookingId: 'b-1',
      bookingCode: 'SLD-1',
      threadId: 't-1',
    })
    expect(state.step).toBe('done')
    expect(state.threadId).toBe('t-1')
  })
})