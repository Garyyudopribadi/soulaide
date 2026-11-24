import type { PaymentStatus } from '@/features/payments/types'

export interface TransactionSearchFields {
  provider_order_id: string
  booking_code: string
  customer_name: string
  psychologist_name?: string | null
  status: string
}

const MANUAL_STATUSES: ReadonlySet<string> = new Set(['pending', 'expired'])

export function canMarkPaidManually(status: string): boolean {
  return MANUAL_STATUSES.has(status)
}

/** Null when the reason is acceptable. */
export function validateManualSettlementReason(reason: string): string | null {
  const trimmed = reason.trim()
  if (trimmed.length < 8) return 'Alasan minimal 8 karakter'
  if (trimmed.length > 500) return 'Alasan maksimal 500 karakter'
  return null
}

export function paymentMatchesStatusFilter(status: string, filter: string): boolean {
  if (filter === 'all') return true
  if (filter === 'refunded') return status === 'refunded' || status === 'partially_refunded'
  return status === filter
}

export function filterTransactions<T extends TransactionSearchFields>(
  items: T[],
  statusFilter: string,
  search: string
): T[] {
  const query = search.trim().toLowerCase()
  return items.filter((item) => {
    if (!paymentMatchesStatusFilter(item.status, statusFilter)) return false
    if (!query) return true
    const haystack = [
      item.provider_order_id,
      item.booking_code,
      item.customer_name,
      item.psychologist_name ?? '',
    ]
    return haystack.some((value) => value.toLowerCase().includes(query))
  })
}

export function needsQrisSync(payment: {
  status: string
  provider_transaction_id: string | null
  provider_status?: string | null
}): boolean {
  if (!payment.provider_transaction_id) return false
  if (payment.status === 'pending' || payment.status === 'expired') return true
  return payment.status === 'paid' && !payment.provider_status
}

export function providerStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Belum dicek'
  switch (status.toUpperCase()) {
    case 'PAID':
      return 'Lunas'
    case 'PENDING':
    case 'UNPAID':
    case 'WAITING':
      return 'Belum lunas'
    case 'EXPIRED':
      return 'Kedaluwarsa'
    case 'CANCELLED':
    case 'CANCELED':
    case 'FAILED':
      return 'Gagal'
    default:
      return status
  }
}

export function settlementLabel(
  source: string | null | undefined,
  status: PaymentStatus | string
): string {
  if (source === 'manual') return 'Manual admin'
  if (source === 'provider' || status === 'paid') return 'QRISGate'
  return '—'
}
