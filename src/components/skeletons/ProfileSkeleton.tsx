import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton for the user profile card on the dashboard */
export function ProfileSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
          {/* Fields */}
          <div className="flex-1 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
