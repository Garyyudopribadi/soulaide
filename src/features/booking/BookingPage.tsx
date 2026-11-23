import React, { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Check,
  CreditCard,
  Sparkles,
  Video,
  MapPin,
  HeartHandshake,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { useServices } from '@/features/services/useServices.ts'
import { usePsychologists } from '@/features/psychologists/usePsychologists.ts'
import { useAuth } from '@/features/auth/useAuth.ts'
import {
  getSelectableDates,
  DEFAULT_DAILY_SLOTS,
  validateBookingLeadTime,
  MINIMUM_LEAD_TIME_HOURS,
} from './availability.ts'
import { createBookingAtomic } from './bookingService.ts'
import { formatIDR } from '@/lib/utils.ts'
import type { DeliveryMethod, ProfessionalTier } from '@/types/index.ts'
import { MidtransSnapModal } from '@/features/payments/MidtransSnapModal.tsx'

export const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: services } = useServices()
  const { data: psychologists } = usePsychologists()

  const [currentStep, setCurrentStep] = useState<number>(1)

  const [serviceIdState, setServiceIdState] = useState<string>(() => searchParams.get('service') || '')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('online')
  const [selectedTier, setSelectedTier] = useState<ProfessionalTier>('Soul Guidance')
  const [psychologistFilter, setPsychologistFilter] = useState<'all' | 'Soul Guidance' | 'Soul Expert'>('Soul Guidance')
  const [psychologistIdState, setPsychologistIdState] = useState<string>(() => searchParams.get('psychologist') || '')
  const [dateState, setDateState] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [consentAgreed, setConsentAgreed] = useState<boolean>(false)

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [completedBooking, setCompletedBooking] = useState<{
    bookingId: string
    bookingCode: string
  } | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const selectableDates = getSelectableDates(14)

  const selectedServiceId = serviceIdState || services[0]?.id || ''
  const selectedPsychologistId = psychologistIdState || psychologists[0]?.id || ''
  const selectedDate = dateState || selectableDates[0]?.dateStr || ''

  const getServicePrice = (
    svc: typeof services[0] | undefined,
    method: DeliveryMethod,
    tier: ProfessionalTier
  ): number => {
    if (!svc) return 0
    const isExpert = tier === 'Soul Expert'
    const isOffline = method === 'offline'

    const lower = svc.title.toLowerCase()
    if (lower.includes('bundl')) {
      if (isExpert) return isOffline ? 650000 : 329000
      return isOffline ? 450000 : 169000
    }
    if (lower.includes('mhcu')) {
      if (isExpert) return isOffline ? 300000 : 179000
      return isOffline ? 200000 : 89000
    }
    if (lower.includes('individu')) {
      if (isExpert) return isOffline ? 500000 : 250000
      return isOffline ? 350000 : 110000
    }

    const base = isOffline ? (svc.priceOffline || 350000) : (svc.priceOnline || svc.price || 110000)
    return isExpert ? base + 150000 : base
  }

  const setSelectedServiceId = (id: string) => setServiceIdState(id)

  const setSelectedPsychologistId = (id: string) => {
    setPsychologistIdState(id)
    const psych = psychologists.find((p) => p.id === id)
    if (psych?.tier) {
      setSelectedTier(psych.tier)
    }
  }

  const setSelectedDate = (d: string) => setDateState(d)

  const selectedService = services.find((s) => s.id === selectedServiceId)
  const selectedPsychologist = psychologists.find((p) => p.id === selectedPsychologistId)

  const handleSelectTime = (time: string) => {
    setSelectedTime(time)
    setBookingError(null)
  }

  const handleConfirmBooking = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/booking' } } })
      return
    }

    if (!selectedService || !selectedPsychologist || !selectedDate || !selectedTime) {
      setBookingError('Silakan lengkapi seluruh langkah pemilihan sesi.')
      return
    }

    if (!consentAgreed) {
      setBookingError('Anda wajib menyetujui pernyataan persetujuan konseling dan kebijakan lead time.')
      return
    }

    const timeFormatted = selectedTime.length === 5 ? `${selectedTime}:00` : selectedTime
    const leadCheck = validateBookingLeadTime(selectedDate, selectedTime)
    if (!leadCheck.isValid) {
      setBookingError(leadCheck.message || 'Waktu yang dipilih melanggar ketentuan lead time minimal 24 jam.')
      return
    }

    setIsSubmitting(true)
    setBookingError(null)

    const result = await createBookingAtomic({
      customerId: user.id,
      psychologistId: selectedPsychologist.id,
      serviceId: selectedService.id,
      sessionDate: selectedDate,
      sessionStartTime: timeFormatted,
      deliveryMethod,
      notes,
    })

    setIsSubmitting(false)

    if (result.success && result.bookingId && result.bookingCode) {
      setCompletedBooking({
        bookingId: result.bookingId,
        bookingCode: result.bookingCode,
      })
      setCurrentStep(5)
    } else {
      setBookingError(result.error || 'Gagal membuat reservasi. Slot mungkin sudah diambil pengguna lain.')
    }
  }

  const calculatedPrice = getServicePrice(selectedService, deliveryMethod, selectedTier)

  const steps = [
    { num: 1, label: 'Layanan & Metode' },
    { num: 2, label: 'Pilih Psikolog' },
    { num: 3, label: 'Pilih Jadwal' },
    { num: 4, label: 'Konfirmasi' },
  ]

  return (
    <div className="pb-20 space-y-10">
      {/* Enhanced Booking Hero Header & Integrated Stepper */}
      <section className="relative w-full overflow-hidden border-b border-[#E5DDD4] soulaide-hero-mesh pt-10 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-plum-200/80 text-plum-800 text-xs font-semibold shadow-2xs backdrop-blur-sm">
              <Calendar className="w-3.5 h-3.5 text-plum-600" />
              <span>Alur Reservasi Sesi Terverifikasi • Kode Etik HIMPSI</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1E1429] tracking-tight">
              Reservasi <span className="font-serif italic font-semibold text-plum-700">Sesi Konseling</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#554B61] max-w-lg mx-auto leading-relaxed">
              Slot terkunci secara atomik dengan kepastian jadwal, kerahasiaan klinis, dan transparansi tarif tanpa biaya tersembunyi.
            </p>
          </div>

          {/* Stepper Inside Glass Dock */}
          {currentStep < 5 && (
            <div className="max-w-2xl mx-auto p-4 sm:p-5 rounded-3xl bg-white/90 backdrop-blur-xl border border-white shadow-[0_14px_34px_-16px_rgba(41,23,56,0.14)]">
              <div className="flex justify-between items-center relative px-2">
                <div className="absolute left-10 right-10 top-4.5 h-0.5 bg-[#E6DFD7] -z-0" />
                <div
                  className="absolute left-10 top-4.5 h-0.5 bg-plum-600 -z-0 transition-all duration-300"
                  style={{ width: `calc(${((currentStep - 1) / 3) * 100}% - 5rem)` }}
                />
                {steps.map((s) => {
                  const isCurrent = currentStep === s.num
                  const isDone = currentStep > s.num
                  return (
                    <button
                      key={s.num}
                      type="button"
                      disabled={s.num > currentStep}
                      onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                      className={`flex flex-col items-center gap-2 relative z-10 px-2 ${
                        s.num < currentStep ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-plum-700 text-white shadow-md ring-4 ring-plum-100'
                            : isDone
                              ? 'bg-plum-600 text-white'
                              : 'bg-white border border-[#DCD4CA] text-[#8E81A1]'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : s.num}
                      </div>
                      <span
                        className={`text-[11px] font-semibold hidden sm:inline ${
                          isCurrent ? 'text-plum-900' : isDone ? 'text-plum-700' : 'text-[#8E81A1]'
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Error Alert */}
        {bookingError && (
          <div className="max-w-4xl mx-auto p-4 bg-rose-50 text-rose-800 text-xs sm:text-sm rounded-2xl border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{bookingError}</span>
          </div>
        )}

      {/* Main Content Area: 2-Column Layout for Steps 1–4, Centered Receipt for Step 5 */}
      {currentStep < 5 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Guided Steps (8 cols) */}
          <div className="lg:col-span-8">
            {/* STEP 1 */}
            {currentStep === 1 && (
              <Card className="rounded-3xl">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-xl font-bold text-[#1E1429]">
                    Langkah 1: Tentukan Kategori, Metode & Layanan
                  </CardTitle>
                  <p className="text-xs text-[#645A70]">
                    Pilih tingkat pendampingan psikolog, metode sesi (Online atau Tatap Muka), dan jenis layanan.
                  </p>
                </CardHeader>
                <CardContent className="space-y-7">
                  {/* Tier Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#3C3148] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-plum-600" />
                      1. Kategori Psikolog Pendamping
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTier('Soul Guidance')
                          setPsychologistFilter('Soul Guidance')
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedTier === 'Soul Guidance'
                            ? 'border-plum-600 bg-plum-50/60 ring-2 ring-plum-500/25 shadow-xs'
                            : 'border-[#EAE3DC] hover:border-plum-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-sm text-[#1E1429]">Soul Guidance</span>
                          <Badge className="bg-plum-700 text-white border-0 text-[10px]">
                            Psikolog & Konselor
                          </Badge>
                        </div>
                        <p className="text-xs text-[#645A70] leading-relaxed">
                          Pendampingan adaptif untuk stres, regulasi emosi harian, quarter-life crisis, kecemasan, dan peningkatan resiliensi.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTier('Soul Expert')
                          setPsychologistFilter('Soul Expert')
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedTier === 'Soul Expert'
                            ? 'border-champagne-600 bg-champagne-50/70 ring-2 ring-champagne-500/25 shadow-xs'
                            : 'border-[#EAE3DC] hover:border-champagne-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-sm text-[#1E1429]">Soul Expert</span>
                          <Badge className="bg-champagne-600 text-white border-0 text-[10px]">
                            Senior &gt; 10 Tahun
                          </Badge>
                        </div>
                        <p className="text-xs text-[#645A70] leading-relaxed">
                          Penanganan mendalam untuk relasi pernikahan/keluarga, trauma psikologis, parenting inklusi, dan asesmen kompleks.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Modality Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#3C3148] uppercase tracking-wider flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-plum-600" />
                      2. Metode Pelaksanaan Sesi
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('online')}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          deliveryMethod === 'online'
                            ? 'border-plum-600 bg-plum-50/60 ring-2 ring-plum-500/25 shadow-xs'
                            : 'border-[#EAE3DC] hover:border-plum-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Video className="w-4 h-4 text-plum-600" />
                          <p className="font-bold text-sm text-[#1E1429]">Sesi Daring (Online)</p>
                        </div>
                        <p className="text-xs text-[#645A70] leading-relaxed">
                          Konseling privat via Google Meet berenkripsi dari kenyamanan ruang Anda.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('offline')}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          deliveryMethod === 'offline'
                            ? 'border-plum-600 bg-plum-50/60 ring-2 ring-plum-500/25 shadow-xs'
                            : 'border-[#EAE3DC] hover:border-plum-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-plum-600" />
                          <p className="font-bold text-sm text-[#1E1429]">Tatap Muka (Offline)</p>
                        </div>
                        <p className="text-xs text-[#645A70] leading-relaxed">
                          Klinik tenang di Pondok Bambu, Duren Sawit, Jakarta Timur (by appointment).
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Service Selection */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-[#3C3148] uppercase tracking-wider flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4 text-plum-600" />
                        3. Pilih Layanan Konseling
                      </label>
                      <span className="text-[11px] text-[#72677E]">
                        Tarif <strong className="text-[#1E1429]">{selectedTier}</strong> (
                        {deliveryMethod === 'offline' ? 'Tatap Muka' : 'Online'})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {services.map((svc) => {
                        const isSelected = selectedServiceId === svc.id
                        const price = getServicePrice(svc, deliveryMethod, selectedTier)
                        return (
                          <button
                            key={svc.id}
                            type="button"
                            onClick={() => setSelectedServiceId(svc.id)}
                            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-plum-600 bg-plum-50/60 ring-2 ring-plum-500/25 shadow-xs'
                                : 'border-[#EAE3DC] hover:border-plum-300 bg-white'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1">
                                <Badge variant="default" className="text-[10px]">
                                  {selectedTier}
                                </Badge>
                                <span className="text-[10px] text-[#8E81A1] font-medium">
                                  {svc.duration.split('(')[0].trim()}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-[#1E1429] pt-1">{svc.title}</h4>
                              <p className="text-xs text-[#645A70] leading-relaxed line-clamp-3">
                                {svc.description}
                              </p>
                            </div>
                            <div className="pt-3 border-t border-[#EFE9E2] mt-3 flex items-center justify-between w-full">
                              <span className="text-[10px] text-plum-700 font-bold uppercase">
                                {deliveryMethod === 'offline' ? 'Tatap Muka' : 'Online'}
                              </span>
                              <span className="text-sm font-extrabold text-[#1E1429] tabular-nums">
                                {formatIDR(price)}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end pt-4 border-t border-[#F2ECE6]">
                  <Button onClick={() => setCurrentStep(2)} className="gap-2 h-11 px-6 rounded-xl">
                    <span>Lanjut Pilih Psikolog</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <Card className="rounded-3xl">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl font-bold text-[#1E1429]">
                        Langkah 2: Pilih Psikolog Pendamping
                      </CardTitle>
                      <p className="text-xs text-[#645A70] mt-0.5">
                        Pilih psikolog yang paling selaras dengan kebutuhan dan kenyamanan Anda.
                      </p>
                    </div>
                    <div className="flex gap-1 bg-sanctuary-100 p-1 rounded-xl border border-[#EAE3DC] self-start sm:self-center">
                      {(['all', 'Soul Guidance', 'Soul Expert'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setPsychologistFilter(t)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                            psychologistFilter === t
                              ? 'bg-white shadow-xs text-plum-900'
                              : 'text-[#645A70] hover:text-[#1E1429]'
                          }`}
                        >
                          {t === 'all' ? 'Semua' : t}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {psychologists
                      .filter((p) => {
                        if (psychologistFilter === 'all') return true
                        const pTier =
                          p.tier || (p.experienceYears.includes('> 10') ? 'Soul Expert' : 'Soul Guidance')
                        return pTier === psychologistFilter
                      })
                      .map((psych) => {
                        const isSelected = selectedPsychologistId === psych.id
                        const psychTier =
                          psych.tier ||
                          (psych.experienceYears.includes('> 10') ? 'Soul Expert' : 'Soul Guidance')
                        const isExpert = psychTier === 'Soul Expert'

                        return (
                          <button
                            key={psych.id}
                            type="button"
                            onClick={() => setSelectedPsychologistId(psych.id)}
                            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex gap-3.5 ${
                              isSelected
                                ? 'border-plum-600 bg-plum-50/60 ring-2 ring-plum-500/25 shadow-xs'
                                : 'border-[#EAE3DC] hover:border-plum-300 bg-white'
                            }`}
                          >
                            <div
                              className={`w-16 h-20 rounded-xl overflow-hidden shrink-0 ${
                                isExpert
                                  ? 'bg-gradient-to-b from-champagne-100 to-[#F3ECE4]'
                                  : 'bg-gradient-to-b from-plum-100 to-[#EFEAF5]'
                              }`}
                            >
                              <img
                                src={psych.profileImage || psych.cardImage}
                                alt={psych.fullName}
                                className="w-full h-full object-cover object-top mix-blend-multiply"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = '/Soulaide Psi Arc Logo.png'
                                }}
                              />
                            </div>
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-bold text-sm text-[#1E1429] truncate">
                                  {psych.fullName}
                                </h4>
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                                    isExpert
                                      ? 'bg-champagne-600 text-white'
                                      : 'bg-plum-700 text-white'
                                  }`}
                                >
                                  {psychTier}
                                </span>
                              </div>
                              <p className="text-xs text-plum-600 font-semibold truncate">
                                {psych.credentials}
                              </p>
                              <p className="text-[11px] text-[#72677E]">
                                Pengalaman: {psych.experienceYears}
                              </p>
                              <p className="text-[10px] text-[#8E81A1] truncate">
                                {psych.initialSchedule}
                              </p>
                              <div className="flex flex-wrap gap-1 pt-1">
                                {psych.practiceAreas.slice(0, 2).map((a, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-full bg-sanctuary-100 border border-[#EAE3DC] text-[#52475E] text-[9px] font-medium"
                                  >
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                  </div>
                </CardContent>
                <CardFooter className="justify-between pt-4 border-t border-[#F2ECE6]">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="gap-1.5 h-11 px-4 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                  </Button>
                  <Button onClick={() => setCurrentStep(3)} className="gap-2 h-11 px-6 rounded-xl">
                    <span>Lanjut Pilih Jadwal</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <Card className="rounded-3xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-[#1E1429]">
                    Langkah 3: Tentukan Tanggal & Slot Waktu
                  </CardTitle>
                  <p className="text-xs text-[#645A70]">
                    Seluruh waktu menggunakan zona waktu WIB (Asia/Jakarta). Ketentuan lead time minimal {MINIMUM_LEAD_TIME_HOURS} jam sebelum sesi.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-champagne-50 text-[#5B3F14] text-xs rounded-2xl flex items-center gap-3 border border-champagne-200">
                    <Clock className="w-4.5 h-4.5 text-champagne-600 shrink-0" />
                    <span>
                      Pemesanan membutuhkan lead time minimal 24 jam untuk persiapan psikolog. Jadwal hari ini tidak dapat dipesan.
                    </span>
                  </div>

                  {/* Date Picker */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#3C3148] uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-plum-600" /> Pilih Tanggal Sesi
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {selectableDates.map((d) => {
                        const isSelected = selectedDate === d.dateStr
                        const parts = d.label.split(' ')
                        return (
                          <button
                            key={d.dateStr}
                            type="button"
                            onClick={() => setSelectedDate(d.dateStr)}
                            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'border-plum-700 bg-plum-700 text-white font-bold shadow-sm'
                                : 'border-[#EAE3DC] bg-white hover:border-plum-300 hover:bg-plum-50/40 text-[#23192D]'
                            }`}
                          >
                            <p className="text-[10px] uppercase opacity-75">{parts[0]}</p>
                            <p className="text-base font-extrabold mt-0.5 tabular-nums">{parts[1]}</p>
                            <p className="text-[10px] opacity-75">{parts[2]}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#3C3148] uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-plum-600" /> Pilih Jam Sesi (WIB)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {DEFAULT_DAILY_SLOTS.map((time) => {
                        const isSelected = selectedTime === time
                        const leadValidation = selectedDate
                          ? validateBookingLeadTime(selectedDate, time)
                          : { isValid: true }
                        const isAllowed = leadValidation.isValid

                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={!isAllowed}
                            onClick={() => handleSelectTime(time)}
                            className={`p-3.5 rounded-2xl border text-center font-bold text-sm tabular-nums transition-all ${
                              isSelected
                                ? 'border-plum-600 bg-plum-50 text-plum-900 ring-2 ring-plum-500/30 shadow-xs cursor-pointer'
                                : isAllowed
                                  ? 'border-[#EAE3DC] bg-white hover:border-plum-300 text-[#23192D] cursor-pointer'
                                  : 'border-[#F2ECE6] bg-sanctuary-100 text-[#C2B9CB] cursor-not-allowed'
                            }`}
                          >
                            {time} WIB
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between pt-4 border-t border-[#F2ECE6]">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="gap-1.5 h-11 px-4 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                  </Button>
                  <Button
                    onClick={() => {
                      if (!selectedTime) {
                        setBookingError('Silakan pilih salah satu jam sesi terlebih dahulu.')
                        return
                      }
                      setCurrentStep(4)
                    }}
                    className="gap-2 h-11 px-6 rounded-xl"
                  >
                    <span>Lanjut ke Konfirmasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* STEP 4 */}
            {currentStep === 4 && (
              <Card className="rounded-3xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-[#1E1429]">
                    Langkah 4: Konfirmasi & Informed Consent
                  </CardTitle>
                  <p className="text-xs text-[#645A70]">
                    Tinjau catatan awal dan setujui Informed Consent klinis sebelum slot dikunci.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Intake Notes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#3C3148] uppercase tracking-wider block">
                      Catatan Awal / Topik yang Ingin Didiskusikan (Opsional)
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ceritakan secara singkat keluhan atau topik yang ingin Anda bahas bersama psikolog..."
                      className="w-full px-4 py-3 text-sm border border-[#DFD7CE] rounded-2xl focus:ring-2 focus:ring-plum-500/30 focus:border-plum-500 focus:outline-hidden bg-sanctuary-50 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Informed Consent */}
                  <div className="p-5 bg-plum-50/60 rounded-2xl border border-plum-200/70 space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="consentCheckbox"
                        checked={consentAgreed}
                        onChange={(e) => setConsentAgreed(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-plum-300 accent-plum-700 cursor-pointer"
                      />
                      <label
                        htmlFor="consentCheckbox"
                        className="text-xs text-[#3C3148] leading-relaxed cursor-pointer"
                      >
                        Saya menyetujui <strong className="text-plum-900">Informed Consent</strong> layanan konseling psikologi Soulaide. Saya memahami bahwa:
                        <ul className="list-disc pl-4 mt-2 space-y-1 text-[#5A5066]">
                          <li>Pemesanan sesi ini mengikat dan slot akan direservasi secara atomik di kalender psikolog.</li>
                          <li>Permintaan perubahan jadwal (reschedule) dapat diajukan paling lambat 8 jam sebelum sesi.</li>
                          <li>Layanan ini merupakan konseling terencana dan bukan penanganan darurat krisis jiwa (hubungi 119 ext 8 untuk gawat darurat).</li>
                        </ul>
                      </label>
                    </div>
                  </div>

                  {!user && (
                    <div className="p-4 bg-champagne-50 text-[#5B3F14] rounded-2xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-champagne-200">
                      <span>
                        Anda belum masuk ke akun Anda. Silakan masuk terlebih dahulu untuk mengunci reservasi.
                      </span>
                      <Link to="/login" state={{ from: { pathname: '/booking' } }}>
                        <Button size="sm" variant="outline" className="text-xs whitespace-nowrap rounded-full">
                          Masuk Sekarang
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="justify-between pt-4 border-t border-[#F2ECE6]">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    className="gap-1.5 h-11 px-4 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                  </Button>
                  <Button
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting || !consentAgreed || !user}
                    className="gap-2 h-11 px-6 rounded-xl"
                  >
                    {isSubmitting ? 'Mengunci Slot...' : 'Kunci Reservasi Sesi'}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          {/* Right Sticky Live Summary Sidebar (4 cols) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <Card className="rounded-3xl border-[#E5DDD5] bg-white overflow-hidden">
              <div className="bg-gradient-to-r from-plum-900 to-plum-700 px-6 py-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-plum-200">
                  Ringkasan Reservasi
                </p>
                <h3 className="text-base font-bold mt-0.5">Detail Sesi Pilihan Anda</h3>
              </div>

              <CardContent className="p-6 space-y-4 text-xs">
                {/* Selected Service */}
                <div className="space-y-1 pb-3.5 border-b border-[#F2ECE6]">
                  <span className="text-[11px] text-[#8E81A1] font-semibold">Layanan</span>
                  <p className="text-sm font-bold text-[#1E1429]">
                    {selectedService?.title || 'Belum dipilih'}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Badge variant={selectedTier === 'Soul Expert' ? 'warning' : 'default'} className="text-[10px]">
                      {selectedTier}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {deliveryMethod === 'offline' ? 'Tatap Muka' : 'Daring (Online)'}
                    </Badge>
                  </div>
                </div>

                {/* Selected Psychologist */}
                <div className="flex items-center gap-3 pb-3.5 border-b border-[#F2ECE6]">
                  {selectedPsychologist ? (
                    <>
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-plum-50 border border-plum-100 shrink-0">
                        <img
                          src={selectedPsychologist.profileImage || selectedPsychologist.cardImage}
                          alt={selectedPsychologist.fullName}
                          className="w-full h-full object-cover object-top mix-blend-multiply"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#8E81A1] font-semibold block">Psikolog</span>
                        <p className="font-bold text-[#1E1429] truncate">
                          {selectedPsychologist.fullName}
                        </p>
                        <p className="text-[11px] text-plum-600 truncate">
                          {selectedPsychologist.credentials}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-[#8E81A1]">
                      <UserCheck className="w-4 h-4" />
                      <span>Belum memilih psikolog</span>
                    </div>
                  )}
                </div>

                {/* Selected Schedule */}
                <div className="space-y-1 pb-3.5 border-b border-[#F2ECE6]">
                  <span className="text-[11px] text-[#8E81A1] font-semibold">Jadwal Sesi</span>
                  <div className="flex items-center justify-between text-[#1E1429] font-semibold">
                    <span>{selectedDate || 'Belum dipilih'}</span>
                    <span className="text-plum-700 tabular-nums">
                      {selectedTime ? `${selectedTime} WIB` : 'Pilih jam'}
                    </span>
                  </div>
                </div>

                {/* Total Price */}
                <div className="p-4 rounded-2xl bg-sanctuary-100 border border-[#EAE3DC] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#52475E]">Estimasi Total</span>
                  <span className="text-lg font-extrabold text-plum-900 tabular-nums">
                    {formatIDR(calculatedPrice)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#72677E] pt-1">
                  <ShieldCheck className="w-4 h-4 text-plum-600 shrink-0" />
                  <span>Transaksi aman via Midtrans & dilindungi Kode Etik HIMPSI.</span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : (
        /* STEP 5: Confirmation Receipt */
        completedBooking && (
          <Card className="max-w-2xl mx-auto p-6 sm:p-10 text-center space-y-6 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <Badge variant="success" className="text-xs font-bold px-3.5 py-1">
                Reservasi Berhasil Dikunci
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1429]">
                Slot Jadwal Berhasil Dipesan!
              </h2>
              <p className="text-xs sm:text-sm text-[#645A70] max-w-md mx-auto leading-relaxed">
                Kode booking Anda telah terdaftar secara resmi di sistem Soulaide. Lanjutkan ke pembayaran untuk aktivasi tautan sesi.
              </p>
            </div>

            <div className="max-w-md mx-auto p-5 bg-sanctuary-100 rounded-2xl border border-[#EAE3DC] text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-[#E5DDD5] pb-2.5">
                <span className="text-[#72677E] font-semibold uppercase tracking-wider">Kode Booking</span>
                <span className="font-mono font-bold text-sm text-plum-900">
                  {completedBooking.bookingCode}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#72677E]">Layanan</span>
                <span className="font-semibold text-[#1E1429]">
                  {selectedService?.title} ({selectedTier})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#72677E]">Metode Sesi</span>
                <span className="font-semibold text-plum-800">
                  {deliveryMethod === 'offline' ? 'Tatap Muka (Pondok Bambu)' : 'Daring (Google Meet)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#72677E]">Psikolog</span>
                <span className="font-semibold text-[#1E1429]">{selectedPsychologist?.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#72677E]">Jadwal</span>
                <span className="font-semibold text-[#1E1429] tabular-nums">
                  {selectedDate} pukul {selectedTime} WIB
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-[#E5DDD5] pt-2.5">
                <span className="text-[#72677E] font-semibold">Total Tagihan</span>
                <span className="font-extrabold text-base text-plum-900 tabular-nums">
                  {formatIDR(calculatedPrice)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <Link to="/dashboard">
                <Button variant="outline" className="w-full sm:w-auto h-11 px-5 rounded-xl">
                  Buka Dashboard Klien
                </Button>
              </Link>
              <Button
                onClick={() => setShowPaymentModal(true)}
                className="w-full sm:w-auto gap-2 h-11 px-6 rounded-xl"
              >
                <CreditCard className="w-4 h-4 text-plum-200" />
                <span>Bayar Sekarang via Midtrans</span>
              </Button>
            </div>

            <MidtransSnapModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              bookingId={completedBooking.bookingId}
              bookingCode={completedBooking.bookingCode}
              serviceName={selectedService?.title || 'Konseling Psikologi'}
              amount={calculatedPrice}
              onPaymentSuccess={() => {
                setShowPaymentModal(false)
                navigate('/dashboard')
              }}
            />
          </Card>
        )
      )}
      </div>
    </div>
  )
}
