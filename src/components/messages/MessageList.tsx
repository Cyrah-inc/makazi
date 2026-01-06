import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Mail, 
  MailOpen, 
  MoreVertical, 
  Reply, 
  Trash2, 
  Building2,
  Inbox
} from 'lucide-react';
import type { Message } from '@/types/message';
import { useAuth } from '@/hooks/useAuth';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  onSelect: (message: Message) => void;
  onReply: (message: Message) => void;
  onDelete: (messageId: string) => Promise<boolean>;
  selectedId?: string;
  filter: 'all' | 'inbox' | 'sent';
}

export const MessageList = ({
  messages,
  loading,
  onSelect,
  onReply,
  onDelete,
  selectedId,
  filter,
}: MessageListProps) => {
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const filteredMessages = messages.filter(msg => {
    if (filter === 'inbox') return msg.recipient_id === user?.id;
    if (filter === 'sent') return msg.sender_id === user?.id;
    return true;
  });

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || 'U';
  };

  const handleDeleteClick = (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (messageToDelete) {
      await onDelete(messageToDelete);
    }
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredMessages.length === 0) {
    return (
      <div className="text-center py-12">
        <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">No messages</h3>
        <p className="text-muted-foreground">
          {filter === 'inbox' 
            ? "Your inbox is empty"
            : filter === 'sent'
            ? "You haven't sent any messages yet"
            : "No messages to display"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {filteredMessages.map(message => {
          const isIncoming = message.recipient_id === user?.id;
          const otherUser = isIncoming ? message.sender : message.recipient;
          const isUnread = isIncoming && !message.is_read;
          const canDelete = message.sender_id === user?.id;

          return (
            <Card 
              key={message.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedId === message.id ? 'ring-2 ring-primary' : ''
              } ${isUnread ? 'bg-primary/5' : ''}`}
              onClick={() => onSelect(message)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(otherUser?.full_name || null, otherUser?.email || null)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isUnread ? (
                          <Mail className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <MailOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={`font-medium truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {isIncoming ? 'From: ' : 'To: '}
                          {otherUser?.full_name || otherUser?.email || 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isIncoming && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReply(message); }}>
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={(e) => handleDeleteClick(message.id, e)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <p className={`text-sm truncate mt-1 ${isUnread ? 'font-medium' : ''}`}>
                      {message.subject}
                    </p>

                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {message.content.slice(0, 100)}
                      {message.content.length > 100 ? '...' : ''}
                    </p>

                    {message.property && (
                      <div className="flex items-center gap-1 mt-2">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">
                          {message.property.title}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
