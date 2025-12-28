import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Building2, 
  CheckCircle, 
  XCircle,
  Clock
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'user_signup' | 'property_listed' | 'property_approved' | 'property_rejected';
  message: string;
  time: string;
}

const mockActivities: Activity[] = [
  { id: '1', type: 'user_signup', message: 'New user registered: john@example.com', time: '2 mins ago' },
  { id: '2', type: 'property_listed', message: 'New property listed in Westlands, Nairobi', time: '15 mins ago' },
  { id: '3', type: 'property_approved', message: 'Property #1234 approved', time: '1 hour ago' },
  { id: '4', type: 'user_signup', message: 'New landlord registered: jane@properties.co.ke', time: '2 hours ago' },
  { id: '5', type: 'property_rejected', message: 'Property #1235 rejected - incomplete info', time: '3 hours ago' },
];

const activityIcons = {
  user_signup: UserPlus,
  property_listed: Building2,
  property_approved: CheckCircle,
  property_rejected: XCircle,
};

const activityColors = {
  user_signup: 'text-blue-500',
  property_listed: 'text-primary',
  property_approved: 'text-green-500',
  property_rejected: 'text-red-500',
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockActivities.map((activity) => {
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
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
