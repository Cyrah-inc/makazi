import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/types/conversation';

export const useChat = (conversationId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, recipient_id, subject, content, is_read, created_at, property_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark unread messages as read
      const unreadIds = (data || [])
        .filter(m => m.recipient_id === user.id && !m.is_read)
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadIds);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!conversationId || !user || !content.trim()) return false;

    // Get conversation to find recipient
    const { data: convo, error: convoErr } = await supabase
      .from('conversations')
      .select('participant_1, participant_2, property_id')
      .eq('id', conversationId)
      .single();

    if (convoErr || !convo) {
      toast({ title: 'Error', description: 'Conversation not found.', variant: 'destructive' });
      return false;
    }

    const recipientId = convo.participant_1 === user.id ? convo.participant_2 : convo.participant_1;

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: recipientId,
      conversation_id: conversationId,
      subject: 'Chat',
      content: content.trim(),
      property_id: convo.property_id,
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
      return false;
    }

    // Update conversation preview
    await supabase.from('conversations').update({
      last_message_at: new Date().toISOString(),
      last_message_preview: content.trim().substring(0, 100),
    }).eq('id', conversationId);

    await fetchMessages();
    return true;
  };

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Real-time
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user, fetchMessages]);

  return { messages, loading, sendMessage, refetch: fetchMessages };
};

// Helper to find or create a conversation
export const findOrCreateConversation = async (
  userId: string,
  otherUserId: string,
  propertyId: string | null
): Promise<string | null> => {
  // Sort IDs for consistent unique constraint
  const [p1, p2] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

  // Try to find existing
  let query = supabase
    .from('conversations')
    .select('id')
    .eq('participant_1', p1)
    .eq('participant_2', p2);

  if (propertyId) {
    query = query.eq('property_id', propertyId);
  } else {
    query = query.is('property_id', null);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) return existing.id;

  // Create new
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      participant_1: p1,
      participant_2: p2,
      property_id: propertyId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return created.id;
};
