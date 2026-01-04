import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface PendingProperty {
  id: string;
  title: string;
  city: string;
  state: string | null;
  price: number;
  property_type: 'sale' | 'rent' | 'airbnb';
  created_at: string;
  landlord_id: string;
  landlord_name: string | null;
}

export function PendingApprovals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        .select('user_id, full_name')
        .in('user_id', landlordIds);

      return (properties || []).map(property => ({
        ...property,
        landlord_name: profiles?.find(p => p.user_id === property.landlord_id)?.full_name || 'Unknown',
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
    const formatted = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Pending Approvals</CardTitle>
        <Badge variant="secondary">{pendingProperties?.length || 0} pending</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
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
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      By {property.landlord_name} • {formatDistanceToNow(new Date(property.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/property/${property.id}`}>
                      <Button size="sm" variant="ghost" className="text-muted-foreground">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
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
      </CardContent>
    </Card>
  );
}
