import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Eye, MapPin, Loader2, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { PropertyPreviewModal } from './PropertyPreviewModal';
import { PendingLandlordApplications } from './PendingLandlordApplications';

interface PendingProperty {
  id: string;
  title: string;
  description: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  price: number;
  property_type: 'sale' | 'rent' | 'airbnb';
  bedrooms: number;
  bathrooms: number;
  area_sqft: number | null;
  images: string[];
  amenities: string[];
  views_count: number;
  created_at: string;
  landlord_id: string;
  landlord_name: string | null;
  landlord_email: string | null;
  favorites_count: number;
}

export function PendingApprovals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewProperty, setPreviewProperty] = useState<PendingProperty | null>(null);

  const { data: pendingProperties, isLoading } = useQuery({
    queryKey: ['pending-properties'],
    queryFn: async () => {
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (propertiesError) throw propertiesError;

      // Get landlord names
      const landlordIds = [...new Set(properties?.map(p => p.landlord_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', landlordIds);

      // Get favorites count for each property
      const propertyIds = properties?.map(p => p.id) || [];
      const { data: favorites } = await supabase
        .from('favorites')
        .select('property_id')
        .in('property_id', propertyIds);

      const favoritesCount = propertyIds.reduce((acc, id) => {
        acc[id] = favorites?.filter(f => f.property_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      return (properties || []).map(property => ({
        ...property,
        images: property.images || [],
        amenities: property.amenities || [],
        landlord_name: profiles?.find(p => p.user_id === property.landlord_id)?.full_name || 'Unknown',
        landlord_email: profiles?.find(p => p.user_id === property.landlord_id)?.email || null,
        favorites_count: favoritesCount[property.id] || 0,
      })) as PendingProperty[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('properties')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      toast({
        title: status === 'approved' ? 'Property Approved' : 'Property Rejected',
        description: `The property has been ${status}`,
      });
      queryClient.invalidateQueries({ queryKey: ['pending-properties'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const formatPrice = (price: number, type: string) => {
    const formatted = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(price);
    
    if (type === 'rent') return `${formatted}/mo`;
    if (type === 'airbnb') return `${formatted}/night`;
    return formatted;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sale': return 'Sale';
      case 'rent': return 'Rent';
      case 'airbnb': return 'Airbnb';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="properties">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="landlords">Landlord Applications</TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="space-y-4">
              {!pendingProperties || pendingProperties.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No pending properties to review
                </div>
              ) : (
                <>
                  {pendingProperties.map((property) => (
                    <div 
                      key={property.id} 
                      className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{property.title}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {property.city}{property.state ? `, ${property.state}` : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{getTypeLabel(property.property_type)}</Badge>
                            <span className="text-sm font-medium text-primary">
                              {formatPrice(property.price, property.property_type)}
                            </span>
                            {property.favorites_count > 0 && (
                              <span className="flex items-center gap-1 text-xs text-pink-500">
                                <Heart className="w-3 h-3 fill-current" />
                                {property.favorites_count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            By {property.landlord_name} • {formatDistanceToNow(new Date(property.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-muted-foreground"
                            onClick={() => setPreviewProperty(property)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => updateStatus.mutate({ id: property.id, status: 'approved' })}
                            disabled={updateStatus.isPending}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => updateStatus.mutate({ id: property.id, status: 'rejected' })}
                            disabled={updateStatus.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link to="/admin/properties?status=pending" className="block">
                    <Button variant="outline" className="w-full">
                      View All Pending Properties
                    </Button>
                  </Link>
                </>
              )}
            </TabsContent>

            <TabsContent value="landlords">
              <PendingLandlordApplications />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <PropertyPreviewModal
        property={previewProperty}
        open={!!previewProperty}
        onOpenChange={(open) => !open && setPreviewProperty(null)}
        onApprove={(id) => updateStatus.mutate({ id, status: 'approved' })}
        onReject={(id) => updateStatus.mutate({ id, status: 'rejected' })}
      />
    </>
  );
}