import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LISTING_COLUMNS, fetchLandlordProfiles, transformProperty } from './useProperties';
import { Property } from '@/types/property';

const STORAGE_KEY = 'makazi_recently_viewed';
const MAX_ITEMS = 12;

export const addRecentlyViewed = (propertyId: string) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[];
    const filtered = stored.filter(id => id !== propertyId);
    filtered.unshift(propertyId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch { /* ignore */ }
};

export const getRecentlyViewedIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[];
  } catch {
    return [];
  }
};

export const useRecentlyViewed = (excludeId?: string) => {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const all = getRecentlyViewedIds();
    setIds(excludeId ? all.filter(id => id !== excludeId) : all);
  }, [excludeId]);

  return useQuery<Property[]>({
    queryKey: ['recently-viewed', ids],
    queryFn: async () => {
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from('properties')
        .select(LISTING_COLUMNS)
        .in('id', ids)
        .eq('status', 'approved');

      if (error || !data) return [];

      const profileMap = await fetchLandlordProfiles(data.map(p => p.landlord_id));
      const transformed = data.map(p => transformProperty(p, profileMap));

      // Preserve localStorage order
      const byId = new Map(transformed.map(p => [p.id, p]));
      return ids.map(id => byId.get(id)).filter(Boolean) as Property[];
    },
    enabled: ids.length > 0,
    staleTime: 2 * 60 * 1000,
  });
};
