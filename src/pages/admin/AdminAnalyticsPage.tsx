import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Users, UserCheck, Eye, TrendingUp, Clock, Heart, Building2, CalendarDays, Loader2 } from 'lucide-react';
import { format, subDays, differenceInMinutes, startOfMonth } from 'date-fns';

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

async function fetchAnalyticsData() {
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
  ] = await Promise.all([
    supabase.from('profiles').select('user_id, created_at, full_name, email, status'),
    supabase.from('user_roles').select('user_id, role, created_at'),
    supabase.from('properties').select('id, title, landlord_id, property_type, status, views_count, city, state'),
    supabase.from('bookings').select('id, status, total_amount, created_at, property_id'),
    supabase.from('inquiries').select('id, landlord_id, created_at, replied_at, status'),
    supabase.from('favorites').select('id, property_id'),
  ]);

  const allProfiles = profiles || [];
  const allRoles = roles || [];
  const allProperties = properties || [];
  const allBookings = bookings || [];
  const allInquiries = inquiries || [];
  const allFavorites = favorites || [];

  const landlordUserIds = new Set(allRoles.filter(r => r.role === 'landlord').map(r => r.user_id));

  // User stats
  const totalUsers = allProfiles.length;
  const totalLandlords = landlordUserIds.size;
  const newUsersWeek = allProfiles.filter(p => new Date(p.created_at) >= weekAgo).length;
  const newUsersMonth = allProfiles.filter(p => new Date(p.created_at) >= monthAgo).length;
  const newLandlordsWeek = allRoles.filter(r => r.role === 'landlord' && new Date(r.created_at) >= weekAgo).length;
  const newLandlordsMonth = allRoles.filter(r => r.role === 'landlord' && new Date(r.created_at) >= monthAgo).length;

  // Profile map for name lookups
  const profileMap = new Map(allProfiles.map(p => [p.user_id, p]));

  // Inquiry response leaderboard
  const landlordInquiries = new Map<string, { total: number; replied: number; totalMinutes: number }>();
  allInquiries.forEach(inq => {
    const entry = landlordInquiries.get(inq.landlord_id) || { total: 0, replied: 0, totalMinutes: 0 };
    entry.total++;
    if (inq.replied_at) {
      entry.replied++;
      entry.totalMinutes += differenceInMinutes(new Date(inq.replied_at), new Date(inq.created_at));
    }
    landlordInquiries.set(inq.landlord_id, entry);
  });

  const responseLeaderboard = Array.from(landlordInquiries.entries())
    .map(([userId, stats]) => ({
      userId,
      name: profileMap.get(userId)?.full_name || profileMap.get(userId)?.email || 'Unknown',
      avgMinutes: stats.replied > 0 ? stats.totalMinutes / stats.replied : null,
      totalInquiries: stats.total,
      unanswered: stats.total - stats.replied,
      responseRate: stats.total > 0 ? Math.round((stats.replied / stats.total) * 100) : 0,
    }))
    .sort((a, b) => {
      if (a.avgMinutes === null) return 1;
      if (b.avgMinutes === null) return -1;
      return a.avgMinutes - b.avgMinutes;
    })
    .slice(0, 10);

  // Most viewed properties
  const topViewed = [...allProperties]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 10)
    .map(p => ({
      ...p,
      landlordName: profileMap.get(p.landlord_id)?.full_name || profileMap.get(p.landlord_id)?.email || 'Unknown',
    }));

  // Booking analytics
  const bookingsByStatus: Record<string, number> = {};
  allBookings.forEach(b => {
    bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
  });

  const totalRevenue = allBookings
    .filter(b => ['paid', 'checked_in', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

  const avgBookingValue = allBookings.length > 0
    ? allBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0) / allBookings.length
    : 0;

  // Revenue by month
  const revenueByMonth = new Map<string, number>();
  allBookings
    .filter(b => ['paid', 'checked_in', 'completed'].includes(b.status))
    .forEach(b => {
      const month = format(startOfMonth(new Date(b.created_at)), 'MMM yyyy');
      revenueByMonth.set(month, (revenueByMonth.get(month) || 0) + Number(b.total_amount || 0));
    });

  const revenueChartData = Array.from(revenueByMonth.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .slice(-12);

  // Property distribution
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byCity: Record<string, number> = {};
  allProperties.forEach(p => {
    byType[p.property_type] = (byType[p.property_type] || 0) + 1;
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    const loc = p.city || 'Unknown';
    byCity[loc] = (byCity[loc] || 0) + 1;
  });

  const typeChartData = Object.entries(byType).map(([name, value]) => ({ name, value }));
  const statusChartData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  const cityChartData = Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // Favorites insights
  const favCounts = new Map<string, number>();
  allFavorites.forEach(f => {
    favCounts.set(f.property_id, (favCounts.get(f.property_id) || 0) + 1);
  });
  const topFavorited = Array.from(favCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([propId, count]) => {
      const prop = allProperties.find(p => p.id === propId);
      return {
        propertyId: propId,
        title: prop?.title || 'Unknown',
        landlordName: prop ? (profileMap.get(prop.landlord_id)?.full_name || 'Unknown') : 'Unknown',
        count,
        type: prop?.property_type || 'unknown',
      };
    });

  return {
    totalUsers,
    totalLandlords,
    newUsersWeek,
    newUsersMonth,
    newLandlordsWeek,
    newLandlordsMonth,
    responseLeaderboard,
    topViewed,
    bookingsByStatus,
    totalRevenue,
    avgBookingValue,
    revenueChartData,
    typeChartData,
    statusChartData,
    cityChartData,
    topFavorited,
    totalBookings: allBookings.length,
    totalProperties: allProperties.length,
  };
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: fetchAnalyticsData,
  });

  if (isLoading || !data) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const chartConfig = {
    amount: { label: 'Revenue', color: 'hsl(var(--primary))' },
    value: { label: 'Count', color: 'hsl(var(--primary))' },
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Platform insights and performance metrics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Total Users" value={data.totalUsers} icon={Users} change={`+${data.newUsersWeek} this week`} changeType="positive" />
          <StatsCard title="Total Landlords" value={data.totalLandlords} icon={UserCheck} change={`+${data.newLandlordsWeek} this week`} changeType="positive" />
          <StatsCard title="Total Properties" value={data.totalProperties} icon={Building2} change={`+${data.newUsersMonth} users/mo`} changeType="neutral" />
          <StatsCard title="Total Revenue" value={`KES ${(data.totalRevenue / 1000).toFixed(0)}K`} icon={TrendingUp} change={`${data.totalBookings} bookings`} changeType="positive" />
        </div>

        {/* Revenue Chart */}
        {data.revenueChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue Trend</CardTitle>
              <CardDescription>Monthly booking revenue (KES)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={data.revenueChartData}>
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Distribution Charts */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'By Type', data: data.typeChartData },
            { title: 'By Status', data: data.statusChartData },
          ].map(chart => (
            <Card key={chart.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{chart.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <PieChart>
                    <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                      {chart.data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={data.cityChartData} layout="vertical">
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0,4,4,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leaderboard">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="leaderboard">Response Leaderboard</TabsTrigger>
            <TabsTrigger value="views">Most Viewed</TabsTrigger>
            <TabsTrigger value="favorites">Most Favorited</TabsTrigger>
            <TabsTrigger value="bookings">Booking Status</TabsTrigger>
          </TabsList>

          {/* Response Leaderboard */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5" /> Inquiry Response Leaderboard</CardTitle>
                <CardDescription>Landlords ranked by average response time</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Landlord</TableHead>
                      <TableHead>Avg Response</TableHead>
                      <TableHead>Response Rate</TableHead>
                      <TableHead>Unanswered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.responseLeaderboard.map((ll, i) => (
                      <TableRow key={ll.userId}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell className="font-medium">{ll.name}</TableCell>
                        <TableCell>
                          {ll.avgMinutes !== null ? (
                            <Badge variant={ll.avgMinutes < 120 ? 'default' : 'secondary'}>
                              {formatDuration(ll.avgMinutes)}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">No replies</Badge>
                          )}
                        </TableCell>
                        <TableCell>{ll.responseRate}%</TableCell>
                        <TableCell>
                          {ll.unanswered > 0 ? (
                            <span className="text-destructive font-medium">{ll.unanswered}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.responseLeaderboard.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No inquiry data yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Most Viewed */}
          <TabsContent value="views">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Eye className="w-5 h-5" /> Most Viewed Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Landlord</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topViewed.map((p, i) => (
                      <TableRow key={p.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                        <TableCell>{p.landlordName}</TableCell>
                        <TableCell><Badge variant="outline">{p.property_type}</Badge></TableCell>
                        <TableCell className="font-semibold">{p.views_count?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {data.topViewed.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No properties yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites */}
          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Heart className="w-5 h-5" /> Most Favorited Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Landlord</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Favorites</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topFavorited.map((p, i) => (
                      <TableRow key={p.propertyId}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                        <TableCell>{p.landlordName}</TableCell>
                        <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                        <TableCell className="font-semibold">{p.count}</TableCell>
                      </TableRow>
                    ))}
                    {data.topFavorited.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No favorites yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking Status */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Booking Status Breakdown</CardTitle>
                <CardDescription>Avg booking value: KES {data.avgBookingValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(data.bookingsByStatus).map(([status, count]) => (
                    <div key={status} className="rounded-lg border bg-muted/50 p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{count}</p>
                      <p className="text-xs text-muted-foreground capitalize">{status.replace('_', ' ')}</p>
                    </div>
                  ))}
                  {Object.keys(data.bookingsByStatus).length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-4">No bookings yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
