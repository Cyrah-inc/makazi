import { useQuery } from '@tanstack/react-query';
import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Eye, MessageSquare, TrendingUp, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';

export default function LandlordDashboard() {
  const { user } = useAuth();

  const { data: properties, isLoading } = useQuery({
    queryKey: ['landlord-properties', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const stats = {
    total: properties?.length ?? 0,
    approved: properties?.filter(p => p.status === 'approved').length ?? 0,
    pending: properties?.filter(p => p.status === 'pending').length ?? 0,
    rejected: properties?.filter(p => p.status === 'rejected').length ?? 0,
    totalViews: properties?.reduce((sum, p) => sum + (p.views_count || 0), 0) ?? 0,
  };

  const recentProperties = properties?.slice(0, 5) ?? [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <LandlordLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your property listings</p>
          </div>
          <Link to="/landlord/add-property">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add New Property
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
              <Clock className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Properties */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Properties</CardTitle>
            <Link to="/landlord/properties">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentProperties.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No properties yet</p>
                <Link to="/landlord/add-property">
                  <Button className="mt-4">Add Your First Property</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProperties.map((property) => (
                  <div key={property.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {property.images?.[0] ? (
                        <img src={getOptimizedImageUrl(property.images[0], IMAGE_SIZES.DASHBOARD.width, IMAGE_SIZES.DASHBOARD.quality)} alt={property.title} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{property.title}</h4>
                      <p className="text-sm text-muted-foreground">{property.city}, {property.state}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatCurrency(property.price)}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        {property.views_count}
                      </div>
                    </div>
                    {getStatusBadge(property.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LandlordLayout>
  );
}
