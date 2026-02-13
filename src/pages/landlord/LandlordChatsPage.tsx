import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { ChatList } from '@/components/chat/ChatList';
import { ChatThread } from '@/components/chat/ChatThread';
import { useConversations } from '@/hooks/useConversations';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

const LandlordChatsPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('c'));
  const { conversations, loading } = useConversations();
  const isMobile = useIsMobile();

  useEffect(() => {
    const c = searchParams.get('c');
    if (c) setSelectedId(c);
  }, [searchParams]);

  const selectedConvo = conversations.find(c => c.id === selectedId) || null;
  const showList = isMobile ? !selectedId : true;
  const showThread = isMobile ? !!selectedId : true;

  return (
    <LandlordLayout>
      <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)]">
        {showList && (
          <div className={`${isMobile ? 'w-full' : 'w-80 border-r border-border'} flex flex-col`}>
            <div className="p-4 border-b border-border shrink-0">
              <h1 className="font-heading text-xl font-bold">Chats</h1>
            </div>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ChatList conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} />
            )}
          </div>
        )}

        {showThread && (
          <ChatThread
            conversation={selectedConvo}
            onBack={() => setSelectedId(null)}
          />
        )}
      </div>
    </LandlordLayout>
  );
};

export default LandlordChatsPage;
