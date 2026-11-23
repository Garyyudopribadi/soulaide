/**
 * Assistant booking flow: a pure state machine.
 * greet -> method -> service -> psychologist -> date -> time -> notes ->
 * consent -> confirm -> booking -> done
 *
 * The reducer is pure so it can be unit-tested; async work (RPC booking) is
 * dispatched by the component as booking_success / booking_error actions.
 */

import type { DeliveryMethod } from '@/types/index.ts'

export type FlowStep =
  | 'greet'
  | 'method'
  | 'service'
  | 'psychologist'
  | 'date'
  | 'time'
  | 'notes'
  | 'consent'
  | 'confirm'
  | 'booking'
  | 'done'
  | 'error'

export interface FlowSelections {
  method?: DeliveryMethod
  serviceId?: string
  psychologistId?: string
  dateStr?: string
  time?: string
  notes?: string
  consent?: boolean
}

export interface FlowState {
  step: FlowStep
  selections: FlowSelections
  bookingId?: string
  bookingCode?: string
  threadId?: string
  error?: string
}

export type FlowAction =
  | { type: 'start' }
  | { type: 'begin' }
  | { type: 'choose_method'; method: DeliveryMethod }
  | { type: 'choose_service'; serviceId: string }
  | { type: 'choose_psychologist'; psychologistId: string }
  | { type: 'choose_date'; dateStr: string }
  | { type: 'choose_time'; time: string }
  | { type: 'set_notes'; notes: string }
  | { type: 'skip_notes' }
  | { type: 'set_consent'; consent: boolean }
  | { type: 'confirm' }
  | { type: 'booking_success'; bookingId: string; bookingCode: string; threadId: string }
  | { type: 'booking_error'; error: string }
  | { type: 'retry' }
  | { type: 'back' }
  | { type: 'restart' }
  | { type: 'seed'; step: FlowStep; selections: FlowSelections }

export const initialFlowState: FlowState = { step: 'greet', selections: {} }

const STEP_ORDER: FlowStep[] = [
  'greet', 'method', 'service', 'psychologist', 'date', 'time', 'notes', 'consent', 'confirm',
]

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'start':
      return { ...initialFlowState }

    case 'begin':
      return { step: 'method', selections: {} }

    case 'choose_method':
      return {
        step: 'service',
        // Changing method invalidates later picks that depend on it.
        selections: { method: action.method },
      }

    case 'choose_service':
      return {
        step: 'psychologist',
        selections: { ...state.selections, serviceId: action.serviceId, psychologistId: undefined, dateStr: undefined, time: undefined },
      }

    case 'choose_psychologist':
      return {
        step: 'date',
        selections: { ...state.selections, psychologistId: action.psychologistId, dateStr: undefined, time: undefined },
      }

    case 'choose_date':
      return {
        step: 'time',
        selections: { ...state.selections, dateStr: action.dateStr, time: undefined },
      }

    case 'choose_time':
      return {
        step: 'notes',
        selections: { ...state.selections, time: action.time },
      }

    case 'set_notes':
      return { step: 'consent', selections: { ...state.selections, notes: action.notes } }

    case 'skip_notes':
      return { step: 'consent', selections: { ...state.selections, notes: undefined } }

    case 'set_consent':
      if (!action.consent) {
        return { ...state, selections: { ...state.selections, consent: false } }
      }
      return { step: 'confirm', selections: { ...state.selections, consent: true } }

    case 'confirm':
      return { ...state, step: 'booking', error: undefined }

    case 'booking_success':
      return {
        step: 'done',
        selections: state.selections,
        bookingId: action.bookingId,
        bookingCode: action.bookingCode,
        threadId: action.threadId,
      }

    case 'booking_error':
      return { ...state, step: 'error', error: action.error }

    case 'retry':
      return { ...state, step: 'confirm', error: undefined }

    case 'back': {
      if (state.step === 'error' || state.step === 'booking' || state.step === 'done') {
        return { ...state, step: 'confirm', error: undefined }
      }
      const idx = STEP_ORDER.indexOf(state.step)
      if (idx <= 0) return { ...initialFlowState }
      const prev = STEP_ORDER[idx - 1]
      // Going back re-opens the previous step: clear its selection and everything downstream.
      const selections = { ...state.selections }
      const stepKeys: Array<keyof FlowSelections> = [
        'method', 'serviceId', 'psychologistId', 'dateStr', 'time', 'notes', 'consent',
      ]
      for (let i = STEP_ORDER.indexOf(prev); i < STEP_ORDER.length; i++) {
        const key = stepKeys[i - 1]
        if (key) delete selections[key]
      }
      return { step: prev, selections }
    }

    case 'restart':
      return { ...initialFlowState }

    case 'seed':
      return { step: action.step, selections: action.selections }

    default:
      return state
  }
}

/** True when every selection needed for the booking RPC is present. */
export function isFlowComplete(selections: FlowSelections): boolean {
  return Boolean(
    selections.method &&
    selections.serviceId &&
    selections.psychologistId &&
    selections.dateStr &&
    selections.time &&
    selections.consent
  )
}