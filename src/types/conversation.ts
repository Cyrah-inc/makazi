export interface Conversation {
  id: string;
  property_id: string | null;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  // Joined data
  other_user?: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    email?: string | null;
  };
  property?: {
    id: string;
    title: string;
    images: string[] | null;
    price: number;
    property_type: string;
    city: string;
  };
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string | null;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  property_id: string | null;
}
