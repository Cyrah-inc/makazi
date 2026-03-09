import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/property';
import { LISTING_COLUMNS, fetchLandlordProfiles, transformProperty, DbProperty } from './useProperties';
import { STALE_TIME } from './useHomeSections';

export interface HeroProperty extends Property {
  heroCategory: 'buy' | 'rent' | 'airbnb';
}

export const useHeroProperties = () =>
  useQuery<HeroProperty[]>({
    queryKey: ['home', 'hero-carousel'],
    queryFn: async () => {
      // Single query: fetch top 6 approved properties across all types
      const { data, error } = await supabase
        .from('properties')
        .select(LISTING_COLUMNS)
        .eq('status', 'approved')
        .order('views_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const typed = data as DbProperty[];

      // Pick top 2 per type from the result set
      const byType: Record<string, DbProperty[]> = { sale: [], rent: [], airbnb: [] };
      for (const p of typed) {
        if (byType[p.property_type]?.length < 2) {
          byType[p.property_type].push(p);
        }
      }

      const selected = [...byType.sale, ...byType.rent, ...byType.airbnb];
      if (selected.length === 0) return [];

      // Single profile fetch for all selected properties
      const profileMap = await fetchLandlordProfiles(selected.map(p => p.landlord_id));

      return selected.map(p => ({
        ...transformProperty(p, profileMap),
        heroCategory: (p.property_type === 'sale' ? 'buy' : p.property_type) as HeroProperty['heroCategory'],
      }));
    },
    staleTime: STALE_TIME,
  });
