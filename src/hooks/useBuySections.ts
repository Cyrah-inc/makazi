import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LISTING_COLUMNS } from './useProperties';
import { fetchAndTransform, STALE_TIME } from './useHomeSections';

// 1. Trending for Sale — most viewed
export const useTrendingForSale = () =>
  useQuery({
    queryKey: ['buy', 'trending'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'sale')
          .order('views_count', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// 2. Houses for Sale — houses, villas, bungalows
const HOUSE_CATEGORIES = ['house', 'villa', 'bungalow'];

export const useHousesForSale = () =>
  useQuery({
    queryKey: ['buy', 'houses'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'sale')
          .in('property_category', HOUSE_CATEGORIES)
          .order('views_count', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// 3. Land & Plots
export const useLandForSale = () =>
  useQuery({
    queryKey: ['buy', 'land'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'sale')
          .eq('property_category', 'land')
          .order('created_at', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// 4. Commercial & Industrial
export const useCommercialForSale = () =>
  useQuery({
    queryKey: ['buy', 'commercial'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'sale')
          .eq('property_category', 'commercial')
          .order('views_count', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// 5. Apartments for Sale
export const useApartmentsForSale = () =>
  useQuery({
    queryKey: ['buy', 'apartments'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'sale')
          .eq('property_category', 'apartment')
          .order('views_count', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// 6. Townhouses & Maisonettes
const TOWNHOUSE_CATEGORIES = ['townhouse', 'maisonette'];

export const useTownhousesForSale = () =>
  useQuery({
    queryKey: ['buy', 'townhouses'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'sale')
          .in('property_category', TOWNHOUSE_CATEGORIES)
          .order('views_count', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });
