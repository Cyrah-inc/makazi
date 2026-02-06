import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Booking, BookingWithProperty, SERVICE_FEE_RATE } from '@/types/booking';
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

      // Enrich with property data
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

      // Enrich with property + guest data
      const propertyIds = [...new Set(data.map(b => b.property_id))];
      const guestIds = [...new Set(data.map(b => b.guest_id))];

      const [propertiesRes, profilesRes] = await Promise.all([
        supabase.from('properties').select('id, title, images, city').in('id', propertyIds),
        supabase.from('profiles').select('user_id, full_name, email').in('user_id', guestIds),
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

      // Build array of disabled dates
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

// Simulate payment (temporary until real payment integration)
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
