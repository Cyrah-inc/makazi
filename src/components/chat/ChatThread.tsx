import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatPropertyCard } from './ChatPropertyCard';
import { cn } from '@/lib/utils';
import { Send, Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { format, isToday, isYesterday } from 'date-fns';
import type { Conversation } from '@/types/conversation';

interface ChatThreadProps {
  conversation: Conversation | null;
  onBack?: () => void;
}

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
}

export function ChatThread({ conversation, onBack }: ChatThreadProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const { messages, loading, sendMessage } = useChat(conversation?.id || null);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isOtherTyping, sendTyping } = useTypingIndicator(conversation?.id || null);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/20">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquare className="h-9 w-9 text-muted-foreground" />
        </div>
        <h3 className="font-heading font-semibold text-lg mb-1">Select a conversation</h3>
        <p className="text-sm text-muted-foreground">Choose a chat from the list to start messaging.</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const success = await sendMessage(input.trim());
    if (success) setInput('');
    setSending(false);
  };

  // Group messages by day
  const grouped: { date: string; msgs: typeof messages }[] = [];
  messages.forEach(msg => {
    const day = format(new Date(msg.created_at), 'yyyy-MM-dd');
    const last = grouped[grouped.length - 1];
    if (last && last.date === day) {
      last.msgs.push(msg);
    } else {
      grouped.push({ date: day, msgs: [msg] });
    }
  });

  const otherName = conversation.other_user?.full_name || conversation.other_user?.email || 'User';

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center gap-3 bg-card shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold truncate">{otherName}</h3>
          {conversation.property && (
            <p className="text-xs text-muted-foreground truncate">
              Re: {conversation.property.title}
            </p>
          )}
        </div>
      </div>

      {/* Property context card */}
      {conversation.property && (
        <div className="p-3 border-b border-border bg-card shrink-0">
          <ChatPropertyCard property={conversation.property} />
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : grouped.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Say hello!
          </p>
        ) : (
          grouped.map(group => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-4">
                <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {formatDateHeader(group.msgs[0].created_at)}
                </span>
              </div>
              <div className="space-y-2">
                {group.msgs.map(msg => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm',
                          isMine
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={cn(
                          'text-[10px] mt-1',
                          isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        {isOtherTyping && (
          <div className="flex items-center gap-2 px-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-muted-foreground">typing...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-card shrink-0">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={e => { setInput(e.target.value); sendTyping(); }}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={sending}
          />
          <Button size="icon" onClick={handleSend} disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
