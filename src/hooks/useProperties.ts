import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertyPurpose, PropertyType } from '@/types/property';
import { Tables } from '@/integrations/supabase/types';

type DbProperty = Tables<'properties'> & {
  sale_price?: number | null;
  monthly_rent?: number | null;
  nightly_rate?: number | null;
  property_category?: string | null;
};

type DbPropertyType = 'sale' | 'rent' | 'airbnb';

// Map database property_type to frontend purposes
const mapPropertyTypeToPurpose = (propertyType: DbPropertyType): PropertyPurpose => {
  if (propertyType === 'sale') return 'buy';
  return propertyType as PropertyPurpose;
};

// Map frontend purpose to database property_type
export const mapPurposeToPropertyType = (purpose: PropertyPurpose): DbPropertyType => {
  if (purpose === 'buy') return 'sale';
  return purpose as DbPropertyType;
};

// Map database property_category to frontend PropertyType
const mapPropertyCategory = (category: string | null | undefined): PropertyType => {
  const validTypes: PropertyType[] = ['apartment', 'house', 'maisonette', 'bungalow', 'villa', 'land', 'commercial', 'townhouse'];
  if (category && validTypes.includes(category as PropertyType)) {
    return category as PropertyType;
  }
  return 'apartment';
};

// Determine purposes based on available pricing
const determinePurposes = (dbProperty: DbProperty): PropertyPurpose[] => {
  const purposes: PropertyPurpose[] = [];
  
  if (dbProperty.sale_price || dbProperty.property_type === 'sale') {
    purposes.push('buy');
  }
  if (dbProperty.monthly_rent || dbProperty.property_type === 'rent') {
    purposes.push('rent');
  }
  if (dbProperty.nightly_rate || dbProperty.property_type === 'airbnb') {
    purposes.push('airbnb');
  }
  
  if (purposes.length === 0) {
    purposes.push(mapPropertyTypeToPurpose(dbProperty.property_type));
  }
  
  return purposes;
};

interface ProfileMap {
  [userId: string]: { full_name: string | null; avatar_url: string | null };
}

// Batch-fetch all landlord profiles in a single query (fixes N+1)
const fetchLandlordProfiles = async (landlordIds: string[]): Promise<ProfileMap> => {
  if (landlordIds.length === 0) return {};

  const uniqueIds = [...new Set(landlordIds)];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, full_name, avatar_url')
    .in('user_id', uniqueIds);

  const map: ProfileMap = {};
  profiles?.forEach((p) => {
    map[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
  });
  return map;
};

// Transform database property to frontend Property type (sync, no DB calls)
const transformProperty = (
  dbProperty: DbProperty,
  profileMap: ProfileMap
): Property => {
  const profile = profileMap[dbProperty.landlord_id];
  const landlordName = profile?.full_name || 'Unknown';
  const landlordAvatar = profile?.avatar_url || undefined;

  const purposes = determinePurposes(dbProperty);
  
  const salePrice = dbProperty.sale_price || (dbProperty.property_type === 'sale' ? dbProperty.price : undefined);
  const monthlyRent = dbProperty.monthly_rent || (dbProperty.property_type === 'rent' ? dbProperty.price : undefined);
  const nightlyRate = dbProperty.nightly_rate || (dbProperty.property_type === 'airbnb' ? dbProperty.price : undefined);
  
  return {
    id: dbProperty.id,
    title: dbProperty.title,
    description: dbProperty.description || '',
    purposes,
    propertyType: mapPropertyCategory(dbProperty.property_category),
    salePrice: salePrice ? Number(salePrice) : undefined,
    monthlyRent: monthlyRent ? Number(monthlyRent) : undefined,
    nightlyRate: nightlyRate ? Number(nightlyRate) : undefined,
    county: dbProperty.state || dbProperty.country,
    town: dbProperty.city,
    address: dbProperty.address,
    latitude: dbProperty.latitude ? Number(dbProperty.latitude) : undefined,
    longitude: dbProperty.longitude ? Number(dbProperty.longitude) : undefined,
    bedrooms: dbProperty.bedrooms,
    bathrooms: dbProperty.bathrooms,
    parkingSpaces: 0,
    size: dbProperty.area_sqft || 0,
    yearBuilt: undefined,
    furnished: false,
    images: dbProperty.images || [],
    videoUrl: undefined,
    amenities: dbProperty.amenities || [],
    featured: false,
    verified: dbProperty.status === 'approved',
    views: dbProperty.views_count,
    createdAt: dbProperty.created_at,
    updatedAt: dbProperty.updated_at,
    landlordId: dbProperty.landlord_id,
    landlordName,
    landlordAvatar,
  };
};

export const useProperties = (purpose?: PropertyPurpose, requireLocation: boolean = false) => {
  return useQuery({
    queryKey: ['properties', purpose, requireLocation],
    queryFn: async (): Promise<Property[]> => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      
      if (purpose) {
        const dbPropertyType = mapPurposeToPropertyType(purpose);
        query = query.eq('property_type', dbPropertyType);
      }

      if (requireLocation) {
        query = query.not('latitude', 'is', null).not('longitude', 'is', null);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Batch-fetch all landlord profiles in ONE query (was N+1)
      const profileMap = await fetchLandlordProfiles(data.map((p) => p.landlord_id));
      
      return data.map((dbProperty) => transformProperty(dbProperty, profileMap));
    },
  });
};

export const useFeaturedProperties = (requireLocation: boolean = false) => {
  return useQuery({
    queryKey: ['properties', 'featured', requireLocation],
    queryFn: async (): Promise<Property[]> => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .order('views_count', { ascending: false })
        .limit(8);

      if (requireLocation) {
        query = query.not('latitude', 'is', null).not('longitude', 'is', null);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching featured properties:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      const profileMap = await fetchLandlordProfiles(data.map((p) => p.landlord_id));
      
      return data.map((dbProperty) => transformProperty(dbProperty, profileMap));
    },
  });
};
