import { useMemo } from 'react';
import PropertyListingPage from './PropertyListingPage';
import PropertyCarousel from '@/components/PropertyCarousel';
import {
  useTrendingRentals,
  useApartmentsForRent,
  useHousesForRent,
  useLuxuryRentals,
  useFurnishedRentals,
  useRentalsNearYou,
  useNewlyListedForRent,
} from '@/hooks/useRentSections';
import { useGeolocation } from '@/hooks/useGeolocation';
import { detectCounty } from '@/hooks/useHomeSections';
import { TrendingUp, Building, Home, Gem, Sofa, Navigation, Key, Sparkles } from 'lucide-react';

const RentPage = () => {
  const geo = useGeolocation();
  const county = useMemo(
    () => (geo.latitude && geo.longitude ? detectCounty(geo.latitude, geo.longitude) : null),
    [geo.latitude, geo.longitude]
  );

  const trending = useTrendingRentals();
  const apartments = useApartmentsForRent();
  const houses = useHousesForRent();
  const luxury = useLuxuryRentals();
  const furnished = useFurnishedRentals();
  const nearby = useRentalsNearYou(county);
  const newlyListed = useNewlyListedForRent();

  const sections = (
    <>
      <PropertyCarousel title="Just Added for Rent" subtitle="Freshly listed rental properties" properties={newlyListed.data ?? []} isLoading={newlyListed.isLoading} seeAllLink="/rent?category=new" icon={<Sparkles className="h-5 w-5 text-primary" />} />
      <PropertyCarousel title="Trending Rentals" subtitle="Most viewed rental properties right now" properties={trending.data ?? []} isLoading={trending.isLoading} seeAllLink="/rent?category=trending" icon={<TrendingUp className="h-5 w-5 text-primary" />} />
      <PropertyCarousel title="Apartments for Rent" subtitle="City apartments in Nairobi, Mombasa & Kisumu" properties={apartments.data ?? []} isLoading={apartments.isLoading} seeAllLink="/rent?type=apartment" icon={<Building className="h-5 w-5 text-primary" />} />
      <PropertyCarousel title="Houses for Rent" subtitle="Spacious houses, villas & bungalows" properties={houses.data ?? []} isLoading={houses.isLoading} seeAllLink="/rent?type=house" icon={<Home className="h-5 w-5 text-primary" />} />
      <PropertyCarousel title="Luxury Rentals" subtitle="Premium high-end properties" properties={luxury.data ?? []} isLoading={luxury.isLoading} seeAllLink="/rent?category=luxury" icon={<Gem className="h-5 w-5 text-primary" />} />
      <PropertyCarousel title="Furnished Homes" subtitle="Move-in ready with all amenities" properties={furnished.data ?? []} isLoading={furnished.isLoading} seeAllLink="/rent?category=furnished" icon={<Sofa className="h-5 w-5 text-primary" />} />
      {county && (
        <PropertyCarousel title="Rentals Near You" subtitle={`Available in ${county} and surrounding areas`} properties={nearby.data ?? []} isLoading={nearby.isLoading} seeAllLink={`/rent?county=${county}`} icon={<Navigation className="h-5 w-5 text-primary" />} />
      )}
    </>
  );

  return (
    <PropertyListingPage
      purpose="rent"
      title="Properties for Rent"
      subtitle="Discover long-term rentals that match your lifestyle"
      heroIcon={<Key className="h-5 w-5" />}
      categorySections={sections}
    />
  );
};

export default RentPage;
