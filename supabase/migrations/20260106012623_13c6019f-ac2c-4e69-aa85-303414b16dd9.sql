-- Create messages table for direct communication
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Optional: link to a property for context
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  -- Prevent self-messaging
  CONSTRAINT no_self_messaging CHECK (sender_id != recipient_id)
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent
CREATE POLICY "Users can view sent messages"
ON public.messages
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id);

-- Users can view messages they received
CREATE POLICY "Users can view received messages"
ON public.messages
FOR SELECT
TO authenticated
USING (auth.uid() = recipient_id);

-- Users can send messages (insert)
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Recipients can mark messages as read (update is_read only)
CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id);

-- Senders can delete their own messages
CREATE POLICY "Senders can delete own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Admins can view all messages for moderation
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_unread ON public.messages(recipient_id, is_read) WHERE is_read = false;

-- Update timestamp trigger
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();