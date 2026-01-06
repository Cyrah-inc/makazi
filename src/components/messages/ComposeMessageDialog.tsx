import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Send, Loader2 } from 'lucide-react';
import type { MessageFormData } from '@/types/message';

interface ComposeMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: MessageFormData) => Promise<boolean>;
  recipientId?: string;
  recipientName?: string;
  propertyId?: string;
  propertyTitle?: string;
  replyTo?: {
    subject: string;
    senderId: string;
    senderName: string;
  };
}

interface Recipient {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

export const ComposeMessageDialog = ({
  open,
  onOpenChange,
  onSend,
  recipientId,
  recipientName,
  propertyId,
  propertyTitle,
  replyTo,
}: ComposeMessageDialogProps) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState(recipientId || '');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  useEffect(() => {
    if (open && !recipientId) {
      fetchRecipients();
    }
  }, [open, recipientId]);

  useEffect(() => {
    if (recipientId) {
      setSelectedRecipient(recipientId);
    }
    if (replyTo) {
      setSubject(replyTo.subject.startsWith('Re: ') ? replyTo.subject : `Re: ${replyTo.subject}`);
      setSelectedRecipient(replyTo.senderId);
    }
    if (propertyTitle) {
      setSubject(`Inquiry about: ${propertyTitle}`);
    }
  }, [recipientId, replyTo, propertyTitle]);

  const fetchRecipients = async () => {
    setLoadingRecipients(true);
    try {
      // Fetch landlords and admins as potential recipients
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['landlord', 'admin']);

      if (roles && roles.length > 0) {
        const userIds = roles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds)
          .eq('status', 'active');

        setRecipients(profiles || []);
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRecipient || !subject.trim() || !content.trim()) {
      return;
    }

    setSending(true);
    const success = await onSend({
      recipient_id: selectedRecipient,
      subject: subject.trim(),
      content: content.trim(),
      property_id: propertyId || null,
    });

    setSending(false);

    if (success) {
      setSubject('');
      setContent('');
      setSelectedRecipient('');
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {replyTo ? 'Reply to Message' : 'New Message'}
          </DialogTitle>
          <DialogDescription>
            {recipientName 
              ? `Send a message to ${recipientName}`
              : 'Compose and send a new message'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient */}
          {recipientId || replyTo ? (
            <div>
              <Label>To</Label>
              <Input 
                value={recipientName || replyTo?.senderName || 'Recipient'} 
                disabled 
                className="mt-1.5"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="recipient">To</Label>
              <Select
                value={selectedRecipient}
                onValueChange={setSelectedRecipient}
                disabled={loadingRecipients}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={loadingRecipients ? 'Loading...' : 'Select recipient'} />
                </SelectTrigger>
                <SelectContent>
                  {recipients.map(r => (
                    <SelectItem key={r.user_id} value={r.user_id}>
                      {r.full_name || r.email || 'Unknown User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Property context */}
          {propertyTitle && (
            <div>
              <Label>Regarding Property</Label>
              <Input value={propertyTitle} disabled className="mt-1.5" />
            </div>
          )}

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject"
              maxLength={200}
              required
              className="mt-1.5"
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              maxLength={5000}
              required
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/5000 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={sending}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={sending || !selectedRecipient || !subject.trim() || !content.trim()}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
