import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewFormStarsProps {
  rating: number;
  hoveredRating: number;
  onRate: (star: number) => void;
  onHover: (star: number) => void;
  onLeave: () => void;
}

function ReviewFormStars({ rating, hoveredRating, onRate, onHover, onLeave }: ReviewFormStarsProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={onLeave}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              'h-7 w-7 transition-colors',
              (hoveredRating || rating) >= star
                ? 'fill-[hsl(var(--gold))] text-[hsl(var(--gold))]'
                : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default ReviewFormStars;
