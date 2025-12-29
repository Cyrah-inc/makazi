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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  MoreHorizontal, 
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Home,
  Loader2,
  RefreshCw,
  Building2,
  Clock,
  AlertTriangle,
  DollarSign,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type PropertyStatus = 'pending' | 'approved' | 'rejected' | 'removed';
type PropertyType = 'sale' | 'rent' | 'airbnb';

interface PropertyWithLandlord {
  id: string;
  landlord_id: string;
  title: string;
  description: string | null;
  property_type: PropertyType;
  status: PropertyStatus;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  images: string[];
  views_count: number;
  created_at: string;
  landlord_name: string | null;
  landlord_email: string | null;
}

const statusColors: Record<PropertyStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  removed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const typeColors: Record<PropertyType, string> = {
  sale: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  rent: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  airbnb: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
};

const statusIcons: Record<PropertyStatus, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  approved: <CheckCircle className="w-3 h-3" />,
  rejected: <XCircle className="w-3 h-3" />,
  removed: <Trash2 className="w-3 h-3" />,
};

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<PropertyWithLandlord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProperties = async () => {
    setLoading(true);
    try {
      // Fetch all properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      // Get unique landlord IDs
      const landlordIds = [...new Set(propertiesData?.map(p => p.landlord_id) || [])];

      // Fetch landlord profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', landlordIds);

      if (profilesError) throw profilesError;

      // Merge properties with landlord info
      const propertiesWithLandlords: PropertyWithLandlord[] = (propertiesData || []).map((property) => {
        const landlord = profiles?.find(p => p.user_id === property.landlord_id);
        return {
          ...property,
          property_type: property.property_type as PropertyType,
          status: property.status as PropertyStatus,
          images: property.images || [],
          landlord_name: landlord?.full_name || null,
          landlord_email: landlord?.email || null,
        };
      });

      setProperties(propertiesWithLandlords);
    } catch (error: any) {
      toast({
        title: 'Error fetching properties',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const updatePropertyStatus = async (propertyId: string, newStatus: PropertyStatus) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Property ${newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'updated'}`,
      });

      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus } : p))
      );
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteProperty = async () => {
    if (!propertyToDelete) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyToDelete);

      if (error) throw error;

      toast({
        title: 'Property deleted',
        description: 'The property has been permanently removed',
      });

      setProperties((prev) => prev.filter((p) => p.id !== propertyToDelete));
    } catch (error: any) {
      toast({
        title: 'Error deleting property',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  // Filter properties
  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      !searchQuery ||
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.landlord_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesType = typeFilter === 'all' || property.property_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Summary stats
  const pendingCount = properties.filter(p => p.status === 'pending').length;
  const approvedCount = properties.filter(p => p.status === 'approved').length;
  const rejectedCount = properties.filter(p => p.status === 'rejected').length;
  const totalViews = properties.reduce((sum, p) => sum + p.views_count, 0);

  const formatPrice = (price: number, type: PropertyType) => {
    const formatted = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(price);
    
    if (type === 'rent') return `${formatted}/mo`;
    if (type === 'airbnb') return `${formatted}/night`;
    return formatted;
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Properties</h1>
            <p className="text-muted-foreground mt-1">
              Manage all property listings and approvals
            </p>
          </div>
          <Button onClick={fetchProperties} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">Live listings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedCount}</div>
              <p className="text-xs text-muted-foreground">Not approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Views
              </CardTitle>
              <Eye className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All properties</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, address, city, or landlord..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="removed">Removed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sale">For Sale</SelectItem>
              <SelectItem value="rent">For Rent</SelectItem>
              <SelectItem value="airbnb">Airbnb</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Properties Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No properties found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Listed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {property.images.length > 0 ? (
                            <img 
                              src={property.images[0]} 
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Home className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">
                            {property.title}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {property.city}, {property.country}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={typeColors[property.property_type]}>
                        {property.property_type === 'sale' ? 'For Sale' : 
                         property.property_type === 'rent' ? 'For Rent' : 'Airbnb'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[property.status]}>
                        {statusIcons[property.status]}
                        <span className="ml-1 capitalize">{property.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        {formatPrice(Number(property.price), property.property_type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {property.landlord_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {property.landlord_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(property.created_at), 'MMM d, yyyy')}
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
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          {property.status !== 'approved' && (
                            <DropdownMenuItem
                              onClick={() => updatePropertyStatus(property.id, 'approved')}
                            >
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {property.status !== 'rejected' && (
                            <DropdownMenuItem
                              onClick={() => updatePropertyStatus(property.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4 mr-2 text-red-600" />
                              Reject
                            </DropdownMenuItem>
                          )}
                          {property.status !== 'removed' && (
                            <DropdownMenuItem
                              onClick={() => updatePropertyStatus(property.id, 'removed')}
                            >
                              <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                              Mark as Removed
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setPropertyToDelete(property.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Permanently
                          </DropdownMenuItem>
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
          Showing {filteredProperties.length} of {properties.length} properties
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this property? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProperty}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
