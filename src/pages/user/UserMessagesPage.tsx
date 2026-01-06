import { useState } from 'react';
import { UserLayout } from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Inbox, Send, Mail } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { MessageList } from '@/components/messages/MessageList';
import { MessageDetail } from '@/components/messages/MessageDetail';
import { ComposeMessageDialog } from '@/components/messages/ComposeMessageDialog';
import type { Message } from '@/types/message';

const UserMessagesPage = () => {
  const { messages, loading, unreadCount, sendMessage, markAsRead, deleteMessage } = useMessages();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'inbox' | 'sent'>('inbox');
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
    setComposeOpen(true);
  };

  const handleComposeClose = () => {
    setComposeOpen(false);
    setReplyTo(null);
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              Communicate with landlords and agents
            </p>
          </div>
          <Button onClick={() => setComposeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-4 w-4" />
              Inbox
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="h-4 w-4" />
              Sent
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message List */}
          <div className={selectedMessage ? 'hidden lg:block' : ''}>
            <MessageList
              messages={messages}
              loading={loading}
              onSelect={handleSelectMessage}
              onReply={handleReply}
              onDelete={deleteMessage}
              selectedId={selectedMessage?.id}
              filter={filter}
            />
          </div>

          {/* Message Detail */}
          {selectedMessage && (
            <div className="lg:sticky lg:top-6">
              <MessageDetail
                message={selectedMessage}
                onReply={() => handleReply(selectedMessage)}
                onBack={() => setSelectedMessage(null)}
                onMarkAsRead={markAsRead}
              />
            </div>
          )}

          {!selectedMessage && (
            <div className="hidden lg:flex items-center justify-center h-96 border rounded-lg bg-muted/20">
              <div className="text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a message to read</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <ComposeMessageDialog
        open={composeOpen}
        onOpenChange={handleComposeClose}
        onSend={sendMessage}
        replyTo={replyTo ? {
          subject: replyTo.subject,
          senderId: replyTo.sender_id,
          senderName: replyTo.sender?.full_name || replyTo.sender?.email || 'Unknown',
        } : undefined}
      />
    </UserLayout>
  );
};

export default UserMessagesPage;
