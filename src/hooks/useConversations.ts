import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Conversation } from '@/types/conversation';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Collect other user IDs and property IDs
      const otherUserIds = new Set<string>();
      const propertyIds = new Set<string>();

      data.forEach(c => {
        const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
        otherUserIds.add(otherId);
        if (c.property_id) propertyIds.add(c.property_id);
      });

      // Parallel fetch profiles, properties, unread counts
      const [profilesRes, propertiesRes, unreadRes] = await Promise.all([
        supabase.rpc('get_public_profiles', { user_ids: Array.from(otherUserIds) }),
        propertyIds.size > 0
          ? supabase.from('properties').select('id, title, images, price, property_type, city').in('id', Array.from(propertyIds))
          : Promise.resolve({ data: [] }),
        supabase.from('messages').select('conversation_id').eq('recipient_id', user.id).eq('is_read', false),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
      const propertyMap = new Map((propertiesRes.data || []).map(p => [p.id, p]));

      // Count unread per conversation
      const unreadMap = new Map<string, number>();
      (unreadRes.data || []).forEach(m => {
        if (m.conversation_id) {
          unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) || 0) + 1);
        }
      });

      const enriched: Conversation[] = data.map(c => {
        const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
        return {
          ...c,
          other_user: profileMap.get(otherId) ? { ...profileMap.get(otherId)!, user_id: otherId } : undefined,
          property: c.property_id ? propertyMap.get(c.property_id) || undefined : undefined,
          unread_count: unreadMap.get(c.id) || 0,
        };
      });

      setConversations(enriched);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('conversations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
};
