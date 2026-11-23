import React, { useState } from 'react'
import { Card } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { useServices } from '@/features/services/useServices.ts'
import { formatIDR } from '@/lib/utils.ts'
import { Check, Edit2 } from 'lucide-react'

export const AdminCmsServices: React.FC = () => {
  const { data: services } = useServices()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tempPrice, setTempPrice] = useState<number>(0)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)

  const handleStartEdit = (id: string, currentPrice: number | null) => {
    setEditingId(id)
    setTempPrice(currentPrice ?? 0)
    setSavedNotice(null)
  }

  const handleSavePrice = (title: string) => {
    setEditingId(null)
    setSavedNotice(`Harga untuk "${title}" berhasil diperbarui ke ${formatIDR(tempPrice)}.`)
    setTimeout(() => setSavedNotice(null), 4000)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manajemen Layanan & Tarif</h2>
          <p className="text-xs text-slate-500">Kelola informasi katalog layanan, metode sesi, dan tarif konseling.</p>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2 border border-emerald-200">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {services.map((svc) => (
          <Card key={svc.id}>
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{svc.category}</Badge>
                  <span className="text-xs text-slate-400 font-medium">{svc.duration}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{svc.title}</h3>
                <p className="text-xs text-slate-500 max-w-xl">{svc.description}</p>
                <p className="text-xs text-emerald-700 font-medium">{svc.method}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {editingId === svc.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(Number(e.target.value))}
                      className="w-32 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    <Button size="sm" onClick={() => handleSavePrice(svc.title)}>
                      Simpan
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Batal
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-slate-900">
                      {svc.price !== null ? formatIDR(svc.price) : 'Belum ditentukan'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartEdit(svc.id, svc.price)}
                      className="gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Tarif
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
