import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Building2, Home, TrendingUp, DollarSign, Search, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface LandlordListing {
  landlord_id: string;
  landlord_name: string | null;
  landlord_email: string | null;
  total: number;
  approved: number;
  pending: number;
  sale: number;
  rent: number;
  airbnb: number;
  verification_status: string;
  subscription_status: string | null;
}

async function fetchListingsOverview() {
  const [propertiesRes, profilesRes, landlordProfilesRes, subscriptionsRes] = await Promise.all([
    supabase.from('properties').select('id, landlord_id, property_type, status'),
    supabase.from('profiles').select('user_id, full_name, email'),
    supabase.from('landlord_profiles').select('user_id, verification_status'),
    supabase.from('subscriptions').select('user_id, status, expires_at').order('created_at', { ascending: false }),
  ]);

  const properties = propertiesRes.data || [];
  const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
  const verificationMap = new Map((landlordProfilesRes.data || []).map(lp => [lp.user_id, lp.verification_status]));
  
  // Get latest subscription per user
  const subMap = new Map<string, string>();
  (subscriptionsRes.data || []).forEach(s => {
    if (!subMap.has(s.user_id)) {
      subMap.set(s.user_id, s.status);
    }
  });

  // Group by landlord
  const landlordMap = new Map<string, LandlordListing>();
  properties.forEach(p => {
    let entry = landlordMap.get(p.landlord_id);
    if (!entry) {
      const profile = profileMap.get(p.landlord_id);
      entry = {
        landlord_id: p.landlord_id,
        landlord_name: profile?.full_name || null,
        landlord_email: profile?.email || null,
        total: 0, approved: 0, pending: 0, sale: 0, rent: 0, airbnb: 0,
        verification_status: verificationMap.get(p.landlord_id) || 'unverified',
        subscription_status: subMap.get(p.landlord_id) || null,
      };
      landlordMap.set(p.landlord_id, entry);
    }
    entry.total++;
    if (p.status === 'approved') entry.approved++;
    if (p.status === 'pending') entry.pending++;
    if (p.property_type === 'sale') entry.sale++;
    if (p.property_type === 'rent') entry.rent++;
    if (p.property_type === 'airbnb') entry.airbnb++;
  });

  const listings = Array.from(landlordMap.values()).sort((a, b) => b.total - a.total);

  const totalCount = properties.length;
  const saleCount = properties.filter(p => p.property_type === 'sale').length;
  const rentCount = properties.filter(p => p.property_type === 'rent').length;
  const airbnbCount = properties.filter(p => p.property_type === 'airbnb').length;

  return { listings, totalCount, saleCount, rentCount, airbnbCount };
}

const verificationBadge = (status: string) => {
  const colors: Record<string, string> = {
    verified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    unverified: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return <Badge variant="secondary" className={colors[status] || ''}>{status}</Badge>;
};

const subBadge = (status: string | null) => {
  if (!status) return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">None</Badge>;
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return <Badge variant="secondary" className={colors[status] || ''}>{status}</Badge>;
};

export default function AdminListingsPage() {
  const [search, setSearch] = useState('');
  const [verFilter, setVerFilter] = useState('all');
  const [subFilter, setSubFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-listings-overview'],
    queryFn: fetchListingsOverview,
  });

  const filtered = (data?.listings || []).filter(l => {
    const matchSearch = !search ||
      l.landlord_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.landlord_email?.toLowerCase().includes(search.toLowerCase());
    const matchVer = verFilter === 'all' || l.verification_status === verFilter;
    const matchSub = subFilter === 'all' || (l.subscription_status || 'none') === subFilter;
    return matchSearch && matchVer && matchSub;
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Listings Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">Property listings grouped by landlord</p>
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Listings</CardTitle>
                  <Building2 className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{data?.totalCount ?? 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">For Sale</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{data?.saleCount ?? 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">For Rent</CardTitle>
                  <Home className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{data?.rentCount ?? 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Airbnb</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{data?.airbnbCount ?? 0}</div></CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by landlord name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={verFilter} onValueChange={setVerFilter}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Verification" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verification</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subFilter} onValueChange={setSubFilter}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Subscription" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subscriptions</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border border-border overflow-x-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No landlords found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Landlord</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Sale / Rent / Airbnb</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(l => (
                      <TableRow key={l.landlord_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{l.landlord_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{l.landlord_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{l.total}</TableCell>
                        <TableCell>{l.approved}</TableCell>
                        <TableCell>{l.pending}</TableCell>
                        <TableCell>
                          <span className="text-sm">{l.sale} / {l.rent} / {l.airbnb}</span>
                        </TableCell>
                        <TableCell>{verificationBadge(l.verification_status)}</TableCell>
                        <TableCell>{subBadge(l.subscription_status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/properties?landlord=${l.landlord_id}`}>
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View
                            </Link>
                          </Button>
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
