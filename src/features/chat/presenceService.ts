import { supabase } from '@/lib/supabase/client.ts';
import type { PresenceStatus } from './types.ts';

export const PRESENCE_CONFIG: Record<
  PresenceStatus,
  { label: string; color: string; badgeVariant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' }
> = {
  offline: { label: 'Offline', color: 'bg-slate-400', badgeVariant: 'secondary' },
  online: { label: 'Online', color: 'bg-blue-500', badgeVariant: 'outline' },
  available: { label: 'Siap Melayani', color: 'bg-emerald-500', badgeVariant: 'success' },
  busy: { label: 'Sedang Sesi', color: 'bg-amber-500', badgeVariant: 'warning' },
  away: { label: 'Sementara Tidak Aktif', color: 'bg-slate-500', badgeVariant: 'secondary' },
};

export const presenceService = {
  /**
   * Fetches current presence status for a psychologist.
   */
  async getPsychologistPresence(psychologistId: string): Promise<PresenceStatus> {
    const { data, error } = await supabase
      .from('Soulaide_psychologist_presence')
      .select('status, last_active_at')
      .eq('psychologist_id', psychologistId)
      .limit(1);

    if (error || !data || data.length === 0) {
      return 'offline';
    }

    return (data[0].status as PresenceStatus) || 'offline';
  },

  /**
   * Updates psychologist presence status in database.
   */
  async updatePsychologistPresence(psychologistId: string, status: PresenceStatus): Promise<void> {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('Soulaide_psychologist_presence')
      .upsert(
        {
          psychologist_id: psychologistId,
          status,
          last_active_at: now,
        },
        { onConflict: 'psychologist_id' }
      );

    if (error) {
      throw new Error(`Gagal memperbarui status kehadiran: ${error.message}`);
    }
  },

  /**
   * Subscribes to presence updates for a specific psychologist.
   */
  subscribeToPresence(
    psychologistId: string,
    onStatusChange: (status: PresenceStatus, lastActive: string) => void
  ): () => void {
    const channel = supabase
      .channel(`presence_psychologist_${psychologistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Soulaide_psychologist_presence',
          filter: `psychologist_id=eq.${psychologistId}`,
        },
        (payload) => {
          const row = payload.new as { status?: PresenceStatus; last_active_at?: string };
          if (row && row.status) {
            onStatusChange(row.status, row.last_active_at || new Date().toISOString());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribes to presence updates across all psychologists.
   */
  subscribeToAllPresence(
    onMapChange: (presenceMap: Record<string, PresenceStatus>) => void
  ): () => void {
    const channel = supabase
      .channel('presence_all_psychologists')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Soulaide_psychologist_presence',
        },
        (payload) => {
          const row = payload.new as { psychologist_id?: string; status?: PresenceStatus };
          if (row && row.psychologist_id && row.status) {
            onMapChange({ [row.psychologist_id]: row.status });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
