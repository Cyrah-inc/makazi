import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useTypingIndicator(conversationId: string | null) {
  const { user } = useAuth();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`typing-${conversationId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.userId !== user.id) {
          setIsOtherTyping(true);
          // Auto-clear after 3 seconds
          if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
          clearTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [conversationId, user]);

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    
    // Debounce: only send every 2 seconds
    if (timeoutRef.current) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id },
    });

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = undefined;
    }, 2000);
  }, [user]);

  return { isOtherTyping, sendTyping };
}
