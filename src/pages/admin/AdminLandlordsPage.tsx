import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Loader2, RefreshCw, Eye, Mail, Phone, Home, Star,
  TrendingUp, Users, BadgeCheck, CreditCard,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  LandlordDetailModal,
  type LandlordData,
  verificationColors,
} from '@/components/admin/LandlordDetailModal';

export default function AdminLandlordsPage() {
  const [landlords, setLandlords] = useState<LandlordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [selectedLandlord, setSelectedLandlord] = useState<LandlordData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { toast } = useToast();

  const fetchLandlords = async () => {
    setLoading(true);
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'landlord');
      const landlordIds = roles?.map(r => r.user_id) || [];
      if (!landlordIds.length) { setLandlords([]); setLoading(false); return; }

      const [profilesRes, lpRes, propsRes, reviewsRes, subsRes] = await Promise.all([
        supabase.from('profiles').select('*').in('user_id', landlordIds),
        supabase.from('landlord_profiles').select('*').in('user_id', landlordIds),
        supabase.from('properties').select('id, landlord_id, views_count, status').in('landlord_id', landlordIds),
        supabase.from('reviews').select('landlord_id, rating').in('landlord_id', landlordIds),
        supabase.from('subscriptions').select('*').in('user_id', landlordIds),
      ]);

      const profiles = profilesRes.data || [];
      const lps = lpRes.data || [];
      const props = propsRes.data || [];
      const reviews = reviewsRes.data || [];
      const subs = subsRes.data || [];

      const combined: LandlordData[] = profiles.map(p => {
        const lp = lps.find(l => l.user_id === p.user_id);
        const landlordProps = props.filter(pr => pr.landlord_id === p.user_id);
        const landlordReviews = reviews.filter(r => r.landlord_id === p.user_id);
        const sub = subs.find(s => s.user_id === p.user_id);

        return {
          user_id: p.user_id,
          full_name: p.full_name,
          email: p.email,
          phone: p.phone,
          status: p.status,
          created_at: p.created_at,
          avatar_url: p.avatar_url,
          id_number: lp?.id_number || null,
          kra_pin: lp?.kra_pin || null,
          business_phone: lp?.business_phone || null,
          documents: (lp?.documents as string[]) || [],
          verification_status: lp?.verification_status || 'unverified',
          verification_notes: lp?.verification_notes || null,
          verified_at: lp?.verified_at || null,
          propertyCount: landlordProps.filter(pr => ['approved', 'pending'].includes(pr.status)).length,
          totalViews: landlordProps.reduce((s, pr) => s + (pr.views_count || 0), 0),
          averageRating: landlordReviews.length
            ? landlordReviews.reduce((s, r) => s + r.rating, 0) / landlordReviews.length
            : null,
          subscriptionStatus: sub?.status || null,
          subscriptionExpiry: sub?.expires_at || null,
          subscriptionId: sub?.id || null,
        };
      });

      setLandlords(combined);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLandlords(); }, []);

  const filteredLandlords = landlords.filter(l => {
    const matchesSearch = !searchQuery ||
      l.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVerification = verificationFilter === 'all' || l.verification_status === verificationFilter;
    return matchesSearch && matchesVerification;
  });

  const stats = {
    total: landlords.length,
    verified: landlords.filter(l => l.verification_status === 'verified').length,
    pending: landlords.filter(l => l.verification_status === 'pending').length,
    subscribed: landlords.filter(l => l.subscriptionStatus === 'active').length,
  };

  const getSubBadge = (l: LandlordData) => {
    if (l.subscriptionStatus === 'active' && l.subscriptionExpiry && new Date(l.subscriptionExpiry) > new Date()) {
      return <Badge className="bg-primary/10 text-primary text-xs">Subscribed</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Free</Badge>;
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Landlords</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage landlord verification, accounts &amp; subscriptions</p>
          </div>
          <Button onClick={fetchLandlords} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
              <BadgeCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-primary">{stats.verified}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-accent">{stats.pending}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Subscribed</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.subscribed}</div></CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={verificationFilter} onValueChange={setVerificationFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredLandlords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No landlords found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="hidden md:table-cell">Properties</TableHead>
                  <TableHead className="hidden lg:table-cell">Rating</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLandlords.map(l => (
                  <TableRow key={l.user_id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{l.full_name || 'No name'}</p>
                          {l.verification_status === 'verified' && <BadgeCheck className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {l.email}
                        </p>
                        {l.business_phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {l.business_phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', verificationColors[l.verification_status] || verificationColors.unverified)}>
                        {l.verification_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{getSubBadge(l)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-medium">{l.propertyCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {l.averageRating ? (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />
                          {l.averageRating.toFixed(1)}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">N/A</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {format(new Date(l.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedLandlord(l); setDetailOpen(true); }}>
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Showing {filteredLandlords.length} of {landlords.length} landlords
        </p>

        {/* Detail Modal */}
        <LandlordDetailModal
          landlord={selectedLandlord}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onActionComplete={fetchLandlords}
        />
      </div>
    </AdminLayout>
  );
}
