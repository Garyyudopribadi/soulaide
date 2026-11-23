import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, FileBadge2 } from 'lucide-react'
import { usePsychologists } from '@/features/psychologists/usePsychologists.ts'
import { Modal } from './components.tsx'

export const PsychologistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { data: psychologists } = usePsychologists()
  const [showOfficialCard, setShowOfficialCard] = useState(false)

  const psychologist = psychologists.find((p) => p.id === id)

  if (!psychologist) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="display text-2xl">Profil psikolog tidak ditemukan.</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Profil yang kamu cari tidak tersedia atau telah berpindah.
        </p>
        <Link to="/psychologists" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke daftar psikolog
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link
        to="/psychologists"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-plum-700 hover:text-plum-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Semua psikolog
      </Link>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="panel overflow-hidden">
            <img
              src={psychologist.profileImage || psychologist.cardImage}
              alt={`Potret ${psychologist.fullName}`}
              width={600}
              height={800}
              fetchPriority="high"
              className="aspect-[3/4] w-full object-cover object-top"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowOfficialCard(true)}
            className="btn-outline mt-4 w-full"
          >
            <FileBadge2 className="h-4 w-4 text-plum-700" />
            Lihat kartu resmi
          </button>
        </div>

        <div className="space-y-8 lg:col-span-8">
          <div>
            <p className="kicker">{psychologist.tier ?? 'Soul Guidance'}</p>
            <h1 className="display mt-2 text-3xl sm:text-4xl">{psychologist.fullName}</h1>
            <p className="mt-2 text-sm font-semibold text-plum-700">{psychologist.credentials}</p>
            <p className="mt-1 text-sm text-ink-soft">Pengalaman {psychologist.experienceYears}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="panel p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                <Clock className="h-4 w-4 text-plum-600" />
                Jadwal praktik
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {psychologist.initialSchedule}
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                Pemesanan membutuhkan lead time minimal 24 jam.
              </p>
            </div>
            <div className="panel p-5">
              <h2 className="text-sm font-bold text-ink">Pendekatan</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {psychologist.approaches.join(', ')}
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                Disesuaikan dengan kebutuhanmu, dalam kerahasiaan Kode Etik HIMPSI.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-ink">Topik praktik</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {psychologist.practiceAreas.map((area) => (
                <li
                  key={area}
                  className="rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-medium text-ink-soft"
                >
                  {area}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <Link to={`/booking?psychologist=${psychologist.id}`} className="btn-primary btn-lg">
              <Calendar className="h-4 w-4" />
              Booking dengan {psychologist.fullName.split(' ')[0]}
            </Link>
            <Link to="/services" className="btn-outline btn-lg">
              Lihat layanan dan tarif
            </Link>
          </div>
          {psychologist.tier === 'Soul Expert' && (
            <p className="text-xs text-ink-soft">
              Tarif Soul Expert dikonfirmasi saat booking. Tanya admin via WhatsApp bila
              perlu sebelum memilih jadwal.
            </p>
          )}
        </div>
      </div>

      <Modal
        open={showOfficialCard}
        onClose={() => setShowOfficialCard(false)}
        label={`Kartu resmi ${psychologist.fullName}`}
      >
        <div className="p-3">
          <img
            src={psychologist.cardImage}
            alt={`Kartu resmi ${psychologist.fullName}`}
            className="w-full rounded-lg object-contain"
          />
        </div>
      </Modal>
    </div>
  )
}
