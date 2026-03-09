import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye, Phone, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { LandlordDetailModal } from './LandlordDetailModal';

interface PendingApplication {
  id: string;
  user_id: string;
  business_phone: string | null;
  id_number: string | null;
  kra_pin: string | null;
  documents: string[];
  verification_status: string;
  created_at: string;
  full_name: string | null;
  email: string | null;
}

export function PendingLandlordApplications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLandlord, setSelectedLandlord] = useState<any>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['pending-landlord-applications'],
    queryFn: async () => {
      // Get landlord_profiles with pending status
      const { data: profiles, error } = await supabase
        .from('landlord_profiles')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (!profiles?.length) return [];

      // Get user details
      const userIds = profiles.map(p => p.user_id);
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      return profiles.map(p => ({
        ...p,
        documents: p.documents || [],
        full_name: userProfiles?.find(u => u.user_id === p.user_id)?.full_name || 'Unknown',
        email: userProfiles?.find(u => u.user_id === p.user_id)?.email || null,
      })) as PendingApplication[];
    },
  });

  const handleAction = useMutation({
    mutationFn: async ({ userId, action, notes }: { userId: string; action: 'verified' | 'rejected'; notes?: string }) => {
      // Update landlord_profiles
      const { error: profileError } = await supabase
        .from('landlord_profiles')
        .update({
          verification_status: action,
          verification_notes: notes || null,
          verified_at: action === 'verified' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // If approved, upgrade role to landlord
      if (action === 'verified') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'landlord' as any })
          .eq('user_id', userId);

        if (roleError) throw roleError;
      }

      return action;
    },
    onSuccess: (action) => {
      toast({
        title: action === 'verified' ? 'Application Approved' : 'Application Rejected',
        description: action === 'verified' 
          ? 'The user has been upgraded to landlord.' 
          : 'The application has been rejected.',
      });
      queryClient.invalidateQueries({ queryKey: ['pending-landlord-applications'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const docsCount = (app: PendingApplication) => {
    let count = 0;
    if (app.id_number) count++;
    if (app.kra_pin) count++;
    if (app.business_phone) count++;
    if (app.documents?.[0]) count++;
    if (app.documents?.[1]) count++;
    if (app.documents?.[2]) count++;
    return count;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!applications?.length) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No pending landlord applications
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {applications.map((app) => (
          <div
            key={app.id}
            className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{app.full_name}</h4>
                <p className="text-sm text-muted-foreground">{app.email}</p>
                {app.business_phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {app.business_phone}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{docsCount(app)}/6 docs</Badge>
                  <span className="text-xs text-muted-foreground">
                    Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => setSelectedLandlord({
                    user_id: app.user_id,
                    full_name: app.full_name,
                    email: app.email,
                    phone: null,
                    verification_status: app.verification_status,
                    business_phone: app.business_phone,
                    id_number: app.id_number,
                    kra_pin: app.kra_pin,
                    documents: app.documents,
                    created_at: app.created_at,
                    property_count: 0,
                    avg_rating: 0,
                    subscription: null,
                  })}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleAction.mutate({ userId: app.user_id, action: 'verified' })}
                  disabled={handleAction.isPending}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleAction.mutate({ userId: app.user_id, action: 'rejected' })}
                  disabled={handleAction.isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedLandlord && (
        <LandlordDetailModal
          landlord={selectedLandlord}
          open={!!selectedLandlord}
          onOpenChange={(open) => !open && setSelectedLandlord(null)}
          onActionComplete={() => queryClient.invalidateQueries({ queryKey: ['pending-landlord-applications'] })}
        />
      )}
    </>
  );
}
