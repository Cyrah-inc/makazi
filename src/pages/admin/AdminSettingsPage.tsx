import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, UserCheck, DollarSign, Shield, FileText, CreditCard, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

async function fetchSettingsData() {
  const [
    { data: profiles },
    { data: landlordProfiles },
    { data: subscriptions },
  ] = await Promise.all([
    supabase.from('profiles').select('user_id, status'),
    supabase.from('landlord_profiles').select('user_id, verification_status'),
    supabase.from('subscriptions').select('id, user_id, status, plan, amount, starts_at, expires_at'),
  ]);

  const allProfiles = profiles || [];
  const allLandlords = landlordProfiles || [];
  const allSubs = subscriptions || [];

  const activeUsers = allProfiles.filter(p => p.status === 'active').length;
  const suspendedUsers = allProfiles.filter(p => p.status === 'suspended').length;

  const verificationStats = {
    unverified: allLandlords.filter(l => l.verification_status === 'unverified').length,
    pending: allLandlords.filter(l => l.verification_status === 'pending').length,
    verified: allLandlords.filter(l => l.verification_status === 'verified').length,
    rejected: allLandlords.filter(l => l.verification_status === 'rejected').length,
  };

  const activeSubs = allSubs.filter(s => s.status === 'active');
  const expiredSubs = allSubs.filter(s => s.status === 'expired' || s.status === 'cancelled');

  return {
    totalUsers: allProfiles.length,
    activeUsers,
    suspendedUsers,
    verificationStats,
    totalLandlords: allLandlords.length,
    activeSubs,
    expiredSubs,
    allSubs,
  };
}

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: fetchSettingsData,
  });

  const handleCancelSubscription = async (subId: string) => {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subId);
    if (error) {
      toast.error('Failed to cancel subscription');
    } else {
      toast.success('Subscription cancelled');
      refetch();
    }
  };

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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-7 h-7" /> Settings
          </h1>
          <p className="text-muted-foreground">Platform configuration and management</p>
        </div>

        <Tabs defaultValue="platform">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="platform">Platform</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>

          {/* Platform Tab */}
          <TabsContent value="platform">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Platform Name</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">Makazi</p>
                  <p className="text-sm text-muted-foreground mt-1">Real estate platform</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Fee</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">10%</p>
                  <p className="text-sm text-muted-foreground mt-1">Applied to Airbnb bookings</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Subscription Price</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">KES 2,000</p>
                  <p className="text-sm text-muted-foreground mt-1">Monthly landlord plan</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-foreground">{data.totalUsers}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{data.activeUsers}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-destructive">{data.suspendedUsers}</p>
                    <p className="text-sm text-muted-foreground">Suspended</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => navigate('/admin/users')}>
                    <Users className="w-4 h-4 mr-2" /> Manage Users
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/admin/landlords')}>
                    <UserCheck className="w-4 h-4 mr-2" /> Manage Landlords
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/admin/revenue')}>
                    <DollarSign className="w-4 h-4 mr-2" /> View Revenue
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/admin/analytics')}>
                    <ExternalLink className="w-4 h-4 mr-2" /> View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data.verificationStats).map(([status, count]) => (
                  <Card key={status}>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-foreground">{count}</p>
                      <p className="text-sm text-muted-foreground capitalize">{status}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5" /> Required Documents</CardTitle>
                  <CardDescription>Documents landlords must submit for verification</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      { label: 'National ID Number', desc: 'Government-issued identification' },
                      { label: 'KRA PIN Certificate', desc: 'Kenya Revenue Authority tax PIN' },
                      { label: 'Business Phone Number', desc: 'Active phone for tenant inquiries' },
                      { label: 'Supporting Documents', desc: 'ID copy, KRA certificate uploads' },
                    ].map(doc => (
                      <li key={doc.label} className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-foreground">{doc.label}</p>
                          <p className="text-sm text-muted-foreground">{doc.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Button variant="outline" onClick={() => navigate('/admin/landlords')}>
                <UserCheck className="w-4 h-4 mr-2" /> Review Landlord Verifications
              </Button>
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{data.activeSubs.length}</p>
                    <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-muted-foreground">{data.expiredSubs.length}</p>
                    <p className="text-sm text-muted-foreground">Expired / Cancelled</p>
                  </CardContent>
                </Card>
              </div>

              {data.activeSubs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-5 h-5" /> Active Subscriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plan</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.activeSubs.map(sub => (
                          <TableRow key={sub.id}>
                            <TableCell className="capitalize font-medium">{sub.plan}</TableCell>
                            <TableCell>KES {Number(sub.amount).toLocaleString()}</TableCell>
                            <TableCell><Badge variant="default">Active</Badge></TableCell>
                            <TableCell>
                              <Button size="sm" variant="destructive" onClick={() => handleCancelSubscription(sub.id)}>
                                Cancel
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
