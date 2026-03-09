import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserLayout } from '@/components/user/UserLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SingleDocumentUpload } from '@/components/landlord/SingleDocumentUpload';
import { 
  Phone, CreditCard, FileText, CheckCircle, ArrowRight, ArrowLeft, 
  Loader2, Clock, Shield, XCircle, RefreshCw, Building2 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const STEPS = [
  { title: 'Business Phone', description: 'WhatsApp-connected phone number', icon: Phone },
  { title: 'National ID', description: 'ID number and front/back photos', icon: CreditCard },
  { title: 'KRA Compliance', description: 'KRA PIN and certificate', icon: FileText },
];

export default function BecomeAgentPage() {
  const { user, isLandlord, isAdmin, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [businessPhone, setBusinessPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [kraPin, setKraPin] = useState('');
  const [kraCert, setKraCert] = useState<string | null>(null);

  // Fetch existing application
  const { data: existingProfile, isLoading } = useQuery({
    queryKey: ['agent-application', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landlord_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Hydrate form from existing data
  useEffect(() => {
    if (existingProfile) {
      setBusinessPhone(existingProfile.business_phone || '');
      setIdNumber(existingProfile.id_number || '');
      setKraPin(existingProfile.kra_pin || '');
      const docs = existingProfile.documents || [];
      setIdFront(docs[0] || null);
      setIdBack(docs[1] || null);
      setKraCert(docs[2] || null);
    }
  }, [existingProfile]);

  // Redirect if already a landlord
  if (isLandlord || isAdmin) {
    navigate('/landlord', { replace: true });
    return null;
  }

  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  const verificationStatus = existingProfile?.verification_status;
  const isPending = verificationStatus === 'pending';
  const isVerified = verificationStatus === 'verified';
  const isRejected = verificationStatus === 'rejected';

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    // Re-fetch role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (roleData?.role === 'landlord') {
      // Force auth refresh
      window.location.href = '/landlord';
      return;
    }
    
    await queryClient.invalidateQueries({ queryKey: ['agent-application', user.id] });
    setRefreshing(false);
    toast({ title: 'Status refreshed', description: 'Your application status has been updated.' });
  };

  const handleSubmit = async () => {
    // Validate all fields
    if (!businessPhone.trim()) {
      toast({ title: 'Missing field', description: 'Please enter your business phone number.', variant: 'destructive' });
      setStep(0);
      return;
    }
    if (!idNumber.trim() || !idFront || !idBack) {
      toast({ title: 'Missing field', description: 'Please complete all National ID fields.', variant: 'destructive' });
      setStep(1);
      return;
    }
    if (!kraPin.trim() || !kraCert) {
      toast({ title: 'Missing field', description: 'Please complete all KRA fields.', variant: 'destructive' });
      setStep(2);
      return;
    }

    setSaving(true);
    const documents = [idFront, idBack, kraCert];
    
    const profileData = {
      user_id: user.id,
      business_phone: businessPhone.trim(),
      id_number: idNumber.trim(),
      kra_pin: kraPin.trim(),
      documents,
      verification_status: 'pending',
      updated_at: new Date().toISOString(),
    };

    let error;
    if (existingProfile) {
      const res = await supabase
        .from('landlord_profiles')
        .update(profileData)
        .eq('user_id', user.id);
      error = res.error;
    } else {
      const res = await supabase
        .from('landlord_profiles')
        .insert(profileData);
      error = res.error;
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['agent-application', user.id] });
    toast({ title: 'Application submitted!', description: 'Your agent application is now under review.' });
    setSaving(false);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return businessPhone.trim().length > 0;
      case 1: return idNumber.trim().length > 0 && !!idFront && !!idBack;
      case 2: return kraPin.trim().length > 0 && !!kraCert;
      default: return false;
    }
  };

  if (isLoading) {
    return (
      <UserLayout>
        <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </UserLayout>
    );
  }

  // Status screens
  if (isPending) {
    return (
      <UserLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="py-12 px-6 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="w-10 h-10 text-accent" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-heading font-bold text-foreground">Verification Pending</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your agent application has been submitted and is currently under review. 
                  We'll notify you once it's been processed.
                </p>
              </div>
              <Badge variant="outline" className="text-accent border-accent px-4 py-1.5 text-sm">
                <Clock className="w-4 h-4 mr-2" /> Under Review
              </Badge>
              <Button variant="outline" onClick={handleRefreshStatus} disabled={refreshing}>
                {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Check Status
              </Button>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    );
  }

  if (isRejected) {
    return (
      <UserLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="py-12 px-6 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-heading font-bold text-foreground">Application Rejected</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Unfortunately, your agent application was not approved. 
                  {existingProfile?.verification_notes && (
                    <span className="block mt-2 text-sm italic">
                      Reason: {existingProfile.verification_notes}
                    </span>
                  )}
                </p>
              </div>
              <Button onClick={() => {
                // Allow resubmission
                setStep(0);
              }}>
                Resubmit Application
              </Button>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Become an Agent</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Complete the verification process to start listing properties on Makazi.
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`flex items-center gap-1.5 transition-colors ${
                  i === step ? 'text-primary font-medium' : i < step ? 'text-primary/60' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  i < step ? 'bg-primary text-primary-foreground' : 
                  i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5 text-primary" />; })()}
              {STEPS[step].title}
            </CardTitle>
            <CardDescription>{STEPS[step].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <div className="space-y-2">
                <Label htmlFor="business-phone">WhatsApp Business Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="business-phone"
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter a phone number connected to WhatsApp for tenant communication.
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="id-number">National ID Number</Label>
                  <Input
                    id="id-number"
                    placeholder="Enter your National ID number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm">ID Front</Label>
                    <SingleDocumentUpload
                      label="Upload ID Front"
                      value={idFront}
                      onChange={setIdFront}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">ID Back</Label>
                    <SingleDocumentUpload
                      label="Upload ID Back"
                      value={idBack}
                      onChange={setIdBack}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kra-pin">KRA PIN</Label>
                  <Input
                    id="kra-pin"
                    placeholder="Enter your KRA PIN"
                    value={kraPin}
                    onChange={(e) => setKraPin(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">KRA Certificate</Label>
                  <SingleDocumentUpload
                    label="Upload KRA Certificate"
                    value={kraCert}
                    onChange={setKraCert}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving || !canProceed()}>
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><Shield className="w-4 h-4 mr-2" /> Submit Application</>
              )}
            </Button>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
