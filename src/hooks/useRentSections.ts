import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LISTING_COLUMNS } from './useProperties';
import { fetchAndTransform, STALE_TIME } from './useHomeSections';

// 1. Trending Rentals
export const useTrendingRentals = () =>
  useQuery({
    queryKey: ['rent', 'trending'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'rent')
          .order('views_count', { ascending: false })
          .order('created_at', { ascending: false })
      ),
    staleTime: STALE_TIME,
  });

// 2. Apartments for Rent
const URBAN_COUNTIES = ['Nairobi', 'Mombasa', 'Kisumu'];

export const useApartmentsForRent = () =>
  useQuery({
    queryKey: ['rent', 'apartments'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'rent')
          .eq('property_category', 'apartment')
          .in('state', URBAN_COUNTIES)
          .order('views_count', { ascending: false })
          .order('created_at', { ascending: false })
      ),
    staleTime: STALE_TIME,
  });

// 3. Houses for Rent
const HOUSE_CATEGORIES = ['house', 'villa', 'bungalow'];

export const useHousesForRent = () =>
  useQuery({
    queryKey: ['rent', 'houses'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'rent')
          .in('property_category', HOUSE_CATEGORIES)
          .order('views_count', { ascending: false })
          .order('created_at', { ascending: false })
      ),
    staleTime: STALE_TIME,
  });

// 4. Luxury Rentals — highest priced
export const useLuxuryRentals = () =>
  useQuery({
    queryKey: ['rent', 'luxury'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'rent')
          .order('monthly_rent', { ascending: false, nullsFirst: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// 5. Furnished Homes
export const useFurnishedRentals = () =>
  useQuery({
    queryKey: ['rent', 'furnished'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'rent')
          .contains('amenities', ['Furnished'])
          .order('views_count', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// 6. Near You — by county
export const useRentalsNearYou = (county: string | null) =>
  useQuery({
    queryKey: ['rent', 'nearby', county],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'rent')
          .ilike('state', `%${county}%`)
          .order('views_count', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(8)
      ),
    enabled: !!county,
    staleTime: STALE_TIME,
  });

// 7. Newly Listed for Rent
export const useNewlyListedForRent = () =>
  useQuery({
    queryKey: ['rent', 'newly-listed'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'rent')
          .order('created_at', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });
