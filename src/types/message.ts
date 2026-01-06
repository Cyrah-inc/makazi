export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  property_id: string | null;
  // Joined data
  sender?: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
  recipient?: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
  property?: {
    title: string;
  };
}

export interface MessageFormData {
  recipient_id: string;
  subject: string;
  content: string;
  property_id?: string | null;
}
