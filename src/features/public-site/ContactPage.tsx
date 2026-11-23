import React from 'react'
import {
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { useSiteSettings } from './useSiteSettings.ts'
import { CrisisDisclaimerBanner } from '@/features/chat/CrisisDisclaimerBanner.tsx'

export const ContactPage: React.FC = () => {
  const { data: settings } = useSiteSettings()

  const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, '')
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(settings.defaultMessage)}`

  return (
    <div className="pb-20 space-y-12">
      {/* =====================================================================
          ENHANCED CONTACT HERO HEADER
         ===================================================================== */}
      <section className="relative w-full overflow-hidden border-b border-[#E5DDD4] soulaide-hero-mesh pt-12 pb-16">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-plum-200/80 text-plum-800 text-xs font-semibold shadow-2xs backdrop-blur-sm">
            <MessageSquare className="w-3.5 h-3.5 text-plum-600" />
            <span>Care Coordinator &amp; Lokasi Klinik</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1E1429] tracking-tight">
            Hubungi <span className="font-serif italic font-semibold text-plum-700">Soulaide</span>
          </h1>
          <p className="text-sm sm:text-base text-[#554B61] max-w-2xl mx-auto leading-relaxed">
            Tim operasional kami siap memandu proses reservasi, konfirmasi jadwal sesi, serta menjawab pertanyaan layanan konseling Anda.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Emergency Crisis Alert */}
        <CrisisDisclaimerBanner />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-stretch">
          {/* WhatsApp Card */}
          <Card className="flex flex-col justify-between rounded-3xl sanctuary-card-hover">
            <div>
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-2xl bg-plum-50 text-plum-700 flex items-center justify-center mb-3 border border-plum-100">
                  <MessageSquare className="w-5.5 h-5.5" />
                </div>
                <CardTitle className="text-xl font-bold text-[#1E1429]">
                  WhatsApp Resmi Klien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-[#645A70] leading-relaxed">
                  Terkoneksi langsung dengan Care Coordinator Soulaide untuk konsultasi pemilihan layanan, konfirmasi pembayaran, dan informasi teknis sesi.
                </p>

                <div className="p-4 bg-sanctuary-100 rounded-2xl border border-[#EAE3DC] space-y-1.5">
                  <p className="text-[11px] text-[#72677E] font-bold uppercase tracking-wider">
                    Nomor Layanan Resmi
                  </p>
                  <p className="text-lg font-extrabold text-plum-900 tracking-wide tabular-nums">
                    {settings.whatsappNumber}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-[#645A70] pt-1">
                    <Clock className="w-3.5 h-3.5 text-plum-600" />
                    <span>Respon rata-rata &lt; 30 menit (09.00 – 20.00 WIB)</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-[#5A5066]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-plum-600 shrink-0" />
                    <span>Panduan langkah demi langkah proses reservasi</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-plum-600 shrink-0" />
                    <span>Bantuan perubahan jadwal (reschedule) &amp; teknis link Meet</span>
                  </div>
                </div>
              </CardContent>
            </div>

            <div className="p-6 pt-2">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full gap-2 h-11 rounded-xl">
                  <Phone className="w-4 h-4 text-plum-200" />
                  <span>Mulai Chat di WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
                </Button>
              </a>
            </div>
          </Card>

          {/* Offline Practice Card */}
          <Card className="flex flex-col justify-between rounded-3xl sanctuary-card-hover">
            <div>
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-2xl bg-champagne-50 text-champagne-700 flex items-center justify-center mb-3 border border-champagne-200/80">
                  <MapPin className="w-5.5 h-5.5" />
                </div>
                <CardTitle className="text-xl font-bold text-[#1E1429]">Klinik Tatap Muka</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-sm text-[#645A70]">
                <div className="p-4 bg-sanctuary-100 rounded-2xl border border-[#EAE3DC] space-y-1">
                  <p className="text-[11px] text-[#72677E] font-bold uppercase tracking-wider">
                    Alamat Praktik
                  </p>
                  <p className="text-sm font-bold text-[#1E1429] leading-snug">
                    {settings.offlineAddress}
                  </p>
                  <p className="text-xs text-[#645A70] pt-1">
                    Kecamatan Duren Sawit, Kota Jakarta Timur, DKI Jakarta 13430
                  </p>
                </div>

                <p className="text-xs text-[#645A70] leading-relaxed">
                  Ruang konsultasi bernuansa hangat, tenang, kedap suara, dan kondusif untuk menjaga privasi mutlak sesi konseling Anda bersama psikolog.
                </p>

                <div className="pt-3 space-y-2.5 border-t border-[#F2ECE6] text-xs text-[#4B3F59]">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-plum-600 shrink-0" />
                    <span>
                      <strong className="text-[#1E1429]">Jadwal Praktik:</strong> Sesuai Janji Temu Terkonfirmasi
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-plum-600 shrink-0" />
                    <span>
                      <strong className="text-[#1E1429]">Surel Resmi:</strong> halo@soulaide.id
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-plum-600 shrink-0" />
                    <span>Hanya melayani klien dengan reservasi terjadwal</span>
                  </div>
                </div>
              </CardContent>
            </div>

            <div className="p-6 pt-2">
              <a
                href="https://maps.google.com/?q=Pondok+Bambu+Jakarta+Timur"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full gap-2 h-11 rounded-xl">
                  <MapPin className="w-4 h-4 text-plum-600" />
                  <span>Buka Petunjuk Arah di Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-60" />
                </Button>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
