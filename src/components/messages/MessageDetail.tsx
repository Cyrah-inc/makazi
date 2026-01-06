import { useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Reply, Building2, ArrowLeft, Clock } from 'lucide-react';
import type { Message } from '@/types/message';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

interface MessageDetailProps {
  message: Message;
  onReply: () => void;
  onBack: () => void;
  onMarkAsRead: (messageId: string) => void;
}

export const MessageDetail = ({ message, onReply, onBack, onMarkAsRead }: MessageDetailProps) => {
  const { user } = useAuth();
  const isIncoming = message.recipient_id === user?.id;
  const otherUser = isIncoming ? message.sender : message.recipient;

  useEffect(() => {
    // Mark as read when viewing
    if (isIncoming && !message.is_read) {
      onMarkAsRead(message.id);
    }
  }, [message.id, isIncoming, message.is_read, onMarkAsRead]);

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold flex-1">{message.subject}</h2>
          {isIncoming && (
            <Button onClick={onReply}>
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={otherUser?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(otherUser?.full_name || null, otherUser?.email || null)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <p className="font-medium">
              {isIncoming ? 'From: ' : 'To: '}
              {otherUser?.full_name || otherUser?.email || 'Unknown User'}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(new Date(message.created_at), 'PPP p')}
            </div>
          </div>
        </div>

        {message.property && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Regarding:</span>
            <Link to={`/property/${message.property_id}`}>
              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                {message.property.title}
              </Badge>
            </Link>
          </div>
        )}

        <Separator />
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </CardContent>
    </Card>
  );
};
