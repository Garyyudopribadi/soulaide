import React from 'react'
import { Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react'
import { useSiteSettings } from './useSiteSettings.ts'
import { SectionHead } from './components.tsx'
import { waHref } from './whatsapp.ts'

export const ContactPage: React.FC = () => {
  const { data: settings } = useSiteSettings()
  const whatsappUrl = waHref(settings.whatsappNumber, settings.defaultMessage)

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <SectionHead
            as="h1"
            kicker="Kontak"
            title="Sapa kami dulu, tidak apa-apa."
            lead="Belum siap booking? Tanya apa pun ke admin kami. Kami balas pada jam kerja."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="panel group flex flex-col p-6 transition-colors duration-150 hover:border-plum-400"
          >
            <MessageSquare className="h-5 w-5 text-plum-600" />
            <h2 className="mt-3 text-base font-bold text-ink group-hover:text-plum-800">
              WhatsApp admin
            </h2>
            <p className="mt-1 text-sm text-ink-soft">+62 896-3086-9804</p>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              Cara tercepat untuk bertanya tarif, jadwal, atau layanan yang pas untukmu.
            </p>
            <span className="btn-primary btn-sm mt-4 self-start">Buka WhatsApp</span>
          </a>

          <a
            href="mailto:halo@soulaide.id"
            className="panel group flex flex-col p-6 transition-colors duration-150 hover:border-plum-400"
          >
            <Mail className="h-5 w-5 text-plum-600" />
            <h2 className="mt-3 text-base font-bold text-ink group-hover:text-plum-800">Email</h2>
            <p className="mt-1 text-sm text-ink-soft">halo@soulaide.id</p>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              Untuk pertanyaan tertulis, kerja sama, atau hal yang lebih panjang.
            </p>
          </a>

          <div className="panel flex flex-col p-6">
            <MapPin className="h-5 w-5 text-plum-600" />
            <h2 className="mt-3 text-base font-bold text-ink">Lokasi tatap muka</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{settings.offlineAddress}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
              <Clock className="h-3.5 w-3.5 text-plum-600" />
              Senin–Sabtu, sesuai perjanjian
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="panel p-6">
            <h2 className="text-sm font-bold text-ink">Sebelum sesi pertama</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
              <li>Pemesanan membutuhkan lead time minimal {settings.minimumLeadTimeHours} jam.</li>
              <li>Sesi online berlangsung via video call dari ruang privatmu.</li>
              <li>Reschedule mengikuti kebijakan yang dijelaskan admin saat konfirmasi.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-champagne-200 bg-champagne-50 p-6">
            <h2 className="text-sm font-bold text-champagne-700">
              Soulaide bukan layanan darurat
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Jika kamu atau orang terdekat berada dalam bahaya, segera hubungi Hotline
              Kesehatan Jiwa <strong className="text-ink">119 ext 8</strong> (bebas pulsa).
            </p>
            <a href="tel:119" className="btn-outline btn-sm mt-4">
              <Phone className="h-3.5 w-3.5" />
              Hubungi 119
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
