import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  UserPlus, 
  Building2, 
  Clock,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'user_signup' | 'property_listed';
  message: string;
  timestamp: string;
}

async function fetchRecentActivity(): Promise<Activity[]> {
  const [profilesRes, propertiesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('properties')
      .select('id, title, city, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const activities: Activity[] = [];

  (profilesRes.data || []).forEach((p) => {
    activities.push({
      id: `user-${p.id}`,
      type: 'user_signup',
      message: `New user registered: ${p.full_name || p.email || 'Unknown'}`,
      timestamp: p.created_at,
    });
  });

  (propertiesRes.data || []).forEach((p) => {
    activities.push({
      id: `prop-${p.id}`,
      type: 'property_listed',
      message: `New property listed: ${p.title}${p.city ? ` in ${p.city}` : ''}`,
      timestamp: p.created_at,
    });
  });

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return activities.slice(0, 8);
}

const activityIcons = {
  user_signup: UserPlus,
  property_listed: Building2,
};

const activityColors = {
  user_signup: 'text-blue-500',
  property_listed: 'text-primary',
};

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: fetchRecentActivity,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !activities?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const color = activityColors[activity.type];
            
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-full bg-muted ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
