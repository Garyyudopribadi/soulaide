import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogOut, LayoutDashboard, Menu, X, Phone } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth.ts'

export const Header: React.FC = () => {
  const location = useLocation()
  const { user, profile, role, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Beranda', to: '/' },
    { label: 'Layanan', to: '/services' },
    { label: 'Psikolog', to: '/psychologists' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Kontak', to: '/contact' },
  ]

  const getDashboardPath = () => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return '/admin'
      case 'psychologist':
        return '/psychologist'
      default:
        return '/dashboard'
    }
  }

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Crisis line always visible, calm and static */}
      <div className="hidden bg-plum-950 text-plum-100 sm:block">
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-between px-4 text-[11px] sm:px-6 lg:px-8">
          <span>Senin–Sabtu, sesuai perjanjian</span>
          <a
            href="tel:119"
            className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-plum-200"
          >
            <Phone className="h-3 w-3" />
            Hotline krisis: 119 ext 8
          </a>
        </div>
      </div>

      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5"
            aria-label="Beranda Soulaide"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img
              src="/Soulaide Psi Arc Logo.png"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 object-contain"
            />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-lg font-semibold text-plum-900">Soulaide</span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                Counseling Psychology
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Navigasi utama">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                aria-current={isActive(link.to) ? 'page' : undefined}
                className={`border-b-2 pb-0.5 text-sm transition-colors duration-150 ${
                  isActive(link.to)
                    ? 'border-plum-700 font-semibold text-plum-800'
                    : 'border-transparent font-medium text-ink-soft hover:text-plum-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link to={getDashboardPath()} className="btn-outline btn-sm">
                  <LayoutDashboard className="h-3.5 w-3.5 text-plum-700" />
                  <span className="max-w-[140px] truncate">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="btn-ghost btn-sm"
                  title="Keluar dari akun"
                  aria-label="Keluar dari akun"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost btn-sm">
                  Masuk
                </Link>
                <Link to="/booking" className="btn-primary btn-sm">
                  Booking sesi
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Link to="/booking" className="btn-primary btn-sm">
              Booking
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-line-strong bg-white text-ink"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-b border-line bg-paper px-4 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col" aria-label="Navigasi mobile">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive(link.to) ? 'page' : undefined}
                className={`border-b border-line py-3 text-sm font-semibold ${
                  isActive(link.to) ? 'text-plum-800' : 'text-ink-soft'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-4">
            {user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-outline btn-sm"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                  }}
                  className="btn-outline btn-sm"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-outline btn-sm"
                >
                  Masuk
                </Link>
                <Link
                  to="/booking"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary btn-sm"
                >
                  Booking sesi
                </Link>
              </div>
            )}
          </div>

          <a
            href="tel:119"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-plum-800"
          >
            <Phone className="h-3 w-3" />
            Hotline krisis: 119 ext 8
          </a>
        </div>
      )}
    </header>
  )
}
