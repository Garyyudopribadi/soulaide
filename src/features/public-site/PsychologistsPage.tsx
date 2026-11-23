import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { usePsychologists } from '@/features/psychologists/usePsychologists.ts'
import type { ProfessionalTier, PsychologistProfile } from '@/types/index.ts'
import { SectionHead, PsychCard, Modal } from './components.tsx'

export const PsychologistsPage: React.FC = () => {
  const { data: psychologists } = usePsychologists()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTier, setSelectedTier] = useState<'all' | ProfessionalTier>('all')
  const [selectedArea, setSelectedArea] = useState<string>('all')
  const [previewPsych, setPreviewPsych] = useState<PsychologistProfile | null>(null)

  const allAreas = Array.from(new Set(psychologists.flatMap((p) => p.practiceAreas))).sort()

  const filtered = psychologists.filter((p) => {
    const q = searchQuery.trim().toLowerCase()
    const matchQuery =
      q === '' ||
      p.fullName.toLowerCase().includes(q) ||
      p.practiceAreas.some((a) => a.toLowerCase().includes(q)) ||
      p.approaches.some((a) => a.toLowerCase().includes(q))
    const matchTier = selectedTier === 'all' || p.tier === selectedTier
    const matchArea = selectedArea === 'all' || p.practiceAreas.includes(selectedArea)
    return matchQuery && matchTier && matchArea
  })

  const hasFilter = searchQuery !== '' || selectedTier !== 'all' || selectedArea !== 'all'

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <SectionHead
            as="h1"
            kicker="Psikolog"
            title="Temukan pendamping yang selaras denganmu."
            lead="Semua psikolog di sini berlisensi SIPP. Baca profilnya, lihat kartu resminya, lalu pilih yang paling nyaman untukmu."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, topik, atau pendekatan..."
              aria-label="Cari psikolog"
              className="field pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'Soul Guidance', 'Soul Expert'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTier(t)}
                aria-pressed={selectedTier === t}
                className={`chip ${selectedTier === t ? 'chip-active' : ''}`}
              >
                {t === 'all' ? 'Semua tier' : t}
              </button>
            ))}
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              aria-label="Filter topik praktik"
              className="field w-auto py-1.5 text-xs font-semibold"
            >
              <option value="all">Semua topik</option>
              {allAreas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-6 text-xs font-medium text-ink-soft" role="status">
          Menampilkan {filtered.length} dari {psychologists.length} psikolog
        </p>

        {filtered.length === 0 ? (
          <div className="panel mt-6 px-6 py-14 text-center">
            <p className="text-base font-bold text-ink">Tidak ada yang cocok.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
              Coba kata kunci lain, atau hapus filter untuk melihat semua psikolog.
            </p>
            {hasFilter && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedTier('all')
                  setSelectedArea('all')
                }}
                className="btn-outline btn-sm mt-5"
              >
                <X className="h-3.5 w-3.5" />
                Hapus filter
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p) => (
              <div key={p.id} className="flex flex-col gap-2">
                <PsychCard psych={p} />
                <button
                  type="button"
                  onClick={() => setPreviewPsych(p)}
                  className="text-xs font-semibold text-plum-700 underline underline-offset-4 hover:text-plum-900"
                >
                  Lihat kartu resmi
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={previewPsych !== null}
        onClose={() => setPreviewPsych(null)}
        label={previewPsych ? `Kartu resmi ${previewPsych.fullName}` : 'Kartu resmi psikolog'}
      >
        {previewPsych && (
          <div className="p-3">
            <img
              src={previewPsych.cardImage}
              alt={`Kartu resmi ${previewPsych.fullName}`}
              className="w-full rounded-lg object-contain"
            />
            <div className="flex items-center justify-between gap-3 px-2 py-3">
              <p className="text-sm font-bold text-ink">{previewPsych.fullName}</p>
              <Link
                to={`/booking?psychologist=${previewPsych.id}`}
                className="btn-primary btn-sm"
                onClick={() => setPreviewPsych(null)}
              >
                Booking dengan psikolog ini
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
