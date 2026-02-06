import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { useCreateReview } from '@/hooks/useReviews';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  bookingId: string;
  propertyId: string;
  landlordId: string;
}

export function ReviewForm({ bookingId, propertyId, landlordId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const createReview = useCreateReview();

  const handleSubmit = () => {
    if (rating === 0) return;
    createReview.mutate({
      bookingId,
      propertyId,
      landlordId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Your Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
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
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Your Review (optional)</p>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience at this property..."
          rows={3}
          maxLength={1000}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || createReview.isPending}
        className="w-full sm:w-auto"
      >
        {createReview.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Star className="h-4 w-4 mr-2" />
        )}
        Submit Review
      </Button>
    </div>
  );
}
