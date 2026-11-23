import { describe, expect, it } from 'vitest'
import { cn, formatIDR } from './utils.ts'

describe('cn utility', () => {
  it('combines class names correctly', () => {
    expect(cn('px-2 py-1', 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500')
  })

  it('merges tailwind conflicts correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })
})

describe('formatIDR utility', () => {
  it('formats Indonesian Rupiah properly', () => {
    const formatted = formatIDR(110000)
    expect(formatted).toContain('110.000')
  })
})
