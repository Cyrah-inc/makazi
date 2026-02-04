import { Car, Bus, PersonStanding, MapPinOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { TransportMode } from './CommuteChecker';

interface CommuteBadgeProps {
  minutes: number | null | undefined;
  mode: TransportMode;
  destination: string;
  isLoading?: boolean;
  noLocation?: boolean;
}

const getModeIcon = (mode: TransportMode) => {
  switch (mode) {
    case 'driving':
      return Car;
    case 'transit':
      return Bus;
    case 'walking':
      return PersonStanding;
  }
};

const getColorClass = (minutes: number): string => {
  if (minutes < 30) return 'bg-green-500/10 text-green-600 border-green-500/20';
  if (minutes <= 60) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
  return 'bg-red-500/10 text-red-600 border-red-500/20';
};

const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
};

const CommuteBadge = ({ minutes, mode, destination, isLoading, noLocation }: CommuteBadgeProps) => {
  const Icon = getModeIcon(mode);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    );
  }

  // Property has no location data
  if (noLocation) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-muted/50 text-muted-foreground border-border"
        title="This property has no location data"
      >
        <MapPinOff className="h-3 w-3" />
        <span>No location</span>
      </div>
    );
  }

  if (minutes === null || minutes === undefined) {
    return null;
  }

  const colorClass = getColorClass(minutes);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        colorClass
      )}
      title={`${formatTime(minutes)} to ${destination}`}
    >
      <Icon className="h-3 w-3" />
      <span>{formatTime(minutes)}</span>
      <span className="hidden sm:inline text-[10px] opacity-75">to Work</span>
    </div>
  );
};

export default CommuteBadge;
