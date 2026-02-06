import { useParams, Link, useNavigate } from 'react-router-dom';
import { UserLayout } from '@/components/user/UserLayout';
import { useBookingDetail } from '@/hooks/useBookings';
import { useBookingReview } from '@/hooks/useReviews';
import { BookingTimeline } from '@/components/booking/BookingTimeline';
import { BookingLocationMap } from '@/components/booking/BookingLocationMap';
import { ReviewForm } from '@/components/booking/ReviewForm';
import { ReviewDisplay } from '@/components/booking/ReviewDisplay';
import { CheckInButton } from '@/components/booking/CheckInButton';
import { CancelBookingButton } from '@/components/booking/CancelBookingButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BOOKING_STATUS_CONFIG, BookingStatus } from '@/types/booking';
import { formatFullPrice, formatDate } from '@/lib/formatters';
import { getBookingRelativeLabel } from '@/lib/bookingUtils';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';
import {
  Loader2, ArrowLeft, MapPin, Bed, Bath, Copy, Check,
  MessageSquare, CalendarDays, CreditCard, Home, Star,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export default function UserBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: booking, isLoading } = useBookingDetail(id);
  const { data: review, isLoading: reviewLoading } = useBookingReview(id);
  const [copied, setCopied] = useState(false);

  const copyBookingRef = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.id);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Booking reference copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </UserLayout>
    );
  }

  if (!booking) {
    return (
      <UserLayout>
        <div className="text-center py-16">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground mb-4">Booking not found</p>
          <Button variant="outline" onClick={() => navigate('/dashboard/bookings')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bookings
          </Button>
        </div>
      </UserLayout>
    );
  }

  const statusConfig = BOOKING_STATUS_CONFIG[booking.status as BookingStatus];
  const relativeLabel = getBookingRelativeLabel(booking.check_in_date, booking.check_out_date, booking.status);
  const canReview = ['checked_in', 'completed'].includes(booking.status) && !review && !reviewLoading;
  const landlordPayout = booking.total_amount - booking.service_fee;

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/bookings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-xl sm:text-2xl font-bold truncate">
              {booking.property_title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <Badge className={cn('text-xs', statusConfig?.color)}>
                {statusConfig?.label}
              </Badge>
              <span className="text-sm text-muted-foreground">{relativeLabel.text}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Property & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property card */}
            <Card>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-48 h-40 sm:h-auto shrink-0">
                    <img
                      src={getOptimizedImageUrl(booking.property_image, IMAGE_SIZES.DETAIL.width, IMAGE_SIZES.DETAIL.quality)}
                      alt={booking.property_title}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"
                    />
                  </div>
                  <div className="p-4 flex-1 space-y-3">
                    <div>
                      <Link to={`/property/${booking.property_id}`} className="hover:underline">
                        <h3 className="font-heading font-semibold text-lg">{booking.property_title}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {booking.property_address}, {booking.property_city}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        {booking.property_category || booking.property_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        {booking.property_bedrooms} bed{booking.property_bedrooms !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-4 w-4 text-muted-foreground" />
                        {booking.property_bathrooms} bath{booking.property_bathrooms !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {booking.property_amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {booking.property_amenities.slice(0, 6).map(a => (
                          <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                        ))}
                        {booking.property_amenities.length > 6 && (
                          <Badge variant="secondary" className="text-xs">+{booking.property_amenities.length - 6} more</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading">Booking Status</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingTimeline status={booking.status} />
              </CardContent>
            </Card>

            {/* Dates & Payment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading">Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Check-in</p>
                    <p className="font-medium text-sm">{formatDate(booking.check_in_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Check-out</p>
                    <p className="font-medium text-sm">{formatDate(booking.check_out_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nights</p>
                    <p className="font-medium text-sm">{booking.nights}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <p className="font-medium text-sm capitalize">{booking.payment_method}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {formatFullPrice(booking.nightly_rate)} × {booking.nights} night{booking.nights !== 1 ? 's' : ''}
                    </span>
                    <span>{formatFullPrice(booking.nightly_rate * booking.nights)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service fee</span>
                    <span>{formatFullPrice(booking.service_fee)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-heading font-bold text-base">
                    <span>Total</span>
                    <span className="text-primary">{formatFullPrice(booking.total_amount)}</span>
                  </div>
                </div>

                {/* Booking Reference */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Booking Reference</p>
                    <p className="text-xs font-mono">{booking.id.slice(0, 8)}...</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={copyBookingRef}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                {booking.payment_reference && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Payment Reference</p>
                    <p className="text-xs font-mono">{booking.payment_reference}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Star className="h-4 w-4" /> Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                {review ? (
                  <ReviewDisplay
                    rating={review.rating}
                    comment={review.comment}
                    createdAt={review.created_at}
                    guestName="You"
                  />
                ) : canReview ? (
                  <ReviewForm
                    bookingId={booking.id}
                    propertyId={booking.property_id}
                    landlordId={booking.landlord_id}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {reviewLoading ? 'Loading...' : 'Reviews are available after check-in.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Map & Actions */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <CheckInButton booking={booking as any} />
                <CancelBookingButton bookingId={booking.id} status={booking.status} />

                <Link to={`/dashboard/messages`}>
                  <Button variant="outline" className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message Landlord
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Map */}
            {booking.property_latitude && booking.property_longitude && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-heading">Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingLocationMap
                    latitude={booking.property_latitude}
                    longitude={booking.property_longitude}
                    title={booking.property_title}
                    address={`${booking.property_address}, ${booking.property_city}`}
                  />
                </CardContent>
              </Card>
            )}

            {/* Checked-in timestamp */}
            {booking.checked_in_at && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Checked in at</p>
                  <p className="text-sm font-medium">
                    {new Date(booking.checked_in_at).toLocaleString('en-KE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
