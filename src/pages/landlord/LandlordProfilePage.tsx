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
import { DocumentUpload } from '@/components/landlord/DocumentUpload';
import { SubscriptionPaymentDialog } from '@/components/landlord/SubscriptionPaymentDialog';
import {
  Loader2, Save, User, Shield, CreditCard, CheckCircle, Clock, XCircle, AlertCircle, BadgeCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

  // Verification details
  const [idNumber, setIdNumber] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [documents, setDocuments] = useState<string[]>([]);
  const [savingVerification, setSavingVerification] = useState(false);

  const [subscriptionOpen, setSubscriptionOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    if (landlordProfile) {
      setIdNumber(landlordProfile.id_number || '');
      setKraPin(landlordProfile.kra_pin || '');
      setBusinessPhone(landlordProfile.business_phone || '');
      setDocuments(landlordProfile.documents || []);
    }
  }, [landlordProfile]);

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

  const handleSaveVerification = async (submit = false) => {
    if (!user?.id) return;
    setSavingVerification(true);

    const updates: Record<string, any> = {
      id_number: idNumber,
      kra_pin: kraPin,
      business_phone: businessPhone,
      documents,
    };

    if (submit) {
      // Validate required fields
      if (!idNumber || !kraPin || !businessPhone || documents.length === 0) {
        toast({ title: 'Incomplete', description: 'Fill in all fields and upload at least one document', variant: 'destructive' });
        setSavingVerification(false);
        return;
      }
      updates.verification_status = 'pending';
    }

    // Check if profile exists
    if (landlordProfile) {
      const { error } = await supabase
        .from('landlord_profiles')
        .update(updates)
        .eq('user_id', user.id);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        setSavingVerification(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('landlord_profiles')
        .insert({ user_id: user.id, ...updates });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        setSavingVerification(false);
        return;
      }
    }

    setSavingVerification(false);
    toast({ title: submit ? 'Submitted for review!' : 'Details saved' });
    queryClient.invalidateQueries({ queryKey: ['landlord-profile'] });
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" /> Verification Details
              </CardTitle>
              <CardDescription>
                {isVerified
                  ? 'Your account is verified'
                  : 'Provide your details and documents to get verified'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRejected && landlordProfile?.verification_notes && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  <strong>Rejection reason:</strong> {landlordProfile.verification_notes}
                </div>
              )}

              <div>
                <Label htmlFor="idNumber">National ID Number *</Label>
                <Input
                  id="idNumber"
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value)}
                  placeholder="e.g., 12345678"
                  disabled={isPending || isVerified}
                />
              </div>
              <div>
                <Label htmlFor="kraPin">KRA PIN *</Label>
                <Input
                  id="kraPin"
                  value={kraPin}
                  onChange={e => setKraPin(e.target.value)}
                  placeholder="e.g., A001234567Z"
                  disabled={isPending || isVerified}
                />
              </div>
              <div>
                <Label htmlFor="businessPhone">Business Phone *</Label>
                <Input
                  id="businessPhone"
                  value={businessPhone}
                  onChange={e => setBusinessPhone(e.target.value)}
                  placeholder="e.g., 0722123456"
                  disabled={isPending || isVerified}
                />
              </div>

              <div>
                <Label className="mb-2 block">Verification Documents *</Label>
                <DocumentUpload
                  documents={documents}
                  onDocumentsChange={setDocuments}
                  maxDocuments={5}
                  disabled={isPending || isVerified}
                />
              </div>

              {!isVerified && !isPending && (
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSaveVerification(false)}
                    disabled={savingVerification}
                    className="flex-1"
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSaveVerification(true)}
                    disabled={savingVerification}
                    className="flex-1 gap-2"
                  >
                    {savingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                    Submit for Review
                  </Button>
                </div>
              )}

              {isPending && (
                <div className="p-3 rounded-lg bg-[hsl(var(--gold))]/10 border border-[hsl(var(--gold))]/20 text-sm text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-[hsl(var(--gold))]" />
                  Your verification is under review
                </div>
              )}

              {isVerified && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-center text-primary">
                  <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                  Account verified
                  {landlordProfile?.verified_at && (
                    <p className="text-xs mt-1 text-muted-foreground">
                      on {format(new Date(landlordProfile.verified_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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

      <SubscriptionPaymentDialog open={subscriptionOpen} onOpenChange={setSubscriptionOpen} />
    </LandlordLayout>
  );
}
