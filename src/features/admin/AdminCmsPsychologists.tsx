import React, { useState } from 'react'
import { Card } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { usePsychologists } from '@/features/psychologists/usePsychologists.ts'
import { Check } from 'lucide-react'

export const AdminCmsPsychologists: React.FC = () => {
  const { data: psychologists } = usePsychologists()
  const [notice, setNotice] = useState<string | null>(null)

  const handleToggleActive = (name: string) => {
    setNotice(`Status aktif untuk "${name}" berhasil diperbarui.`)
    setTimeout(() => setNotice(null), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Manajemen Profil Psikolog</h2>
        <p className="text-xs text-slate-500">Kelola daftar psikolog aktif, kredensial, dan informasi jadwal.</p>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2 border border-emerald-200">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {psychologists.map((psych) => (
          <Card key={psych.id} className="flex flex-col justify-between">
            <div className="p-4 sm:p-5 flex gap-4">
              <div className="w-20 h-24 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                <img
                  src={psych.cardImage}
                  alt={psych.fullName}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/Soulaide Psi Arc Logo.png'
                  }}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{psych.fullName}</h3>
                  <Badge variant="success" className="text-[10px]">Aktif</Badge>
                </div>
                <p className="text-xs text-emerald-700 font-medium">{psych.credentials}</p>
                <p className="text-xs text-slate-500">Pengalaman: {psych.experienceYears}</p>
                <p className="text-xs text-slate-400">Jadwal: {psych.initialSchedule}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {psych.practiceAreas.slice(0, 3).map((a, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0">{a}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-slate-400">Status Sesi: {psych.presence}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleActive(psych.fullName)}
                >
                  Ubah Ketersediaan
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
