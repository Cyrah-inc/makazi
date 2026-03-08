import { UserLayout } from '@/components/user/UserLayout';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Banknote, AlertTriangle, Info, CheckCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const typeIcons: Record<string, React.ElementType> = {
  payout_success: Banknote,
  payout_failed: AlertTriangle,
  info: Info,
};

const typeColors: Record<string, string> = {
  payout_success: 'text-primary bg-primary/10',
  payout_failed: 'text-destructive bg-destructive/10',
  info: 'text-blue-600 bg-blue-100',
};

export default function UserNotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0;

  const handleClick = (n: { id: string; is_read: boolean; link: string | null }) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground text-sm">Stay updated on your activity.</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !notifications?.length ? (
              <div className="text-center py-12">
                <Bell className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">No notifications yet.</p>
                <p className="text-muted-foreground text-xs mt-1">You'll be notified about important updates.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => {
                  const Icon = typeIcons[n.type] || Info;
                  const color = typeColors[n.type] || typeColors.info;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={cn(
                        'w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors',
                        !n.is_read && 'bg-primary/5'
                      )}
                    >
                      <div className={cn('p-2 rounded-lg mt-0.5 shrink-0', color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', !n.is_read ? 'font-semibold' : 'font-medium')}>
                          {n.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1.5">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
