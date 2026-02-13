import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { findOrCreateConversation } from '@/hooks/useChat';
import { QuickPrompts } from './QuickPrompts';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface InlineChatInputProps {
  propertyId: string;
  landlordId: string;
  propertyTitle: string;
}

export function InlineChatInput({ propertyId, landlordId, propertyTitle }: InlineChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="hero" size="lg" className="w-full gap-2">
          <MessageCircle className="h-5 w-5" />
          Sign in to Chat
        </Button>
      </Link>
    );
  }

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const conversationId = await findOrCreateConversation(user.id, landlordId, propertyId);
      if (!conversationId) throw new Error('Failed to create conversation');

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: landlordId,
        conversation_id: conversationId,
        subject: `Inquiry: ${propertyTitle}`,
        content: message.trim(),
        property_id: propertyId,
      });

      if (error) throw error;

      // Update conversation preview
      await supabase.from('conversations').update({
        last_message_at: new Date().toISOString(),
        last_message_preview: message.trim().substring(0, 100),
      }).eq('id', conversationId);

      toast({ title: 'Message sent!', description: 'The landlord will respond soon.' });
      setMessage('');
      
      // Navigate to chat
      navigate(`/dashboard/chats?c=${conversationId}`);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Start chatting about this property</p>
      <QuickPrompts onSelect={(prompt) => setMessage(prompt)} />
      <div className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={sending}
        />
        <Button size="icon" onClick={handleSend} disabled={sending || !message.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
