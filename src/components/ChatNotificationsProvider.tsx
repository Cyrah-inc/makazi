import { useChatNotifications } from '@/hooks/useChatNotifications';

export function ChatNotificationsProvider() {
  useChatNotifications();
  return null;
}
