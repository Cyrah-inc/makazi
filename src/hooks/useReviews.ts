import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Review {
  id: string;
  booking_id: string;
  property_id: string;
  guest_id: string;
  landlord_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ReviewWithGuest extends Review {
  guest_name: string;
  guest_avatar_url: string | null;
}

// Fetch review for a specific booking
export function useBookingReview(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['review', 'booking', bookingId],
    queryFn: async (): Promise<Review | null> => {
      if (!bookingId) return null;

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });
}

// Fetch reviews for a property
export function usePropertyReviews(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', 'property', propertyId],
    queryFn: async (): Promise<ReviewWithGuest[]> => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data?.length) return [];

      // Enrich with guest profiles
      const guestIds = [...new Set(data.map((r) => r.guest_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', guestIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return data.map((review) => {
        const guest = profileMap.get(review.guest_id);
        return {
          ...review,
          guest_name: guest?.full_name || 'Guest',
          guest_avatar_url: guest?.avatar_url || null,
        };
      });
    },
    enabled: !!propertyId,
  });
}

// Create a review
export function useCreateReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      bookingId: string;
      propertyId: string;
      landlordId: string;
      rating: number;
      comment?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          booking_id: params.bookingId,
          property_id: params.propertyId,
          guest_id: user.id,
          landlord_id: params.landlordId,
          rating: params.rating,
          comment: params.comment || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['review', 'booking', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'property', variables.propertyId] });
      toast({
        title: 'Review submitted!',
        description: 'Thank you for sharing your experience.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to submit review',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
