import { useMemo } from 'react';
import PropertyListingPage from './PropertyListingPage';
import PropertyCarousel from '@/components/PropertyCarousel';
import {
  useTrendingStaycations,
  useAirbnbNearMe,
  useLuxuryStays,
  useExoticStays,
  useBeachVibes,
  useSafariStays,
  useBudgetStays,
  useMountainRetreats,
  useCityBreaks,
} from '@/hooks/useAirbnbSections';
import { useProperties } from '@/hooks/useProperties';
import { detectCounty } from '@/hooks/useHomeSections';
import { useGeolocation } from '@/hooks/useGeolocation';
import { formatPrice } from '@/lib/formatters';
import { TrendingUp, Navigation, Gem, Mountain, Waves, Binoculars, Palmtree, Coins, MountainSnow, Building } from 'lucide-react';

const AirbnbPage = () => {
  const geo = useGeolocation();
  const county = useMemo(
    () => (geo.latitude && geo.longitude ? detectCounty(geo.latitude, geo.longitude) : null),
    [geo.latitude, geo.longitude]
  );

  const trending = useTrendingStaycations();
  const nearby = useAirbnbNearMe(county);
  const luxury = useLuxuryStays();
  const exotic = useExoticStays();
  const beach = useBeachVibes();
  const safari = useSafariStays();
  const budget = useBudgetStays();
  const mountain = useMountainRetreats();
  const cityBreaks = useCityBreaks();
  const { data: properties = [] } = useProperties('airbnb', false);

  const stats = useMemo(() => {
    const avgRate = properties.length > 0
      ? properties.reduce((sum, p) => sum + (p.nightlyRate || 0), 0) / properties.length
      : 0;
    return [
      { label: 'Stays', value: properties.length.toLocaleString() },
      { label: 'From', value: avgRate > 0 ? formatPrice(Math.min(...properties.map(p => p.nightlyRate || Infinity))) + '/night' : '—' },
      { label: 'Locations', value: new Set(properties.map(p => p.county)).size.toString() },
    ];
  }, [properties]);

  const sections = (
    <>
      <PropertyCarousel
        title="Trending Staycations"
        subtitle="Popular short-term stays everyone loves"
        properties={trending.data ?? []}
        isLoading={trending.isLoading}
        seeAllLink="/airbnb"
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
      />
      {county && (
        <PropertyCarousel
          title="Airbnb Near Me"
          subtitle={`Stays in ${county} and nearby`}
          properties={nearby.data ?? []}
          isLoading={nearby.isLoading}
          seeAllLink="/airbnb"
          icon={<Navigation className="h-5 w-5 text-primary" />}
        />
      )}
      <PropertyCarousel
        title="Luxury Stays"
        subtitle="Premium escapes for a lavish getaway"
        properties={luxury.data ?? []}
        isLoading={luxury.isLoading}
        seeAllLink="/airbnb"
        icon={<Gem className="h-5 w-5 text-primary" />}
      />
      <PropertyCarousel
        title="Budget-Friendly Stays"
        subtitle="Great value getaways that won't break the bank"
        properties={budget.data ?? []}
        isLoading={budget.isLoading}
        seeAllLink="/airbnb"
        icon={<Coins className="h-5 w-5 text-primary" />}
      />
      <PropertyCarousel
        title="Exotic Getaways"
        subtitle="Maasai Mara, Naivasha, Laikipia & more"
        properties={exotic.data ?? []}
        isLoading={exotic.isLoading}
        seeAllLink="/airbnb"
        icon={<Mountain className="h-5 w-5 text-primary" />}
      />
      <PropertyCarousel
        title="Mountain Retreats"
        subtitle="Highland escapes in Nyeri, Meru & the Rift Valley"
        properties={mountain.data ?? []}
        isLoading={mountain.isLoading}
        seeAllLink="/airbnb"
        icon={<MountainSnow className="h-5 w-5 text-primary" />}
      />
      <PropertyCarousel
        title="Beach Vibes"
        subtitle="Coastal escapes in Diani, Watamu, Lamu & Mombasa"
        properties={beach.data ?? []}
        isLoading={beach.isLoading}
        seeAllLink="/airbnb"
        icon={<Waves className="h-5 w-5 text-primary" />}
      />
      <PropertyCarousel
        title="Safari & Wildlife"
        subtitle="Stay close to Kenya's iconic game reserves"
        properties={safari.data ?? []}
        isLoading={safari.isLoading}
        seeAllLink="/airbnb"
        icon={<Binoculars className="h-5 w-5 text-primary" />}
      />
      <PropertyCarousel
        title="City Breaks"
        subtitle="Urban adventures in Nairobi, Mombasa, Kisumu & Nakuru"
        properties={cityBreaks.data ?? []}
        isLoading={cityBreaks.isLoading}
        seeAllLink="/airbnb"
        icon={<Building className="h-5 w-5 text-primary" />}
      />
    </>
  );

  return (
    <PropertyListingPage
      purpose="airbnb"
      title="Short-term Stays"
      subtitle="Book unique vacation rentals and experiences across Kenya"
      heroIcon={<Palmtree className="h-5 w-5" />}
      heroStats={stats}
      categorySections={sections}
    />
  );
};

export default AirbnbPage;
