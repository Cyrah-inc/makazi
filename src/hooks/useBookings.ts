import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Booking, BookingWithProperty, BookingDetail, Payout, SERVICE_FEE_RATE } from '@/types/booking';
import { toast } from '@/hooks/use-toast';

// Fetch bookings for the current guest
export function useGuestBookings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookings', 'guest', user?.id],
    queryFn: async (): Promise<BookingWithProperty[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('guest_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const propertyIds = [...new Set(data.map(b => b.property_id))];
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, images, city')
        .in('id', propertyIds);

      const propertyMap = new Map(properties?.map(p => [p.id, p]) || []);

      return data.map(booking => {
        const prop = propertyMap.get(booking.property_id);
        return {
          ...booking,
          property_title: prop?.title || 'Unknown Property',
          property_image: prop?.images?.[0] || '/placeholder.svg',
          property_city: prop?.city || '',
        } as BookingWithProperty;
      });
    },
    enabled: !!user,
  });
}

// Fetch bookings for the current landlord
export function useLandlordBookings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookings', 'landlord', user?.id],
    queryFn: async (): Promise<BookingWithProperty[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const propertyIds = [...new Set(data.map(b => b.property_id))];
      const guestIds = [...new Set(data.map(b => b.guest_id))];

      const [propertiesRes, profilesRes] = await Promise.all([
        supabase.from('properties').select('id, title, images, city').in('id', propertyIds),
        supabase.rpc('get_public_profiles', { user_ids: guestIds }),
      ]);

      const propertyMap = new Map(propertiesRes.data?.map(p => [p.id, p]) || []);
      const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);

      return data.map(booking => {
        const prop = propertyMap.get(booking.property_id);
        const guest = profileMap.get(booking.guest_id);
        return {
          ...booking,
          property_title: prop?.title || 'Unknown Property',
          property_image: prop?.images?.[0] || '/placeholder.svg',
          property_city: prop?.city || '',
          guest_name: guest?.full_name || 'Guest',
          guest_email: guest?.email || '',
        } as BookingWithProperty;
      });
    },
    enabled: !!user,
  });
}

// Fetch a single booking with full details
export function useBookingDetail(bookingId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['booking-detail', bookingId],
    queryFn: async (): Promise<BookingDetail | null> => {
      if (!bookingId || !user) return null;

      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();

      if (error) throw error;
      if (!booking) return null;

      const [propRes, guestRes] = await Promise.all([
        supabase
          .from('properties')
          .select('id, title, images, city, address, latitude, longitude, bedrooms, bathrooms, amenities, property_type, property_category')
          .eq('id', booking.property_id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('user_id, full_name, email, phone, avatar_url')
          .eq('user_id', booking.guest_id)
          .maybeSingle(),
      ]);

      const prop = propRes.data;
      const guest = guestRes.data;

      return {
        ...booking,
        property_title: prop?.title || 'Unknown Property',
        property_image: prop?.images?.[0] || '/placeholder.svg',
        property_images: prop?.images || [],
        property_city: prop?.city || '',
        property_address: prop?.address || '',
        property_latitude: prop?.latitude || null,
        property_longitude: prop?.longitude || null,
        property_bedrooms: prop?.bedrooms || 0,
        property_bathrooms: prop?.bathrooms || 0,
        property_amenities: prop?.amenities || [],
        property_type: prop?.property_type || 'airbnb',
        property_category: prop?.property_category || null,
        guest_name: guest?.full_name || 'Guest',
        guest_email: guest?.email || '',
        guest_phone_profile: guest?.phone || null,
        guest_avatar_url: guest?.avatar_url || null,
      } as BookingDetail;
    },
    enabled: !!bookingId && !!user,
  });
}

// Fetch booked dates for a property (to block on calendar)
export function usePropertyBookedDates(propertyId: string) {
  return useQuery({
    queryKey: ['booked-dates', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('check_in_date, check_out_date')
        .eq('property_id', propertyId)
        .in('status', ['pending_payment', 'paid', 'checked_in']);

      if (error) throw error;

      const disabledDates: Date[] = [];
      data?.forEach(booking => {
        const start = new Date(booking.check_in_date);
        const end = new Date(booking.check_out_date);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          disabledDates.push(new Date(d));
        }
      });

      return disabledDates;
    },
    enabled: !!propertyId,
  });
}

// Create a new booking
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      propertyId: string;
      landlordId: string;
      guestId: string;
      checkInDate: string;
      checkOutDate: string;
      nights: number;
      nightlyRate: number;
      paymentMethod: 'mpesa' | 'stripe';
      guestPhone?: string;
    }) => {
      const totalAmount = params.nights * params.nightlyRate;
      const serviceFee = Math.round(totalAmount * SERVICE_FEE_RATE);

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          property_id: params.propertyId,
          landlord_id: params.landlordId,
          guest_id: params.guestId,
          check_in_date: params.checkInDate,
          check_out_date: params.checkOutDate,
          nights: params.nights,
          nightly_rate: params.nightlyRate,
          total_amount: totalAmount + serviceFee,
          service_fee: serviceFee,
          payment_method: params.paymentMethod,
          guest_phone: params.guestPhone || null,
          status: 'pending_payment',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booked-dates'] });
    },
  });
}

// Check-in mutation
export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      toast({
        title: 'Checked In!',
        description: 'You have successfully checked in. The landlord will receive their payout.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Check-in failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Cancel booking mutation
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      queryClient.invalidateQueries({ queryKey: ['booked-dates'] });
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Cancellation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Mark booking as completed (landlord action) — now calls edge function for payout
export function useRequestPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { bookingId: string; phoneNumber: string }) => {
      const { data, error } = await supabase.functions.invoke('process-booking-payout', {
        body: { bookingId: params.bookingId, phoneNumber: params.phoneNumber },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { success: boolean; payoutAmount: number; payoutReference: string; message: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      queryClient.invalidateQueries({ queryKey: ['landlord-payouts'] });
      toast({
        title: 'Payout Processed!',
        description: `KES ${data.payoutAmount.toLocaleString()} has been sent to your M-Pesa (simulated).`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Payout failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Keep old useCompleteBooking for backward compatibility
export function useCompleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      toast({
        title: 'Booking Completed',
        description: 'The booking has been marked as completed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to complete booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Fetch landlord payouts
export function useLandlordPayouts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['landlord-payouts', user?.id],
    queryFn: async (): Promise<Payout[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Payout[];
    },
    enabled: !!user,
  });
}

// Fetch payout for a specific booking
export function useBookingPayout(bookingId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['booking-payout', bookingId],
    queryFn: async (): Promise<Payout | null> => {
      if (!bookingId || !user) return null;

      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Payout | null;
    },
    enabled: !!bookingId && !!user,
  });
}

// Trigger M-Pesa STK Push via edge function
export function useMpesaStkPush() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { bookingId: string; phoneNumber: string }) => {
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: { bookingId: params.bookingId, phoneNumber: params.phoneNumber },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { checkoutRequestId: string; bookingId: string; message: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error) => {
      toast({
        title: 'M-Pesa payment failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Poll booking status until it changes from pending_payment
export function useBookingStatusPoll(bookingId: string | null) {
  return useQuery({
    queryKey: ['booking-status-poll', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('id', bookingId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || status === 'pending_payment') return 3000;
      return false;
    },
  });
}

// Simulate payment (kept as fallback)
export function useSimulatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'paid',
          payment_reference: `SIM-${Date.now()}`,
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been received and is held in escrow until check-in.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Payment failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Admin withdraw commission
export function useAdminWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { amount: number; phoneNumber: string; source: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-withdraw-commission', {
        body: params,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      toast({
        title: 'Withdrawal Processed',
        description: 'Commission withdrawal has been processed (simulated).',
      });
    },
    onError: (error) => {
      toast({
        title: 'Withdrawal failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
