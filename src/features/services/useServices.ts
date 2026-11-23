import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client.ts'
import type { ServiceDetail, DeliveryMethod } from '@/types/index.ts'

export const fallbackServices: ServiceDetail[] = [
  {
    id: 's1000000-0000-0000-0000-000000000001',
    title: 'Layanan Konseling Individu',
    category: 'Soul Guidance',
    duration: '1 Sesi Konseling / 60 Menit',
    method: 'Online & Tatap Muka (Offline)',
    price: 110000,
    priceOnline: 110000,
    priceOffline: 350000,
    deliveryMethods: ['online', 'offline'],
    description:
      'Sesi konseling 1-on-1 selama 60 menit bersama psikolog profesional untuk memahami pikiran, emosi, stres, quarter-life crisis, karier, maupun dinamika relasi.',
    isConfirmedPrice: true,
  },
  {
    id: 's2000000-0000-0000-0000-000000000002',
    title: 'Layanan MHCU (Mental Health Check Up)',
    category: 'Soul Guidance',
    duration: 'Asesmen + 1 Sesi Konseling / 30 Menit',
    method: 'Online & Tatap Muka (Offline)',
    price: 89000,
    priceOnline: 89000,
    priceOffline: 200000,
    deliveryMethods: ['online', 'offline'],
    description:
      'Pemeriksaan kesehatan mental terstruktur dilengkapi 1 sesi konseling pembahasan awal selama 30 menit untuk memahami kondisi emosional, tingkat stres, serta rekomendasi awal.',
    isConfirmedPrice: true,
  },
  {
    id: 's3000000-0000-0000-0000-000000000003',
    title: 'Bundling MHCU+Konseling Individu Online',
    category: 'Soul Guidance',
    duration: 'Asesmen + 1 Sesi Penyampaian Hasil MHCU / 30 Menit + 1 Sesi Konseling / 60 Menit',
    method: 'Daring (Online via Google Meet)',
    price: 169000,
    priceOnline: 169000,
    priceOffline: null,
    deliveryMethods: ['online'],
    description:
      'Paket terintegrasi terbaik: asesmen MHCU menyeluruh, 1 sesi penyampaian hasil MHCU (30 menit), dan 1 sesi konseling individu mendalam (60 menit) secara online.',
    isConfirmedPrice: true,
  },
]

export function useServices() {
  return useQuery<ServiceDetail[]>({
    queryKey: ['soulaide-services'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('Soulaide_services')
          .select(`
            id,
            name,
            slug,
            description,
            duration_minutes,
            delivery_methods,
            price_online,
            price_offline,
            is_active,
            category_id
          `)
          .eq('is_active', true)

        if (error || !data || data.length === 0) {
          return fallbackServices
        }

        return data.map((item) => ({
          id: item.id,
          title: item.name,
          category: 'Soul Guidance' as const,
          duration: `${item.duration_minutes} Menit`,
          method:
            item.delivery_methods?.length === 1 && item.delivery_methods[0] === 'online'
              ? 'Daring (Online via Google Meet)'
              : 'Online & Tatap Muka (Offline)',
          price: item.price_online ?? item.price_offline ?? null,
          priceOnline: item.price_online,
          priceOffline: item.price_offline,
          deliveryMethods: (item.delivery_methods as DeliveryMethod[]) || ['online', 'offline'],
          description: item.description ?? '',
          isConfirmedPrice: item.price_online !== null || item.price_offline !== null,
        }))
      } catch {
        return fallbackServices
      }
    },
    initialData: fallbackServices,
  })
}
