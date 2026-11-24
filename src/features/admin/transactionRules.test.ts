import { describe, expect, it } from 'vitest'
import {
  canMarkPaidManually,
  filterTransactions,
  needsQrisSync,
  providerStatusLabel,
  settlementLabel,
  validateManualSettlementReason,
} from './transactionRules'

describe('admin transaction rules', () => {
  it('allows manual settlement only for pending and expired payments', () => {
    expect(canMarkPaidManually('pending')).toBe(true)
    expect(canMarkPaidManually('expired')).toBe(true)
    expect(canMarkPaidManually('paid')).toBe(false)
    expect(canMarkPaidManually('failed')).toBe(false)
    expect(canMarkPaidManually('refunded')).toBe(false)
  })

  it('requires a short reason and rejects an empty or oversized one', () => {
    expect(validateManualSettlementReason('  ')).toMatch(/minimal 8/)
    expect(validateManualSettlementReason('pendek')).toMatch(/minimal 8/)
    expect(validateManualSettlementReason('Listener DANA tidak mendeteksi')).toBeNull()
    expect(validateManualSettlementReason('a'.repeat(501))).toMatch(/maksimal 500/)
  })

  it('filters by status, including partial refunds, and by client or psychologist', () => {
    const rows = [
      {
        provider_order_id: 'SLD-A',
        booking_code: 'SLD-1',
        customer_name: 'Budi',
        psychologist_name: 'Amanda',
        status: 'pending',
      },
      {
        provider_order_id: 'SLD-B',
        booking_code: 'SLD-2',
        customer_name: 'Rina',
        psychologist_name: 'Filza',
        status: 'partially_refunded',
      },
    ]

    expect(filterTransactions(rows, 'refunded', '').map((row) => row.provider_order_id)).toEqual(['SLD-B'])
    expect(filterTransactions(rows, 'all', 'amanda').map((row) => row.booking_code)).toEqual(['SLD-1'])
    expect(filterTransactions(rows, 'pending', 'rina')).toEqual([])
  })

  it('syncs open QRISGate rows and paid rows that have never been checked', () => {
    expect(needsQrisSync({ status: 'pending', provider_transaction_id: 'trx_1', provider_status: null })).toBe(true)
    expect(needsQrisSync({ status: 'expired', provider_transaction_id: 'trx_1', provider_status: 'EXPIRED' })).toBe(true)
    expect(needsQrisSync({ status: 'paid', provider_transaction_id: 'trx_1', provider_status: null })).toBe(true)
    expect(needsQrisSync({ status: 'paid', provider_transaction_id: 'trx_1', provider_status: 'PAID' })).toBe(false)
    expect(needsQrisSync({ status: 'pending', provider_transaction_id: null, provider_status: null })).toBe(false)
    expect(needsQrisSync({ status: 'refunded', provider_transaction_id: 'trx_1', provider_status: null })).toBe(false)
  })

  it('labels provider status and the settlement source', () => {
    expect(providerStatusLabel(null)).toBe('Belum dicek')
    expect(providerStatusLabel('PAID')).toBe('Lunas')
    expect(providerStatusLabel('PENDING')).toBe('Belum lunas')
    expect(settlementLabel('manual', 'paid')).toBe('Manual admin')
    expect(settlementLabel(null, 'paid')).toBe('QRISGate')
    expect(settlementLabel(null, 'pending')).toBe('—')
  })
})
