import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Eye, Search, Plus, Clock, CheckCircle, XCircle, Pencil, Trash2, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';

interface PropertyWithFavorites {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string | null;
  price: number;
  property_type: string;
  status: string;
  images: string[] | null;
  views_count: number;
  favorites_count: number;
}

export default function LandlordPropertiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: properties, isLoading, refetch } = useQuery({
    queryKey: ['landlord-properties', user?.id],
    queryFn: async (): Promise<PropertyWithFavorites[]> => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const propertyIds = data?.map(p => p.id) || [];
      const { data: favorites } = await supabase
        .from('favorites')
        .select('property_id')
        .in('property_id', propertyIds);

      const favoritesCount = propertyIds.reduce((acc, id) => {
        acc[id] = favorites?.filter(f => f.property_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      return (data || []).map(property => ({
        ...property,
        favorites_count: favoritesCount[property.id] || 0,
      }));
    },
    enabled: !!user?.id,
  });

  const filteredProperties = properties?.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(search.toLowerCase()) ||
                         property.address.toLowerCase().includes(search.toLowerCase()) ||
                         property.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesType = typeFilter === 'all' || property.property_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) ?? [];

  const handleDelete = async () => {
    if (!deleteId) return;
    
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', deleteId)
      .eq('landlord_id', user?.id);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete property', variant: 'destructive' });
    } else {
      toast({ title: 'Property deleted', description: 'The property has been removed' });
      refetch();
    }
    setDeleteId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/10"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'pending':
        return <Badge className="bg-accent/10 text-accent hover:bg-accent/10"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <LandlordLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">My Properties</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage all your property listings</p>
          </div>
          <Link to="/landlord/add-property">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Add New Property
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sale">For Sale</SelectItem>
                  <SelectItem value="rent">For Rent</SelectItem>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No properties found</p>
              <Link to="/landlord/add-property">
                <Button className="mt-4">Add Your First Property</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                <div className="aspect-video bg-muted relative">
                  {property.images?.[0] ? (
                    <img src={getOptimizedImageUrl(property.images[0], IMAGE_SIZES.CARD.width, IMAGE_SIZES.CARD.quality)} alt={property.title} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(property.status)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold truncate">{property.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{property.city}, {property.state}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-primary">{formatCurrency(property.price)}</span>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {property.views_count}
                      </div>
                      <div className="flex items-center gap-1 text-accent">
                        <Heart className="w-3 h-3 fill-current" />
                        {property.favorites_count}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/landlord/edit-property/${property.id}`} className="flex-1">
                      <Button variant="outline" className="w-full gap-2" size="sm">
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(property.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Property</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this property? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LandlordLayout>
  );
}
