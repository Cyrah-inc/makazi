import { useParams, useNavigate, Link } from 'react-router-dom';
import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { useBookingDetail, useRequestPayout, useCancelBooking, useBookingPayout } from '@/hooks/useBookings';
import { useBookingReview } from '@/hooks/useReviews';
import { useLandlordProfile } from '@/hooks/useLandlordProfile';
import { BookingTimeline } from '@/components/booking/BookingTimeline';
import { ReviewDisplay } from '@/components/booking/ReviewDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BOOKING_STATUS_CONFIG, BookingStatus } from '@/types/booking';
import { formatFullPrice, formatDate } from '@/lib/formatters';
import { getBookingRelativeLabel } from '@/lib/bookingUtils';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';
import {
  Loader2, ArrowLeft, MapPin, CalendarDays, CreditCard, MessageSquare,
  User, Mail, Phone, Star, CheckCircle, XCircle, Copy, Check, Banknote,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

export default function LandlordBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: booking, isLoading } = useBookingDetail(id);
  const { data: review } = useBookingReview(id);
  const { data: payout } = useBookingPayout(id);
  const { landlordProfile } = useLandlordProfile();
  const requestPayout = useRequestPayout();
  const cancelBooking = useCancelBooking();
  const [copied, setCopied] = useState(false);
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);

  const copyBookingRef = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.id);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Booking reference copied.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestPayout = () => {
    if (!booking || !payoutPhone) return;
    requestPayout.mutate(
      { bookingId: booking.id, phoneNumber: payoutPhone },
      { onSuccess: () => setPayoutDialogOpen(false) }
    );
  };

  const openPayoutDialog = () => {
    setPayoutPhone(landlordProfile?.business_phone || '');
    setPayoutDialogOpen(true);
  };

  if (isLoading) {
    return (
      <LandlordLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LandlordLayout>
    );
  }

  if (!booking) {
    return (
      <LandlordLayout>
        <div className="text-center py-16">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground mb-4">Booking not found</p>
          <Button variant="outline" onClick={() => navigate('/landlord/airbnb-bookings')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bookings
          </Button>
        </div>
      </LandlordLayout>
    );
  }

  const statusConfig = BOOKING_STATUS_CONFIG[booking.status as BookingStatus];
  const relativeLabel = getBookingRelativeLabel(booking.check_in_date, booking.check_out_date, booking.status);
  const landlordPayout = booking.total_amount - booking.service_fee;
  const canRequestPayout = booking.status === 'checked_in' && !payout;
  const canCancel = ['pending_payment', 'paid'].includes(booking.status);
  const hasPayout = !!payout;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <LandlordLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/landlord/airbnb-bookings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-xl sm:text-2xl font-bold truncate">
              Booking Details
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
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <User className="h-4 w-4" /> Guest Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarImage src={booking.guest_avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getInitials(booking.guest_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-semibold truncate">{booking.guest_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{booking.guest_email}</span>
                    </p>
                    {booking.guest_phone_profile && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" /> {booking.guest_phone_profile}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Summary */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-40 h-32 sm:h-auto shrink-0">
                    <img
                      src={getOptimizedImageUrl(booking.property_image, IMAGE_SIZES.CARD.width, IMAGE_SIZES.CARD.quality)}
                      alt={booking.property_title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex-1">
                    <Link to={`/property/${booking.property_id}`} className="hover:underline">
                      <h3 className="font-heading font-semibold">{booking.property_title}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {booking.property_address}, {booking.property_city}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading">Booking Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingTimeline status={booking.status} paidOut={hasPayout && payout?.status === 'completed'} />
              </CardContent>
            </Card>

            {/* Dates & Timestamps */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading">Dates & Timing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Check-in Date</p>
                    <p className="font-medium">{formatDate(booking.check_in_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Check-out Date</p>
                    <p className="font-medium">{formatDate(booking.check_out_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nights</p>
                    <p className="font-medium">{booking.nights}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Method</p>
                    <p className="font-medium capitalize">{booking.payment_method}</p>
                  </div>
                </div>

                {booking.checked_in_at && (
                  <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-primary">Checked in at</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(booking.checked_in_at).toLocaleString('en-KE', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payout Details */}
            {hasPayout && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-heading flex items-center gap-2">
                    <Banknote className="h-4 w-4" /> Payout Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{formatFullPrice(payout!.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-mono text-xs">{payout!.phone_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={payout!.status === 'completed' ? 'default' : payout!.status === 'failed' ? 'destructive' : 'secondary'}>
                      {payout!.status}
                    </Badge>
                  </div>
                  {payout!.mpesa_receipt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Receipt</span>
                      <span className="font-mono text-xs">{payout!.mpesa_receipt}</span>
                    </div>
                  )}
                  {payout!.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid at</span>
                      <span>{new Date(payout!.completed_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Guest Review */}
            {review && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-heading flex items-center gap-2">
                    <Star className="h-4 w-4" /> Guest Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewDisplay
                    rating={review.rating}
                    comment={review.comment}
                    guestName={booking.guest_name}
                    createdAt={review.created_at}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Payment & Actions */}
          <div className="space-y-6">
            {/* Payment Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {formatFullPrice(booking.nightly_rate)} × {booking.nights} night{booking.nights !== 1 ? 's' : ''}
                  </span>
                  <span>{formatFullPrice(booking.nightly_rate * booking.nights)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guest total</span>
                  <span>{formatFullPrice(booking.total_amount)}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Platform fee (10%)</span>
                  <span>-{formatFullPrice(booking.service_fee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-heading font-bold text-base">
                  <span>Your Payout</span>
                  <span className="text-primary">{formatFullPrice(landlordPayout)}</span>
                </div>

                {booking.payment_reference && (
                  <div className="p-3 rounded-lg bg-muted/50 mt-2">
                    <p className="text-xs text-muted-foreground">Payment Ref</p>
                    <p className="text-xs font-mono truncate">{booking.payment_reference}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-3">
                {canRequestPayout && (
                  <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2" onClick={openPayoutDialog}>
                        <Banknote className="h-4 w-4" />
                        Request Payout
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request M-Pesa Payout</DialogTitle>
                        <DialogDescription>
                          Enter your M-Pesa phone number to receive {formatFullPrice(landlordPayout)}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="payout-phone">M-Pesa Phone Number</Label>
                          <Input
                            id="payout-phone"
                            placeholder="254712345678"
                            value={payoutPhone}
                            onChange={(e) => setPayoutPhone(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">Format: 254XXXXXXXXX</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payout amount</span>
                            <span className="font-semibold">{formatFullPrice(landlordPayout)}</span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleRequestPayout}
                          disabled={!payoutPhone || requestPayout.isPending}
                          className="gap-2"
                        >
                          {requestPayout.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                          Confirm Payout
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {hasPayout && payout?.status === 'completed' && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-primary font-medium">Payout sent</span>
                  </div>
                )}

                {canCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                        <XCircle className="h-4 w-4" />
                        Cancel Booking
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel the booking for {booking.guest_name}. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => cancelBooking.mutate(booking.id)}
                          disabled={cancelBooking.isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {cancelBooking.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          Cancel Booking
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <Link to={`/landlord/messages`}>
                  <Button variant="outline" className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message Guest
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Booking Reference */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Booking Reference</p>
                    <p className="text-xs font-mono truncate">{booking.id.slice(0, 8)}...</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={copyBookingRef} className="shrink-0">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
