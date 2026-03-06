import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Building2, CalendarDays, DollarSign, UserCheck, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface BookingRow {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  landlord_name: string | null;
  property_title: string | null;
  property_city: string | null;
  total_amount: number;
  service_fee: number;
  status: string;
  payment_method: string;
  check_in_date: string;
  check_out_date: string;
  created_at: string;
}

async function fetchAirbnbData() {
  const [bookingsRes, profilesRes, propertiesRes] = await Promise.all([
    supabase.from('bookings').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('user_id, full_name, email'),
    supabase.from('properties').select('id, title, city, property_type'),
  ]);

  const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
  const propertyMap = new Map((propertiesRes.data || []).map(p => [p.id, p]));

  const bookings: BookingRow[] = (bookingsRes.data || []).map(b => {
    const guest = profileMap.get(b.guest_id);
    const landlord = profileMap.get(b.landlord_id);
    const property = propertyMap.get(b.property_id);
    return {
      id: b.id,
      guest_name: guest?.full_name || null,
      guest_email: guest?.email || null,
      landlord_name: landlord?.full_name || null,
      property_title: property?.title || null,
      property_city: property?.city || null,
      total_amount: Number(b.total_amount),
      service_fee: Number(b.service_fee),
      status: b.status,
      payment_method: b.payment_method,
      check_in_date: b.check_in_date,
      check_out_date: b.check_out_date,
      created_at: b.created_at,
    };
  });

  const paidStatuses = ['paid', 'checked_in', 'completed'];
  const airbnbListings = (propertiesRes.data || []).filter(p => p.property_type === 'airbnb').length;
  const platformRevenue = bookings
    .filter(b => paidStatuses.includes(b.status))
    .reduce((sum, b) => sum + b.service_fee, 0);
  const activeCheckins = bookings.filter(b => b.status === 'checked_in').length;

  return { bookings, airbnbListings, platformRevenue, activeCheckins, totalBookings: bookings.length };
}

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  checked_in: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  pending_payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

function formatKES(amount: number) {
  return `KES ${amount.toLocaleString()}`;
}

export default function AdminAirbnbPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-airbnb'],
    queryFn: fetchAirbnbData,
  });

  const filtered = (data?.bookings || []).filter(b => {
    const matchSearch = !search ||
      b.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.guest_email?.toLowerCase().includes(search.toLowerCase()) ||
      b.landlord_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.property_title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchPayment = paymentFilter === 'all' || b.payment_method === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Airbnb Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage all Airbnb bookings across the platform</p>
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">Airbnb Listings</CardTitle>
                  <Building2 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{data?.airbnbListings ?? 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{data?.totalBookings ?? 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Platform Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{formatKES(data?.platformRevenue ?? 0)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Check-ins</CardTitle>
                  <UserCheck className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{data?.activeCheckins ?? 0}</div></CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by guest, landlord, or property..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending_payment">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Payment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border border-border overflow-x-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No bookings found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Landlord</TableHead>
                      <TableHead>Check-in / Out</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Platform Fee</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Booked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(b => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{b.guest_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{b.guest_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{b.property_title || '—'}</p>
                            <p className="text-xs text-muted-foreground">{b.property_city}</p>
                          </div>
                        </TableCell>
                        <TableCell>{b.landlord_name || 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p>{format(new Date(b.check_in_date), 'MMM d')} – {format(new Date(b.check_out_date), 'MMM d, yyyy')}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatKES(b.total_amount)}</TableCell>
                        <TableCell className="font-medium text-green-600">{formatKES(b.service_fee)}</TableCell>
                        <TableCell className="capitalize">{b.payment_method}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColors[b.status] || ''}>
                            {b.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(b.created_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
