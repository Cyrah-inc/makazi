import { useState } from 'react';
import { UserLayout } from '@/components/user/UserLayout';
import { useGuestBookings } from '@/hooks/useBookings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CheckInButton } from '@/components/booking/CheckInButton';
import { StarRatingInline } from '@/components/booking/ReviewDisplay';
import { BookingStatus, BOOKING_STATUS_CONFIG } from '@/types/booking';
import { formatFullPrice, formatDate } from '@/lib/formatters';
import { getBookingRelativeLabel } from '@/lib/bookingUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarDays, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';
import { Link } from 'react-router-dom';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'active', label: 'Active' },
  { value: 'past', label: 'Past' },
];

const UserBookingsPage = () => {
  const { user } = useAuth();
  const { data: bookings, isLoading } = useGuestBookings();
  const [filter, setFilter] = useState('all');

  const bookingIds = bookings?.map(b => b.id) || [];
  const { data: reviews } = useQuery({
    queryKey: ['reviews', 'bookings', bookingIds],
    queryFn: async () => {
      if (!bookingIds.length) return [];
      const { data, error } = await supabase
        .from('reviews')
        .select('booking_id, rating')
        .in('booking_id', bookingIds);
      if (error) throw error;
      return data || [];
    },
    enabled: bookingIds.length > 0,
  });

  const reviewMap = new Map(reviews?.map(r => [r.booking_id, r.rating]) || []);

  const filtered = bookings?.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['pending_payment', 'paid'].includes(b.status);
    if (filter === 'active') return b.status === 'checked_in';
    if (filter === 'past') return ['completed', 'cancelled', 'refunded'].includes(b.status);
    return true;
  });

  return (
    <UserLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground text-sm">Manage your Airbnb reservations</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !filtered?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No bookings found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(booking => {
              const statusConfig = BOOKING_STATUS_CONFIG[booking.status as BookingStatus];
              const relativeLabel = getBookingRelativeLabel(booking.check_in_date, booking.check_out_date, booking.status);
              const rating = reviewMap.get(booking.id);

              return (
                <Link key={booking.id} to={`/dashboard/bookings/${booking.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer mb-4">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-40 h-32 sm:h-auto shrink-0">
                          <img
                            src={getOptimizedImageUrl(booking.property_image, IMAGE_SIZES.DASHBOARD.width, IMAGE_SIZES.DASHBOARD.quality)}
                            alt={booking.property_title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-heading font-semibold">{booking.property_title}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {booking.property_city}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge className={cn('text-xs', statusConfig?.color)}>
                                {statusConfig?.label || booking.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{relativeLabel.text}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Check-in: </span>
                              <span className="font-medium">{formatDate(booking.check_in_date)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Check-out: </span>
                              <span className="font-medium">{formatDate(booking.check_out_date)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total: </span>
                              <span className="font-heading font-bold text-primary">
                                {formatFullPrice(booking.total_amount)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              {rating && <StarRatingInline rating={rating} />}
                              <div onClick={(e) => e.preventDefault()}>
                                <CheckInButton booking={booking} />
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="gap-1 text-primary shrink-0">
                              View Details <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default UserBookingsPage;
