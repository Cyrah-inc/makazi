import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LISTING_COLUMNS, fetchLandlordProfiles, transformProperty } from '@/hooks/useProperties';
import PropertyCarousel from './PropertyCarousel';
import { Sparkles } from 'lucide-react';

interface SimilarPropertiesProps {
  propertyId: string;
  propertyType: string;
  state: string | null;
}

const SimilarProperties = ({ propertyId, propertyType, state }: SimilarPropertiesProps) => {
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['similar-properties', propertyId],
    queryFn: async () => {
      // First try: same type + same county
      let { data } = await supabase
        .from('properties')
        .select(LISTING_COLUMNS)
        .eq('status', 'approved')
        .eq('property_type', propertyType as 'sale' | 'rent' | 'airbnb')
        .neq('id', propertyId)
        .order('views_count', { ascending: false })
        .limit(6);

      // Filter by state client-side if available (to allow fallback)
      let results = data || [];
      if (state && results.length > 0) {
        const sameState = results.filter(p => p.state === state);
        if (sameState.length >= 3) {
          results = sameState.slice(0, 6);
        }
      }

      // Fallback: broaden to any type if too few
      if (results.length < 3) {
        const { data: broader } = await supabase
          .from('properties')
          .select(LISTING_COLUMNS)
          .eq('status', 'approved')
          .neq('id', propertyId)
          .order('views_count', { ascending: false })
          .limit(6);
        if (broader && broader.length > results.length) {
          results = broader;
        }
      }

      if (results.length === 0) return [];

      const profileMap = await fetchLandlordProfiles(results.map(p => p.landlord_id));
      return results.map(p => transformProperty(p, profileMap));
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PropertyCarousel
      properties={properties}
      title="Similar Properties"
      subtitle="You might also like these"
      isLoading={isLoading}
      icon={<Sparkles className="h-5 w-5 text-primary" />}
    />
  );
};

export default SimilarProperties;
