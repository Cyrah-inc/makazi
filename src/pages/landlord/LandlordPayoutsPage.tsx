import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { useLandlordPayouts, useLandlordBookings } from '@/hooks/useBookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatFullPrice, formatDate } from '@/lib/formatters';
import { Loader2, Banknote, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';

export default function LandlordPayoutsPage() {
  const { data: payouts, isLoading } = useLandlordPayouts();
  const { data: bookings } = useLandlordBookings();

  const completedPayouts = payouts?.filter(p => p.status === 'completed') || [];
  const pendingPayouts = payouts?.filter(p => p.status === 'pending') || [];
  const totalEarned = completedPayouts.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

  // Bookings eligible for payout (checked_in but no payout yet)
  const payoutBookingIds = new Set(payouts?.map(p => p.booking_id) || []);
  const awaitingPayout = bookings?.filter(b => b.status === 'checked_in' && !payoutBookingIds.has(b.id)) || [];
  const awaitingAmount = awaitingPayout.reduce((sum, b) => sum + b.total_amount - b.service_fee, 0);

  // Map booking IDs to property names
  const bookingMap = new Map(bookings?.map(b => [b.id, b]) || []);

  return (
    <LandlordLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Payouts</h1>
          <p className="text-muted-foreground text-sm">Track your earnings and payout history.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                  <p className="font-heading font-bold text-lg">{formatFullPrice(totalEarned)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-700" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending Payouts</p>
                  <p className="font-heading font-bold text-lg">{formatFullPrice(pendingAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Banknote className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Awaiting Request</p>
                  <p className="font-heading font-bold text-lg">{formatFullPrice(awaitingAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completed Payouts</p>
                  <p className="font-heading font-bold text-lg">{completedPayouts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payout History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !payouts?.length ? (
              <div className="text-center py-8">
                <Banknote className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">No payouts yet.</p>
                <p className="text-muted-foreground text-xs mt-1">Request payouts from your completed bookings.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((p) => {
                      const b = bookingMap.get(p.booking_id);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium truncate max-w-[160px]">
                            {b?.property_title || 'Unknown'}
                          </TableCell>
                          <TableCell>{formatFullPrice(p.amount)}</TableCell>
                          <TableCell className="font-mono text-xs">{p.phone_number}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === 'completed' ? 'default' : p.status === 'failed' ? 'destructive' : 'secondary'}>
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs truncate max-w-[120px]">
                            {p.mpesa_receipt || '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(p.created_at)}
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
}
