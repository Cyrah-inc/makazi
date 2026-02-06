import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { useLandlordBookings } from '@/hooks/useBookings';
import { BOOKING_STATUS_CONFIG, BookingStatus } from '@/types/booking';
import { formatFullPrice, formatDate } from '@/lib/formatters';
import { getBookingRelativeLabel } from '@/lib/bookingUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, CalendarDays, DollarSign, Users, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const LandlordAirbnbPage = () => {
  const { data: bookings, isLoading } = useLandlordBookings();
  const isMobile = useIsMobile();

  const stats = {
    total: bookings?.length || 0,
    pendingCheckIn: bookings?.filter(b => b.status === 'paid').length || 0,
    revenue: bookings
      ?.filter(b => ['checked_in', 'completed'].includes(b.status))
      .reduce((sum, b) => sum + b.total_amount - b.service_fee, 0) || 0,
    activeGuests: bookings?.filter(b => b.status === 'checked_in').length || 0,
  };

  const getInitials = (name?: string) => {
    if (!name) return 'G';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <LandlordLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Airbnb Bookings</h1>
          <p className="text-muted-foreground text-sm">Track reservations and revenue</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Bookings', value: stats.total, icon: CalendarDays, color: 'text-primary' },
            { label: 'Pending Check-ins', value: stats.pendingCheckIn, icon: Clock, color: 'text-blue-600' },
            { label: 'Revenue Earned', value: formatFullPrice(stats.revenue), icon: DollarSign, color: 'text-green-600' },
            { label: 'Active Guests', value: stats.activeGuests, icon: Users, color: 'text-accent' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('p-2 rounded-lg bg-muted', stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-heading text-lg sm:text-xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !bookings?.length ? (
              <div className="text-center py-12">
                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">No bookings yet</p>
              </div>
            ) : isMobile ? (
              /* Mobile card layout */
              <div className="space-y-3">
                {bookings.map(booking => {
                  const statusConfig = BOOKING_STATUS_CONFIG[booking.status as BookingStatus];
                  const relativeLabel = getBookingRelativeLabel(booking.check_in_date, booking.check_out_date, booking.status);
                  return (
                    <Link key={booking.id} to={`/landlord/airbnb-bookings/${booking.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {getInitials(booking.guest_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-sm truncate">{booking.guest_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{booking.property_title}</p>
                                </div>
                                <Badge className={cn('text-xs shrink-0', statusConfig?.color)}>
                                  {statusConfig?.label || booking.status}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{formatDate(booking.check_in_date)} → {formatDate(booking.check_out_date)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-heading font-bold text-sm">
                                  {formatFullPrice(booking.total_amount - booking.service_fee)}
                                </span>
                                <span className="text-xs text-muted-foreground">{relativeLabel.text}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* Desktop table layout */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map(booking => {
                      const statusConfig = BOOKING_STATUS_CONFIG[booking.status as BookingStatus];
                      return (
                        <TableRow
                          key={booking.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => window.location.href = `/landlord/airbnb-bookings/${booking.id}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(booking.guest_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{booking.guest_name}</p>
                                <p className="text-xs text-muted-foreground">{booking.guest_email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{booking.property_title}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{formatDate(booking.check_in_date)}</p>
                              <p className="text-muted-foreground">→ {formatDate(booking.check_out_date)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-heading font-bold">
                            {formatFullPrice(booking.total_amount - booking.service_fee)}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('text-xs', statusConfig?.color)}>
                              {statusConfig?.label || booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link to={`/landlord/airbnb-bookings/${booking.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1">
                                Details <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LandlordLayout>
  );
};

export default LandlordAirbnbPage;
