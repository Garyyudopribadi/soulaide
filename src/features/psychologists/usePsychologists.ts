import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client.ts'
import type { PsychologistProfile, PresenceStatus } from '@/types/index.ts'
import { initialPsychologists } from './data.ts'

export interface PsychologistWithPresence extends PsychologistProfile {
  presence: PresenceStatus
}

export function usePsychologists() {
  return useQuery<PsychologistWithPresence[]>({
    queryKey: ['soulaide-psychologists'],
    queryFn: async () => {
      try {
        const { data: psychs, error: psychsError } = await supabase
          .from('Soulaide_psychologists')
          .select('*')
          .eq('is_active', true)

        const { data: presenceData } = await supabase
          .from('Soulaide_psychologist_presence')
          .select('psychologist_id, status')

        const presenceMap = new Map<string, PresenceStatus>()
        if (presenceData) {
          presenceData.forEach((p) => {
            presenceMap.set(p.psychologist_id, p.status as PresenceStatus)
          })
        }

        if (psychsError || !psychs || psychs.length === 0) {
          return initialPsychologists.map((p) => ({
            ...p,
            presence: 'available' as PresenceStatus,
          }))
        }

        return psychs.map((p) => {
          const isSenior = (p.experience_years && (p.experience_years.includes('> 10') || p.experience_years.toLowerCase().includes('senior'))) || p.full_name.includes('Finandita')
          return {
            id: p.id,
            fullName: p.full_name,
            credentials: p.credentials,
            experienceYears: p.experience_years,
            initialSchedule: p.initial_schedule ?? 'By appointment',
            practiceAreas: p.practice_areas,
            approaches: p.approaches,
            cardImage: p.card_image_url || '/Soulaide Psi Arc Logo.png',
            profileImage: p.profile_image_url || '/Soulaide Psi Arc Logo.png',
            presence: presenceMap.get(p.id) ?? 'available',
            tier: isSenior ? ('Soul Expert' as const) : ('Soul Guidance' as const),
            isBot: Boolean(p.is_bot),
            userId: p.user_id ?? null,
          }
        })
      } catch {
        return initialPsychologists.map((p) => ({
          ...p,
          presence: 'available' as PresenceStatus,
        }))
      }
    },
    initialData: initialPsychologists.map((p) => ({
      ...p,
      presence: 'available' as PresenceStatus,
    })),
  })
}
