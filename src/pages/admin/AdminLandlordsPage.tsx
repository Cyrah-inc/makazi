import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  MoreHorizontal, 
  Ban, 
  CheckCircle,
  Building2,
  Loader2,
  RefreshCw,
  Eye,
  Mail,
  Phone,
  Home,
  Star,
  TrendingUp,
  Users,
  BadgeCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type UserStatus = 'active' | 'suspended' | 'pending';

interface LandlordProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  status: UserStatus;
  created_at: string;
  // Mock metrics - in production these would come from properties table
  propertyCount: number;
  totalViews: number;
  averageRating: number;
  verified: boolean;
}

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

export default function AdminLandlordsPage() {
  const [landlords, setLandlords] = useState<LandlordProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchLandlords = async () => {
    setLoading(true);
    try {
      // Fetch all users with landlord role
      const { data: landlordRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'landlord');

      if (rolesError) throw rolesError;

      const landlordUserIds = landlordRoles?.map(r => r.user_id) || [];

      if (landlordUserIds.length === 0) {
        setLandlords([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for landlords
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', landlordUserIds)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Add mock metrics (in production, these would come from properties/reviews tables)
      const landlordsWithMetrics: LandlordProfile[] = (profiles || []).map((profile, index) => ({
        ...profile,
        status: profile.status as UserStatus,
        propertyCount: Math.floor(Math.random() * 15) + 1,
        totalViews: Math.floor(Math.random() * 5000) + 100,
        averageRating: (Math.random() * 2 + 3).toFixed(1) as unknown as number,
        verified: index % 3 !== 0, // Mock: 2/3 are verified
      }));

      setLandlords(landlordsWithMetrics);
    } catch (error: any) {
      toast({
        title: 'Error fetching landlords',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandlords();
  }, []);

  const updateLandlordStatus = async (userId: string, newStatus: UserStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Landlord ${newStatus === 'suspended' ? 'suspended' : 'activated'}`,
      });

      setLandlords((prev) =>
        prev.map((l) => (l.user_id === userId ? { ...l, status: newStatus } : l))
      );
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleVerification = (userId: string) => {
    // In production, this would update a verified field in the database
    setLandlords((prev) =>
      prev.map((l) => (l.user_id === userId ? { ...l, verified: !l.verified } : l))
    );
    
    const landlord = landlords.find(l => l.user_id === userId);
    toast({
      title: landlord?.verified ? 'Verification removed' : 'Landlord verified',
      description: landlord?.verified 
        ? 'Landlord verification has been removed' 
        : 'Landlord has been verified successfully',
    });
  };

  // Filter landlords
  const filteredLandlords = landlords.filter((landlord) => {
    const matchesSearch =
      !searchQuery ||
      landlord.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      landlord.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || landlord.status === statusFilter;
    const matchesVerified = 
      verifiedFilter === 'all' || 
      (verifiedFilter === 'verified' && landlord.verified) ||
      (verifiedFilter === 'unverified' && !landlord.verified);

    return matchesSearch && matchesStatus && matchesVerified;
  });

  // Summary stats
  const totalLandlords = landlords.length;
  const verifiedLandlords = landlords.filter(l => l.verified).length;
  const activeLandlords = landlords.filter(l => l.status === 'active').length;
  const totalProperties = landlords.reduce((sum, l) => sum + l.propertyCount, 0);

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Landlords</h1>
            <p className="text-muted-foreground mt-1">
              Manage landlord accounts and verify their profiles
            </p>
          </div>
          <Button onClick={fetchLandlords} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Landlords
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLandlords}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified
              </CardTitle>
              <BadgeCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedLandlords}</div>
              <p className="text-xs text-muted-foreground">
                {totalLandlords > 0 ? Math.round((verifiedLandlords / totalLandlords) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLandlords}</div>
              <p className="text-xs text-muted-foreground">
                {totalLandlords > 0 ? Math.round((activeLandlords / totalLandlords) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Properties
              </CardTitle>
              <Home className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties}</div>
              <p className="text-xs text-muted-foreground">
                ~{totalLandlords > 0 ? Math.round(totalProperties / totalLandlords) : 0} per landlord
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Landlords Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredLandlords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No landlords found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLandlords.map((landlord) => (
                  <TableRow key={landlord.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">
                              {landlord.full_name || 'No name'}
                            </p>
                            {landlord.verified && (
                              <BadgeCheck className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {landlord.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {landlord.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[landlord.status]}
                      >
                        {landlord.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{landlord.propertyCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{landlord.averageRating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          {landlord.totalViews.toLocaleString()} views
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(landlord.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => toggleVerification(landlord.user_id)}>
                            <BadgeCheck className="w-4 h-4 mr-2" />
                            {landlord.verified ? 'Remove Verification' : 'Verify Landlord'}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Properties
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Account Status</DropdownMenuLabel>
                          {landlord.status === 'suspended' ? (
                            <DropdownMenuItem
                              onClick={() => updateLandlordStatus(landlord.user_id, 'active')}
                            >
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Activate Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => updateLandlordStatus(landlord.user_id, 'suspended')}
                              className="text-red-600"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend Account
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mt-4">
          Showing {filteredLandlords.length} of {landlords.length} landlords
        </p>
      </div>
    </AdminLayout>
  );
}
