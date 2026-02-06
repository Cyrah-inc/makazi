import { useQuery } from '@tanstack/react-query';
import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, Eye, Plus, Clock, CheckCircle, XCircle, CalendarDays, DollarSign, Users, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLandlordBookings } from '@/hooks/useBookings';
import { BOOKING_STATUS_CONFIG, BookingStatus } from '@/types/booking';
import { Link } from 'react-router-dom';
import { formatCurrency, formatFullPrice, formatDate } from '@/lib/formatters';
import { getBookingRelativeLabel } from '@/lib/bookingUtils';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';

export default function LandlordDashboard() {
  const { user } = useAuth();
  const { data: bookings } = useLandlordBookings();

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

  // Fetch average rating for landlord's properties
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
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your property listings & bookings</p>
          </div>
          <Link to="/landlord/add-property">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add New Property
            </Button>
          </Link>
        </div>

        {/* Property Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Properties</CardTitle>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{propertyStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Approved</CardTitle>
              <CheckCircle className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">{propertyStats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Clock className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-accent">{propertyStats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{propertyStats.totalViews}</div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Bookings</CardTitle>
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{bookingStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">{formatFullPrice(bookingStats.revenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Active Guests</CardTitle>
              <Users className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-accent">{bookingStats.activeGuests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
              <Star className="w-4 h-4 text-[hsl(var(--gold))]" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{bookingStats.avgRating}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card className="mb-6 lg:mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Link to="/landlord/airbnb-bookings">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => {
                  const statusConfig = BOOKING_STATUS_CONFIG[booking.status as BookingStatus];
                  const relativeLabel = getBookingRelativeLabel(booking.check_in_date, booking.check_out_date, booking.status);
                  return (
                    <Link key={booking.id} to={`/landlord/airbnb-bookings/${booking.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer mb-2">
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Properties</CardTitle>
            <Link to="/landlord/properties">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentProperties.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No properties yet</p>
                <Link to="/landlord/add-property">
                  <Button className="mt-4">Add Your First Property</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProperties.map((property) => (
                  <div key={property.id} className="flex items-center gap-4 p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {property.images?.[0] ? (
                        <img src={getOptimizedImageUrl(property.images[0], IMAGE_SIZES.DASHBOARD.width, IMAGE_SIZES.DASHBOARD.quality)} alt={property.title} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-muted-foreground" />
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
    </LandlordLayout>
  );
}
