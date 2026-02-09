import { 
  Users, 
  Building2, 
  UserCheck, 
  DollarSign,
  Eye,
} from 'lucide-react';
import { AdminStatsCardSkeleton } from '@/components/skeletons/StatsCardSkeleton';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { PendingApprovals } from '@/components/admin/PendingApprovals';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface DashboardStats {
  totalUsers: number;
  activeLandlords: number;
  totalProperties: number;
  totalViews: number;
  forSale: number;
  forRent: number;
  airbnb: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const [
    usersRes,
    landlordsRes,
    propertiesRes,
    saleRes,
    rentRes,
    airbnbRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'landlord'),
    supabase.from('properties').select('views_count'),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('property_type', 'sale').eq('status', 'approved'),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('property_type', 'rent').eq('status', 'approved'),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('property_type', 'airbnb').eq('status', 'approved'),
  ]);

  const totalViews = (propertiesRes.data || []).reduce((sum, p) => sum + (p.views_count || 0), 0);

  return {
    totalUsers: usersRes.count || 0,
    activeLandlords: landlordsRes.count || 0,
    totalProperties: propertiesRes.data?.length || 0,
    totalViews,
    forSale: saleRes.count || 0,
    forRent: rentRes.count || 0,
    airbnb: airbnbRes.count || 0,
  };
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toLocaleString();
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your platform.</p>
        </div>

        {isLoading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <AdminStatsCardSkeleton key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <AdminStatsCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Users"
                value={formatNumber(stats?.totalUsers ?? 0)}
                icon={Users}
              />
              <StatsCard
                title="Active Landlords"
                value={formatNumber(stats?.activeLandlords ?? 0)}
                icon={UserCheck}
              />
              <StatsCard
                title="Total Properties"
                value={formatNumber(stats?.totalProperties ?? 0)}
                icon={Building2}
              />
              <StatsCard
                title="Total Views"
                value={formatNumber(stats?.totalViews ?? 0)}
                icon={Eye}
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                title="Properties for Sale"
                value={stats?.forSale ?? 0}
                icon={DollarSign}
                iconColor="text-green-600"
              />
              <StatsCard
                title="Properties for Rent"
                value={stats?.forRent ?? 0}
                icon={Building2}
                iconColor="text-blue-600"
              />
              <StatsCard
                title="Airbnb Listings"
                value={stats?.airbnb ?? 0}
                icon={Building2}
                iconColor="text-purple-600"
              />
            </div>

            {/* Activity & Approvals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PendingApprovals />
              <RecentActivity />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
