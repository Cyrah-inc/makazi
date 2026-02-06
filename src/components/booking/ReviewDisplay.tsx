import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/formatters';

interface ReviewDisplayProps {
  rating: number;
  comment?: string | null;
  guestName?: string;
  createdAt: string;
  compact?: boolean;
}

export function ReviewDisplay({ rating, comment, guestName, createdAt, compact }: ReviewDisplayProps) {
  return (
    <div className={cn('space-y-2', compact && 'space-y-1')}>
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                compact ? 'h-4 w-4' : 'h-5 w-5',
                rating >= star
                  ? 'fill-[hsl(var(--gold))] text-[hsl(var(--gold))]'
                  : 'text-muted-foreground/20'
              )}
            />
          ))}
        </div>
        {!compact && (
          <span className="text-sm text-muted-foreground">{rating}/5</span>
        )}
      </div>
      {comment && (
        <p className={cn('text-muted-foreground', compact ? 'text-xs line-clamp-2' : 'text-sm')}>
          "{comment}"
        </p>
      )}
      {!compact && (
        <p className="text-xs text-muted-foreground">
          {guestName && <span className="font-medium text-foreground">{guestName}</span>}
          {guestName && ' · '}
          {formatRelativeDate(createdAt)}
        </p>
      )}
    </div>
  );
}

export function StarRatingInline({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-3.5 w-3.5',
              rating >= star
                ? 'fill-[hsl(var(--gold))] text-[hsl(var(--gold))]'
                : 'text-muted-foreground/20'
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{rating}</span>
    </div>
  );
}
