import { supabase } from '@/lib/supabase/client.ts'
import type { BookingStatus, DeliveryMethod } from '@/types/index.ts'
import { validateBookingLeadTime, validateRescheduleEligibility } from './availability.ts'

export interface CreateBookingPayload {
  customerId: string
  psychologistId: string
  serviceId: string
  sessionDate: string // YYYY-MM-DD
  sessionStartTime: string // HH:mm:ss
  deliveryMethod: DeliveryMethod
  notes?: string
  consent?: boolean
}

export interface CustomerBookingRecord {
  id: string
  bookingCode: string
  customerId: string
  sessionDate: string
  sessionStartTime: string
  sessionEndTime: string
  deliveryMethod: DeliveryMethod
  status: BookingStatus
  notes: string | null
  meetingLink: string | null
  locationAddress: string | null
  createdAt: string
  service: {
    id: string
    name: string
    durationMinutes: number
    priceOnline: number | null
    priceOffline: number | null
  }
  psychologist: {
    id: string
    fullName: string
    credentials: string
    cardImageUrl: string | null
    isBot: boolean
    userId: string | null
  }
}

/**
 * Creates an appointment booking atomically in the database.
 * Invokes the PostgreSQL RPC function "Soulaide_reserve_slot_atomic" with transaction locking.
 */
export async function createBookingAtomic(payload: CreateBookingPayload): Promise<{
  success: boolean
  bookingId?: string
  bookingCode?: string
  threadId?: string
  error?: string
}> {
  // 1. Client-side sanity check for lead time (24h)
  const leadCheck = validateBookingLeadTime(payload.sessionDate, payload.sessionStartTime)
  if (!leadCheck.isValid) {
    return {
      success: false,
      error: leadCheck.message || 'Pemesanan harus minimal 24 jam sebelum sesi berlangsung.',
    }
  }

  try {
    // 2. Call the atomic reservation RPC
    const { data, error } = await supabase.rpc('Soulaide_reserve_slot_atomic', {
      p_customer_id: payload.customerId,
      p_psychologist_id: payload.psychologistId,
      p_service_id: payload.serviceId,
      p_session_date: payload.sessionDate,
      p_session_start_time: payload.sessionStartTime,
      p_delivery_method: payload.deliveryMethod,
      p_notes: payload.notes ?? undefined,
      p_consent: payload.consent ?? false,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    const result = data as {
      success: boolean
      booking_id?: string
      booking_code?: string
      thread_id?: string
      error?: string
    }

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Slot waktu tidak tersedia atau terjadi konflik jadwal.',
      }
    }

    return {
      success: true,
      bookingId: result.booking_id,
      bookingCode: result.booking_code,
      threadId: result.thread_id,
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal menghubungi server untuk reservasi slot.',
    }
  }
}

const BOOKING_SELECT = `
  id,
  booking_code,
  customer_id,
  session_date,
  session_start_time,
  session_end_time,
  delivery_method,
  status,
  notes,
  meeting_link,
  location_address,
  created_at,
  service:Soulaide_services(id, name, duration_minutes, price_online, price_offline),
  psychologist:Soulaide_psychologists(id, full_name, credentials, card_image_url, is_bot, user_id)
`

function mapBookingRow(row: unknown): CustomerBookingRecord {
  const item = row as {
    id: string
    booking_code: string
    customer_id: string
    session_date: string
    session_start_time: string
    session_end_time: string
    delivery_method: DeliveryMethod
    status: BookingStatus
    notes: string | null
    meeting_link: string | null
    location_address: string | null
    created_at: string
    service: {
      id: string
      name: string
      duration_minutes: number
      price_online: number | null
      price_offline: number | null
    } | null
    psychologist: {
      id: string
      full_name: string
      credentials: string
      card_image_url: string | null
      is_bot: boolean | null
      user_id: string | null
    } | null
  }

  return {
    id: item.id,
    bookingCode: item.booking_code,
    customerId: item.customer_id,
    sessionDate: item.session_date,
    sessionStartTime: item.session_start_time,
    sessionEndTime: item.session_end_time,
    deliveryMethod: item.delivery_method,
    status: item.status,
    notes: item.notes,
    meetingLink: item.meeting_link,
    locationAddress: item.location_address,
    createdAt: item.created_at,
    service: {
      id: item.service?.id || '',
      name: item.service?.name || 'Sesi Konseling',
      durationMinutes: item.service?.duration_minutes || 60,
      priceOnline: item.service?.price_online || null,
      priceOffline: item.service?.price_offline || null,
    },
    psychologist: {
      id: item.psychologist?.id || '',
      fullName: item.psychologist?.full_name || 'Psikolog Soulaide',
      credentials: item.psychologist?.credentials || 'Psikolog',
      cardImageUrl: item.psychologist?.card_image_url || '/Soulaide Psi Arc Logo.png',
      isBot: Boolean(item.psychologist?.is_bot),
      userId: item.psychologist?.user_id ?? null,
    },
  }
}

/**
 * Fetches all bookings belonging to a specific customer.
 */
export async function fetchCustomerBookings(customerId: string): Promise<CustomerBookingRecord[]> {
  try {
    const { data, error } = await supabase
      .from('Soulaide_bookings')
      .select(BOOKING_SELECT)
      .eq('customer_id', customerId)
      .order('session_date', { ascending: false })

    if (error || !data) {
      return []
    }

    return (data as unknown[]).map(mapBookingRow)
  } catch {
    return []
  }
}

/**
 * Fetches a single booking by id (client, assigned psychologist, or admin via RLS).
 */
export async function fetchBookingById(bookingId: string): Promise<CustomerBookingRecord | null> {
  try {
    const { data, error } = await supabase
      .from('Soulaide_bookings')
      .select(BOOKING_SELECT)
      .eq('id', bookingId)
      .maybeSingle()

    if (error || !data) return null
    return mapBookingRow(data)
  } catch {
    return null
  }
}

/**
 * Submits a reschedule request if within the eligible policy window (>= 8 hours).
 */
export async function submitRescheduleRequest(
  booking: CustomerBookingRecord,
  userId: string,
  proposedDate: string,
  proposedStartTime: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const eligibility = validateRescheduleEligibility(booking.sessionDate, booking.sessionStartTime)
  if (!eligibility.isEligible) {
    return {
      success: false,
      error: eligibility.message || 'Batas waktu pengajuan reschedule minimal 8 jam sebelum sesi.',
    }
  }

  try {
    const [hours, minutes] = proposedStartTime.split(':').map(Number)
    const endMinutes = minutes + booking.service.durationMinutes
    const endHours = hours + Math.floor(endMinutes / 60)
    const remMinutes = endMinutes % 60
    const proposedEndTime = `${String(endHours).padStart(2, '0')}:${String(remMinutes).padStart(2, '0')}:00`

    // Insert reschedule request
    const { error: reqError } = await supabase
      .from('Soulaide_reschedule_requests')
      .insert({
        booking_id: booking.id,
        requested_by: userId,
        proposed_date: proposedDate,
        proposed_start_time: proposedStartTime.length === 5 ? `${proposedStartTime}:00` : proposedStartTime,
        proposed_end_time: proposedEndTime,
        reason,
        status: 'pending',
      })

    if (reqError) {
      return { success: false, error: reqError.message }
    }

    // Update booking status; the status-change trigger records history,
    // thread activity, and notifications automatically.
    const { error: updateError } = await supabase
      .from('Soulaide_bookings')
      .update({ status: 'reschedule_requested' })
      .eq('id', booking.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal mengajukan reschedule.',
    }
  }
}

/**
 * Cancels a booking. History, thread activity, and notifications are written
 * by the Soulaide_bookings_status_change trigger.
 */
export async function cancelBooking(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('Soulaide_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal membatalkan sesi.',
    }
  }
}
