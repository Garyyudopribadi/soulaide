import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  HeartHandshake,
  ShieldCheck,
  Calendar,
  Sparkles,
  MessageCircle,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Users,
  CheckCircle2,
  Award,
  Video,
  MapPin,
  Lock,
  Compass,
  Play,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { usePsychologists } from '@/features/psychologists/usePsychologists.ts'
import { useServices } from '@/features/services/useServices.ts'
import { formatIDR } from '@/lib/utils.ts'
import type { DeliveryMethod, ProfessionalTier } from '@/types/index.ts'

const LOOPING_PHRASES = [
  {
    step: '01',
    text: 'A safe space to be heard.',
    sub: 'Ruang bercerita yang hangat, rahasia, dan bebas dari penghakiman.',
    tag: 'Ruang Aman & Empatik',
  },
  {
    step: '02',
    text: 'Care that meets you where you are.',
    sub: 'Pendampingan yang menyesuaikan ritme, kebutuhan, dan kenyamanan Anda.',
    tag: 'Pendekatan Personal',
  },
  {
    step: '03',
    text: 'Small steps toward feeling well.',
    sub: 'Langkah kecil yang terukur menuju pemulihan dan kejelasan emosi.',
    tag: 'Pemulihan Berkelanjutan',
  },
] as const

const JOURNEY_STEPS = [
  {
    step: '01',
    title: 'Pilih Layanan & Psikolog',
    description:
      'Tentukan kebutuhan Anda — Konseling Individu, MHCU, atau Bundling MHCU+Konseling Individu Online — lalu pilih pendamping Soul Guidance atau Soul Expert.',
    icon: Compass,
  },
  {
    step: '02',
    title: 'Atur Jadwal & Metode Sesi',
    description:
      'Pilih sesi Daring (Google Meet) atau Tatap Muka di Pondok Bambu sesuai waktu nyaman Anda dengan lead time 24 jam.',
    icon: Calendar,
  },
  {
    step: '03',
    title: 'Mulai Sesi Privat & Terjaga',
    description:
      'Konfirmasi pembayaran transparan, terima tautan ruang sesi aman, dan jalani proses pendampingan berstandar Kode Etik HIMPSI.',
    icon: HeartHandshake,
  },
] as const

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: psychologists } = usePsychologists()
  const { data: services } = useServices()
  const [activePhraseIndex, setActivePhraseIndex] = useState(0)
  const [showMotionVideoModal, setShowMotionVideoModal] = useState(false)
  const [showcaseTier, setShowcaseTier] = useState<ProfessionalTier>('Soul Guidance')
  const [activeBrochureImg, setActiveBrochureImg] = useState<string | null>(null)

  // Quick Concierge Finder States inside Hero Header
  const [quickTier, setQuickTier] = useState<ProfessionalTier>('Soul Guidance')
  const [quickMethod, setQuickMethod] = useState<DeliveryMethod>('online')
  const [quickServiceId, setQuickServiceId] = useState<string>('')

  const activeQuickService =
    services.find((s) => s.id === quickServiceId) || services[0]

  const getQuickEstimate = (): number => {
    if (!activeQuickService) return 110000
    const isExpert = quickTier === 'Soul Expert'
    const isOffline = quickMethod === 'offline'
    const lower = activeQuickService.title.toLowerCase()

    if (lower.includes('individual')) {
      return isExpert ? (isOffline ? 500000 : 250000) : isOffline ? 350000 : 110000
    }
    if (lower.includes('mhcu')) {
      return isExpert ? (isOffline ? 300000 : 179000) : isOffline ? 200000 : 89000
    }
    if (lower.includes('bundle')) {
      return isExpert ? (isOffline ? 650000 : 329000) : isOffline ? 450000 : 169000
    }
    return activeQuickService.priceOnline || 110000
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePhraseIndex((prev) => (prev + 1) % LOOPING_PHRASES.length)
    }, 4200)
    return () => clearInterval(timer)
  }, [])

  const getPresencePill = (presence: string) => {
    switch (presence) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-emerald-200/80 text-emerald-800 text-[10px] font-semibold shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Tersedia Sesi
          </span>
        )
      case 'online':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-plum-200 text-plum-800 text-[10px] font-semibold shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-plum-500" />
            Online
          </span>
        )
      case 'busy':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-champagne-200 text-champagne-700 text-[10px] font-semibold shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-champagne-500" />
            Sedang Sesi
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-[#E5DDD5] text-[#645A70] text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9D94A8]" />
            Offline
          </span>
        )
    }
  }

  return (
    <div className="pb-20">
      {/* =====================================================================
          ENHANCED BERANDA HERO HEADER — Iconic Soulaide Orbital Psi Arc &
          Kinetic Looping Header Experience
         ===================================================================== */}
      <section className="relative w-full overflow-hidden border-b border-[#E5DDD4] soulaide-hero-mesh pt-8 sm:pt-12 lg:pt-16 pb-14 sm:pb-20">
        {/* Soft Atmospheric Aurora Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-28 -left-20 w-[34rem] h-[34rem] rounded-full bg-plum-300/30 blur-3xl animate-breathe" />
          <div className="absolute top-1/4 right-0 w-[30rem] h-[30rem] rounded-full bg-[#5D728F]/12 blur-3xl animate-breathe-delayed" />
          <div className="absolute -bottom-24 left-1/4 w-[28rem] h-[20rem] rounded-full bg-plum-200/35 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 lg:space-y-14">
          {/* MAIN 2-COLUMN EDITORIAL HERO STAGE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* LEFT COLUMN (5 cols): Iconic Soulaide Psi Arc Orbital Sanctuary */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-72 h-72 sm:w-88 sm:h-88 lg:w-96 lg:h-96 flex items-center justify-center">
                {/* Outer Concentric Orbital Ring 3 (Slow Rotation) */}
                <svg
                  viewBox="0 0 400 400"
                  className="absolute inset-0 w-full h-full animate-orbit-slow pointer-events-none"
                  aria-hidden="true"
                >
                  <circle
                    cx="200"
                    cy="200"
                    r="186"
                    fill="none"
                    stroke="rgba(73, 46, 95, 0.12)"
                    strokeWidth="1.2"
                  />
                  <circle
                    cx="200"
                    cy="200"
                    r="186"
                    fill="none"
                    stroke="rgba(166, 130, 196, 0.45)"
                    strokeWidth="1.5"
                    strokeDasharray="36 180"
                    strokeLinecap="round"
                  />
                  <circle cx="200" cy="14" r="4" fill="#A682C4" />
                  <circle cx="386" cy="200" r="3" fill="#5D728F" />
                </svg>

                {/* Middle Concentric Orbital Ring 2 (Reverse Rotation) */}
                <svg
                  viewBox="0 0 400 400"
                  className="absolute inset-0 w-full h-full animate-orbit-reverse pointer-events-none"
                  aria-hidden="true"
                >
                  <circle
                    cx="200"
                    cy="200"
                    r="146"
                    fill="none"
                    stroke="rgba(73, 46, 95, 0.16)"
                    strokeWidth="1.2"
                    strokeDasharray="6 10"
                  />
                  <circle cx="54" cy="200" r="3.5" fill="#492E5F" />
                </svg>

                {/* Inner Soft Halo Ring 1 */}
                <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-white/95 via-white/80 to-plum-50/75 border border-white shadow-[0_24px_60px_-18px_rgba(73,46,95,0.22),inset_0_1px_4px_rgba(255,255,255,0.9)] backdrop-blur-md flex items-center justify-center p-7 sm:p-8">
                  <img
                    src="/Soulaide Psi Arc Logo.png"
                    alt="Soulaide Psi Arc Logo"
                    className="w-full h-full object-contain select-none drop-shadow-[0_8px_18px_rgba(73,46,95,0.14)] transition-transform duration-500 hover:scale-105"
                  />
                </div>

                {/* Floating Glass Chip 1 (Top Right): Live Psychologists Avatar Stack */}
                <Link
                  to="/psychologists"
                  className="absolute -top-2 -right-2 sm:top-2 sm:-right-4 z-20 flex items-center gap-2.5 pl-2.5 pr-3.5 py-2 rounded-2xl bg-white/92 backdrop-blur-xl border border-white/90 shadow-[0_14px_32px_-10px_rgba(41,23,56,0.18)] hover:border-plum-300 transition-all animate-float-gentle group"
                >
                  <div className="flex -space-x-2 overflow-hidden">
                    {psychologists.slice(0, 4).map((p) => (
                      <img
                        key={p.id}
                        src={p.profileImage || p.cardImage}
                        alt={p.fullName}
                        className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover object-top bg-plum-100"
                      />
                    ))}
                  </div>
                  <div className="text-left leading-tight">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#1E1429] group-hover:text-plum-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>4 Psikolog Klinis</span>
                    </div>
                    <span className="text-[10px] text-[#5D728F] font-medium">
                      Soul Expert &amp; Guidance
                    </span>
                  </div>
                </Link>

                {/* Floating Glass Chip 2 (Bottom Left): Ethical & SIPP Verification */}
                <div className="absolute -bottom-2 -left-2 sm:bottom-3 sm:-left-4 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/92 backdrop-blur-xl border border-white/90 shadow-[0_14px_32px_-10px_rgba(41,23,56,0.18)] animate-float-gentle-delayed">
                  <div className="w-8 h-8 rounded-xl bg-plum-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-plum-100" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-[11px] font-bold text-[#1E1429]">
                      100% Privasi Terjaga
                    </div>
                    <span className="text-[10px] text-[#5D728F] font-medium">
                      Kode Etik HIMPSI &amp; SIPP
                    </span>
                  </div>
                </div>

                {/* Floating Motion Loop Preview Button (Bottom Right) */}
                <button
                  type="button"
                  onClick={() => setShowMotionVideoModal(true)}
                  className="absolute bottom-1 right-1 sm:bottom-4 sm:right-2 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-plum-900/90 hover:bg-plum-800 text-white text-[10px] font-semibold shadow-md backdrop-blur-md transition-all cursor-pointer hover:scale-105"
                  title="Putar video Looping Header Soulaide"
                >
                  <Play className="w-2.5 h-2.5 fill-plum-200 text-plum-200" />
                  <span>Motion Intro</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN (7 cols): Editorial Headline, Looping Value Stage & CTAs */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              {/* Top Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-plum-200/80 text-plum-800 text-xs font-semibold shadow-2xs backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-plum-600" />
                <span>Layanan Konseling Psikologi Profesional • Online &amp; Pondok Bambu</span>
              </div>

              {/* Canonical 2-Line Headline from Soulaide Looping Header */}
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl xl:text-[3.65rem] font-extrabold text-plum-800 tracking-tight leading-[1.1]">
                  Counseling Psychology,
                  <span className="block mt-1 text-[#23192D]">
                    made for{' '}
                    <span className="font-serif italic font-semibold text-transparent bg-clip-text bg-gradient-to-r from-plum-700 via-plum-500 to-[#5D728F]">
                      you.
                    </span>
                  </span>
                </h1>
              </div>

              {/* Kinetic Looping Phrase Showcase Card */}
              <div className="relative rounded-3xl bg-white/88 backdrop-blur-xl border border-white/90 p-5 sm:p-6 shadow-[0_18px_45px_-20px_rgba(73,46,95,0.18)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[#EFE9E3]">
                  <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#5D728F]">
                    <span className="w-2 h-2 rounded-full bg-plum-600" />
                    {LOOPING_PHRASES[activePhraseIndex].tag}
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-plum-500">
                    {LOOPING_PHRASES[activePhraseIndex].step} / 03
                  </span>
                </div>

                {/* Animated Quote Text */}
                <div className="min-h-[4.25rem] flex flex-col justify-center">
                  <p
                    key={`hero-phrase-${activePhraseIndex}`}
                    className="text-xl sm:text-2xl md:text-[1.7rem] font-semibold text-[#5D728F] tracking-tight leading-snug animate-phrase-enter"
                  >
                    {LOOPING_PHRASES[activePhraseIndex].text}
                  </p>
                  <p
                    key={`hero-sub-${activePhraseIndex}`}
                    className="text-xs sm:text-sm text-[#645A70] mt-1.5 animate-phrase-enter"
                  >
                    {LOOPING_PHRASES[activePhraseIndex].sub}
                  </p>
                </div>

                {/* Interactive 3-Segment Timeline Selector */}
                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  {LOOPING_PHRASES.map((item, idx) => {
                    const isActive = idx === activePhraseIndex
                    return (
                      <button
                        key={item.text}
                        type="button"
                        onClick={() => setActivePhraseIndex(idx)}
                        className={`group text-left p-2.5 rounded-2xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-plum-50/90 border-plum-300 shadow-2xs'
                            : 'bg-sanctuary-100/70 border-transparent hover:border-[#E5DDD5] hover:bg-white'
                        }`}
                      >
                        {/* Segment Progress Line */}
                        <div className="h-1 w-full rounded-full bg-plum-100 overflow-hidden mb-2">
                          {isActive && (
                            <div
                              key={`seg-bar-${activePhraseIndex}`}
                              className="h-full bg-gradient-to-r from-plum-700 to-plum-400 animate-progress-bar"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'text-plum-700' : 'text-[#9B8FB0]'
                            }`}
                          />
                          <span
                            className={`text-[11px] font-semibold truncate ${
                              isActive ? 'text-plum-900' : 'text-[#645A70]'
                            }`}
                          >
                            {item.text}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Clinical Narrative */}
              <p className="text-sm sm:text-base text-[#4F455B] leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Soulaide mendampingi perjalanan kesehatan mental Anda secara aman, rahasia, dan tanpa penghakiman. Pilih pendampingan dari{' '}
                <strong className="text-plum-900 font-semibold">Soul Guidance</strong> atau{' '}
                <strong className="text-plum-900 font-semibold">Soul Expert</strong>, tersedia sesi daring (Google Meet) maupun tatap muka di Pondok Bambu, Jakarta Timur.
              </p>

              {/* Primary & Secondary Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-1">
                <Link to="/booking">
                  <Button
                    size="lg"
                    className="gap-2.5 h-13 px-7 rounded-full bg-gradient-to-r from-plum-800 via-plum-700 to-plum-600 hover:from-plum-900 hover:to-plum-700 text-white font-semibold shadow-[0_10px_28px_-6px_rgba(73,46,95,0.5)]"
                  >
                    <Calendar className="w-4.5 h-4.5 text-plum-200" />
                    <span>Jadwalkan Konseling</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/psychologists">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 h-13 px-6 rounded-full border-[#DDD4CA] bg-white/95 hover:bg-white hover:border-plum-300 text-[#2E223A]"
                  >
                    <Users className="w-4 h-4 text-plum-600" />
                    <span>Kenali Psikolog Kami</span>
                  </Button>
                </Link>
                <Link to="/services">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="gap-1.5 h-13 px-5 rounded-full text-plum-800 hover:bg-white/70 font-semibold"
                  >
                    <span>Lihat 3 Layanan</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* =================================================================
              QUICK SESSION CONCIERGE DOCK — Interactive Instant Finder Bar
             ================================================================= */}
          <div className="rounded-3xl bg-white/92 backdrop-blur-xl border border-white shadow-[0_20px_50px_-20px_rgba(41,23,56,0.16)] p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Dock Label */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-plum-50 border border-plum-100 text-plum-700 flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-plum-700">
                    Simulasi &amp; Reservasi Cepat
                  </div>
                  <p className="text-xs text-[#645A70]">
                    Sesuaikan kategori pendamping dan metode sesi Anda
                  </p>
                </div>
              </div>

              {/* Interactive Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-3xl">
                {/* 1. Tier Selector */}
                <div className="p-2.5 rounded-2xl bg-sanctuary-100/90 border border-[#EAE3DC]">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#72677E] mb-1">
                    1. Kategori Psikolog
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    {(['Soul Guidance', 'Soul Expert'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setQuickTier(t)}
                        className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer truncate ${
                          quickTier === t
                            ? t === 'Soul Expert'
                              ? 'bg-champagne-600 text-white shadow-2xs'
                              : 'bg-plum-700 text-white shadow-2xs'
                            : 'text-[#52475E] hover:bg-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Delivery Method Selector */}
                <div className="p-2.5 rounded-2xl bg-sanctuary-100/90 border border-[#EAE3DC]">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#72677E] mb-1">
                    2. Metode Sesi
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setQuickMethod('online')}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        quickMethod === 'online'
                          ? 'bg-plum-700 text-white shadow-2xs'
                          : 'text-[#52475E] hover:bg-white'
                      }`}
                    >
                      <Video className="w-3 h-3" />
                      <span>Online</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickMethod('offline')}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        quickMethod === 'offline'
                          ? 'bg-plum-700 text-white shadow-2xs'
                          : 'text-[#52475E] hover:bg-white'
                      }`}
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Klinik</span>
                    </button>
                  </div>
                </div>

                {/* 3. Service Selector */}
                <div className="p-2.5 rounded-2xl bg-sanctuary-100/90 border border-[#EAE3DC]">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#72677E] mb-1">
                    3. Jenis Layanan
                  </label>
                  <select
                    value={activeQuickService?.id || ''}
                    onChange={(e) => setQuickServiceId(e.target.value)}
                    aria-label="Pilih Jenis Layanan"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E5DDD5] text-xs font-bold text-[#1E1429] focus:outline-hidden focus:ring-2 focus:ring-plum-500/30 cursor-pointer"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Price & Instant Action */}
              <div className="flex items-center justify-between lg:justify-end gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#F2ECE6]">
                <div className="text-left lg:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#72677E] block">
                    Estimasi Tarif
                  </span>
                  <span className="text-lg font-extrabold text-plum-900 tabular-nums">
                    {formatIDR(getQuickEstimate())}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/booking?service=${activeQuickService?.id || ''}`
                    )
                  }
                  className="rounded-2xl h-11 px-5 gap-2 shrink-0"
                >
                  <span>Cari Slot</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Bottom Micro-Assurance Strip inside Dock */}
            <div className="mt-4 pt-3 border-t border-[#F2ECE6] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#6B6177]">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-plum-600" />
                  <span>Online (Google Meet) &amp; Tatap Muka (Pondok Bambu, Jaktim)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-champagne-600" />
                  <span>Psikolog Klinis Terverifikasi SIPP</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-plum-500" />
                  <span>Lead time minimal 24 jam</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-plum-500" />
                  <span>Rekam medis terenkripsi</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Motion Video Modal (Plays official soulaide-header-loop.mp4 on demand) */}
      {showMotionVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/75 backdrop-blur-sm"
          onClick={() => setShowMotionVideoModal(false)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EAE3DC] bg-sanctuary-100">
              <span className="text-xs font-bold text-[#23192D]">
                Soulaide Psychology — Official Motion Header
              </span>
              <button
                type="button"
                onClick={() => setShowMotionVideoModal(false)}
                className="px-3 py-1 rounded-full text-xs font-semibold text-[#645A70] hover:text-[#1E1429] hover:bg-white cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <div className="bg-[#EEF3F8]">
              <video
                src="/soulaide-header-loop.mp4"
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          BEHIND SOULAIDE — Brand Philosophy & Meaning of the Psi Arc
         ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="rounded-[2.25rem] bg-white border border-[#EAE3DC] shadow-[0_20px_50px_-24px_rgba(41,23,56,0.12)] p-6 sm:p-10 lg:p-12 overflow-hidden relative">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-plum-100/50 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left Editorial Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden border border-[#EAE3DC] bg-gradient-to-br from-plum-50 via-white to-sanctuary-100 p-3 shadow-md group">
                <img
                  src="/apa itru Soulaide.jpg"
                  alt="Behind Soulaide Psychology — Makna di balik nama dan logo Soulaide"
                  className="w-full h-72 sm:h-84 object-cover object-center rounded-2xl transition-transform duration-500 group-hover:scale-102"
                />
                <div className="mt-3 px-2 py-1 flex items-center justify-between text-xs text-[#5D728F]">
                  <span className="font-bold text-plum-900">Filosofi Identitas Soulaide</span>
                  <span className="font-mono text-[11px]">Soul • Aide • Psi (Ψ)</span>
                </div>
              </div>
            </div>

            {/* Right Story & 3 Philosophy Pillars */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <Badge className="px-3.5 py-1">Behind Soulaide Psychology</Badge>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E1429] leading-tight">
                  Setiap perjalanan memiliki cerita,{' '}
                  <span className="font-serif italic font-semibold text-plum-700">
                    dan Anda layak didengar.
                  </span>
                </h2>
                <p className="text-sm sm:text-base text-[#5A5066] leading-relaxed">
                  Nama <strong className="text-plum-900">Soulaide</strong> lahir dari perpaduan kata{' '}
                  <em>Soul</em> (jiwa), <em>Aide</em> (pendamping yang menolong), dan lengkungan simbol{' '}
                  <em>Psi (Ψ)</em> yang merangkul — melambangkan ilmu psikologi klinis yang hadir secara hangat, setara, dan merengkuh setiap individu tanpa penghakiman.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-sanctuary-100/80 border border-[#EAE3DC] space-y-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-plum-700 block">
                    01 • Soul
                  </span>
                  <h3 className="text-sm font-bold text-[#1E1429]">Ruang Jiwa Empatik</h3>
                  <p className="text-xs text-[#645A70] leading-relaxed">
                    Menghargai keunikan emosi, cerita hidup, dan kerentanan Anda dengan penerimaan utuh.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-sanctuary-100/80 border border-[#EAE3DC] space-y-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-plum-500 block">
                    02 • Aide
                  </span>
                  <h3 className="text-sm font-bold text-[#1E1429]">Pendampingan Aktif</h3>
                  <p className="text-xs text-[#645A70] leading-relaxed">
                    Berjalan bersama Anda menemukan regulasi emosi dan langkah pemulihan yang aplikatif.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-sanctuary-100/80 border border-[#EAE3DC] space-y-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#5D728F] block">
                    03 • Psi (Ψ)
                  </span>
                  <h3 className="text-sm font-bold text-[#1E1429]">Keilmuan &amp; Etika</h3>
                  <p className="text-xs text-[#645A70] leading-relaxed">
                    Intervensi berbasis bukti ilmiah (CBT, SFBT, Humanistik, ABA) sesuai Kode Etik HIMPSI.
                  </p>
                </div>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-[#645A70]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-plum-800">
                  <ShieldCheck className="w-4 h-4 text-plum-600" />
                  Terdaftar Surat Izin Praktik Psikolog (SIPP)
                </span>
                <span className="text-[#D6CEC2]">•</span>
                <span>Klinik Pondok Bambu, Jakarta Timur &amp; Google Meet Daring</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          HOW IT WORKS — Calm 3-Step Client Journey
         ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <Badge className="px-3.5 py-1">Alur Sesi Nyaman</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E1429]">
            Tiga Langkah Menuju{' '}
            <span className="font-serif italic font-semibold text-plum-700">Ruang Aman</span>
          </h2>
          <p className="text-sm sm:text-base text-[#645A70] leading-relaxed">
            Kami merancang proses reservasi yang sederhana, transparan, dan bebas rasa cemas sejak langkah pertama.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {JOURNEY_STEPS.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={item.step}
                className="relative p-7 rounded-3xl sanctuary-card sanctuary-card-hover flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-plum-50 border border-plum-100 text-plum-700 group-hover:bg-plum-700 group-hover:text-white transition-colors flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sanctuary-100 border border-[#EAE3DC] text-xs font-bold text-plum-700">
                      Langkah {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#23192D]">{item.title}</h3>
                  <p className="text-sm text-[#645A70] leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F2ECE6] flex items-center justify-between text-xs text-plum-700 font-semibold">
                  <span>
                    {idx === 0
                      ? '3 Layanan & 4 Psikolog'
                      : idx === 1
                        ? 'Konfirmasi Jadwal Atomik'
                        : 'Privasi Medis Terlindungi'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* =====================================================================
          COUNSELING TOPICS EXPLORER — Contoh Topik Konseling Resmi Soulaide
         ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="rounded-[2.25rem] bg-gradient-to-br from-[#F6F1FB] via-white to-[#F4F7FB] border border-[#E5DDD5] p-6 sm:p-10 lg:p-12 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <Badge className="px-3.5 py-1">Cakupan Topik Konseling</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E1429]">
                Apa Saja yang Bisa Anda{' '}
                <span className="font-serif italic font-semibold text-plum-700">Ceritakan?</span>
              </h2>
              <p className="text-sm sm:text-base text-[#5A5066]">
                Bersama Psikolog Soulaide, Anda diajak memahami pikiran, emosi, dan pola respons secara sehat dan konstruktif.
              </p>
            </div>
            <Link to="/booking">
              <Button variant="outline" className="rounded-full bg-white gap-2">
                <Calendar className="w-4 h-4 text-plum-600" />
                <span>Mulai Ceritakan Kondisimu</span>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Domain 1 */}
            <div className="p-6 rounded-3xl bg-white border border-[#EAE3DC] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-plum-50 border border-plum-200/70 text-plum-800 text-xs font-bold">
                  Emosi &amp; Pemahaman Diri
                </span>
                <HeartHandshake className="w-5 h-5 text-plum-500" />
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#4B3F59]">
                {[
                  'Overthinking & kecemasan berlebih',
                  'Stres berkepanjangan & burnout',
                  'Regulasi emosi & mood swing',
                  'Mengenal diri lebih dalam',
                  'Self-esteem & kepercayaan diri',
                ].map((topic) => (
                  <li key={topic} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-plum-600 shrink-0 mt-0.5" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Domain 2 */}
            <div className="p-6 rounded-3xl bg-white border border-[#EAE3DC] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-plum-50 border border-plum-200/70 text-plum-800 text-xs font-bold">
                  Kehidupan &amp; Pengembangan Diri
                </span>
                <Compass className="w-5 h-5 text-plum-500" />
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#4B3F59]">
                {[
                  'Quarter-life crisis & arah hidup',
                  'Tekanan pekerjaan & akademik',
                  'Membangun kebiasaan yang lebih sehat',
                  'Mengatur tujuan hidup (life goals)',
                  'Adaptasi lingkungan & caregiver burnout',
                ].map((topic) => (
                  <li key={topic} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-plum-600 shrink-0 mt-0.5" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Domain 3 */}
            <div className="p-6 rounded-3xl bg-white border border-[#EAE3DC] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-champagne-50 border border-champagne-200 text-champagne-700 text-xs font-bold">
                  Relasi, Keluarga &amp; Parenting
                </span>
                <Users className="w-5 h-5 text-champagne-600" />
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#4B3F59]">
                {[
                  'Dinamika pasangan, pernikahan & keluarga',
                  'Toxic relationship & pemulihan relasi',
                  'Boundaries (batasan sehat dalam relasi)',
                  'Trust issue & kesulitan komunikasi',
                  'Parenting, inklusi & kebutuhan khusus',
                ].map((topic) => (
                  <li key={topic} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-champagne-600 shrink-0 mt-0.5" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-plum-900 text-plum-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <Sparkles className="w-4 h-4 text-champagne-200 shrink-0" />
              <span>
                <strong className="text-white">Catatan Hangat:</strong> Kamu tetap bisa bercerita tentang kondisimu walau topikmu tidak tercantum di atas.
              </span>
            </div>
            <Link
              to="/services"
              className="text-xs font-bold text-champagne-200 hover:text-white underline underline-offset-4 shrink-0"
            >
              Pelajari Detail Layanan →
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FEATURED PSYCHOLOGISTS — Crisp Studio Portraits
         ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div className="space-y-2">
            <Badge className="px-3.5 py-1">Tim Profesional Terverifikasi</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E1429]">
              Psikolog <span className="font-serif italic font-semibold text-plum-700">Soulaide</span>
            </h2>
            <p className="text-sm sm:text-base text-[#645A70]">
              Temukan pendamping profesional berlisensi SIPP yang paling selaras dengan kebutuhan emosional Anda.
            </p>
          </div>
          <Link
            to="/psychologists"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-plum-700 hover:text-plum-900 group"
          >
            <span>Lihat Semua Profil &amp; Filter</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {psychologists.slice(0, 4).map((psych) => {
            const isExpert = psych.tier === 'Soul Expert'
            return (
              <Card
                key={psych.id}
                className="flex flex-col justify-between sanctuary-card-hover group rounded-3xl"
              >
                <div>
                  {/* Studio Portrait Pedestal */}
                  <div
                    className={`relative h-72 overflow-hidden ${
                      isExpert
                        ? 'bg-gradient-to-b from-champagne-100/80 via-[#F8F3EC] to-[#F3ECE4]'
                        : 'bg-gradient-to-b from-plum-100/70 via-[#F6F2FA] to-[#EFEAF5]'
                    }`}
                  >
                    <img
                      src={psych.profileImage || psych.cardImage}
                      alt={psych.fullName}
                      className="w-full h-full object-cover object-top mix-blend-multiply transition-transform duration-500 group-hover:scale-104"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = '/Soulaide Psi Arc Logo.png'
                      }}
                    />

                    {/* Tier Pill (Top Left) */}
                    <div className="absolute top-3.5 left-3.5">
                      {isExpert ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-champagne-600 text-white text-[10px] font-bold shadow-sm">
                          <Sparkles className="w-2.5 h-2.5" />
                          Soul Expert
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-plum-700 text-white text-[10px] font-bold shadow-sm">
                          Soul Guidance
                        </span>
                      )}
                    </div>

                    {/* Presence Indicator (Top Right) */}
                    <div className="absolute top-3.5 right-3.5">
                      {getPresencePill(psych.presence)}
                    </div>
                  </div>

                  <CardHeader className="p-5 pb-2 space-y-1">
                    <CardTitle className="text-base font-bold text-[#23192D] group-hover:text-plum-700 transition-colors">
                      {psych.fullName}
                    </CardTitle>
                    <p className="text-xs font-semibold text-plum-600">{psych.credentials}</p>
                    <p className="text-xs text-[#72677E]">
                      Pengalaman: <strong className="text-[#23192D]">{psych.experienceYears}</strong>
                    </p>
                  </CardHeader>

                  <CardContent className="px-5 pt-1 pb-4 space-y-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {psych.practiceAreas.slice(0, 3).map((area, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-full bg-sanctuary-100 border border-[#EAE3DC] text-[#52475E] text-[10px] font-medium"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#72677E] line-clamp-1">
                      Pendekatan: <strong className="text-plum-800">{psych.approaches.join(', ')}</strong>
                    </p>
                  </CardContent>
                </div>

                <CardFooter className="p-4 pt-3 border-t border-[#F2ECE6] grid grid-cols-2 gap-2">
                  <Link to={`/psychologists/${psych.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full rounded-xl text-xs">
                      Detail Profil
                    </Button>
                  </Link>
                  <Link to={`/booking?psychologist=${psych.id}`} className="w-full">
                    <Button size="sm" className="w-full rounded-xl text-xs">
                      Jadwalkan
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </section>

      {/* =====================================================================
          SERVICES SHOWCASE — Architectural Pricing Cards with Tier Switcher
         ===================================================================== */}
      <section className="mt-16 py-20 bg-white border-y border-[#EAE3DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
            <div className="space-y-2">
              <Badge className="px-3.5 py-1">Layanan &amp; Transparansi Tarif</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E1429]">
                Pilihan <span className="font-serif italic font-semibold text-plum-700">Layanan Konseling</span>
              </h2>
              <p className="text-sm sm:text-base text-[#645A70]">
                Struktur biaya transparan untuk sesi Daring (Google Meet) maupun Tatap Muka (Pondok Bambu).
              </p>
            </div>

            {/* Interactive Tier Switcher & Official Brochure Trigger */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 bg-sanctuary-100 p-1.5 rounded-2xl border border-[#EAE3DC]">
                {(['Soul Guidance', 'Soul Expert'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setShowcaseTier(tier)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      showcaseTier === tier
                        ? tier === 'Soul Expert'
                          ? 'bg-champagne-600 text-white shadow-xs'
                          : 'bg-plum-700 text-white shadow-xs'
                        : 'text-[#52475E] hover:text-[#1E1429]'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveBrochureImg('/Layanan Kesehatan Mental.jpg')}
                className="rounded-xl text-xs h-10"
              >
                Lihat Brosur Tarif Resmi
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
            {services.map((svc) => {
              const lower = svc.title.toLowerCase()
              const isBundle = lower.includes('bundl')
              const isMhcuOnly = lower.includes('mhcu') && !isBundle
              const isExpert = showcaseTier === 'Soul Expert'

              const priceOnline = isBundle
                ? isExpert
                  ? 329000
                  : 169000
                : isMhcuOnly
                  ? isExpert
                    ? 179000
                    : 89000
                  : isExpert
                    ? 250000
                    : 110000

              const priceOffline = isBundle
                ? null
                : isMhcuOnly
                  ? isExpert
                    ? 300000
                    : 200000
                  : isExpert
                    ? 500000
                    : 350000

              return (
                <Card
                  key={svc.id}
                  className={`flex flex-col justify-between rounded-3xl transition-all duration-300 relative ${
                    isBundle
                      ? 'border-2 border-champagne-500/80 bg-gradient-to-b from-champagne-50/55 via-white to-white shadow-[0_18px_40px_-18px_rgba(168,122,41,0.28)] hover:-translate-y-1'
                      : 'sanctuary-card-hover'
                  }`}
                >
                  <div>
                    <CardHeader className="p-6 pb-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {isBundle ? (
                          <Badge variant="warning" className="gap-1 px-3 py-0.5 text-[11px] font-bold">
                            <Sparkles className="w-3 h-3" /> Best Value
                          </Badge>
                        ) : (
                          <Badge
                            variant={isExpert ? 'warning' : 'default'}
                            className="text-[11px]"
                          >
                            {showcaseTier}
                          </Badge>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#72677E] text-right">
                          <Clock className="w-3.5 h-3.5 text-plum-400 shrink-0" />
                          <span className="truncate max-w-[165px]" title={svc.duration}>
                            {isBundle ? '90 Menit Total' : isMhcuOnly ? 'Asesmen + 30 Menit' : '60 Menit'}
                          </span>
                        </span>
                      </div>

                      <CardTitle className="text-xl font-bold text-[#1E1429] leading-snug">
                        {svc.title}
                      </CardTitle>
                      <p className="text-[11px] font-semibold text-plum-700 leading-snug">
                        {svc.duration}
                      </p>
                    </CardHeader>

                    <CardContent className="px-6 pt-1 pb-6 space-y-5">
                      <p className="text-sm text-[#645A70] leading-relaxed line-clamp-3">
                        {svc.description}
                      </p>

                      {/* Pricing Breakdown */}
                      <div className="p-4 rounded-2xl bg-sanctuary-100 border border-[#EAE3DC] space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#645A70] inline-flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-plum-500" />
                            Sesi Daring (Online)
                          </span>
                          <span className="font-bold text-sm text-[#1E1429] tabular-nums">
                            {formatIDR(priceOnline)}
                          </span>
                        </div>
                        <div className="h-px bg-[#EAE3DC]" />
                        <div className="flex items-center justify-between">
                          <span className="text-[#645A70] inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-plum-500" />
                            Tatap Muka (Klinik)
                          </span>
                          <span className="font-bold text-sm text-plum-700 tabular-nums">
                            {priceOffline ? formatIDR(priceOffline) : 'Khusus Online'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="p-6 pt-4 border-t border-[#F2ECE6]">
                    <Link to={`/booking?service=${svc.id}`} className="w-full">
                      <Button
                        size="md"
                        className={`w-full gap-2 rounded-xl ${
                          isBundle
                            ? 'bg-plum-800 hover:bg-plum-900 text-white'
                            : 'bg-plum-700 hover:bg-plum-800 text-white'
                        }`}
                      >
                        <span>Pilih Layanan Ini</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Official Brochure Lightbox Modal */}
      {activeBrochureImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/75 backdrop-blur-sm"
          onClick={() => setActiveBrochureImg(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EAE3DC] bg-sanctuary-100">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                {[
                  { label: 'Katalog Utama', src: '/Layanan Kesehatan Mental.jpg' },
                  { label: 'Konseling Individu', src: '/layanan/Konseling Individu.jpg' },
                  { label: 'MHCU & Bundling', src: '/layanan/Konseling Mental Health Check Up.png' },
                  { label: 'Soul Expert', src: '/layanan/Online Offline.jpg' },
                ].map((item) => (
                  <button
                    key={item.src}
                    type="button"
                    onClick={() => setActiveBrochureImg(item.src)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                      activeBrochureImg === item.src
                        ? 'bg-plum-700 text-white'
                        : 'bg-white text-[#52475E] hover:bg-plum-50 border border-[#EAE3DC]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveBrochureImg(null)}
                className="ml-2 px-3 py-1 rounded-full text-xs font-bold text-[#645A70] hover:text-[#1E1429] hover:bg-white cursor-pointer shrink-0"
              >
                Tutup
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto bg-plum-950 p-3">
              <img
                src={activeBrochureImg}
                alt="Brosur Resmi Layanan Kesehatan Mental Soulaide"
                className="w-full h-auto rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          WHY SOULAIDE — Editorial Value Pillars
         ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2.5">
          <Badge className="px-3.5 py-1">Komitmen Klinis Kami</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E1429]">
            Mengapa Memilih{' '}
            <span className="font-serif italic font-semibold text-plum-700">Soulaide?</span>
          </h2>
          <p className="text-sm sm:text-base text-[#645A70]">
            Standar praktik psikologi profesional yang dibalut kehangatan dan rasa aman.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-3xl sanctuary-card sanctuary-card-hover space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-plum-50 border border-plum-100 text-plum-700 flex items-center justify-center">
              <HeartHandshake className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-[#23192D]">Psikolog Berizin &amp; Berpengalaman</h3>
            <p className="text-sm text-[#645A70] leading-relaxed">
              Didampingi langsung oleh psikolog klinis berlisensi (S.Psi., M.Psi.) yang terverifikasi SIPP dan menjunjung tinggi kode etik profesi.
            </p>
          </div>

          <div className="p-7 rounded-3xl sanctuary-card sanctuary-card-hover space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-plum-50 border border-plum-100 text-plum-700 flex items-center justify-center">
              <ShieldCheck className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-[#23192D]">Kerahasiaan Data Terjamin</h3>
            <p className="text-sm text-[#645A70] leading-relaxed">
              Catatan sesi dan laporan asesmen MHCU dilindungi kontrol akses otorisasi ketat (least-privilege) yang hanya dapat diakses oleh psikolog Anda.
            </p>
          </div>

          <div className="p-7 rounded-3xl sanctuary-card sanctuary-card-hover space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-champagne-50 border border-champagne-200/80 text-champagne-700 flex items-center justify-center">
              <MessageCircle className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-[#23192D]">Pilihan Sesi Fleksibel</h3>
            <p className="text-sm text-[#645A70] leading-relaxed">
              Pilih sesi daring (Google Meet) dari kenyamanan ruang pribadi Anda, atau tatap muka di ruang konsultasi tenang di Pondok Bambu, Jakarta Timur.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CLOSING SANCTUARY CTA BANNER
         ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="relative rounded-[2rem] bg-gradient-to-br from-plum-900 via-plum-800 to-[#331B49] p-8 sm:p-14 text-center text-white overflow-hidden shadow-[0_24px_60px_-20px_rgba(41,23,56,0.5)]">
          <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-plum-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-champagne-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-plum-100 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-champagne-200" />
              Mulai Perjalanan Anda Hari Ini
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight">
              Anda tidak harus menghadapi semuanya{' '}
              <span className="font-serif italic font-normal text-plum-200">sendirian.</span>
            </h2>
            <p className="text-sm sm:text-base text-plum-100/85 leading-relaxed">
              Ambil langkah kecil yang penuh makna. Tim psikolog Soulaide siap mendengarkan dan mendampingi Anda dengan sepenuh hati.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/booking">
                <Button
                  size="lg"
                  className="rounded-full bg-white text-plum-900 hover:bg-sanctuary-100 font-bold h-12 px-7 shadow-lg gap-2"
                >
                  <Calendar className="w-4 h-4 text-plum-700" />
                  <span>Reservasi Sesi Sekarang</span>
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-white/25 bg-white/10 hover:bg-white/20 text-white h-12 px-6 backdrop-blur-sm"
                >
                  Konsultasi Admin via WhatsApp
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
