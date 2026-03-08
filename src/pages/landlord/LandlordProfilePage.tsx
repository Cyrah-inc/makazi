import { useState, useEffect } from 'react';
import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLandlordProfile } from '@/hooks/useLandlordProfile';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { VerificationDetailsCard } from '@/components/landlord/VerificationDetailsCard';
import { SubscriptionPaymentDialog } from '@/components/landlord/SubscriptionPaymentDialog';
import {
  Loader2, Save, User, CreditCard, CheckCircle, Clock, XCircle, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ChangePasswordCard } from '@/components/ChangePasswordCard';

export default function LandlordProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    landlordProfile, subscription, propertyCount,
    isLoading, isVerified, isPending, isRejected, hasActiveSubscription, needsSubscription,
  } = useLandlordProfile();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Personal details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [subscriptionOpen, setSubscriptionOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSavingProfile(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, email })
      .eq('user_id', user.id);

    setSavingProfile(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated' });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  };

  const getStatusConfig = () => {
    switch (landlordProfile?.verification_status) {
      case 'verified':
        return { icon: <CheckCircle className="w-5 h-5" />, label: 'Verified', color: 'bg-primary/10 text-primary border-primary/20' };
      case 'pending':
        return { icon: <Clock className="w-5 h-5" />, label: 'Pending Review', color: 'bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold-foreground))] border-[hsl(var(--gold))]/20' };
      case 'rejected':
        return { icon: <XCircle className="w-5 h-5" />, label: 'Rejected', color: 'bg-destructive/10 text-destructive border-destructive/20' };
      default:
        return { icon: <AlertCircle className="w-5 h-5" />, label: 'Unverified', color: 'bg-accent/10 text-accent border-accent/20' };
    }
  };

  const statusConfig = getStatusConfig();

  if (isLoading) {
    return (
      <LandlordLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage your personal and verification details</p>
          </div>
          <Badge className={cn('gap-1.5 px-3 py-1.5 text-sm border', statusConfig.color)}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" /> Personal Details
              </CardTitle>
              <CardDescription>Your basic account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'L'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{fullName || 'Your Name'}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712345678" />
              </div>

              <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full gap-2">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Personal Details
              </Button>
            </CardContent>
          </Card>

          {/* Verification Details */}
          <VerificationDetailsCard
            landlordProfile={landlordProfile}
            isVerified={isVerified}
            isPending={isPending}
            isRejected={isRejected}
          />
        </div>

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Subscription
            </CardTitle>
            <CardDescription>Manage your listing plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                {hasActiveSubscription ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary">Active</Badge>
                      <span className="font-medium">Makazi Pro Plan</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Expires {subscription?.expires_at ? format(new Date(subscription.expires_at), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Free Tier</Badge>
                      <span className="font-medium">Basic Plan</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {propertyCount}/5 properties used
                    </p>
                  </div>
                )}
              </div>

              {!hasActiveSubscription && (
                <Button onClick={() => setSubscriptionOpen(true)} className="gap-2">
                  <CreditCard className="w-4 h-4" />
                  {needsSubscription ? 'Subscribe Now' : 'Upgrade to Pro'}
                </Button>
              )}

              {hasActiveSubscription && (
                <Button variant="outline" onClick={() => setSubscriptionOpen(true)} className="gap-2">
                  <CreditCard className="w-4 h-4" /> Renew
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Security - Change Password */}
        <ChangePasswordCard />
      </div>

      <SubscriptionPaymentDialog open={subscriptionOpen} onOpenChange={setSubscriptionOpen} />
    </LandlordLayout>
  );
}
