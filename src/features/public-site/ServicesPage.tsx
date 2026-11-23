import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Video, MapPin, Clock, FileText } from 'lucide-react'
import { useServices } from '@/features/services/useServices.ts'
import { useSiteSettings } from './useSiteSettings.ts'
import { SectionHead, PriceRows, Modal } from './components.tsx'
import { waHref } from './whatsapp.ts'

const BROCHURES = [
  { label: 'Katalog layanan', src: '/Layanan Kesehatan Mental.jpg' },
  { label: 'Konseling individu', src: '/layanan/Konseling Individu.jpg' },
  { label: 'MHCU dan bundling', src: '/layanan/Konseling Mental Health Check Up.png' },
  { label: 'Online dan offline', src: '/layanan/Online Offline.jpg' },
]

export const ServicesPage: React.FC = () => {
  const { data: services } = useServices()
  const { data: settings } = useSiteSettings()
  const [activeBrochure, setActiveBrochure] = useState<string | null>(null)

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <SectionHead
            as="h1"
            kicker="Layanan"
            title="Tiga layanan, satu tujuan: kamu paham kondisimu."
            lead="Semua tarif di halaman ini adalah tarif terkonfirmasi. Yang belum terkonfirmasi kami arahkan ke admin, bukan kami karang."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {services.map((svc) => (
            <article key={svc.id} className="panel flex flex-col p-6">
              <h2 className="text-lg font-bold leading-snug text-ink">{svc.title}</h2>
              <p className="mt-1 text-xs font-semibold text-plum-700">{svc.duration}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{svc.description}</p>
              <div className="mt-5">
                <PriceRows service={svc} />
              </div>
              <Link to={`/booking?service=${svc.id}`} className="btn-primary mt-5 w-full">
                Pilih layanan ini
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="panel p-6">
            <h3 className="text-base font-bold text-ink">Soul Guidance dan Soul Expert</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              <strong className="text-ink">Soul Guidance</strong> adalah psikolog dengan
              tarif terkonfirmasi di atas. <strong className="text-ink">Soul Expert</strong>{' '}
              adalah psikolog senior (lebih dari 10 tahun pengalaman); tarifnya
              dikonfirmasi saat booking.
            </p>
            <a
              href={waHref(settings.whatsappNumber, 'Halo Soulaide, saya ingin bertanya tarif Soul Expert.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline btn-sm mt-4"
            >
              Tanya tarif Soul Expert
            </a>
          </div>
          <div className="panel p-6">
            <h3 className="text-base font-bold text-ink">Metode sesi</h3>
            <ul className="mt-3 space-y-3 text-sm text-ink-soft">
              <li className="flex gap-2.5">
                <Video className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" />
                Online via video call, dari ruang privatmu sendiri.
              </li>
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" />
                Tatap muka di Pondok Bambu, Duren Sawit, Jakarta Timur.
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" />
                Lead time minimal {settings.minimumLeadTimeHours} jam sebelum sesi.
              </li>
              <li className="flex gap-2.5">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" />
                Laporan MHCU dapat memerlukan waktu hingga 2 minggu setelah seluruh sesi selesai.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Brosur resmi */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHead
            kicker="Brosur resmi"
            title="Lihat katalog layanan kami."
            lead="Brosur yang sama dengan yang kami bagikan di kanal resmi Soulaide."
          />
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {BROCHURES.map((b) => (
              <button
                key={b.src}
                type="button"
                onClick={() => setActiveBrochure(b.src)}
                className="panel group overflow-hidden text-left"
                aria-label={`Perbesar brosur ${b.label}`}
              >
                <span className="block aspect-[3/4] overflow-hidden bg-paper">
                  <img
                    src={b.src}
                    alt={`Brosur ${b.label}`}
                    width={600}
                    height={800}
                    loading="lazy"
                    className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </span>
                <span className="block px-3 py-2 text-xs font-semibold text-ink group-hover:text-plum-800">
                  {b.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <Modal
        open={activeBrochure !== null}
        onClose={() => setActiveBrochure(null)}
        label="Brosur layanan Soulaide"
      >
        {activeBrochure && (
          <div className="p-3">
            <img
              src={activeBrochure}
              alt="Brosur resmi layanan Soulaide"
              className="w-full rounded-lg object-contain"
            />
          </div>
        )}
      </Modal>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-plum-50 px-6 py-10 text-center sm:px-12">
          <h2 className="display text-2xl sm:text-3xl">Belum yakin mulai dari mana?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Ceritakan kondisimu ke admin, kami bantu pilihkan layanan yang pas.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={waHref(settings.whatsappNumber, settings.defaultMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Chat WhatsApp
            </a>
            <Link to="/psychologists" className="btn-outline">
              Kenali psikolog dulu
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
