import { useQuery } from '@tanstack/react-query';
import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageSquare, TrendingUp, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatRelativeDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export default function LandlordReviewsPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['landlord-reviews', user?.id],
    queryFn: async () => {
      if (!user) return { reviews: [], properties: new Map() };

      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!reviews?.length) return { reviews: [], properties: new Map() };

      // Fetch guest profiles
      const guestIds = [...new Set(reviews.map((r) => r.guest_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', guestIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      // Fetch property titles
      const propIds = [...new Set(reviews.map((r) => r.property_id))];
      const { data: props } = await supabase
        .from('properties')
        .select('id, title')
        .in('id', propIds);
      const propMap = new Map(props?.map((p) => [p.id, p.title]) || []);

      return {
        reviews: reviews.map((r) => ({
          ...r,
          guest_name: profileMap.get(r.guest_id)?.full_name || 'Guest',
          guest_avatar: profileMap.get(r.guest_id)?.avatar_url,
          property_title: propMap.get(r.property_id) || 'Unknown Property',
        })),
        properties: propMap,
      };
    },
    enabled: !!user,
  });

  const reviews = data?.reviews || [];
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  if (isLoading) {
    return (
      <LandlordLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="font-heading text-2xl font-bold">Guest Reviews</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[hsl(var(--gold))]/10">
                <Star className="h-5 w-5 text-[hsl(var(--gold))]" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{avgRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Average Rating</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{reviews.length}</p>
                <p className="text-xs text-muted-foreground">Total Reviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">
                  {reviews.filter((r) => r.rating >= 4).length}
                </p>
                <p className="text-xs text-muted-foreground">Positive (4-5★)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">All Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No reviews yet</p>
                <p className="text-sm">Reviews from guests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-border">
                {reviews.map((review) => (
                  <div key={review.id} className="pt-4 first:pt-0 flex gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {review.guest_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{review.guest_name}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                'h-3.5 w-3.5',
                                review.rating >= s
                                  ? 'fill-[hsl(var(--gold))] text-[hsl(var(--gold))]'
                                  : 'text-muted-foreground/20'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatRelativeDate(review.created_at)}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {review.property_title}
                      </Badge>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-1.5">"{review.comment}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LandlordLayout>
  );
}
