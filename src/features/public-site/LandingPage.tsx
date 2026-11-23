import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { usePsychologists } from '@/features/psychologists/usePsychologists.ts'
import { useServices } from '@/features/services/useServices.ts'
import { useFaqs } from './useFaqs.ts'
import { useSiteSettings } from './useSiteSettings.ts'
import { SectionHead, PriceRows, PsychCard, CrisisBand } from './components.tsx'
import { waHref } from './whatsapp.ts'

const STEPS = [
  {
    n: '01',
    title: 'Pilih layanan dan psikolog',
    text: 'Tentukan kebutuhanmu: konseling individu, MHCU, atau bundling. Lalu pilih psikolog yang paling selaras dengan topikmu.',
  },
  {
    n: '02',
    title: 'Atur jadwal dan metode',
    text: 'Pilih sesi online atau tatap muka di Pondok Bambu. Pemesanan membutuhkan lead time minimal 24 jam sebelum sesi.',
  },
  {
    n: '03',
    title: 'Konfirmasi, lalu mulai bercerita',
    text: 'Selesaikan konfirmasi dan pembayaran, terima tautan ruang sesi, dan jalani sesi privat bersama psikologmu.',
  },
]

const TOPICS = [
  {
    title: 'Emosi dan pemahaman diri',
    items: [
      'Overthinking dan kecemasan',
      'Stres berkepanjangan dan burnout',
      'Regulasi emosi dan perubahan mood',
      'Self-esteem dan kepercayaan diri',
    ],
  },
  {
    title: 'Kehidupan dan pengembangan diri',
    items: [
      'Quarter-life crisis dan arah hidup',
      'Tekanan pekerjaan dan akademik',
      'Membangun kebiasaan yang lebih sehat',
      'Adaptasi lingkungan baru',
    ],
  },
  {
    title: 'Relasi, keluarga, dan parenting',
    items: [
      'Dinamika pasangan dan keluarga',
      'Memulihkan relasi yang tidak sehat',
      'Boundaries dan komunikasi',
      'Parenting dan kebutuhan khusus',
    ],
  },
]

export const LandingPage: React.FC = () => {
  const { data: psychologists } = usePsychologists()
  const { data: services } = useServices()
  const { data: faqs } = useFaqs()
  const { data: settings } = useSiteSettings()

  return (
    <div>
      {/* Hero: statement + real portraits */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-20">
          <div className="space-y-6 lg:col-span-7">
            <p className="kicker">Konseling psikologi · Online dan Jakarta Timur</p>
            <h1 className="display text-4xl leading-[1.12] sm:text-5xl lg:text-[3.4rem]">
              Cerita kamu, didengar dengan sungguh-sungguh.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-ink-soft">
              Soulaide mendampingi perjalanan kesehatan mentalmu bersama psikolog
              berlisensi SIPP. Pilih sesi online dari ruangmu sendiri, atau tatap muka
              di Pondok Bambu, Jakarta Timur. Rahasia, tanpa penghakiman.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/booking" className="btn-primary btn-lg">
                Booking sesi
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/services" className="btn-outline btn-lg">
                Lihat layanan
              </Link>
            </div>
            <p className="text-xs font-medium text-ink-soft">
              4 psikolog berlisensi · Lead time 24 jam · Kerahasiaan terjaga
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-3">
              {psychologists.slice(0, 4).map((p, i) => (
                <Link
                  key={p.id}
                  to={`/psychologists/${p.id}`}
                  className="panel group overflow-hidden"
                  aria-label={`Lihat profil ${p.fullName}`}
                >
                  <span className="block aspect-[3/4] overflow-hidden bg-plum-50">
                    <img
                      src={p.profileImage || p.cardImage}
                      alt={`Potret ${p.fullName}`}
                      width={600}
                      height={800}
                      fetchPriority={i === 0 ? 'high' : undefined}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </span>
                  <span className="block px-3 py-2 text-xs font-semibold text-ink group-hover:text-plum-800">
                    {p.fullName}
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-ink-soft">
              Psikolog Soulaide. Klik untuk mengenal mereka.
            </p>
          </div>
        </div>
      </section>

      {/* Cara mulai */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHead
          kicker="Cara mulai"
          title="Tiga langkah, tanpa ribet."
          lead="Proses reservasi yang sederhana dan transparan, sejak langkah pertama."
        />
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t-2 border-plum-700 pt-5">
              <span className="font-serif text-3xl font-semibold text-plum-300">{s.n}</span>
              <h3 className="mt-3 text-base font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Layanan */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHead
              kicker="Layanan dan tarif"
              title="Pilih pendampingan yang kamu butuhkan."
              lead="Tarif di bawah adalah tarif terkonfirmasi untuk Soul Guidance. Transparan, tanpa biaya tersembunyi."
            />
            <Link to="/services" className="btn-ghost shrink-0">
              Detail layanan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {services.map((svc) => (
              <article key={svc.id} className="panel flex flex-col p-6">
                <h3 className="text-lg font-bold leading-snug text-ink">{svc.title}</h3>
                <p className="mt-1 text-xs font-semibold text-plum-700">{svc.duration}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{svc.description}</p>
                <div className="mt-5">
                  <PriceRows service={svc} />
                </div>
                <Link to={`/booking?service=${svc.id}`} className="btn-primary mt-5 w-full">
                  Pilih layanan ini
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-6 rounded-xl border border-line bg-paper px-5 py-4 text-sm leading-relaxed text-ink-soft">
            Ingin didampingi <strong className="text-ink">Soul Expert</strong> (psikolog
            senior)? Tarif Soul Expert dikonfirmasi saat booking.{' '}
            <a
              href={waHref(settings.whatsappNumber, 'Halo Soulaide, saya ingin bertanya tarif Soul Expert.')}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-plum-700 underline underline-offset-4 hover:text-plum-900"
            >
              Tanya admin via WhatsApp
            </a>
            .
          </p>
        </div>
      </section>

      {/* Psikolog */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead
            kicker="Tim psikolog"
            title="Kenali pendampingmu."
            lead="Semua psikolog Soulaide berlisensi SIPP dan menjunjung Kode Etik HIMPSI."
          />
          <Link to="/psychologists" className="btn-ghost shrink-0">
            Semua profil
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {psychologists.slice(0, 4).map((p) => (
            <PsychCard key={p.id} psych={p} />
          ))}
        </div>
      </section>

      {/* Topik */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHead
            kicker="Topik konseling"
            title="Apa yang bisa kamu ceritakan?"
            lead="Tidak ada topik yang terlalu kecil. Konseling tidak perlu menunggu sampai semuanya terasa berat."
          />
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
            {TOPICS.map((t) => (
              <div key={t.title}>
                <h3 className="border-b border-line pb-3 text-sm font-bold text-ink">
                  {t.title}
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
                  {t.items.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-plum-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-ink-soft">
            Topikmu tidak ada di daftar? Kamu tetap bisa bercerita.{' '}
            <Link to="/booking" className="font-semibold text-plum-700 underline underline-offset-4 hover:text-plum-900">
              Mulai booking
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Tentang */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <figure className="lg:col-span-5">
            <img
              src="/apa itru Soulaide.jpg"
              alt="Makna nama dan logo Soulaide: Soul, Aide, dan simbol Psi"
              width={1080}
              height={1350}
              loading="lazy"
              className="w-full rounded-xl border border-line object-cover"
            />
          </figure>
          <div className="space-y-5 lg:col-span-7">
            <p className="kicker">Tentang Soulaide</p>
            <h2 className="display text-3xl leading-tight sm:text-4xl">
              Counseling Psychology, made for you.
            </h2>
            <p className="text-sm leading-relaxed text-ink-soft sm:text-base">
              Nama Soulaide lahir dari <strong className="text-ink">Soul</strong> (jiwa),{' '}
              <strong className="text-ink">Aide</strong> (pendamping yang menolong), dan
              lengkungan simbol <strong className="text-ink">Psi (Ψ)</strong> yang merangkul.
              Ilmu psikologi yang hadir hangat, setara, dan tanpa penghakiman.
            </p>
            <p className="text-sm leading-relaxed text-ink-soft sm:text-base">
              Setiap sesi dijalankan dengan pendekatan berbasis bukti (CBT, SFBT,
              humanistik, ABA) sesuai kebutuhanmu, dalam kerahasiaan yang dijaga ketat
              oleh Kode Etik HIMPSI.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHead
            kicker="Pertanyaan umum"
            title="Masih ragu? Wajar."
            lead="Beberapa hal yang paling sering ditanyakan sebelum sesi pertama."
          />
          <div className="mt-8 divide-y divide-line border-y border-line">
            {faqs.slice(0, 3).map((f) => (
              <details key={f.id} className="group py-4">
                <summary className="flex list-none items-center justify-between gap-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <span className="text-plum-600 transition-transform duration-150 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.answer}</p>
              </details>
            ))}
          </div>
          <Link to="/faq" className="btn-ghost mt-6">
            Semua pertanyaan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-plum-50 px-6 py-12 text-center sm:px-12">
          <h2 className="display mx-auto max-w-xl text-3xl leading-tight sm:text-4xl">
            Mulai dari satu cerita.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
            Kamu tidak harus menghadapi semuanya sendirian. Ambil langkah kecil hari ini.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/booking" className="btn-primary btn-lg">
              Booking sesi
            </Link>
            <a
              href={waHref(settings.whatsappNumber, settings.defaultMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline btn-lg"
            >
              Tanya admin via WhatsApp
            </a>
          </div>
        </div>
      </section>

      <CrisisBand />
    </div>
  )
}
