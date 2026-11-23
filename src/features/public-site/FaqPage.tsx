import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronDown } from 'lucide-react'
import { useFaqs } from './useFaqs.ts'
import { useSiteSettings } from './useSiteSettings.ts'
import { SectionHead } from './components.tsx'
import { waHref } from './whatsapp.ts'

const CATEGORIES = ['all', 'booking', 'privasi', 'reschedule', 'layanan'] as const

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Semua',
  booking: 'Reservasi dan biaya',
  privasi: 'Kerahasiaan dan data',
  reschedule: 'Jadwal dan reschedule',
  layanan: 'Metode dan fasilitas',
}

export const FaqPage: React.FC = () => {
  const { data: faqs } = useFaqs()
  const { data: settings } = useSiteSettings()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [openFaqId, setOpenFaqId] = useState<string | null>(null)

  const filtered = faqs.filter((f) => {
    const q = searchQuery.trim().toLowerCase()
    const matchQuery =
      q === '' || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    const matchCategory = selectedCategory === 'all' || f.category === selectedCategory
    return matchQuery && matchCategory
  })

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <SectionHead
            as="h1"
            kicker="FAQ"
            title="Pertanyaan yang sering diajukan."
            lead="Kalau jawabanmu belum ada di sini, admin kami senang membantu via WhatsApp."
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pertanyaan..."
            aria-label="Cari pertanyaan"
            className="field pl-10"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              aria-pressed={selectedCategory === c}
              className={`chip ${selectedCategory === c ? 'chip-active' : ''}`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <div className="mt-8 divide-y divide-line border-y border-line">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-ink-soft">
              Tidak ada pertanyaan yang cocok. Coba kata kunci lain.
            </p>
          )}
          {filtered.map((f) => {
            const open = openFaqId === f.id
            return (
              <div key={f.id}>
                <button
                  type="button"
                  onClick={() => setOpenFaqId(open ? null : f.id)}
                  aria-expanded={open}
                  aria-controls={`faq-panel-${f.id}`}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-ink hover:text-plum-800"
                >
                  {f.question}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-plum-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                <div id={`faq-panel-${f.id}`} className="acc-panel" data-open={open}>
                  <div>
                    <p className="pb-5 text-sm leading-relaxed text-ink-soft">{f.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 rounded-xl bg-plum-50 px-6 py-8 text-center">
          <h2 className="display text-xl sm:text-2xl">Masih ada yang mengganjal?</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            Tanya langsung ke admin. Tidak ada pertanyaan yang dianggap sepele.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href={waHref(settings.whatsappNumber, settings.defaultMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Chat WhatsApp
            </a>
            <Link to="/contact" className="btn-outline">
              Halaman kontak
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
