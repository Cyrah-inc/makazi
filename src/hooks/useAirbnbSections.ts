import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LISTING_COLUMNS } from './useProperties';
import { fetchAndTransform, STALE_TIME } from './useHomeSections';

// 1. Trending Staycations
export const useTrendingStaycations = () =>
  useQuery({
    queryKey: ['airbnb', 'trending'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'airbnb')
          .order('views_count', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// 2. Airbnb Near Me — by county
export const useAirbnbNearMe = (county: string | null) =>
  useQuery({
    queryKey: ['airbnb', 'nearby', county],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'airbnb')
          .ilike('state', `%${county}%`)
          .order('views_count', { ascending: false })
          .limit(8)
      ),
    enabled: !!county,
    staleTime: STALE_TIME,
  });

// 3. Luxury Stays — highest priced
export const useLuxuryStays = () =>
  useQuery({
    queryKey: ['airbnb', 'luxury'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'airbnb')
          .order('nightly_rate', { ascending: false, nullsFirst: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// 4. Exotic Getaways — scenic inland counties
const EXOTIC_COUNTIES = ['Narok', 'Nakuru', 'Laikipia', 'Samburu', 'Nyandarua'];

export const useExoticStays = () =>
  useQuery({
    queryKey: ['airbnb', 'exotic'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'airbnb')
          .in('state', EXOTIC_COUNTIES)
          .order('views_count', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// 5. Beach Vibes — coastal counties
const COASTAL_COUNTIES = ['Kwale', 'Kilifi', 'Mombasa', 'Lamu'];

export const useBeachVibes = () =>
  useQuery({
    queryKey: ['airbnb', 'beach'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'airbnb')
          .in('state', COASTAL_COUNTIES)
          .order('views_count', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// 6. Safari & Wildlife
const SAFARI_COUNTIES = ['Narok', 'Laikipia', 'Nakuru', 'Samburu'];

export const useSafariStays = () =>
  useQuery({
    queryKey: ['airbnb', 'safari'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'airbnb')
          .in('state', SAFARI_COUNTIES)
          .order('views_count', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });
