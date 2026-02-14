import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useChatNotifications() {
  const { user } = useAuth();
  const permissionRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => {
        permissionRef.current = p === 'granted';
      });
    } else {
      permissionRef.current = Notification.permission === 'granted';
    }

    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          const msg = payload.new as any;
          
          // Only notify if tab is hidden or user isn't on that chat
          const onChatPage = window.location.pathname.includes('/chats') && 
            window.location.search.includes(msg.conversation_id);
          
          if (onChatPage && !document.hidden) return;
          if (!permissionRef.current) return;

          // Fetch sender name
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', msg.sender_id)
            .single();

          const senderName = profile?.full_name || profile?.email || 'Someone';
          const preview = msg.content?.substring(0, 80) || 'New message';

          const notification = new Notification(`${senderName}`, {
            body: preview,
            icon: '/favicon.ico',
            tag: msg.conversation_id, // Collapse notifications per conversation
          });

          notification.onclick = () => {
            window.focus();
            window.location.href = `/dashboard/chats?c=${msg.conversation_id}`;
            notification.close();
          };
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}
