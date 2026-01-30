import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertyPurpose } from '@/types/property';
import { Tables } from '@/integrations/supabase/types';

type DbProperty = Tables<'properties'>;
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

// Transform database property to frontend Property type
const transformProperty = async (dbProperty: DbProperty): Promise<Property> => {
  // Fetch landlord profile
  let landlordName = 'Unknown';
  let landlordAvatar: string | undefined;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('user_id', dbProperty.landlord_id)
    .single();
  
  if (profile) {
    landlordName = profile.full_name || 'Unknown';
    landlordAvatar = profile.avatar_url || undefined;
  }

  const purpose = mapPropertyTypeToPurpose(dbProperty.property_type);
  
  return {
    id: dbProperty.id,
    title: dbProperty.title,
    description: dbProperty.description || '',
    purposes: [purpose],
    propertyType: 'apartment', // Default since DB doesn't have detailed property types
    salePrice: purpose === 'buy' ? dbProperty.price : undefined,
    monthlyRent: purpose === 'rent' ? dbProperty.price : undefined,
    nightlyRate: purpose === 'airbnb' ? dbProperty.price : undefined,
    county: dbProperty.state || dbProperty.country,
    town: dbProperty.city,
    address: dbProperty.address,
    latitude: dbProperty.latitude ? Number(dbProperty.latitude) : undefined,
    longitude: dbProperty.longitude ? Number(dbProperty.longitude) : undefined,
    bedrooms: dbProperty.bedrooms,
    bathrooms: dbProperty.bathrooms,
    parkingSpaces: 0, // Not in DB
    size: dbProperty.area_sqft || 0,
    yearBuilt: undefined, // Not in DB
    furnished: false, // Not in DB
    images: dbProperty.images || [],
    videoUrl: undefined,
    amenities: dbProperty.amenities || [],
    featured: false, // Could add featured column later
    verified: dbProperty.status === 'approved',
    views: dbProperty.views_count,
    createdAt: dbProperty.created_at,
    updatedAt: dbProperty.updated_at,
    landlordId: dbProperty.landlord_id,
    landlordName,
    landlordAvatar,
  };
};

export const useProperties = (purpose?: PropertyPurpose) => {
  return useQuery({
    queryKey: ['properties', purpose],
    queryFn: async (): Promise<Property[]> => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      
      // Filter by property type if purpose is specified
      if (purpose) {
        const dbPropertyType = mapPurposeToPropertyType(purpose);
        query = query.eq('property_type', dbPropertyType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Transform all properties
      const transformedProperties = await Promise.all(
        data.map(transformProperty)
      );
      
      return transformedProperties;
    },
  });
};

export const useFeaturedProperties = () => {
  return useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .order('views_count', { ascending: false })
        .limit(8);
      
      if (error) {
        console.error('Error fetching featured properties:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      const transformedProperties = await Promise.all(
        data.map(transformProperty)
      );
      
      return transformedProperties;
    },
  });
};
