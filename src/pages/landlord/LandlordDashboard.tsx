import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, Eye, Plus, Clock, CheckCircle, XCircle, CalendarDays, DollarSign, Users, Star } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { StatsCardCompactSkeleton } from '@/components/skeletons/StatsCardSkeleton';
import { DashboardListItemSkeleton } from '@/components/skeletons/ListSkeletons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLandlordBookings } from '@/hooks/useBookings';
import { BOOKING_STATUS_CONFIG, BookingStatus } from '@/types/booking';
import { Link } from 'react-router-dom';
import { formatCurrency, formatFullPrice, formatDate } from '@/lib/formatters';
import { getBookingRelativeLabel } from '@/lib/bookingUtils';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';
import { useLandlordProfile } from '@/hooks/useLandlordProfile';
import { VerificationBanner } from '@/components/landlord/VerificationBanner';
import { SubscriptionPaymentDialog } from '@/components/landlord/SubscriptionPaymentDialog';

const MobileAddPropertyFAB = () => {
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  return (
    <Link to="/landlord/add-property" className="fixed bottom-6 right-6 z-40">
      <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
        <Plus className="w-6 h-6" />
      </Button>
    </Link>
  );
};

export default function LandlordDashboard() {
  const { user } = useAuth();
  const { data: bookings } = useLandlordBookings();
  const { landlordProfile, needsSubscription } = useLandlordProfile();
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['landlord-properties', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const propertyIds = properties?.map(p => p.id) || [];
  const { data: reviews } = useQuery({
    queryKey: ['landlord-reviews', propertyIds],
    queryFn: async () => {
      if (!propertyIds.length) return [];
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .in('property_id', propertyIds);
      if (error) throw error;
      return data || [];
    },
    enabled: propertyIds.length > 0,
  });

  const propertyStats = {
    total: properties?.length ?? 0,
    approved: properties?.filter(p => p.status === 'approved').length ?? 0,
    pending: properties?.filter(p => p.status === 'pending').length ?? 0,
    rejected: properties?.filter(p => p.status === 'rejected').length ?? 0,
    totalViews: properties?.reduce((sum, p) => sum + (p.views_count || 0), 0) ?? 0,
  };

  const bookingStats = {
    total: bookings?.length ?? 0,
    revenue: bookings
      ?.filter(b => ['checked_in', 'completed'].includes(b.status))
      .reduce((sum, b) => sum + b.total_amount - b.service_fee, 0) ?? 0,
    activeGuests: bookings?.filter(b => b.status === 'checked_in').length ?? 0,
    avgRating: reviews?.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 'N/A',
  };

  const recentProperties = properties?.slice(0, 5) ?? [];
  const recentBookings = bookings?.slice(0, 5) ?? [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/10"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'pending':
        return <Badge className="bg-accent/10 text-accent hover:bg-accent/10"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'G';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <LandlordLayout>
      <div className="space-y-6">
        {/* Verification / Subscription Banner */}
        {landlordProfile && (
          <VerificationBanner
            verificationStatus={landlordProfile.verification_status}
            verificationNotes={landlordProfile.verification_notes}
            needsSubscription={needsSubscription}
            onSubscribe={() => setSubscriptionOpen(true)}
          />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage your property listings & bookings</p>
          </div>
          <Link to="/landlord/add-property">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Add New Property
            </Button>
          </Link>
        </div>

        {/* Property Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted shrink-0">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Properties</p>
                <p className="font-heading text-lg sm:text-2xl font-bold">{propertyStats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
                <p className="font-heading text-lg sm:text-2xl font-bold text-primary">{propertyStats.approved}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent/10 shrink-0">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                <p className="font-heading text-lg sm:text-2xl font-bold text-accent">{propertyStats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted shrink-0">
                <Eye className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Views</p>
                <p className="font-heading text-lg sm:text-2xl font-bold">{propertyStats.totalViews}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted shrink-0">
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Bookings</p>
                <p className="font-heading text-lg sm:text-2xl font-bold">{bookingStats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Revenue</p>
                <p className="font-heading text-lg sm:text-xl font-bold text-primary">{formatFullPrice(bookingStats.revenue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent/10 shrink-0">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Guests</p>
                <p className="font-heading text-lg sm:text-2xl font-bold text-accent">{bookingStats.activeGuests}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[hsl(var(--gold))]/10 shrink-0">
                <Star className="w-5 h-5 text-[hsl(var(--gold))]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Avg Rating</p>
                <p className="font-heading text-lg sm:text-2xl font-bold">{bookingStats.avgRating}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-heading">Recent Bookings</CardTitle>
            <Link to="/landlord/airbnb-bookings">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentBookings.map((booking) => {
                  const statusConfig = BOOKING_STATUS_CONFIG[booking.status as BookingStatus];
                  const relativeLabel = getBookingRelativeLabel(booking.check_in_date, booking.check_out_date, booking.status);
                  return (
                    <Link key={booking.id} to={`/landlord/airbnb-bookings/${booking.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer mb-1">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(booking.guest_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{booking.guest_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {booking.property_title} · {formatDate(booking.check_in_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground hidden sm:inline">{relativeLabel.text}</span>
                          <Badge className={cn('text-xs', statusConfig?.color)}>
                            {statusConfig?.label}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Properties */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-heading">Recent Properties</CardTitle>
            <Link to="/landlord/properties">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <DashboardListItemSkeleton key={i} />
                ))}
              </div>
            ) : recentProperties.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">No properties yet</p>
                <Link to="/landlord/add-property">
                  <Button className="mt-4">Add Your First Property</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProperties.map((property) => (
                  <div key={property.id} className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {property.images?.[0] ? (
                        <img src={getOptimizedImageUrl(property.images[0], IMAGE_SIZES.DASHBOARD.width, IMAGE_SIZES.DASHBOARD.quality)} alt={property.title} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate text-sm">{property.title}</h4>
                      <p className="text-xs text-muted-foreground">{property.city}, {property.state}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="font-semibold text-primary text-sm">{formatCurrency(property.price)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
                        <Eye className="w-3 h-3" />
                        {property.views_count}
                      </div>
                    </div>
                    {getStatusBadge(property.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Mobile FAB for Add Property */}
      <MobileAddPropertyFAB />
      <SubscriptionPaymentDialog open={subscriptionOpen} onOpenChange={setSubscriptionOpen} />
    </LandlordLayout>
  );
}
