import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import {
  Users, UserCheck, Eye, TrendingUp, Clock, Heart, Building2,
  Loader2, DollarSign, MessageCircle, Zap, ShieldCheck, Home,
  CreditCard, Star, ArrowRightLeft
} from 'lucide-react';
import { format, subDays, differenceInMinutes, startOfMonth, startOfWeek } from 'date-fns';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatKES(amount: number): string {
  if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `KES ${(amount / 1000).toFixed(0)}K`;
  return `KES ${amount.toLocaleString()}`;
}

async function fetchFullAnalytics() {
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const monthAgo = subDays(now, 30);

  const [
    { data: profiles },
    { data: roles },
    { data: properties },
    { data: bookings },
    { data: inquiries },
    { data: favorites },
    { data: subscriptions },
    { data: reviews },
    { data: leads },
    { data: landlordProfiles },
    { data: viewLogs },
  ] = await Promise.all([
    supabase.from('profiles').select('user_id, created_at, full_name, email, status'),
    supabase.from('user_roles').select('user_id, role, created_at'),
    supabase.from('properties').select('id, title, landlord_id, property_type, property_category, status, views_count, city, state, price, sale_price, monthly_rent, nightly_rate, created_at'),
    supabase.from('bookings').select('id, status, total_amount, service_fee, created_at, property_id, landlord_id, nightly_rate, nights, check_in_date, check_out_date'),
    supabase.from('inquiries').select('id, landlord_id, property_id, created_at, replied_at, status'),
    supabase.from('favorites').select('id, property_id'),
    supabase.from('subscriptions').select('id, user_id, plan, amount, status, payment_method, starts_at, expires_at, created_at'),
    supabase.from('reviews').select('id, property_id, rating, created_at'),
    supabase.from('leads').select('id, user_id, property_id, landlord_id, lead_type, created_at'),
    supabase.from('landlord_profiles').select('user_id, verification_status'),
    supabase.from('property_view_logs').select('property_id, viewed_at').gte('viewed_at', subDays(now, 30).toISOString()),
  ]);

  const all = {
    profiles: profiles || [],
    roles: roles || [],
    properties: properties || [],
    bookings: bookings || [],
    inquiries: inquiries || [],
    favorites: favorites || [],
    subscriptions: subscriptions || [],
    reviews: reviews || [],
    leads: leads || [],
    landlordProfiles: landlordProfiles || [],
    viewLogs: viewLogs || [],
  };

  const profileMap = new Map(all.profiles.map(p => [p.user_id, p]));
  const landlordIds = new Set(all.roles.filter(r => r.role === 'landlord').map(r => r.user_id));

  // === OVERVIEW ===
  const totalUsers = all.profiles.length;
  const totalLandlords = landlordIds.size;
  const totalProperties = all.properties.length;
  const totalLeads = all.leads.length;
  const newUsersWeek = all.profiles.filter(p => new Date(p.created_at) >= weekAgo).length;
  const newLandlordsWeek = all.roles.filter(r => r.role === 'landlord' && new Date(r.created_at) >= weekAgo).length;

  const activeSubscribers = all.subscriptions.filter(s => s.status === 'active' && s.expires_at && new Date(s.expires_at) >= now).length;

  const paidBookings = all.bookings.filter(b => ['paid', 'checked_in', 'completed'].includes(b.status));
  const totalRevenue = paidBookings.reduce((s, b) => s + Number(b.total_amount || 0), 0);
  const totalCommission = paidBookings.reduce((s, b) => s + Number(b.service_fee || 0), 0);
  const subRevenue = all.subscriptions.filter(s => s.status === 'active').reduce((s, sub) => s + Number(sub.amount || 0), 0);

  // User growth by month
  const userGrowth = new Map<string, number>();
  all.profiles.forEach(p => {
    const m = format(startOfMonth(new Date(p.created_at)), 'MMM yy');
    userGrowth.set(m, (userGrowth.get(m) || 0) + 1);
  });
  const userGrowthData = Array.from(userGrowth.entries()).map(([month, count]) => ({ month, count })).slice(-12);

  // Revenue by month
  const revByMonth = new Map<string, number>();
  paidBookings.forEach(b => {
    const m = format(startOfMonth(new Date(b.created_at)), 'MMM yy');
    revByMonth.set(m, (revByMonth.get(m) || 0) + Number(b.total_amount || 0));
  });
  const revenueChartData = Array.from(revByMonth.entries()).map(([month, amount]) => ({ month, amount })).slice(-12);

  // Daily views trend from real view logs (last 30 days)
  const viewsByDay = new Map<string, number>();
  // Pre-fill last 30 days with zeros for a complete chart
  for (let i = 29; i >= 0; i--) {
    const day = format(subDays(now, i), 'MMM dd');
    viewsByDay.set(day, 0);
  }
  all.viewLogs.forEach((log: { property_id: string; viewed_at: string }) => {
    const day = format(new Date(log.viewed_at), 'MMM dd');
    if (viewsByDay.has(day)) {
      viewsByDay.set(day, (viewsByDay.get(day) || 0) + 1);
    }
  });
  const viewsTrendData = Array.from(viewsByDay.entries()).map(([day, views]) => ({ day, views }));

  // Total views (all-time from properties table)
  const totalViews = all.properties.reduce((s, p) => s + (p.views_count || 0), 0);
  const viewsLast30 = all.viewLogs.length;

  // Views by property type (from view logs with property lookup)
  const propTypeMap = new Map(all.properties.map(p => [p.id, p.property_type]));
  const viewsByType: Record<string, number> = {};
  all.viewLogs.forEach((log: { property_id: string; viewed_at: string }) => {
    const type = propTypeMap.get(log.property_id);
    const label = type === 'sale' ? 'Buy' : type === 'rent' ? 'Rent' : type === 'airbnb' ? 'Airbnb' : 'Other';
    viewsByType[label] = (viewsByType[label] || 0) + 1;
  });
  const viewsByTypeData = Object.entries(viewsByType).filter(([name]) => name !== 'Other').map(([name, value]) => ({ name, value }));

  // Property distribution
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byCity: Record<string, number> = {};
  all.properties.forEach(p => {
    byType[p.property_type] = (byType[p.property_type] || 0) + 1;
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    byCity[p.city || 'Unknown'] = (byCity[p.city || 'Unknown'] || 0) + 1;
  });

  // Response leaderboard
  const landlordInq = new Map<string, { total: number; replied: number; totalMin: number }>();
  all.inquiries.forEach(inq => {
    const e = landlordInq.get(inq.landlord_id) || { total: 0, replied: 0, totalMin: 0 };
    e.total++;
    if (inq.replied_at) { e.replied++; e.totalMin += differenceInMinutes(new Date(inq.replied_at), new Date(inq.created_at)); }
    landlordInq.set(inq.landlord_id, e);
  });
  const responseLeaderboard = Array.from(landlordInq.entries())
    .map(([uid, s]) => ({
      name: profileMap.get(uid)?.full_name || profileMap.get(uid)?.email || 'Unknown',
      avgMin: s.replied > 0 ? s.totalMin / s.replied : null,
      total: s.total, unanswered: s.total - s.replied,
      rate: s.total > 0 ? Math.round((s.replied / s.total) * 100) : 0,
    }))
    .sort((a, b) => (a.avgMin ?? Infinity) - (b.avgMin ?? Infinity)).slice(0, 10);

  // Verification breakdown
  const verificationCounts: Record<string, number> = {};
  all.landlordProfiles.forEach(lp => {
    verificationCounts[lp.verification_status] = (verificationCounts[lp.verification_status] || 0) + 1;
  });

  // Avg property rating
  const avgRating = all.reviews.length > 0
    ? all.reviews.reduce((s, r) => s + r.rating, 0) / all.reviews.length
    : 0;

  // === CATEGORY HELPERS ===
  const propsByType = (type: string) => all.properties.filter(p => p.property_type === type);
  const leadsByType = (type: string) => {
    const propIds = new Set(propsByType(type).map(p => p.id));
    return all.leads.filter(l => propIds.has(l.property_id));
  };
  const inquiriesByType = (type: string) => {
    const propIds = new Set(propsByType(type).map(p => p.id));
    return all.inquiries.filter(i => propIds.has(i.property_id));
  };

  const buildCategoryStats = (type: string) => {
    const props = propsByType(type);
    const catLeads = leadsByType(type);
    const catInquiries = inquiriesByType(type);
    const totalViews = props.reduce((s, p) => s + (p.views_count || 0), 0);
    const topViewed = [...props].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 10)
      .map(p => ({ ...p, landlordName: profileMap.get(p.landlord_id)?.full_name || 'Unknown' }));
    const locationData: Record<string, number> = {};
    props.forEach(p => { locationData[p.city || 'Unknown'] = (locationData[p.city || 'Unknown'] || 0) + 1; });
    const locationChart = Object.entries(locationData).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
    return { props, catLeads, catInquiries, totalViews, topViewed, locationChart };
  };

  // === BUY ===
  const buy = buildCategoryStats('sale');
  const avgSalePrice = buy.props.length > 0
    ? buy.props.reduce((s, p) => s + Number(p.sale_price || p.price || 0), 0) / buy.props.length : 0;

  // === RENT ===
  const rent = buildCategoryStats('rent');
  const avgMonthlyRent = rent.props.length > 0
    ? rent.props.reduce((s, p) => s + Number(p.monthly_rent || p.price || 0), 0) / rent.props.length : 0;

  // === AIRBNB ===
  const airbnb = buildCategoryStats('airbnb');
  const airbnbBookings = all.bookings.filter(b => {
    const propIds = new Set(airbnb.props.map(p => p.id));
    return propIds.has(b.property_id);
  });
  const airbnbRevenue = airbnbBookings.filter(b => ['paid', 'checked_in', 'completed'].includes(b.status))
    .reduce((s, b) => s + Number(b.total_amount || 0), 0);
  const avgNightlyRate = airbnb.props.length > 0
    ? airbnb.props.reduce((s, p) => s + Number(p.nightly_rate || p.price || 0), 0) / airbnb.props.length : 0;

  // Airbnb revenue by month
  const airbnbRevByMonth = new Map<string, number>();
  airbnbBookings.filter(b => ['paid', 'checked_in', 'completed'].includes(b.status)).forEach(b => {
    const m = format(startOfMonth(new Date(b.created_at)), 'MMM yy');
    airbnbRevByMonth.set(m, (airbnbRevByMonth.get(m) || 0) + Number(b.total_amount || 0));
  });
  const airbnbRevenueChart = Array.from(airbnbRevByMonth.entries()).map(([month, amount]) => ({ month, amount })).slice(-12);

  // Booking status breakdown
  const bookingsByStatus: Record<string, number> = {};
  airbnbBookings.forEach(b => { bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1; });
  const bookingStatusChart = Object.entries(bookingsByStatus).map(([name, value]) => ({ name, value }));

  // Top Airbnb by revenue
  const revenueByProp = new Map<string, number>();
  airbnbBookings.filter(b => ['paid', 'checked_in', 'completed'].includes(b.status)).forEach(b => {
    revenueByProp.set(b.property_id, (revenueByProp.get(b.property_id) || 0) + Number(b.total_amount || 0));
  });
  const topAirbnbByRevenue = Array.from(revenueByProp.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([pid, rev]) => {
      const p = all.properties.find(pr => pr.id === pid);
      return { title: p?.title || 'Unknown', revenue: rev, landlord: p ? (profileMap.get(p.landlord_id)?.full_name || 'Unknown') : 'Unknown' };
    });

  // === LEADS ===
  const whatsappLeads = all.leads.filter(l => l.lead_type === 'whatsapp').length;
  const chatLeads = all.leads.filter(l => l.lead_type === 'chat').length;
  const leadsThisWeek = all.leads.filter(l => new Date(l.created_at) >= weekAgo).length;
  const leadsThisMonth = all.leads.filter(l => new Date(l.created_at) >= monthAgo).length;

  // Leads by week trend
  const leadsByWeek = new Map<string, number>();
  all.leads.forEach(l => {
    const w = format(startOfWeek(new Date(l.created_at)), 'MMM dd');
    leadsByWeek.set(w, (leadsByWeek.get(w) || 0) + 1);
  });
  const leadsTrendData = Array.from(leadsByWeek.entries()).map(([week, count]) => ({ week, count })).slice(-12);

  // Top landlords by leads
  const leadsByLandlord = new Map<string, number>();
  all.leads.forEach(l => { leadsByLandlord.set(l.landlord_id, (leadsByLandlord.get(l.landlord_id) || 0) + 1); });
  const topLandlordsByLeads = Array.from(leadsByLandlord.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([uid, count]) => ({ name: profileMap.get(uid)?.full_name || 'Unknown', count }));

  // Top properties by leads
  const leadsByProp = new Map<string, number>();
  all.leads.forEach(l => { leadsByProp.set(l.property_id, (leadsByProp.get(l.property_id) || 0) + 1); });
  const topPropsByLeads = Array.from(leadsByProp.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([pid, count]) => {
      const p = all.properties.find(pr => pr.id === pid);
      return { title: p?.title || 'Unknown', count, type: p?.property_type || '' };
    });

  // === SUBSCRIPTIONS ===
  const activeSubs = all.subscriptions.filter(s => s.status === 'active' && s.expires_at && new Date(s.expires_at) >= now);
  const expiredSubs = all.subscriptions.filter(s => s.status === 'expired' || (s.expires_at && new Date(s.expires_at) < now));
  const cancelledSubs = all.subscriptions.filter(s => s.status === 'cancelled');
  const totalSubRevenue = all.subscriptions.filter(s => s.status === 'active' || s.status === 'expired').reduce((s, sub) => s + Number(sub.amount || 0), 0);

  const subStatusChart = [
    { name: 'Active', value: activeSubs.length },
    { name: 'Expired', value: expiredSubs.length },
    { name: 'Cancelled', value: cancelledSubs.length },
  ].filter(d => d.value > 0);

  // Subscription trend by month
  const subsByMonth = new Map<string, number>();
  all.subscriptions.forEach(s => {
    const m = format(startOfMonth(new Date(s.created_at)), 'MMM yy');
    subsByMonth.set(m, (subsByMonth.get(m) || 0) + 1);
  });
  const subTrendData = Array.from(subsByMonth.entries()).map(([month, count]) => ({ month, count })).slice(-12);

  // Subscribers list
  const subscribersList = all.subscriptions
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
    .map(s => ({
      ...s,
      landlordName: profileMap.get(s.user_id)?.full_name || profileMap.get(s.user_id)?.email || 'Unknown',
    }));

  return {
    // Overview
    totalUsers, totalLandlords, totalProperties, totalLeads, totalRevenue, totalCommission,
    subRevenue, activeSubscribers, newUsersWeek, newLandlordsWeek,
    userGrowthData, revenueChartData, viewsTrendData, totalViews, viewsByTypeData,
    typeChartData: Object.entries(byType).map(([name, value]) => ({ name, value })),
    statusChartData: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
    cityChartData: Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value })),
    responseLeaderboard, verificationCounts, avgRating,
    // Buy
    buy: { count: buy.props.length, views: buy.totalViews, avgPrice: avgSalePrice, leads: buy.catLeads.length, topViewed: buy.topViewed, locationChart: buy.locationChart },
    // Rent
    rent: { count: rent.props.length, views: rent.totalViews, avgRent: avgMonthlyRent, leads: rent.catLeads.length, inquiries: rent.catInquiries.length, topViewed: rent.topViewed, locationChart: rent.locationChart },
    // Airbnb
    airbnb: {
      count: airbnb.props.length, totalBookings: airbnbBookings.length, revenue: airbnbRevenue,
      avgNightlyRate, leads: airbnb.catLeads.length, revenueChart: airbnbRevenueChart,
      bookingStatusChart, topByRevenue: topAirbnbByRevenue, topViewed: airbnb.topViewed,
    },
    // Leads
    leads: { total: totalLeads, whatsapp: whatsappLeads, chat: chatLeads, thisWeek: leadsThisWeek, thisMonth: leadsThisMonth, trendData: leadsTrendData, topLandlords: topLandlordsByLeads, topProperties: topPropsByLeads },
    // Subscriptions
    subs: {
      active: activeSubs.length, expired: expiredSubs.length, cancelled: cancelledSubs.length,
      totalRevenue: totalSubRevenue, statusChart: subStatusChart, trendData: subTrendData, list: subscribersList,
    },
  };
}

const chartConfig = {
  amount: { label: 'Revenue', color: 'hsl(var(--primary))' },
  value: { label: 'Count', color: 'hsl(var(--primary))' },
  count: { label: 'Count', color: 'hsl(var(--primary))' },
};

function PropertyTable({ items }: { items: { id?: string; title: string; landlordName: string; property_type?: string; views_count?: number }[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Property</TableHead>
          <TableHead>Landlord</TableHead>
          <TableHead>Views</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((p, i) => (
          <TableRow key={p.id || i}>
            <TableCell>{i + 1}</TableCell>
            <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
            <TableCell>{p.landlordName}</TableCell>
            <TableCell className="font-semibold">{(p.views_count || 0).toLocaleString()}</TableCell>
          </TableRow>
        ))}
        {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No data yet</TableCell></TableRow>}
      </TableBody>
    </Table>
  );
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-analytics-v2'], queryFn: fetchFullAnalytics });

  if (isLoading || !data) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Comprehensive platform insights</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="rent">Rent</TabsTrigger>
            <TabsTrigger value="airbnb">Airbnb</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>

          {/* ===== OVERVIEW ===== */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatsCard title="Total Users" value={data.totalUsers} icon={Users} change={`+${data.newUsersWeek} this week`} changeType="positive" />
              <StatsCard title="Landlords" value={data.totalLandlords} icon={UserCheck} change={`+${data.newLandlordsWeek} this week`} changeType="positive" />
              <StatsCard title="Properties" value={data.totalProperties} icon={Building2} />
              <StatsCard title="Revenue" value={formatKES(data.totalRevenue)} icon={TrendingUp} change={`Commission: ${formatKES(data.totalCommission)}`} changeType="positive" />
              <StatsCard title="Leads" value={data.totalLeads} icon={Zap} />
              <StatsCard title="Active Subs" value={data.activeSubscribers} icon={CreditCard} change={`Sub rev: ${formatKES(data.subRevenue)}`} changeType="positive" />
            </div>

            {/* User growth + Revenue trend */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">User Growth</CardTitle><CardDescription>Monthly registrations</CardDescription></CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={data.userGrowthData}>
                      <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              {data.revenueChartData.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Revenue Trend</CardTitle><CardDescription>Monthly booking revenue</CardDescription></CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                      <BarChart data={data.revenueChartData}>
                        <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="amount" fill="hsl(var(--chart-2, 160 60% 45%))" radius={[4,4,0,0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Views Trend + Views by Type */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Eye className="w-5 h-5" /> Property Views Trend</CardTitle><CardDescription>Total views by listing month ({data.totalViews.toLocaleString()} total)</CardDescription></CardHeader>
                <CardContent>
                  <ChartContainer config={{ ...chartConfig, views: { label: 'Views', color: 'hsl(var(--chart-3, 30 80% 55%))' } }} className="h-[250px] w-full">
                    <LineChart data={data.viewsTrendData}>
                      <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="views" stroke="hsl(var(--chart-3, 30 80% 55%))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Views by Category</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <PieChart>
                      <Pie data={data.viewsByTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value.toLocaleString()}`}>
                        {data.viewsByTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Distribution charts */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: 'By Type', data: data.typeChartData },
                { title: 'By Status', data: data.statusChartData },
              ].map(chart => (
                <Card key={chart.title}>
                  <CardHeader className="pb-2"><CardTitle className="text-base">{chart.title}</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                      <PieChart>
                        <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                          {chart.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              ))}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Top Locations</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <BarChart data={data.cityChartData} layout="vertical">
                      <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0,4,4,0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Additional overview metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard title="Avg Rating" value={data.avgRating.toFixed(1)} icon={Star} />
              <StatsCard title="Total Reviews" value={data.leads.total} icon={MessageCircle} change="All leads" changeType="neutral" />
              <StatsCard title="Verified" value={data.verificationCounts['verified'] || 0} icon={ShieldCheck} change={`Pending: ${data.verificationCounts['pending'] || 0}`} changeType="neutral" />
              <StatsCard title="Conversion" value={`${data.leads.total > 0 ? Math.round((data.airbnb.totalBookings / data.leads.total) * 100) : 0}%`} icon={ArrowRightLeft} change="Lead → Booking" changeType="neutral" />
            </div>

            {/* Response leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5" /> Inquiry Response Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead><TableHead>Landlord</TableHead><TableHead>Avg Response</TableHead><TableHead>Rate</TableHead><TableHead>Unanswered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.responseLeaderboard.map((ll, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{ll.name}</TableCell>
                        <TableCell>{ll.avgMin !== null ? <Badge variant={ll.avgMin < 120 ? 'default' : 'secondary'}>{formatDuration(ll.avgMin)}</Badge> : <Badge variant="destructive">No replies</Badge>}</TableCell>
                        <TableCell>{ll.rate}%</TableCell>
                        <TableCell>{ll.unanswered > 0 ? <span className="text-destructive font-medium">{ll.unanswered}</span> : '0'}</TableCell>
                      </TableRow>
                    ))}
                    {data.responseLeaderboard.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== BUY ===== */}
          <TabsContent value="buy" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard title="Sale Listings" value={data.buy.count} icon={Home} />
              <StatsCard title="Total Views" value={data.buy.views.toLocaleString()} icon={Eye} />
              <StatsCard title="Avg Sale Price" value={formatKES(data.buy.avgPrice)} icon={DollarSign} />
              <StatsCard title="Leads" value={data.buy.leads} icon={Zap} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Listings by Location</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={data.buy.locationChart} layout="vertical">
                      <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0,4,4,0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Top Viewed Sale Properties</CardTitle></CardHeader>
                <CardContent><PropertyTable items={data.buy.topViewed} /></CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== RENT ===== */}
          <TabsContent value="rent" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard title="Rental Listings" value={data.rent.count} icon={Home} />
              <StatsCard title="Total Views" value={data.rent.views.toLocaleString()} icon={Eye} />
              <StatsCard title="Avg Monthly Rent" value={formatKES(data.rent.avgRent)} icon={DollarSign} />
              <StatsCard title="Leads" value={data.rent.leads} icon={Zap} change={`${data.rent.inquiries} inquiries`} changeType="neutral" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Rentals by Location</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={data.rent.locationChart} layout="vertical">
                      <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="hsl(var(--chart-2, 160 60% 45%))" radius={[0,4,4,0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Top Viewed Rentals</CardTitle></CardHeader>
                <CardContent><PropertyTable items={data.rent.topViewed} /></CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== AIRBNB ===== */}
          <TabsContent value="airbnb" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard title="Airbnb Listings" value={data.airbnb.count} icon={Home} />
              <StatsCard title="Total Bookings" value={data.airbnb.totalBookings} icon={CreditCard} />
              <StatsCard title="Airbnb Revenue" value={formatKES(data.airbnb.revenue)} icon={TrendingUp} />
              <StatsCard title="Avg Nightly Rate" value={formatKES(data.airbnb.avgNightlyRate)} icon={DollarSign} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {data.airbnb.revenueChart.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Airbnb Revenue Trend</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                      <LineChart data={data.airbnb.revenueChart}>
                        <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader><CardTitle className="text-lg">Booking Status</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <PieChart>
                      <Pie data={data.airbnb.bookingStatusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                        {data.airbnb.bookingStatusChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Top Airbnb by Revenue</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>#</TableHead><TableHead>Property</TableHead><TableHead>Landlord</TableHead><TableHead>Revenue</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.airbnb.topByRevenue.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                        <TableCell>{p.landlord}</TableCell>
                        <TableCell className="font-semibold">{formatKES(p.revenue)}</TableCell>
                      </TableRow>
                    ))}
                    {data.airbnb.topByRevenue.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== LEADS ===== */}
          <TabsContent value="leads" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard title="Total Leads" value={data.leads.total} icon={Zap} change={`${data.leads.thisMonth} this month`} changeType="positive" />
              <StatsCard title="WhatsApp" value={data.leads.whatsapp} icon={MessageCircle} />
              <StatsCard title="Chat" value={data.leads.chat} icon={MessageCircle} />
              <StatsCard title="This Week" value={data.leads.thisWeek} icon={TrendingUp} />
            </div>
            {data.leads.trendData.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Leads Trend</CardTitle><CardDescription>Weekly lead generation</CardDescription></CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={data.leads.trendData}>
                      <XAxis dataKey="week" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--chart-3, 30 80% 55%))" radius={[4,4,0,0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Top Landlords by Leads</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Landlord</TableHead><TableHead>Leads</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {data.leads.topLandlords.map((l, i) => (
                        <TableRow key={i}><TableCell>{i + 1}</TableCell><TableCell className="font-medium">{l.name}</TableCell><TableCell className="font-semibold">{l.count}</TableCell></TableRow>
                      ))}
                      {data.leads.topLandlords.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No leads yet</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Top Properties by Leads</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Property</TableHead><TableHead>Type</TableHead><TableHead>Leads</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {data.leads.topProperties.map((p, i) => (
                        <TableRow key={i}><TableCell>{i + 1}</TableCell><TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell><TableCell><Badge variant="outline">{p.type}</Badge></TableCell><TableCell className="font-semibold">{p.count}</TableCell></TableRow>
                      ))}
                      {data.leads.topProperties.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No leads yet</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== SUBSCRIPTIONS ===== */}
          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard title="Active" value={data.subs.active} icon={CreditCard} changeType="positive" />
              <StatsCard title="Expired" value={data.subs.expired} icon={CreditCard} changeType="negative" />
              <StatsCard title="Cancelled" value={data.subs.cancelled} icon={CreditCard} changeType="negative" />
              <StatsCard title="Sub Revenue" value={formatKES(data.subs.totalRevenue)} icon={DollarSign} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Subscriber Status</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <PieChart>
                      <Pie data={data.subs.statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                        {data.subs.statusChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              {data.subs.trendData.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Subscription Trend</CardTitle><CardDescription>New subscriptions by month</CardDescription></CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                      <BarChart data={data.subs.trendData}>
                        <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Recent Subscribers</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Landlord</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Expires</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.subs.list.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.landlordName}</TableCell>
                        <TableCell className="capitalize">{s.plan}</TableCell>
                        <TableCell>{formatKES(Number(s.amount))}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === 'active' ? 'default' : s.status === 'cancelled' ? 'destructive' : 'secondary'}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.expires_at ? format(new Date(s.expires_at), 'MMM dd, yyyy') : '—'}</TableCell>
                      </TableRow>
                    ))}
                    {data.subs.list.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No subscriptions yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
