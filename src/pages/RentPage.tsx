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
} from '@/hooks/useRentSections';
import { detectCounty } from '@/hooks/useHomeSections';
import { useGeolocation } from '@/hooks/useGeolocation';
import { TrendingUp, Building, Home, Gem, Sofa, Navigation } from 'lucide-react';

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

  const sections = (
    <>
      <PropertyCarousel
        title="Trending Rentals"
        subtitle="Most viewed rental properties right now"
        properties={trending.data ?? []}
        isLoading={trending.isLoading}
        seeAllLink="/rent"
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
      />
      <PropertyCarousel
        title="Apartments for Rent"
        subtitle="City apartments in Nairobi, Mombasa & Kisumu"
        properties={apartments.data ?? []}
        isLoading={apartments.isLoading}
        seeAllLink="/rent?type=apartment"
        icon={<Building className="h-5 w-5 text-primary" />}
      />
      <PropertyCarousel
        title="Houses for Rent"
        subtitle="Spacious houses, villas & bungalows"
        properties={houses.data ?? []}
        isLoading={houses.isLoading}
        seeAllLink="/rent?type=house"
        icon={<Home className="h-5 w-5 text-primary" />}
      />
      <PropertyCarousel
        title="Luxury Rentals"
        subtitle="Premium high-end properties"
        properties={luxury.data ?? []}
        isLoading={luxury.isLoading}
        seeAllLink="/rent"
        icon={<Gem className="h-5 w-5 text-primary" />}
      />
      <PropertyCarousel
        title="Furnished Homes"
        subtitle="Move-in ready with all amenities"
        properties={furnished.data ?? []}
        isLoading={furnished.isLoading}
        seeAllLink="/rent"
        icon={<Sofa className="h-5 w-5 text-primary" />}
      />
      {county && (
        <PropertyCarousel
          title={`Rentals Near You`}
          subtitle={`Available in ${county} and surrounding areas`}
          properties={nearby.data ?? []}
          isLoading={nearby.isLoading}
          seeAllLink="/rent"
          icon={<Navigation className="h-5 w-5 text-primary" />}
        />
      )}
    </>
  );

  return (
    <PropertyListingPage
      purpose="rent"
      title="Properties for Rent"
      subtitle="Discover long-term rentals that match your lifestyle"
      categorySections={sections}
    />
  );
};

export default RentPage;
