import { usePropertyReviews } from '@/hooks/useReviews';
import { ReviewDisplay } from '@/components/booking/ReviewDisplay';
import { Star, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface PropertyReviewsProps {
  propertyId: string;
}

export function PropertyReviewsSummary({ propertyId }: PropertyReviewsProps) {
  const { data: reviews } = usePropertyReviews(propertyId);

  if (!reviews?.length) return null;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="flex items-center gap-1.5">
      <Star className="h-4 w-4 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
      <span className="font-medium text-foreground">{avgRating.toFixed(1)}</span>
      <span className="text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
    </div>
  );
}

export function PropertyReviewsSection({ propertyId }: PropertyReviewsProps) {
  const { data: reviews, isLoading } = usePropertyReviews(propertyId);

  if (isLoading) return null;

  const avgRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        Reviews
        {reviews && reviews.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">
            · {avgRating.toFixed(1)} avg · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </span>
        )}
      </h2>

      {!reviews?.length ? (
        <div className="text-center py-8 text-muted-foreground">
          <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Rating breakdown */}
          <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/50">
            <div className="text-center">
              <div className="text-3xl font-heading font-bold text-foreground">{avgRating.toFixed(1)}</div>
              <div className="flex mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      'h-4 w-4',
                      avgRating >= s
                        ? 'fill-[hsl(var(--gold))] text-[hsl(var(--gold))]'
                        : 'text-muted-foreground/20'
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-muted-foreground">{star}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[hsl(var(--gold))] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Individual reviews */}
          <div className="space-y-5">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={review.guest_avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {review.guest_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <ReviewDisplay
                    rating={review.rating}
                    comment={review.comment}
                    guestName={review.guest_name}
                    createdAt={review.created_at}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
