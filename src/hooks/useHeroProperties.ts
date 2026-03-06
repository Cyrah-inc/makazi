import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/property';
import { LISTING_COLUMNS, fetchLandlordProfiles, transformProperty, DbProperty } from './useProperties';
import { STALE_TIME } from './useHomeSections';

export interface HeroProperty extends Property {
  heroCategory: 'buy' | 'rent' | 'airbnb';
}

const fetchTop2 = async (
  propertyType: 'sale' | 'rent' | 'airbnb',
  heroCategory: HeroProperty['heroCategory']
): Promise<HeroProperty[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select(LISTING_COLUMNS)
    .eq('status', 'approved')
    .eq('property_type', propertyType)
    .order('views_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(2);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const profileMap = await fetchLandlordProfiles(
    (data as DbProperty[]).map((p) => p.landlord_id)
  );

  return (data as DbProperty[]).map((p) => ({
    ...transformProperty(p, profileMap),
    heroCategory,
  }));
};

export const useHeroProperties = () =>
  useQuery<HeroProperty[]>({
    queryKey: ['home', 'hero-carousel'],
    queryFn: async () => {
      const [buy, rent, airbnb] = await Promise.all([
        fetchTop2('sale', 'buy'),
        fetchTop2('rent', 'rent'),
        fetchTop2('airbnb', 'airbnb'),
      ]);
      return [...buy, ...rent, ...airbnb];
    },
    staleTime: STALE_TIME,
  });
