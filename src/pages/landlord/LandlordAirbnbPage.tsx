import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { useLandlordBookings } from '@/hooks/useBookings';
import { BOOKING_STATUS_CONFIG, BookingStatus } from '@/types/booking';
import { formatFullPrice, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, CalendarDays, DollarSign, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const LandlordAirbnbPage = () => {
  const { data: bookings, isLoading } = useLandlordBookings();

  const stats = {
    total: bookings?.length || 0,
    pendingCheckIn: bookings?.filter(b => b.status === 'paid').length || 0,
    revenue: bookings
      ?.filter(b => ['checked_in', 'completed'].includes(b.status))
      .reduce((sum, b) => sum + b.total_amount - b.service_fee, 0) || 0,
    activeGuests: bookings?.filter(b => b.status === 'checked_in').length || 0,
  };

  return (
    <LandlordLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Airbnb Bookings</h1>
          <p className="text-muted-foreground text-sm">Track reservations and revenue</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Bookings', value: stats.total, icon: CalendarDays, color: 'text-primary' },
            { label: 'Pending Check-ins', value: stats.pendingCheckIn, icon: Clock, color: 'text-blue-600' },
            { label: 'Revenue Earned', value: formatFullPrice(stats.revenue), icon: DollarSign, color: 'text-green-600' },
            { label: 'Active Guests', value: stats.activeGuests, icon: Users, color: 'text-orange-600' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn('p-2 rounded-lg bg-muted', stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-heading text-xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bookings Table */}
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
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map(booking => {
                      const statusConfig = BOOKING_STATUS_CONFIG[booking.status as BookingStatus];
                      return (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.guest_name}</p>
                              <p className="text-xs text-muted-foreground">{booking.guest_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{booking.property_title}</TableCell>
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
