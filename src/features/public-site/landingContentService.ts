import { supabase } from '@/lib/supabase/client.ts'
import { getAssetUrl } from '@/lib/utils.ts'

export interface TopBarContent {
  code_of_ethics: string
  service_session: string
  schedule: string
  crisis_hotline: string
  crisis_phone: string
}

export interface HeroPhrase {
  step: string
  text: string
  sub: string
  tag: string
}

export interface HeroContent {
  tagline_eyebrow: string
  heading_primary: string
  heading_accent: string
  description: string
  logo_image: string
  looping_phrases: HeroPhrase[]
}

export interface PhilosophyPillar {
  tag: string
  title: string
  description: string
}

export interface PhilosophyContent {
  badge: string
  title: string
  accent: string
  description: string
  image_url: string
  video_url: string
  pillars?: PhilosophyPillar[]
}

export interface JourneyStepItem {
  step: string
  title: string
  description: string
  detail: string
}

export interface JourneyContent {
  badge: string
  title_primary: string
  title_accent: string
  subtitle: string
  steps: JourneyStepItem[]
}

export interface ContactMapsContent {
  clinic_name: string
  address: string
  schedule: string
  email: string
  phone: string
  maps_embed_url: string
}

export interface FooterContent {
  tagline: string
  instagram: string
  threads: string
  facebook: string
  youtube?: string
  copyright: string
}

export interface LandingContentMap {
  top_bar: TopBarContent
  hero: HeroContent
  philosophy: PhilosophyContent
  journey: JourneyContent
  contact_maps: ContactMapsContent
  footer: FooterContent
}

export const defaultLandingContent: LandingContentMap = {
  top_bar: {
    code_of_ethics: 'Standar Kode Etik HIMPSI & Psikolog Berlisensi SIPP',
    service_session: 'Sesi Daring (Google Meet) & Tatap Muka Pondok Bambu Aktif',
    schedule: 'Senin – Sabtu (By Appointment)',
    crisis_hotline: '119 ext 8',
    crisis_phone: '119',
  },
  hero: {
    tagline_eyebrow: 'Ruang Bertumbuh & Pemulihan Jiwa',
    heading_primary: 'Menemukan Kejelasan Emosi Bersama',
    heading_accent: 'Psikolog Profesional',
    description: 'Layanan konseling psikologi komprehensif berizin SIPP dengan ruang konsultasi aman, etis, dan empatik.',
    logo_image: getAssetUrl('/Soulaide Psi Arc Logo.webp'),
    looping_phrases: [
      {
        step: '01',
        text: 'A safe space to be heard.',
        sub: 'Ruang bercerita yang hangat, rahasia, dan bebas dari penghakiman.',
        tag: 'Ruang Aman & Empatik',
      },
      {
        step: '02',
        text: 'Care that meets you where you are.',
        sub: 'Pendampingan yang menyesuaikan ritme, kebutuhan, dan kenyamanan Anda.',
        tag: 'Pendekatan Personal',
      },
      {
        step: '03',
        text: 'Small steps toward feeling well.',
        sub: 'Langkah kecil yang terukur menuju pemulihan dan kejelasan emosi.',
        tag: 'Pemulihan Berkelanjutan',
      },
    ],
  },
  philosophy: {
    badge: 'Filosofi Soulaide',
    title: 'Mengapa Dinamakan',
    accent: 'Soulaide?',
    description: 'Soulaide lahir dari keyakinan bahwa setiap jiwa (Soul) berhak mendapatkan pertolongan (Aide) yang hangat, etis, dan ilmiah.',
    image_url: getAssetUrl('/apa itru Soulaide.webp'),
    video_url: getAssetUrl('/soulaide-header-loop.mp4'),
    pillars: [
      {
        tag: '01 · Soul',
        title: 'Ruang Jiwa Empatik',
        description: 'Menghargai keunikan emosi, cerita hidup, dan kerentanan Anda dengan penerimaan utuh.',
      },
      {
        tag: '02 · Aide',
        title: 'Pendampingan Aktif',
        description: 'Berjalan bersama Anda menemukan regulasi emosi dan langkah pemulihan yang aplikatif.',
      },
      {
        tag: '03 · Psi (Ψ)',
        title: 'Keilmuan & Etika',
        description: 'Intervensi berbasis bukti ilmiah (CBT, SFBT, Humanistik, ABA) sesuai Kode Etik HIMPSI.',
      },
    ],
  },
  journey: {
    badge: 'Alur Konseling',
    title_primary: 'Tiga langkah menuju',
    title_accent: 'ruang aman Anda',
    subtitle: 'Alur reservasi yang terukur, transparan, dan bebas kecemasan sejak awal.',
    steps: [
      {
        step: '01',
        title: 'Pilih Layanan & Psikolog',
        description:
          'Tentukan kebutuhan Anda — Konseling Individu, MHCU, atau Bundling MHCU+Konseling Individu Online — lalu pilih pendamping Soul Guidance atau Soul Expert.',
        detail: '3 format layanan resmi, 4 psikolog terverifikasi SIPP',
      },
      {
        step: '02',
        title: 'Atur Jadwal & Metode Sesi',
        description:
          'Pilih sesi Daring (Google Meet) atau Tatap Muka di Pondok Bambu sesuai waktu nyaman Anda dengan lead time minimal 24 jam.',
        detail: 'Kalender sinkron, konfirmasi jadwal langsung',
      },
      {
        step: '03',
        title: 'Mulai Sesi Privat & Terjaga',
        description:
          'Konfirmasi pembayaran transparan, terima tautan ruang sesi aman, dan jalani proses pendampingan berstandar Kode Etik HIMPSI.',
        detail: 'Kerahasiaan medis terjamin & terlindungi',
      },
    ],
  },
  contact_maps: {
    clinic_name: 'Klinik Praktik Soulaide Pondok Bambu',
    address: 'Pondok Bambu, Duren Sawit, Jakarta Timur 13430',
    schedule: 'Senin – Sabtu (Sesuai Perjanjian)',
    email: 'halo@soulaide.id',
    phone: '+62 896-3086-9804',
    maps_embed_url:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15865.045431608824!2d106.89745354999999!3d-6.230553199999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f36a5cf572d3%3A0x2a9a8d11c1e57c67!2sPondok%20Bambu%2C%20Duren%20Sawit%2C%20East%20Jakarta%20City%2C%20Jakarta!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid',
  },
  footer: {
    tagline:
      'Ruang aman dan hangat untuk perjalanan kesehatan mental Anda. Didampingi psikolog klinis berlisensi secara privat, empatik, dan berlandaskan Kode Etik HIMPSI.',
    instagram: 'https://instagram.com/soulaide',
    threads: 'https://threads.net/@soulaide',
    facebook: 'https://facebook.com/soulaide',
    youtube: 'https://youtube.com/@soulaide',
    copyright: 'Soulaide Psychology. Hak Cipta Dilindungi Undang-Undang.',
  },
}

const CACHE_KEY = 'soulaide_landing_content_cache'

function getLocalCache(): LandingContentMap | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(CACHE_KEY)
      if (stored) {
        return JSON.parse(stored) as LandingContentMap
      }
    }
  } catch {
    // ignore localStorage errors
  }
  return null
}

function setLocalCache(content: LandingContentMap) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(content))
    }
  } catch {
    // ignore
  }
}

export const landingContentService = {
  async fetchAllLandingContent(): Promise<LandingContentMap> {
    try {
      const { data, error } = await supabase
        .from('Soulaide_landing_content')
        .select('*')

      if (error || !data || data.length === 0) {
        return getLocalCache() || defaultLandingContent
      }

      const cached = getLocalCache() || defaultLandingContent
      const result = { ...cached }
      for (const rawRow of data) {
        const row = rawRow as { section_key?: string; content?: Record<string, unknown> }
        const key = row.section_key as keyof LandingContentMap
        if (key && key in result && row.content) {
          result[key] = {
            ...result[key],
            ...row.content,
          } as never
        }
      }
      setLocalCache(result)
      return result
    } catch {
      return getLocalCache() || defaultLandingContent
    }
  },

  async updateSectionContent<K extends keyof LandingContentMap>(
    sectionKey: K,
    title: string,
    content: Partial<LandingContentMap[K]>
  ): Promise<LandingContentMap[K]> {
    // Merge with current state (from cache or default)
    const currentCache = getLocalCache() || defaultLandingContent
    const existing = currentCache[sectionKey] || defaultLandingContent[sectionKey]
    const merged = { ...existing, ...content }

    // Update local cache immediately so frontend gets instant dynamic persistence
    currentCache[sectionKey] = merged
    setLocalCache(currentCache)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('Soulaide_landing_content') as any)
      .upsert(
        {
          section_key: sectionKey,
          title,
          content: merged as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'section_key' }
      )

    if (error) {
      console.warn(`[Supabase Upsert Warning] Database upsert had issue: ${error.message}, falling back to persistent cache.`)
    }

    return merged
  },
}
