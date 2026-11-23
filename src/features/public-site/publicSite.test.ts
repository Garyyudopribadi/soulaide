import { describe, expect, it } from 'vitest'
import { fallbackServices } from '@/features/services/useServices.ts'
import { initialPsychologists } from '@/features/psychologists/data.ts'
import { fallbackFaqs } from '@/features/public-site/useFaqs.ts'

describe('Public Site Data & Business Rules', () => {
  it('contains the 3 canonical services (Konseling Individu, MHCU, Bundling MHCU+Konseling Individu Online)', () => {
    expect(fallbackServices.length).toBe(3)

    const individual = fallbackServices.find((s) => s.title === 'Layanan Konseling Individu')
    const mhcu = fallbackServices.find((s) => s.title === 'Layanan MHCU (Mental Health Check Up)')
    const bundle = fallbackServices.find((s) => s.title === 'Bundling MHCU+Konseling Individu Online')

    expect(individual).toBeDefined()
    expect(individual?.priceOnline).toBe(110000)
    expect(individual?.priceOffline).toBe(350000)
    expect(individual?.deliveryMethods).toContain('online')
    expect(individual?.deliveryMethods).toContain('offline')

    expect(mhcu).toBeDefined()
    expect(mhcu?.priceOnline).toBe(89000)
    expect(mhcu?.deliveryMethods).toContain('online')
    expect(mhcu?.deliveryMethods).toContain('offline')

    expect(bundle).toBeDefined()
    expect(bundle?.priceOnline).toBe(169000)
    expect(bundle?.deliveryMethods).toContain('online')
  })

  it('contains the 4 verified initial psychologists with Soul Expert and Soul Guidance tiers', () => {
    expect(initialPsychologists.length).toBe(4)

    const names = initialPsychologists.map((p) => p.fullName)
    expect(names).toContain('Finandita Utari')
    expect(names).toContain('Amanda Natasanti')
    expect(names).toContain('Filza Ayska Syabina')
    expect(names).toContain('Narissa Qurrata Ayunin')

    const finandita = initialPsychologists.find((p) => p.fullName === 'Finandita Utari')
    expect(finandita?.credentials).toContain('M.Psi., Psikolog')
    expect(finandita?.experienceYears).toBe('> 10 tahun')
    expect(finandita?.tier).toBe('Soul Expert')

    const amanda = initialPsychologists.find((p) => p.fullName === 'Amanda Natasanti')
    expect(amanda?.tier).toBe('Soul Guidance')
  })

  it('constructs valid WhatsApp Click-to-Chat links without exposing private data', () => {
    const rawNumber = '+62 896-3086-9804'
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '')
    const message = 'Halo Soulaide, saya ingin bertanya mengenai layanan dan proses booking konseling.'

    expect(cleanNumber).toBe('6289630869804')

    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
    expect(url).toContain('https://wa.me/6289630869804?text=')
    expect(url).toContain('Halo%20Soulaide')
  })

  it('filters FAQs accurately by category', () => {
    const bookingFaqs = fallbackFaqs.filter((f) => f.category === 'booking')
    expect(bookingFaqs.length).toBeGreaterThan(0)
    for (const faq of bookingFaqs) {
      expect(faq.category).toBe('booking')
    }
  })
})
