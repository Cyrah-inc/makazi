import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminWithdraw } from '@/hooks/useBookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { formatFullPrice, formatDate } from '@/lib/formatters';
import { Loader2, DollarSign, TrendingUp, CreditCard, Banknote, ArrowDownToLine } from 'lucide-react';

async function fetchCommissionData() {
  // Fetch bookings with status paid/checked_in/completed (service fees earned)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, service_fee, status, total_amount, created_at, property_id, guest_id')
    .in('status', ['paid', 'checked_in', 'completed'])
    .order('created_at', { ascending: false });

  // Fetch subscriptions (revenue)
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('id, amount, status, payment_reference, created_at, user_id')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Fetch admin withdrawals
  const { data: withdrawals } = await supabase
    .from('admin_withdrawals')
    .select('*')
    .order('created_at', { ascending: false });

  const airbnbCommissions = bookings?.reduce((sum, b) => sum + (b.service_fee || 0), 0) || 0;
  const subscriptionRevenue = subscriptions?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
  const totalWithdrawn = (withdrawals || [])
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  return {
    bookings: bookings || [],
    subscriptions: subscriptions || [],
    withdrawals: withdrawals || [],
    airbnbCommissions,
    subscriptionRevenue,
    totalCommissions: airbnbCommissions + subscriptionRevenue,
    availableBalance: airbnbCommissions + subscriptionRevenue - totalWithdrawn,
    totalWithdrawn,
  };
}

export default function AdminPayoutsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-commission-data'],
    queryFn: fetchCommissionData,
  });

  const adminWithdraw = useAdminWithdraw();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || !withdrawPhone) return;
    adminWithdraw.mutate(
      { amount, phoneNumber: withdrawPhone, source: 'mixed' },
      { onSuccess: () => { setWithdrawOpen(false); setWithdrawAmount(''); } }
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Platform Payouts</h1>
            <p className="text-muted-foreground text-sm">Commission earnings and withdrawal management.</p>
          </div>
          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <ArrowDownToLine className="h-4 w-4" />
                Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw Commission</DialogTitle>
                <DialogDescription>
                  Send platform earnings to your M-Pesa. Available: {formatFullPrice(data?.availableBalance || 0)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Amount (KES)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={data?.availableBalance || 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>M-Pesa Phone Number</Label>
                  <Input
                    placeholder="254712345678"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || !withdrawPhone || adminWithdraw.isPending}
                  className="gap-2"
                >
                  {adminWithdraw.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Withdrawal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Commissions</p>
                      <p className="font-heading font-bold text-lg">{formatFullPrice(data?.totalCommissions || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100"><CreditCard className="h-5 w-5 text-blue-700" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Airbnb Fees</p>
                      <p className="font-heading font-bold text-lg">{formatFullPrice(data?.airbnbCommissions || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100"><DollarSign className="h-5 w-5 text-green-700" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Subscription Revenue</p>
                      <p className="font-heading font-bold text-lg">{formatFullPrice(data?.subscriptionRevenue || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10"><Banknote className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Available Balance</p>
                      <p className="font-heading font-bold text-lg">{formatFullPrice(data?.availableBalance || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="commissions">
              <TabsList>
                <TabsTrigger value="commissions">Commission Sources</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawal History</TabsTrigger>
              </TabsList>

              <TabsContent value="commissions" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-heading">Airbnb Service Fees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Booking ID</TableHead>
                            <TableHead>Service Fee</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.bookings.map((b) => (
                            <TableRow key={b.id}>
                              <TableCell className="font-mono text-xs">{b.id.slice(0, 8)}...</TableCell>
                              <TableCell className="font-medium">{formatFullPrice(b.service_fee)}</TableCell>
                              <TableCell>{formatFullPrice(b.total_amount)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{b.status}</Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{formatDate(b.created_at)}</TableCell>
                            </TableRow>
                          ))}
                          {!data?.bookings.length && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No commission data yet.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="withdrawals" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-heading">Withdrawal History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Amount</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Receipt</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.withdrawals.map((w) => (
                            <TableRow key={w.id}>
                              <TableCell className="font-medium">{formatFullPrice(w.amount)}</TableCell>
                              <TableCell className="font-mono text-xs">{w.phone_number}</TableCell>
                              <TableCell className="capitalize">{w.source}</TableCell>
                              <TableCell>
                                <Badge variant={w.status === 'completed' ? 'default' : w.status === 'failed' ? 'destructive' : 'secondary'}>
                                  {w.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs truncate max-w-[120px]">{w.mpesa_receipt || '—'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{formatDate(w.created_at)}</TableCell>
                            </TableRow>
                          ))}
                          {!data?.withdrawals.length && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No withdrawals yet.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
