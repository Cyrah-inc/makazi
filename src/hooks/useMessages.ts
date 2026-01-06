import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Message, MessageFormData } from '@/types/message';

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch messages where user is sender or recipient
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs for profile lookup
      const userIds = new Set<string>();
      const propertyIds = new Set<string>();
      
      data?.forEach(msg => {
        userIds.add(msg.sender_id);
        userIds.add(msg.recipient_id);
        if (msg.property_id) propertyIds.add(msg.property_id);
      });

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, email')
        .in('user_id', Array.from(userIds));

      // Fetch properties if any
      let properties: { id: string; title: string }[] = [];
      if (propertyIds.size > 0) {
        const { data: propData } = await supabase
          .from('properties')
          .select('id, title')
          .in('id', Array.from(propertyIds));
        properties = propData || [];
      }

      // Map profiles and properties to messages
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const propertyMap = new Map(properties.map(p => [p.id, p]));

      const enrichedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id) || undefined,
        recipient: profileMap.get(msg.recipient_id) || undefined,
        property: msg.property_id ? propertyMap.get(msg.property_id) || undefined : undefined,
      }));

      setMessages(enrichedMessages);
      
      // Count unread
      const unread = enrichedMessages.filter(m => 
        m.recipient_id === user.id && !m.is_read
      ).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const sendMessage = async (data: MessageFormData): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to send messages.',
        variant: 'destructive',
      });
      return false;
    }

    // Validate inputs
    const subject = data.subject.trim();
    const content = data.content.trim();

    if (!subject || subject.length > 200) {
      toast({
        title: 'Error',
        description: 'Subject must be between 1 and 200 characters.',
        variant: 'destructive',
      });
      return false;
    }

    if (!content || content.length > 5000) {
      toast({
        title: 'Error',
        description: 'Message must be between 1 and 5000 characters.',
        variant: 'destructive',
      });
      return false;
    }

    if (data.recipient_id === user.id) {
      toast({
        title: 'Error',
        description: 'You cannot send a message to yourself.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: data.recipient_id,
          subject,
          content,
          property_id: data.property_id || null,
        });

      if (error) throw error;

      toast({
        title: 'Message Sent',
        description: 'Your message has been sent successfully.',
      });

      await fetchMessages();
      return true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const markAsRead = async (messageId: string): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', user.id);

      if (error) throw error;

      setMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, is_read: true } : m)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      
      toast({
        title: 'Message Deleted',
        description: 'The message has been deleted.',
      });
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMessages]);

  return {
    messages,
    loading,
    unreadCount,
    sendMessage,
    markAsRead,
    deleteMessage,
    refetch: fetchMessages,
  };
};
