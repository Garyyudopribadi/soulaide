import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Mail, Phone } from 'lucide-react'

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="1.9"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const ThreadsIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12.186 24C5.467 24 0 18.533 0 11.814 0 5.095 5.467 0 12.186 0c6.719 0 12.186 5.467 12.186 11.814 0 .686-.065 1.365-.19 2.029-.208 1.107-1.196 1.838-2.308 1.63-1.109-.208-1.84-1.197-1.632-2.308a9.47 9.47 0 0 0 .13-1.351c0-5.195-4.225-9.42-9.42-9.42-5.195 0-9.42 4.225-9.42 9.42s4.225 9.42 9.42 9.42c2.81 0 5.434-1.258 7.185-3.418.734-.906 2.06-.98 2.873-.166.814.814.773 2.115-.166 2.873C18.665 22.42 15.534 24 12.186 24z" />
    <path d="M12.186 17.558c-3.172 0-5.744-2.572-5.744-5.744s2.572-5.744 5.744-5.744 5.744 2.572 5.744 5.744c0 .604-.49 1.094-1.094 1.094s-1.094-.49-1.094-1.094c0-1.965-1.591-3.556-3.556-3.556s-3.556 1.591-3.556 3.556 1.591 3.556 3.556 3.556c1.173 0 2.219-.57 2.868-1.455.518-.707 1.488-.868 2.203-.357.715.51.876 1.484.364 2.202-1.206 1.666-3.14 2.723-5.32 2.723z" />
  </svg>
)

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const socials = [
  { href: 'https://instagram.com/soulaide', label: 'Instagram Soulaide', Icon: InstagramIcon },
  { href: 'https://threads.net/@soulaide', label: 'Threads Soulaide', Icon: ThreadsIcon },
  { href: 'https://facebook.com/soulaide', label: 'Facebook Soulaide', Icon: FacebookIcon },
]

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-plum-950 text-plum-100">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="leading-relaxed">
            <strong className="text-white">Layanan krisis darurat:</strong> jika kamu atau orang
            terdekat dalam bahaya, segera hubungi Hotline Kesehatan Jiwa{' '}
            <strong className="text-white">119 ext 8</strong>.
          </p>
          <a
            href="tel:119"
            className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-white underline underline-offset-4 hover:text-plum-200"
          >
            <Phone className="h-3.5 w-3.5" />
            Hubungi 119
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Beranda Soulaide">
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-white p-1.5">
                <img
                  src="/Soulaide Psi Arc Logo.png"
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-serif text-lg font-semibold text-white">Soulaide</span>
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-plum-300">
                  Counseling Psychology
                </span>
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-plum-200">
              Ruang bercerita yang aman dan hangat, didampingi psikolog berlisensi.
              Sesi online dan tatap muka di Pondok Bambu, Jakarta Timur, berlandaskan
              Kode Etik HIMPSI.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-plum-200 transition-colors duration-150 hover:border-plum-400 hover:text-white"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-plum-300">
              Layanan
            </h4>
            <ul className="space-y-2 text-sm text-plum-200">
              <li><Link to="/services" className="hover:text-white">Konseling individu</Link></li>
              <li><Link to="/services" className="hover:text-white">MHCU (check up)</Link></li>
              <li><Link to="/services" className="hover:text-white">Bundling MHCU + konseling</Link></li>
              <li><Link to="/booking" className="hover:text-white">Booking sesi</Link></li>
            </ul>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-plum-300">
              Navigasi
            </h4>
            <ul className="space-y-2 text-sm text-plum-200">
              <li><Link to="/psychologists" className="hover:text-white">Profil psikolog</Link></li>
              <li><Link to="/faq" className="hover:text-white">Pertanyaan umum</Link></li>
              <li><Link to="/contact" className="hover:text-white">Kontak dan lokasi</Link></li>
              <li><Link to="/login" className="hover:text-white">Masuk akun</Link></li>
            </ul>
          </div>

          <div className="space-y-3 lg:col-span-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-plum-300">
              Kontak
            </h4>
            <ul className="space-y-2.5 text-xs leading-relaxed text-plum-200">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-plum-300" />
                Pondok Bambu, Duren Sawit, Jakarta Timur 13430
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-plum-300" />
                Senin–Sabtu, sesuai perjanjian
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-plum-300" />
                <a href="mailto:halo@soulaide.id" className="hover:text-white">halo@soulaide.id</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-plum-300" />
                <a href="tel:+6289630869804" className="hover:text-white">+62 896-3086-9804</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-plum-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Soulaide Psychology.</p>
          <p>Psikolog berlisensi SIPP · Kode Etik HIMPSI</p>
        </div>
      </div>
    </footer>
  )
}
