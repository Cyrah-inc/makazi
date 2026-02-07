import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface LandlordProfile {
  id: string;
  user_id: string;
  id_number: string | null;
  kra_pin: string | null;
  business_phone: string | null;
  documents: string[];
  verification_status: string;
  verification_notes: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan: string;
  amount: number;
  payment_method: string | null;
  payment_reference: string | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useLandlordProfile() {
  const { user } = useAuth();

  const { data: landlordProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['landlord-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landlord_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as LandlordProfile | null;
    },
    enabled: !!user?.id,
  });

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['landlord-subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user?.id,
  });

  const { data: propertyCount } = useQuery({
    queryKey: ['landlord-property-count', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('landlord_id', user!.id)
        .in('status', ['pending', 'approved']);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  const isVerified = landlordProfile?.verification_status === 'verified';
  const isPending = landlordProfile?.verification_status === 'pending';
  const isRejected = landlordProfile?.verification_status === 'rejected';
  const hasActiveSubscription = subscription?.status === 'active' && 
    subscription?.expires_at && new Date(subscription.expires_at) > new Date();
  const canListProperty = isVerified && ((propertyCount ?? 0) < 5 || hasActiveSubscription);
  const needsSubscription = isVerified && (propertyCount ?? 0) >= 5 && !hasActiveSubscription;

  return {
    landlordProfile,
    subscription,
    propertyCount: propertyCount ?? 0,
    isLoading: profileLoading || subscriptionLoading,
    isVerified,
    isPending,
    isRejected,
    hasActiveSubscription,
    canListProperty,
    needsSubscription,
  };
}
