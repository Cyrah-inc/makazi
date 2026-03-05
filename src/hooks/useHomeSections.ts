import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/property';
import {
  LISTING_COLUMNS,
  fetchLandlordProfiles,
  transformProperty,
  DbProperty,
} from './useProperties';

export const STALE_TIME = 5 * 60 * 1000; // 5 min

// Helper: run a query and transform results
export const fetchAndTransform = async (
  queryBuilder: PromiseLike<{ data: any; error: any }>
): Promise<Property[]> => {
  const { data, error } = await queryBuilder;
  if (error) throw error;
  if (!data || data.length === 0) return [];
  const profileMap = await fetchLandlordProfiles(
    (data as DbProperty[]).map((p) => p.landlord_id)
  );
  return (data as DbProperty[]).map((p) => transformProperty(p, profileMap));
};

// 1. Trending — most viewed
export const useTrendingProperties = () =>
  useQuery({
    queryKey: ['home', 'trending'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .order('views_count', { ascending: false })
          .order('created_at', { ascending: false })
      ),
    staleTime: STALE_TIME,
  });

// 2. Near you — by county
export const useNearbyProperties = (county: string | null) =>
  useQuery({
    queryKey: ['home', 'nearby', county],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .ilike('state', `%${county}%`)
          .order('views_count', { ascending: false })
          .order('created_at', { ascending: false })
      ),
    enabled: !!county,
    staleTime: STALE_TIME,
  });

// 3. Exotic getaways — airbnb in scenic counties
const EXOTIC_COUNTIES = ['Kwale', 'Kilifi', 'Narok', 'Nakuru', 'Laikipia', 'Lamu'];

export const useExoticGetaways = () =>
  useQuery({
    queryKey: ['home', 'exotic'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'airbnb')
          .in('state', EXOTIC_COUNTIES)
          .order('views_count', { ascending: false })
          .order('created_at', { ascending: false })
      ),
    staleTime: STALE_TIME,
  });

// 4. Prime Land
export const useLandListings = () =>
  useQuery({
    queryKey: ['home', 'land'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_category', 'land')
          .order('created_at', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// 5. Urban Apartments
const URBAN_COUNTIES = ['Nairobi', 'Mombasa', 'Kisumu'];

export const useUrbanApartments = () =>
  useQuery({
    queryKey: ['home', 'urban'],
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

// 6. Family Homes for Sale
const FAMILY_CATEGORIES = ['house', 'villa', 'bungalow', 'maisonette'];

export const useFamilyHomes = () =>
  useQuery({
    queryKey: ['home', 'family'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .eq('property_type', 'sale')
          .in('property_category', FAMILY_CATEGORIES)
          .order('views_count', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// 7. Newly Listed — latest approved properties
export const useNewlyListed = () =>
  useQuery({
    queryKey: ['home', 'newly-listed'],
    queryFn: () =>
      fetchAndTransform(
        supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(8)
      ),
    staleTime: STALE_TIME,
  });

// --- County detection from coordinates ---
interface CountyCenter {
  name: string;
  lat: number;
  lng: number;
}

const COUNTY_CENTERS: CountyCenter[] = [
  { name: 'Nairobi', lat: -1.2864, lng: 36.8172 },
  { name: 'Mombasa', lat: -4.0435, lng: 39.6682 },
  { name: 'Kiambu', lat: -1.1714, lng: 36.8356 },
  { name: 'Nakuru', lat: -0.3031, lng: 36.0800 },
  { name: 'Kisumu', lat: -0.1022, lng: 34.7617 },
  { name: 'Kajiado', lat: -2.0981, lng: 36.7820 },
  { name: 'Machakos', lat: -1.5177, lng: 37.2634 },
  { name: 'Uasin Gishu', lat: 0.5143, lng: 35.2698 },
  { name: 'Kilifi', lat: -3.5107, lng: 39.9093 },
  { name: 'Kwale', lat: -4.1816, lng: 39.4525 },
  { name: 'Narok', lat: -1.0804, lng: 35.8601 },
  { name: 'Laikipia', lat: 0.3606, lng: 36.7819 },
  { name: 'Nyeri', lat: -0.4197, lng: 36.9511 },
  { name: 'Murang\'a', lat: -0.7839, lng: 37.0400 },
  { name: 'Nyandarua', lat: -0.1804, lng: 36.3689 },
  { name: 'Lamu', lat: -2.2717, lng: 40.9020 },
];

export const detectCounty = (lat: number, lng: number): string => {
  let closest = COUNTY_CENTERS[0];
  let minDist = Infinity;
  for (const c of COUNTY_CENTERS) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < minDist) {
      minDist = d;
      closest = c;
    }
  }
  return closest.name;
};
