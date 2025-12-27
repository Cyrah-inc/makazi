export type PropertyPurpose = 'buy' | 'rent' | 'airbnb';
export type PropertyType = 'apartment' | 'house' | 'maisonette' | 'bungalow' | 'villa' | 'land' | 'commercial' | 'townhouse';

export interface Property {
  id: string;
  title: string;
  description: string;
  purposes: PropertyPurpose[];
  propertyType: PropertyType;
  
  // Pricing
  salePrice?: number;
  monthlyRent?: number;
  nightlyRate?: number;
  
  // Location
  county: string;
  town: string;
  address: string;
  latitude?: number;
  longitude?: number;
  
  // Details
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  size: number; // in sqm
  yearBuilt?: number;
  furnished: boolean;
  
  // Media
  images: string[];
  videoUrl?: string;
  
  // Amenities
  amenities: string[];
  
  // Meta
  featured: boolean;
  verified: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  landlordId: string;
  landlordName: string;
  landlordAvatar?: string;
}

export interface PropertyFilter {
  search?: string;
  purpose?: PropertyPurpose;
  county?: string;
  town?: string;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  amenities?: string[];
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'popular';
}

export const KENYA_COUNTIES = [
  'Nairobi',
  'Mombasa',
  'Kiambu',
  'Nakuru',
  'Kisumu',
  'Uasin Gishu',
  'Machakos',
  'Kajiado',
  'Kilifi',
  'Nyeri',
  'Murang\'a',
  'Kwale',
  'Laikipia',
  'Narok',
  'Nyandarua',
] as const;

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'maisonette', label: 'Maisonette' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'villa', label: 'Villa' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
];

export const AMENITIES = [
  'Wi-Fi',
  'Swimming Pool',
  'Gym',
  'Security',
  'Parking',
  'Garden',
  'Balcony',
  'Elevator',
  'CCTV',
  'Borehole',
  'Generator',
  'Solar Power',
  'Air Conditioning',
  'Furnished',
  'Pet Friendly',
  'Servant Quarters',
] as const;
