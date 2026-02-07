import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DollarSign, Users, TrendingUp, CreditCard, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  status: string;
  payment_method: string | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  landlord_name: string | null;
  landlord_email: string | null;
}

interface BookingRow {
  id: string;
  guest_id: string;
  landlord_id: string;
  property_id: string;
  total_amount: number;
  service_fee: number;
  status: string;
  payment_method: string;
  check_in_date: string;
  check_out_date: string;
  created_at: string;
  guest_name: string | null;
  landlord_name: string | null;
  property_title: string | null;
}

async function fetchRevenueData() {
  const [subsRes, bookingsRes, profilesRes, propertiesRes] = await Promise.all([
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
    supabase.from('bookings').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('user_id, full_name, email'),
    supabase.from('properties').select('id, title'),
  ]);

  const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
  const propertyMap = new Map((propertiesRes.data || []).map(p => [p.id, p]));

  const subscriptions: SubscriptionRow[] = (subsRes.data || []).map(s => {
    const profile = profileMap.get(s.user_id);
    return {
      ...s,
      landlord_name: profile?.full_name || null,
      landlord_email: profile?.email || null,
    };
  });

  const bookings: BookingRow[] = (bookingsRes.data || []).map(b => {
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

  const paidStatuses = ['paid', 'checked_in', 'completed'];
  const subRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + Number(s.amount), 0);
  const airbnbRevenue = bookings
    .filter(b => paidStatuses.includes(b.status))
    .reduce((sum, b) => sum + Number(b.service_fee), 0);
  const activeSubscribers = subscriptions.filter(
    s => s.status === 'active' && s.expires_at && new Date(s.expires_at) > new Date()
  ).length;

  return {
    subscriptions,
    bookings,
    subRevenue,
    airbnbRevenue,
    totalRevenue: subRevenue + airbnbRevenue,
    activeSubscribers,
  };
}

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    expired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    checked_in: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    pending_payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return (
    <Badge variant="secondary" className={colors[status] || ''}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
};

function formatKES(amount: number) {
  return `KES ${amount.toLocaleString()}`;
}

export default function AdminRevenuePage() {
  const [subSearch, setSubSearch] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: fetchRevenueData,
  });

  const filteredSubs = (data?.subscriptions || []).filter(s => {
    const matchSearch = !subSearch || 
      s.landlord_name?.toLowerCase().includes(subSearch.toLowerCase()) ||
      s.landlord_email?.toLowerCase().includes(subSearch.toLowerCase());
    const matchStatus = subStatusFilter === 'all' || s.status === subStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredBookings = (data?.bookings || []).filter(b => {
    const matchSearch = !bookingSearch ||
      b.guest_name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.landlord_name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.property_title?.toLowerCase().includes(bookingSearch.toLowerCase());
    const matchStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Revenue</h1>
          <p className="text-muted-foreground mt-1">Track subscription revenue and Airbnb commissions</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatKES(data?.totalRevenue ?? 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Subscription Revenue</CardTitle>
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatKES(data?.subRevenue ?? 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Airbnb Commissions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatKES(data?.airbnbRevenue ?? 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.activeSubscribers ?? 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="subscriptions">
              <TabsList className="mb-4">
                <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                <TabsTrigger value="commissions">Airbnb Commissions</TabsTrigger>
              </TabsList>

              <TabsContent value="subscriptions">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search by landlord name or email..." value={subSearch} onChange={e => setSubSearch(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={subStatusFilter} onValueChange={setSubStatusFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-card rounded-lg border border-border overflow-x-auto">
                  {filteredSubs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">No subscriptions found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Landlord</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Start</TableHead>
                          <TableHead>Expiry</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubs.map(s => (
                          <TableRow key={s.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{s.landlord_name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{s.landlord_email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="capitalize">{s.plan}</TableCell>
                            <TableCell className="font-medium">{formatKES(Number(s.amount))}</TableCell>
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

              <TabsContent value="commissions">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search by guest, landlord, or property..." value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
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
                </div>
                <div className="bg-card rounded-lg border border-border overflow-x-auto">
                  {filteredBookings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">No bookings found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Guest</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Landlord</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Platform Fee</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Dates</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map(b => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{b.guest_name || 'Unknown'}</TableCell>
                            <TableCell>{b.property_title || '—'}</TableCell>
                            <TableCell>{b.landlord_name || 'Unknown'}</TableCell>
                            <TableCell className="font-medium">{formatKES(Number(b.total_amount))}</TableCell>
                            <TableCell className="font-medium text-green-600">{formatKES(Number(b.service_fee))}</TableCell>
                            <TableCell className="capitalize">{b.payment_method}</TableCell>
                            <TableCell>{statusBadge(b.status)}</TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <p>{format(new Date(b.check_in_date), 'MMM d')} - {format(new Date(b.check_out_date), 'MMM d, yyyy')}</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
