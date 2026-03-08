import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminWithdraw } from '@/hooks/useBookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { formatFullPrice, formatDate } from '@/lib/formatters';
import {
  Loader2, TrendingUp, CreditCard, Banknote, ArrowDownToLine, Wallet,
  Users, ShieldCheck, Download, Search, PieChart as PieChartIcon, Lock,
} from 'lucide-react';
import { format, subMonths, startOfMonth } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// ──────────────────────────── types
interface SubscriptionRow {
  id: string; user_id: string; plan: string; amount: number; status: string;
  payment_method: string | null; starts_at: string | null; expires_at: string | null;
  created_at: string; landlord_name: string | null; landlord_email: string | null;
}
interface BookingRow {
  id: string; guest_id: string; landlord_id: string; property_id: string;
  total_amount: number; service_fee: number; status: string; payment_method: string;
  check_in_date: string; check_out_date: string; created_at: string;
  guest_name: string | null; landlord_name: string | null; property_title: string | null;
}
interface PayoutRow {
  id: string; booking_id: string; landlord_id: string; amount: number;
  phone_number: string; status: string; mpesa_receipt: string | null;
  created_at: string; landlord_name: string | null;
}
interface WithdrawalRow {
  id: string; admin_id: string; amount: number; phone_number: string;
  source: string; status: string; mpesa_receipt: string | null; created_at: string;
}

// ──────────────────────────── fetch
async function fetchFinanceData() {
  const [bookingsRes, subsRes, withdrawalsRes, payoutsRes, profilesRes, propertiesRes] = await Promise.all([
    supabase.from('bookings').select('*').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
    supabase.from('admin_withdrawals').select('*').order('created_at', { ascending: false }),
    supabase.from('payouts').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('user_id, full_name, email'),
    supabase.from('properties').select('id, title'),
  ]);

  const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
  const propertyMap = new Map((propertiesRes.data || []).map(p => [p.id, p]));

  const subscriptions: SubscriptionRow[] = (subsRes.data || []).map(s => {
    const profile = profileMap.get(s.user_id);
    return { ...s, landlord_name: profile?.full_name || null, landlord_email: profile?.email || null };
  });

  const paidStatuses = ['paid', 'checked_in', 'completed'];
  const allBookings = bookingsRes.data || [];

  const bookings: BookingRow[] = allBookings.map(b => {
    const guest = profileMap.get(b.guest_id);
    const landlord = profileMap.get(b.landlord_id);
    const property = propertyMap.get(b.property_id);
    return {
      ...b,
      guest_name: guest?.full_name || guest?.email || null,
      landlord_name: landlord?.full_name || null,
      property_title: property?.title || null,
    };
  });

  const payouts: PayoutRow[] = (payoutsRes.data || []).map(p => {
    const landlord = profileMap.get(p.landlord_id);
    return { ...p, landlord_name: landlord?.full_name || null };
  });

  const withdrawals: WithdrawalRow[] = withdrawalsRes.data || [];

  // Aggregates
  const subRevenue = subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + Number(s.amount), 0);
  const airbnbCommissions = allBookings.filter(b => paidStatuses.includes(b.status)).reduce((sum, b) => sum + Number(b.service_fee), 0);
  const totalRevenue = subRevenue + airbnbCommissions;
  const totalWithdrawn = withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.amount, 0);
  const availableBalance = totalRevenue - totalWithdrawn;
  const activeSubscribers = subscriptions.filter(s => s.status === 'active' && s.expires_at && new Date(s.expires_at) > new Date()).length;

  // Landlord payout aggregates
  const totalPaidOut = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayouts = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const failedPayouts = payouts.filter(p => p.status === 'failed').length;

  // Escrow: bookings with status 'paid' (collected but not yet released)
  const escrowAmount = allBookings.filter(b => b.status === 'paid').reduce((sum, b) => sum + Number(b.total_amount), 0);

  // Cancelled/refunded bookings
  const cancelledBookings = allBookings.filter(b => b.status === 'cancelled');
  const cancelledAmount = cancelledBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);

  // Payment method breakdown
  const mpesaCount = allBookings.filter(b => paidStatuses.includes(b.status) && b.payment_method === 'mpesa').length;
  const stripeCount = allBookings.filter(b => paidStatuses.includes(b.status) && b.payment_method === 'stripe').length;

  // Revenue trend (last 6 months)
  const now = new Date();
  const revenueTrend = Array.from({ length: 6 }, (_, i) => {
    const monthStart = startOfMonth(subMonths(now, 5 - i));
    const monthEnd = startOfMonth(subMonths(now, 4 - i));
    const label = format(monthStart, 'MMM');
    const subsInMonth = subscriptions
      .filter(s => s.status === 'active' && s.created_at && new Date(s.created_at) >= monthStart && new Date(s.created_at) < monthEnd)
      .reduce((sum, s) => sum + Number(s.amount), 0);
    const commInMonth = allBookings
      .filter(b => paidStatuses.includes(b.status) && new Date(b.created_at) >= monthStart && new Date(b.created_at) < monthEnd)
      .reduce((sum, b) => sum + Number(b.service_fee), 0);
    return { month: label, subscriptions: subsInMonth, commissions: commInMonth };
  });

  return {
    subscriptions, bookings, payouts, withdrawals,
    subRevenue, airbnbCommissions, totalRevenue, totalWithdrawn, availableBalance,
    activeSubscribers, totalPaidOut, pendingPayouts, failedPayouts,
    escrowAmount, cancelledAmount, cancelledCount: cancelledBookings.length,
    mpesaCount, stripeCount, revenueTrend,
  };
}

// ──────────────────────────── helpers
const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    expired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    checked_in: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    pending_payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return <Badge variant="secondary" className={colors[status] || ''}>{status.replace(/_/g, ' ')}</Badge>;
};

function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))'];

// ──────────────────────────── component
export default function AdminFinancePage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-finance'], queryFn: fetchFinanceData });

  const adminWithdraw = useAdminWithdraw();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Filters
  const [subSearch, setSubSearch] = useState('');
  const [subStatus, setSubStatus] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatus, setBookingStatus] = useState('all');

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || !withdrawPhone) return;
    adminWithdraw.mutate(
      { amount, phoneNumber: withdrawPhone, source: 'mixed' },
      { onSuccess: () => { setWithdrawOpen(false); setWithdrawAmount(''); } },
    );
  };

  const filteredSubs = useMemo(() => (data?.subscriptions || []).filter(s => {
    const ms = !subSearch || s.landlord_name?.toLowerCase().includes(subSearch.toLowerCase()) || s.landlord_email?.toLowerCase().includes(subSearch.toLowerCase());
    const mst = subStatus === 'all' || s.status === subStatus;
    return ms && mst;
  }), [data?.subscriptions, subSearch, subStatus]);

  const filteredBookings = useMemo(() => (data?.bookings || []).filter(b => {
    const ms = !bookingSearch || b.guest_name?.toLowerCase().includes(bookingSearch.toLowerCase()) || b.landlord_name?.toLowerCase().includes(bookingSearch.toLowerCase()) || b.property_title?.toLowerCase().includes(bookingSearch.toLowerCase());
    const mst = bookingStatus === 'all' || b.status === bookingStatus;
    return ms && mst;
  }), [data?.bookings, bookingSearch, bookingStatus]);

  const paymentPieData = useMemo(() => [
    { name: 'M-Pesa', value: data?.mpesaCount || 0 },
    { name: 'Stripe', value: data?.stripeCount || 0 },
  ], [data?.mpesaCount, data?.stripeCount]);

  // ──── stat card helper
  const StatCard = ({ icon: Icon, label, value, iconClass }: { icon: React.ElementType; label: string; value: string | number; iconClass?: string }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Icon className={`h-5 w-5 ${iconClass || 'text-primary'}`} /></div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-heading font-bold text-lg">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Finance</h1>
            <p className="text-muted-foreground text-sm mt-1">Revenue, commissions, payouts &amp; withdrawals in one place.</p>
          </div>
          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><ArrowDownToLine className="h-4 w-4" />Withdraw</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw Commission</DialogTitle>
                <DialogDescription>Send platform earnings to your M-Pesa. Available: {formatFullPrice(data?.availableBalance || 0)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Amount (KES)</Label>
                  <Input type="number" placeholder="Enter amount" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} max={data?.availableBalance || 0} />
                </div>
                <div className="space-y-2">
                  <Label>M-Pesa Phone Number</Label>
                  <Input placeholder="254712345678" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleWithdraw} disabled={!withdrawAmount || !withdrawPhone || adminWithdraw.isPending} className="gap-2">
                  {adminWithdraw.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Confirm Withdrawal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="landlord-payouts">Landlord Payouts</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            </TabsList>

            {/* ──── OVERVIEW ──── */}
            <TabsContent value="overview" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard icon={TrendingUp} label="Total Revenue" value={formatFullPrice(data?.totalRevenue ?? 0)} />
                <StatCard icon={Wallet} label="Available Balance" value={formatFullPrice(data?.availableBalance ?? 0)} />
                <StatCard icon={Banknote} label="Total Withdrawn" value={formatFullPrice(data?.totalWithdrawn ?? 0)} />
                <StatCard icon={CreditCard} label="Pending Payouts" value={formatFullPrice(data?.pendingPayouts ?? 0)} />
                <StatCard icon={Lock} label="Escrow (Held)" value={formatFullPrice(data?.escrowAmount ?? 0)} />
                <StatCard icon={Users} label="Active Subscribers" value={data?.activeSubscribers ?? 0} />
              </div>

              {/* Revenue Trend Chart */}
              <Card>
                <CardHeader><CardTitle className="text-base font-heading">Revenue Trend (6 Months)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip formatter={(v: number) => formatFullPrice(v)} />
                        <Bar dataKey="subscriptions" name="Subscriptions" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="commissions" name="Commissions" stackId="a" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Bottom row: Payment breakdown + Escrow/Refund */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Method Pie */}
                <Card>
                  <CardHeader><CardTitle className="text-base font-heading">Payment Method Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    {(data?.mpesaCount || 0) + (data?.stripeCount || 0) === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No paid bookings yet.</p>
                    ) : (
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={paymentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                              {paymentPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                            </Pie>
                            <Legend />
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Escrow + Refund summary */}
                <Card>
                  <CardHeader><CardTitle className="text-base font-heading">Escrow &amp; Refunds</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3"><Lock className="h-5 w-5 text-muted-foreground" /><span className="text-sm">Funds in Escrow</span></div>
                      <span className="font-heading font-bold">{formatFullPrice(data?.escrowAmount ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-muted-foreground" /><span className="text-sm">Total Paid to Landlords</span></div>
                      <span className="font-heading font-bold">{formatFullPrice(data?.totalPaidOut ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3"><Banknote className="h-5 w-5 text-destructive" /><span className="text-sm">Cancelled Bookings ({data?.cancelledCount ?? 0})</span></div>
                      <span className="font-heading font-bold">{formatFullPrice(data?.cancelledAmount ?? 0)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ──── SUBSCRIPTIONS ──── */}
            <TabsContent value="subscriptions" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={CreditCard} label="Subscription Revenue" value={formatFullPrice(data?.subRevenue ?? 0)} />
                <StatCard icon={Users} label="Active Subscribers" value={data?.activeSubscribers ?? 0} />
                <StatCard icon={TrendingUp} label="Total Subscriptions" value={data?.subscriptions.length ?? 0} />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by landlord name or email..." value={subSearch} onChange={e => setSubSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={subStatus} onValueChange={setSubStatus}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCSV(filteredSubs.map(s => ({ Landlord: s.landlord_name, Email: s.landlord_email, Plan: s.plan, Amount: s.amount, Status: s.status, Start: s.starts_at, Expiry: s.expires_at })), 'subscriptions.csv')}>
                  <Download className="h-4 w-4" />CSV
                </Button>
              </div>
              <div className="bg-card rounded-lg border border-border overflow-x-auto">
                {filteredSubs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No subscriptions found</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Landlord</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead>Start</TableHead><TableHead>Expiry</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {filteredSubs.map(s => (
                        <TableRow key={s.id}>
                          <TableCell><p className="font-medium">{s.landlord_name || 'Unknown'}</p><p className="text-xs text-muted-foreground">{s.landlord_email}</p></TableCell>
                          <TableCell className="capitalize">{s.plan}</TableCell>
                          <TableCell className="font-medium">{formatFullPrice(Number(s.amount))}</TableCell>
                          <TableCell className="capitalize">{s.payment_method || '—'}</TableCell>
                          <TableCell>{statusBadge(s.status)}</TableCell>
                          <TableCell>{s.starts_at ? format(new Date(s.starts_at), 'MMM d, yyyy') : '—'}</TableCell>
                          <TableCell>{s.expires_at ? format(new Date(s.expires_at), 'MMM d, yyyy') : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            {/* ──── COMMISSIONS ──── */}
            <TabsContent value="commissions" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={TrendingUp} label="Total Commission" value={formatFullPrice(data?.airbnbCommissions ?? 0)} />
                <StatCard icon={CreditCard} label="Total Bookings" value={data?.bookings.length ?? 0} />
                <StatCard icon={Banknote} label="Avg Commission" value={formatFullPrice(data?.bookings.length ? Math.round((data?.airbnbCommissions ?? 0) / data.bookings.length) : 0)} />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by guest, landlord, or property..." value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={bookingStatus} onValueChange={setBookingStatus}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending_payment">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCSV(filteredBookings.map(b => ({ Guest: b.guest_name, Property: b.property_title, Landlord: b.landlord_name, Total: b.total_amount, Fee: b.service_fee, Payment: b.payment_method, Status: b.status, CheckIn: b.check_in_date, CheckOut: b.check_out_date })), 'commissions.csv')}>
                  <Download className="h-4 w-4" />CSV
                </Button>
              </div>
              <div className="bg-card rounded-lg border border-border overflow-x-auto">
                {filteredBookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No bookings found</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Guest</TableHead><TableHead>Property</TableHead><TableHead>Landlord</TableHead>
                      <TableHead>Total</TableHead><TableHead>Platform Fee</TableHead><TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead><TableHead>Dates</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {filteredBookings.map(b => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.guest_name || 'Unknown'}</TableCell>
                          <TableCell>{b.property_title || '—'}</TableCell>
                          <TableCell>{b.landlord_name || 'Unknown'}</TableCell>
                          <TableCell className="font-medium">{formatFullPrice(Number(b.total_amount))}</TableCell>
                          <TableCell className="font-medium text-green-600">{formatFullPrice(Number(b.service_fee))}</TableCell>
                          <TableCell className="capitalize">{b.payment_method}</TableCell>
                          <TableCell>{statusBadge(b.status)}</TableCell>
                          <TableCell><p className="text-xs">{format(new Date(b.check_in_date), 'MMM d')} – {format(new Date(b.check_out_date), 'MMM d, yyyy')}</p></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            {/* ──── LANDLORD PAYOUTS ──── */}
            <TabsContent value="landlord-payouts" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={Banknote} label="Total Paid Out" value={formatFullPrice(data?.totalPaidOut ?? 0)} />
                <StatCard icon={CreditCard} label="Pending Payouts" value={formatFullPrice(data?.pendingPayouts ?? 0)} />
                <StatCard icon={ShieldCheck} label="Failed Payouts" value={data?.failedPayouts ?? 0} />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCSV((data?.payouts || []).map(p => ({ Landlord: p.landlord_name, Amount: p.amount, Phone: p.phone_number, Status: p.status, Receipt: p.mpesa_receipt, Date: p.created_at })), 'landlord-payouts.csv')}>
                  <Download className="h-4 w-4" />CSV
                </Button>
              </div>
              <div className="bg-card rounded-lg border border-border overflow-x-auto">
                {!data?.payouts.length ? (
                  <div className="text-center py-12">
                    <Banknote className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground text-sm">No landlord payouts yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Landlord</TableHead><TableHead>Amount</TableHead><TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead><TableHead>Receipt</TableHead><TableHead>Date</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {data.payouts.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.landlord_name || 'Unknown'}</TableCell>
                          <TableCell className="font-medium">{formatFullPrice(p.amount)}</TableCell>
                          <TableCell className="font-mono text-xs">{p.phone_number}</TableCell>
                          <TableCell>{statusBadge(p.status)}</TableCell>
                          <TableCell className="font-mono text-xs truncate max-w-[120px]">{p.mpesa_receipt || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(p.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            {/* ──── ADMIN WITHDRAWALS ──── */}
            <TabsContent value="withdrawals" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={ArrowDownToLine} label="Total Withdrawn" value={formatFullPrice(data?.totalWithdrawn ?? 0)} />
                <StatCard icon={Wallet} label="Available Balance" value={formatFullPrice(data?.availableBalance ?? 0)} />
                <StatCard icon={Banknote} label="Withdrawals Made" value={data?.withdrawals.length ?? 0} />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCSV((data?.withdrawals || []).map(w => ({ Amount: w.amount, Phone: w.phone_number, Source: w.source, Status: w.status, Receipt: w.mpesa_receipt, Date: w.created_at })), 'admin-withdrawals.csv')}>
                  <Download className="h-4 w-4" />CSV
                </Button>
              </div>
              <div className="bg-card rounded-lg border border-border overflow-x-auto">
                {!data?.withdrawals.length ? (
                  <div className="text-center py-12">
                    <ArrowDownToLine className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground text-sm">No withdrawals yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Amount</TableHead><TableHead>Phone</TableHead><TableHead>Source</TableHead>
                      <TableHead>Status</TableHead><TableHead>Receipt</TableHead><TableHead>Date</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {data.withdrawals.map(w => (
                        <TableRow key={w.id}>
                          <TableCell className="font-medium">{formatFullPrice(w.amount)}</TableCell>
                          <TableCell className="font-mono text-xs">{w.phone_number}</TableCell>
                          <TableCell className="capitalize">{w.source}</TableCell>
                          <TableCell>{statusBadge(w.status)}</TableCell>
                          <TableCell className="font-mono text-xs truncate max-w-[120px]">{w.mpesa_receipt || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(w.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
