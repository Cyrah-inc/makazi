import PropertyListingPage from './PropertyListingPage';
import PropertyCarousel from '@/components/PropertyCarousel';
import {
  useTrendingForSale,
  useHousesForSale,
  useLandForSale,
  useCommercialForSale,
  useApartmentsForSale,
  useTownhousesForSale,
} from '@/hooks/useBuySections';
import { TrendingUp, Home, MapPin, Building2, Building, Castle, ShoppingCart } from 'lucide-react';

const BuyPage = () => {
  const trending = useTrendingForSale();
  const houses = useHousesForSale();
  const land = useLandForSale();
  const commercial = useCommercialForSale();
  const apartments = useApartmentsForSale();
  const townhouses = useTownhousesForSale();

  const sections = (
    <>
      <PropertyCarousel title="Trending for Sale" subtitle="Most popular properties on the market" properties={trending.data ?? []} isLoading={trending.isLoading} seeAllLink="/buy" icon={<TrendingUp className="h-5 w-5 text-primary" />} />
      <PropertyCarousel title="Houses for Sale" subtitle="Houses, villas & bungalows" properties={houses.data ?? []} isLoading={houses.isLoading} seeAllLink="/buy?type=house" icon={<Home className="h-5 w-5 text-primary" />} />
      <PropertyCarousel title="Land & Plots" subtitle="Investment opportunities across Kenya" properties={land.data ?? []} isLoading={land.isLoading} seeAllLink="/buy?type=land" icon={<MapPin className="h-5 w-5 text-primary" />} />
      <PropertyCarousel title="Commercial & Industrial" subtitle="Business premises & commercial spaces" properties={commercial.data ?? []} isLoading={commercial.isLoading} seeAllLink="/buy?type=commercial" icon={<Building2 className="h-5 w-5 text-primary" />} />
      <PropertyCarousel title="Apartments for Sale" subtitle="Modern apartments in prime locations" properties={apartments.data ?? []} isLoading={apartments.isLoading} seeAllLink="/buy?type=apartment" icon={<Building className="h-5 w-5 text-primary" />} />
      <PropertyCarousel title="Townhouses & Maisonettes" subtitle="Spacious multi-level living" properties={townhouses.data ?? []} isLoading={townhouses.isLoading} seeAllLink="/buy?type=townhouse" icon={<Castle className="h-5 w-5 text-primary" />} />
    </>
  );

  return (
    <PropertyListingPage
      purpose="buy"
      title="Properties for Sale"
      subtitle="Find your dream home or investment property in Kenya"
      heroIcon={<ShoppingCart className="h-5 w-5" />}
      categorySections={sections}
    />
  );
};

export default BuyPage;
