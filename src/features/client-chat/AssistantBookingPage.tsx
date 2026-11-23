/**
 * Public booking page (/booking): the assistant conversation, open to everyone.
 * Deep links (?service= / ?psychologist=) preselect flow steps. The booking
 * itself gates on login at the confirm step; drafts survive the round-trip.
 */

import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AssistantChat } from './AssistantChat.tsx'
import { CrisisDisclaimerBanner } from '@/features/chat/CrisisDisclaimerBanner.tsx'

export const AssistantBookingPage: React.FC = () => {
  const [params] = useSearchParams()
  const seed = {
    serviceId: params.get('service') || undefined,
    psychologistId: params.get('psychologist') || undefined,
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-plum-700 transition-colors hover:text-plum-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke beranda
      </Link>

      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-plum-500">
          Pemesanan sesi
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-plum-950">
          Pesan lewat percakapan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5A5066]">
          Asisten Soulaide memandu Anda memilih layanan, psikolog, dan jadwal, lalu menyelesaikan
          pembayaran QRIS. Semua aktivitas sesi tersimpan dalam thread percakapan Anda.
        </p>
      </div>

      <div className="h-[calc(100dvh-320px)] min-h-[460px] overflow-hidden rounded-2xl border border-[#E3DACF] bg-sanctuary-100 shadow-2xs">
        <AssistantChat seed={seed} />
      </div>

      <CrisisDisclaimerBanner compact className="mt-5" />
    </div>
  )
}