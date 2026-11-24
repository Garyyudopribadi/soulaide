import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client.ts'
import type { PsychologistProfile, PresenceStatus } from '@/types/index.ts'
import { initialPsychologists } from './data.ts'
import { getAssetUrl } from '@/lib/utils.ts'

export interface UpdatePsychologistInput {
  id: string
  fullName?: string
  credentials?: string
  experienceYears?: string
  initialSchedule?: string
  practiceAreas?: string[]
  approaches?: string[]
  cardImageUrl?: string
  profileImageUrl?: string
  bio?: string
  isActive?: boolean
}

export interface PsychologistWithPresence extends PsychologistProfile {
  presence: PresenceStatus
  isActive?: boolean
  bio?: string
}

export interface CreatePsychologistInput {
  fullName: string
  credentials: string
  experienceYears: string
  initialSchedule?: string
  practiceAreas: string[]
  approaches: string[]
  cardImageUrl?: string
  profileImageUrl?: string
  bio?: string
}

export function usePsychologists() {
  const queryClient = useQueryClient()

  const query = useQuery<PsychologistWithPresence[]>({
    queryKey: ['soulaide-psychologists'],
    queryFn: async () => {
      try {
        const { data: psychs, error: psychsError } = await supabase
          .from('Soulaide_psychologists')
          .select('*')

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
            isActive: true,
          }))
        }

        return psychs.map((p) => {
          const isSenior =
            (p.experience_years &&
              (p.experience_years.includes('> 10') ||
                p.experience_years.toLowerCase().includes('senior'))) ||
            p.full_name.includes('Finandita')

          // Match matching initial profile for fallbacks if database image fields are missing
          const matchingInitial = initialPsychologists.find((init) =>
            init.fullName.toLowerCase().includes(p.full_name.toLowerCase()) ||
            p.full_name.toLowerCase().includes(init.fullName.toLowerCase())
          )

          const cardImg = p.card_image_url
            ? getAssetUrl(p.card_image_url)
            : matchingInitial?.cardImage || getAssetUrl('/Soulaide Psi Arc Logo.webp')

          const profileImg = p.profile_image_url
            ? getAssetUrl(p.profile_image_url)
            : matchingInitial?.profileImage || getAssetUrl('/Soulaide Psi Arc Logo.webp')

          return {
            id: p.id,
            fullName: p.full_name,
            credentials: p.credentials,
            experienceYears: p.experience_years,
            initialSchedule: p.initial_schedule ?? 'By appointment',
            practiceAreas: p.practice_areas,
            approaches: p.approaches,
            cardImage: cardImg,
            profileImage: profileImg,
            presence: presenceMap.get(p.id) ?? 'available',
            tier: isSenior ? ('Soul Expert' as const) : ('Soul Guidance' as const),
            isActive: p.is_active,
          }
        })
      } catch {
        return initialPsychologists.map((p) => ({
          ...p,
          presence: 'available' as PresenceStatus,
          isActive: true,
        }))
      }
    },
    initialData: initialPsychologists.map((p) => ({
      ...p,
      presence: 'available' as PresenceStatus,
      isActive: true,
    })),
  })

  const updatePresenceMutation = useMutation({
    mutationFn: async ({
      psychologistId,
      status,
    }: {
      psychologistId: string
      status: PresenceStatus
    }) => {
      // Upsert presence in Soulaide_psychologist_presence
      const { error } = await supabase.from('Soulaide_psychologist_presence').upsert(
        {
          psychologist_id: psychologistId,
          status,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: 'psychologist_id' }
      )

      if (error) {
        throw new Error(`Gagal mengubah ketersediaan: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soulaide-psychologists'] })
    },
  })

  const updatePsychologistMutation = useMutation({
    mutationFn: async (input: UpdatePsychologistInput) => {
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      if (input.fullName !== undefined) {
        payload.full_name = input.fullName
        payload.slug = input.fullName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-')
      }
      if (input.credentials !== undefined) payload.credentials = input.credentials
      if (input.experienceYears !== undefined) payload.experience_years = input.experienceYears
      if (input.initialSchedule !== undefined) payload.initial_schedule = input.initialSchedule
      if (input.practiceAreas !== undefined) payload.practice_areas = input.practiceAreas
      if (input.approaches !== undefined) payload.approaches = input.approaches
      if (input.cardImageUrl !== undefined) payload.card_image_url = input.cardImageUrl
      if (input.profileImageUrl !== undefined) payload.profile_image_url = input.profileImageUrl
      if (input.bio !== undefined) payload.bio = input.bio
      if (input.isActive !== undefined) payload.is_active = input.isActive

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('Soulaide_psychologists') as any)
        .update(payload)
        .eq('id', input.id)

      if (error) {
        throw new Error(`Gagal memperbarui profil psikolog: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soulaide-psychologists'] })
    },
  })

  const createPsychologistMutation = useMutation({
    mutationFn: async (input: CreatePsychologistInput) => {
      const slug = input.fullName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('Soulaide_psychologists') as any).insert({
        full_name: input.fullName,
        slug,
        credentials: input.credentials,
        experience_years: input.experienceYears,
        initial_schedule: input.initialSchedule || 'Senin – Sabtu, by appointment',
        practice_areas: input.practiceAreas,
        approaches: input.approaches,
        card_image_url: input.cardImageUrl || null,
        profile_image_url: input.profileImageUrl || null,
        bio: input.bio || null,
        is_active: true,
        is_bot: false,
      })

      if (error) {
        throw new Error(`Gagal menambahkan psikolog baru: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soulaide-psychologists'] })
    },
  })

  const deletePsychologistMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('Soulaide_psychologists') as any)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        throw new Error(`Gagal menonaktifkan psikolog: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soulaide-psychologists'] })
    },
  })

  return {
    ...query,
    updatePresence: updatePresenceMutation.mutateAsync,
    isUpdatingPresence: updatePresenceMutation.isPending,
    updatePsychologist: updatePsychologistMutation.mutateAsync,
    isUpdatingPsychologist: updatePsychologistMutation.isPending,
    createPsychologist: createPsychologistMutation.mutateAsync,
    isCreatingPsychologist: createPsychologistMutation.isPending,
    deletePsychologist: deletePsychologistMutation.mutateAsync,
    isDeletingPsychologist: deletePsychologistMutation.isPending,
  }
}
