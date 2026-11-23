import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LogOut,
  LayoutDashboard,
  Calendar,
  Menu,
  X,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Phone,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { useAuth } from '@/features/auth/useAuth.ts'

export const Header: React.FC = () => {
  const location = useLocation()
  const { user, profile, role, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Beranda', to: '/' },
    { label: 'Layanan', to: '/services', badge: '3' },
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

  const getRoleBadgeVariant = () => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'warning'
      case 'psychologist':
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Clinical Assurance Micro-Bar (Collapses smoothly on scroll) */}
      <div
        className={`hidden lg:block bg-plum-950 text-plum-100/90 border-b border-white/10 transition-all duration-300 overflow-hidden ${
          scrolled ? 'max-h-0 opacity-0 border-b-0' : 'max-h-10 opacity-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium text-plum-200">
              <ShieldCheck className="w-3.5 h-3.5 text-plum-300" />
              <span>Standar Kode Etik HIMPSI &amp; Psikolog Berlisensi SIPP</span>
            </span>
            <span className="text-white/20">|</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sesi Daring (Google Meet) &amp; Tatap Muka Pondok Bambu Aktif</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-plum-200/90">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-plum-300" />
              <span>Senin – Sabtu (By Appointment)</span>
            </span>
            <span className="text-white/20">|</span>
            <a
              href="tel:119"
              className="inline-flex items-center gap-1 text-champagne-200 hover:text-white font-semibold transition-colors"
            >
              <Phone className="w-3 h-3 text-champagne-500" />
              <span>Hotline Krisis: 119 ext 8</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Glass Navigation Bar */}
      <div
        className={`w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/92 backdrop-blur-xl border-b border-[#E5DDD4] shadow-[0_10px_30px_-14px_rgba(41,23,56,0.14)]'
            : 'bg-white/75 backdrop-blur-lg border-b border-[#EAE3DC]/80'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-19 flex items-center justify-between gap-4">
          {/* Brand Logo + Editorial Lockup */}
          <Link
            to="/"
            className="flex items-center gap-3 py-1 group focus:outline-hidden focus:ring-2 focus:ring-plum-600/40 rounded-2xl"
            aria-label="Beranda Soulaide"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="relative flex items-center justify-center p-1.5 rounded-2xl bg-gradient-to-br from-plum-50 via-white to-plum-100/60 border border-plum-200/70 shadow-2xs group-hover:border-plum-300 group-hover:shadow-sm transition-all">
              <img
                src="/Soulaide Psi Arc Logo.png"
                alt="Soulaide Psychology"
                className="h-9 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xl font-bold tracking-tight text-plum-900">
                  Soulaide
                </span>
                <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded-md bg-plum-50 border border-plum-200/60 text-[9px] font-bold text-plum-700 uppercase tracking-wider">
                  Psi
                </span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5D728F] mt-1">
                Counseling Psychology
              </span>
            </div>
          </Link>

          {/* Desktop Capsule Navigation */}
          <nav
            className="hidden md:flex items-center gap-1 p-1.5 rounded-full bg-[#FAF8F5]/90 border border-[#E5DDD5] shadow-[inset_0_1px_2px_rgba(41,23,56,0.04)]"
            aria-label="Navigasi Utama"
          >
            {navLinks.map((link) => {
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-4 py-1.5 rounded-full text-sm transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-plum-800 to-plum-700 text-white font-semibold shadow-[0_2px_10px_-2px_rgba(73,46,95,0.45)]'
                      : 'text-[#4B3F59] hover:text-plum-800 hover:bg-white/80 font-medium'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-tight ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-plum-100 text-plum-700'
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-2">
                <Link to={getDashboardPath()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 h-10 px-3.5 rounded-full border-[#E2DAD1] bg-white hover:border-plum-300"
                  >
                    <span className="w-6 h-6 rounded-full bg-plum-100 text-plum-700 flex items-center justify-center">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-semibold text-[#23192D] max-w-[140px] truncate">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </span>
                    <Badge variant={getRoleBadgeVariant()} className="text-[10px] py-0 px-2">
                      {role || 'klien'}
                    </Badge>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="h-10 w-10 p-0 rounded-full text-[#7A6F85] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Keluar dari akun"
                  aria-label="Keluar dari akun"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-4 rounded-full text-[#4B3F59] hover:text-plum-800 font-semibold"
                  >
                    Masuk
                  </Button>
                </Link>
                <Link to="/booking">
                  <Button
                    size="sm"
                    className="gap-2 h-10.5 px-5 rounded-full bg-gradient-to-r from-plum-800 via-plum-700 to-plum-600 hover:from-plum-900 hover:to-plum-700 text-white font-semibold shadow-[0_4px_14px_-3px_rgba(73,46,95,0.5)]"
                  >
                    <Calendar className="w-3.5 h-3.5 text-plum-200" />
                    <span>Booking Sesi</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Action + Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link to="/booking">
              <Button size="sm" className="rounded-full bg-plum-700 text-white text-xs px-3.5 h-9 gap-1">
                <Sparkles className="w-3 h-3 text-plum-200" />
                <span>Booking</span>
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#E6DFD7] text-[#2E223A] hover:text-plum-700 hover:border-plum-300 focus:outline-hidden focus:ring-2 focus:ring-plum-600/30 transition-colors cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#EAE3DC] bg-white/98 backdrop-blur-xl px-4 pt-4 pb-6 space-y-4 shadow-2xl">
          <nav className="flex flex-col space-y-1" aria-label="Navigasi Mobile">
            {navLinks.map((link) => {
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-plum-50 text-plum-800 border border-plum-200/70'
                      : 'text-[#4B3F59] hover:bg-sanctuary-100'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-plum-700" />}
                </Link>
              )
            })}
          </nav>

          <div className="pt-3 border-t border-[#F0EAE3] space-y-2.5">
            {user ? (
              <div className="space-y-2.5">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-sanctuary-100 border border-[#E6DFD7]"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-plum-700" />
                    <span className="text-sm font-semibold text-[#23192D]">
                      {profile?.full_name || user.email}
                    </span>
                  </div>
                  <Badge variant={getRoleBadgeVariant()} className="text-[10px]">
                    {role || 'klien'}
                  </Badge>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full justify-center gap-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar dari Akun
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center rounded-xl">
                    Masuk
                  </Button>
                </Link>
                <Link to="/booking" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center rounded-xl bg-plum-700 hover:bg-plum-800 text-white">
                    Booking Sesi
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="pt-2 text-center text-xs text-[#7A6F85] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-plum-600" />
            <span>Kerahasiaan data terjamin &amp; Kode Etik HIMPSI</span>
          </div>
        </div>
      )}
    </header>
  )
}
