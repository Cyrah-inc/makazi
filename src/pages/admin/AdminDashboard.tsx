import { 
  Users, 
  Building2, 
  UserCheck, 
  TrendingUp,
  DollarSign,
  Eye
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { PendingApprovals } from '@/components/admin/PendingApprovals';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your platform.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Users"
            value="2,847"
            change="+12% from last month"
            changeType="positive"
            icon={Users}
          />
          <StatsCard
            title="Active Landlords"
            value="342"
            change="+8% from last month"
            changeType="positive"
            icon={UserCheck}
          />
          <StatsCard
            title="Total Properties"
            value="1,294"
            change="+23 new this week"
            changeType="positive"
            icon={Building2}
          />
          <StatsCard
            title="Total Views"
            value="45.2K"
            change="+18% from last month"
            changeType="positive"
            icon={Eye}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Properties for Sale"
            value="456"
            icon={DollarSign}
            iconColor="text-green-600"
          />
          <StatsCard
            title="Properties for Rent"
            value="623"
            icon={Building2}
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Airbnb Listings"
            value="215"
            icon={TrendingUp}
            iconColor="text-purple-600"
          />
        </div>

        {/* Activity & Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PendingApprovals />
          <RecentActivity />
        </div>
      </div>
    </AdminLayout>
  );
}
