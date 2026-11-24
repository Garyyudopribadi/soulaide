import React from 'react'
import { ArrowUpRight, Clock, Mail, MapPin, MessageSquare, ShieldCheck } from 'lucide-react'
import { useSiteSettings } from './useSiteSettings.ts'
import { useLandingContent } from './useLandingContent.ts'
import { formatWhatsAppNumber, cleanWhatsAppNumber } from '@/lib/utils.ts'

export const ContactSection: React.FC = () => {
  const { data: settings } = useSiteSettings()
  const { data: landingContent } = useLandingContent()
  const contactMaps = landingContent.contact_maps

  const phoneNumber = contactMaps.phone || settings.whatsappNumber
  const cleanNumber = cleanWhatsAppNumber(phoneNumber)
  const displayPhone = formatWhatsAppNumber(phoneNumber)
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(settings.defaultMessage)}`

  return (
    <section id="kontak" className="border-t border-line bg-paper-deep/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-plum-500" aria-hidden="true" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-plum-600">
                Kontak &amp; lokasi
              </span>
            </div>
            <h2 className="mt-5 font-serif text-3xl sm:text-4xl leading-[1.08] text-ink">
              Bicara dengan tim Soulaide.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Care coordinator kami membantu memilih layanan, mengonfirmasi jadwal, dan menjawab
              pertanyaan teknis seputar sesi daring maupun tatap muka.
            </p>
          </div>
          <div className="text-xs text-ink-muted md:text-right">
            <p>Senin–Sabtu, 09.00–20.00 WIB</p>
            <p>Rata-rata dibalas di bawah 30 menit</p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Primary channel */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-plum-900 p-7 sm:p-9 text-[#EFE7EF] rounded-xl">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-plum-200">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                WhatsApp resmi klien
              </div>
              <p className="mt-5 font-serif text-3xl sm:text-4xl tabular-nums text-[#FBF7F0]">
                {displayPhone}
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[#D6C9D8]">
                Panduan reservasi, perubahan jadwal, dan konfirmasi pembayaran. Percakapan dibuka
                dengan pesan awal yang bisa Anda ubah sendiri.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-white/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs text-[#C9B9CC]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Kerahasiaan klien dijaga sejak percakapan pertama
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#FBF7F0] px-5 py-2.5 text-sm font-semibold text-plum-900 transition-colors hover:bg-white rounded-lg"
              >
                Mulai chat
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Secondary details */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-5">
            <div className="border border-line bg-paper-card p-7 rounded-xl">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-plum-600">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Klinik tatap muka
              </div>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-ink">
                {settings.offlineAddress}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                Kecamatan Duren Sawit, Jakarta Timur 13430. Ruang konsultasi kedap suara, hanya
                untuk klien dengan janji temu terkonfirmasi.
              </p>
              <a
                href="https://maps.google.com/?q=Pondok+Bambu+Duren+Sawit+Jakarta+Timur"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-plum-800 underline decoration-plum-300 underline-offset-4 hover:text-plum-900"
              >
                Buka petunjuk arah
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>

            <div className="border border-line bg-paper-card p-7 rounded-xl">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-plum-600">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Jam &amp; surel
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-muted">Praktik</dt>
                  <dd className="text-right font-medium text-ink">Sesuai janji temu</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-[#EDE6D9] pt-3">
                  <dt className="flex items-center gap-1.5 text-ink-muted">
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    Surel
                  </dt>
                  <dd className="font-medium text-ink">halo@soulaide.id</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Peta Lokasi Klinik Tatap Muka */}
        <div className="mt-8 rounded-xl border border-line bg-paper-card overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-line bg-sanctuary-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-plum-700" />
              <div>
                <h3 className="text-xs font-bold text-ink">{contactMaps.clinic_name}</h3>
                <p className="text-[11px] text-ink-muted">{contactMaps.address}</p>
              </div>
            </div>
            <a
              href="https://maps.google.com/?q=Pondok+Bambu+Duren+Sawit+Jakarta+Timur"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-plum-800 hover:text-plum-950 underline underline-offset-4"
            >
              <span>Buka di Google Maps</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="w-full h-72 sm:h-80 relative bg-sanctuary-100">
            <iframe
              title={contactMaps.clinic_name}
              src={contactMaps.maps_embed_url}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
