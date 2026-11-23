import { supabase } from '@/lib/supabase/client.ts';
import type { ChatMessage, Conversation } from './types.ts';

export const chatService = {
  /**
   * Finds or creates the coordination thread for a booking via the
   * Soulaide_open_booking_thread RPC. The RPC enforces access (client,
   * assigned psychologist, admin) and registers participants with the
   * correct auth uids, including psychologists without auth accounts.
   */
  async getOrCreateBookingConversation(bookingId: string): Promise<Conversation> {
    const { data, error } = await supabase.rpc('Soulaide_open_booking_thread', {
      p_booking_id: bookingId,
    });

    const result = data as { success?: boolean; conversation_id?: string; error?: string } | null;
    if (error || !result?.success || !result.conversation_id) {
      throw new Error(`Gagal membuka kanal percakapan: ${result?.error || error?.message || 'respons tidak valid'}`);
    }

    const { data: conv, error: convError } = await supabase
      .from('Soulaide_conversations')
      .select('id, booking_id, created_at, updated_at')
      .eq('id', result.conversation_id)
      .single();

    if (convError || !conv) {
      throw new Error(`Gagal memuat percakapan: ${convError?.message}`);
    }

    return {
      id: conv.id,
      booking_id: conv.booking_id,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
    };
  },

  /**
   * Fetches message history for a conversation.
   */
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('Soulaide_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Gagal mengambil riwayat pesan: ${error.message}`);
    }

    return (data || []).map((msg) => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      content: msg.content,
      is_read: msg.is_read,
      created_at: msg.created_at,
    }));
  },

  /**
   * Sends a new message to a conversation.
   */
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<ChatMessage> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('Pesan tidak boleh kosong.');
    }

    const { data, error } = await supabase
      .from('Soulaide_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: trimmed,
        is_read: false,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Gagal mengirim pesan: ${error?.message}`);
    }

    return {
      id: data.id,
      conversation_id: data.conversation_id,
      sender_id: data.sender_id,
      content: data.content,
      is_read: data.is_read,
      created_at: data.created_at,
    };
  },

  /**
   * Marks unread messages in a conversation as read.
   */
  async markMessagesAsRead(conversationId: string, currentUserId: string): Promise<void> {
    const { error } = await supabase
      .from('Soulaide_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false);

    if (error) {
      console.warn('Gagal menandai pesan terbaca:', error.message);
    }
  },

  /**
   * Subscribes to new messages in a conversation via Supabase Realtime channel.
   */
  subscribeToMessages(
    conversationId: string,
    onMessage: (message: ChatMessage) => void
  ): () => void {
    const channel = supabase
      .channel(`chat_room_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Soulaide_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newRow = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            is_read: boolean;
            created_at: string;
          };
          if (newRow) {
            onMessage({
              id: newRow.id,
              conversation_id: newRow.conversation_id,
              sender_id: newRow.sender_id,
              content: newRow.content,
              is_read: newRow.is_read,
              created_at: newRow.created_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
