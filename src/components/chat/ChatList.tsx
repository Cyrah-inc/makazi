import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/formatters';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';
import type { Conversation } from '@/types/conversation';
import { MessageSquare } from 'lucide-react';

interface ChatListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ChatList({ conversations, selectedId, onSelect }: ChatListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquare className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="font-heading font-semibold text-lg mb-1">No conversations yet</h3>
        <p className="text-sm text-muted-foreground">
          Start chatting by contacting a landlord on any property listing.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {conversations.map((convo) => {
          const isSelected = convo.id === selectedId;
          const name = convo.other_user?.full_name || convo.other_user?.email || 'Unknown User';
          const initials = name.charAt(0).toUpperCase();

          return (
            <button
              key={convo.id}
              onClick={() => onSelect(convo.id)}
              className={cn(
                'w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50',
                isSelected && 'bg-primary/5 border-l-2 border-l-primary'
              )}
            >
              {/* Property thumbnail or avatar */}
              {convo.property?.images?.[0] ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={getOptimizedImageUrl(convo.property.images[0], IMAGE_SIZES.DETAIL_THUMB.width, IMAGE_SIZES.DETAIL_THUMB.quality)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={convo.other_user?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('text-sm font-medium truncate', (convo.unread_count || 0) > 0 && 'font-bold')}>
                    {name}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatRelativeDate(convo.last_message_at)}
                  </span>
                </div>
                {convo.property && (
                  <p className="text-xs text-primary truncate">{convo.property.title}</p>
                )}
                <p className={cn(
                  'text-xs truncate mt-0.5',
                  (convo.unread_count || 0) > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}>
                  {convo.last_message_preview || 'No messages yet'}
                </p>
              </div>

              {(convo.unread_count || 0) > 0 && (
                <Badge className="shrink-0 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {convo.unread_count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
