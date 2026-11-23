import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useSiteSettings } from './useSiteSettings.ts'
import { formatIDR } from '@/lib/utils.ts'
import type { ServiceDetail } from '@/types/index.ts'
import type { PsychologistWithPresence } from '@/features/psychologists/usePsychologists.ts'
import { waHref } from './whatsapp.ts'

export const SectionHead: React.FC<{
  kicker: string
  title: string
  lead?: string
  as?: 'h1' | 'h2'
}> = ({ kicker, title, lead, as: Tag = 'h2' }) => (
  <div className="max-w-2xl space-y-3">
    <p className="kicker">{kicker}</p>
    <Tag className="display text-3xl sm:text-4xl leading-tight">{title}</Tag>
    {lead && <p className="text-sm sm:text-base text-ink-soft leading-relaxed">{lead}</p>}
  </div>
)

export const Modal: React.FC<{
  open: boolean
  onClose: () => void
  label: string
  children: React.ReactNode
}> = ({ open, onClose, label, children }) => {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    boxRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      onClick={onClose}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="panel relative max-h-[85vh] w-full max-w-2xl overflow-y-auto outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-soft transition-colors duration-150 hover:bg-plum-50 hover:text-plum-800"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

/**
 * Harga jujur: hanya menampilkan tarif terkonfirmasi dari data.
 * Nilai null (belum dikonfirmasi) tidak pernah ditampilkan sebagai angka.
 */
export const PriceRows: React.FC<{ service: ServiceDetail }> = ({ service }) => {
  const { data: settings } = useSiteSettings()
  const onlineOnly =
    service.deliveryMethods?.length === 1 && service.deliveryMethods[0] === 'online'

  return (
    <dl className="divide-y divide-line rounded-[10px] border border-line bg-paper text-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <dt className="text-ink-soft">Online (video call)</dt>
        <dd className="font-semibold text-ink tabular-nums">
          {service.priceOnline != null ? formatIDR(service.priceOnline) : 'Hubungi kami'}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <dt className="text-ink-soft">Tatap muka (Pondok Bambu)</dt>
        <dd className="font-semibold text-ink tabular-nums">
          {onlineOnly ? (
            <span className="font-medium text-ink-soft">Khusus online</span>
          ) : service.priceOffline != null ? (
            formatIDR(service.priceOffline)
          ) : (
            <a
              href={waHref(
                settings.whatsappNumber,
                `Halo Soulaide, saya ingin bertanya tarif tatap muka untuk ${service.title}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-plum-700 underline underline-offset-4 hover:text-plum-900"
            >
              Hubungi kami
            </a>
          )}
        </dd>
      </div>
    </dl>
  )
}

export const PsychCard: React.FC<{ psych: PsychologistWithPresence }> = ({ psych }) => (
  <article className="panel flex flex-col overflow-hidden">
    <Link
      to={`/psychologists/${psych.id}`}
      className="block aspect-[3/4] overflow-hidden bg-plum-50"
      aria-label={`Lihat profil ${psych.fullName}`}
    >
      <img
        src={psych.profileImage || psych.cardImage}
        alt={`Potret ${psych.fullName}`}
        width={600}
        height={800}
        loading="lazy"
        className="h-full w-full object-cover object-top"
      />
    </Link>
    <div className="flex flex-1 flex-col gap-2 p-4">
      <div>
        <h3 className="text-base font-bold text-ink">{psych.fullName}</h3>
        <p className="text-xs text-ink-soft">{psych.credentials}</p>
      </div>
      <p className="text-xs font-semibold text-plum-700">
        {psych.tier ?? 'Soul Guidance'}
        <span className="font-normal text-ink-soft"> · {psych.experienceYears}</span>
      </p>
      <p className="text-xs text-ink-soft leading-relaxed">
        {psych.practiceAreas.slice(0, 3).join(', ')}
      </p>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
        <Link to={`/psychologists/${psych.id}`} className="btn-outline btn-sm">
          Profil
        </Link>
        <Link to={`/booking?psychologist=${psych.id}`} className="btn-primary btn-sm">
          Booking
        </Link>
      </div>
    </div>
  </article>
)

export const CrisisBand: React.FC = () => (
  <section className="bg-plum-900 text-white">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div className="max-w-xl space-y-1.5">
        <h2 className="display text-xl text-white sm:text-2xl">
          Butuh bantuan segera?
        </h2>
        <p className="text-sm leading-relaxed text-plum-100">
          Soulaide bukan layanan darurat. Jika kamu atau orang terdekat dalam bahaya,
          hubungi Hotline Kesehatan Jiwa sekarang.
        </p>
      </div>
      <a href="tel:119" className="btn-inverse btn-lg shrink-0">
        Hubungi 119 ext 8
      </a>
    </div>
  </section>
)
