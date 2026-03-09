import { useEffect, useMemo, useCallback, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroCarousel from '@/components/HeroCarousel';
import PropertyCarousel from '@/components/PropertyCarousel';
import { LazySection } from '@/components/LazySection';
import LocationsSection from '@/components/LocationsSection';
import FeaturesSection from '@/components/FeaturesSection';
import CTASection from '@/components/CTASection';
import {
  useTrendingProperties,
  useNearbyProperties,
  useExoticGetaways,
  useLandListings,
  useUrbanApartments,
  useFamilyHomes,
  useNewlyListed,
  detectCounty,
} from '@/hooks/useHomeSections';
import { useHeroProperties } from '@/hooks/useHeroProperties';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { TrendingUp, MapPin, Palmtree, TreePine, Building2, Home, Sparkles, Clock } from 'lucide-react';

const Index = () => {
  const geo = useGeolocation();

  const [visibleSections, setVisibleSections] = useState({
    nearby: false,
    exotic: false,
    land: false,
    urban: false,
    family: false,
  });

  const onSectionVisible = useCallback((key: keyof typeof visibleSections) => {
    setVisibleSections(prev => prev[key] ? prev : { ...prev, [key]: true });
  }, []);

  useEffect(() => {
    geo.requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectedCounty = useMemo(
    () => (geo.latitude && geo.longitude ? detectCounty(geo.latitude, geo.longitude) : null),
    [geo.latitude, geo.longitude]
  );

  const nearbyCounty = detectedCounty || 'Nairobi';

  const heroProperties = useHeroProperties();
  const recentlyViewed = useRecentlyViewed();
  const newlyListed = useNewlyListed();
  const trending = useTrendingProperties();

  const nearby = useNearbyProperties(nearbyCounty, visibleSections.nearby);
  const exotic = useExoticGetaways(visibleSections.exotic);
  const land = useLandListings(visibleSections.land);
  const urban = useUrbanApartments(visibleSections.urban);
  const family = useFamilyHomes(visibleSections.family);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Carousel */}
        <HeroCarousel
          properties={heroProperties.data ?? []}
          isLoading={heroProperties.isLoading}
        />

        {/* Category Carousels */}
        <div className="bg-muted/30">
          <PropertyCarousel
            title="Just Added"
            subtitle="Fresh listings you haven't seen yet"
            properties={newlyListed.data ?? []}
            isLoading={newlyListed.isLoading}
            seeAllLink="/buy"
            icon={<Sparkles className="h-6 w-6 text-primary" />}
          />

          <PropertyCarousel
            title="Trending Homes"
            subtitle="The most viewed properties right now"
            properties={trending.data ?? []}
            isLoading={trending.isLoading}
            seeAllLink="/buy"
            icon={<TrendingUp className="h-6 w-6 text-primary" />}
          />

          <LazySection onVisible={() => onSectionVisible('nearby')}>
            <PropertyCarousel
              title={detectedCounty ? `Near You in ${nearbyCounty}` : `Popular in ${nearbyCounty}`}
              subtitle={detectedCounty ? 'Properties close to your location' : 'Top listings in Nairobi'}
              properties={nearby.data ?? []}
              isLoading={nearby.isLoading}
              seeAllLink={`/buy?county=${nearbyCounty}`}
              icon={<MapPin className="h-6 w-6 text-primary" />}
            />
          </LazySection>

          <LazySection onVisible={() => onSectionVisible('exotic')}>
            <PropertyCarousel
              title="Exotic Getaways"
              subtitle="Airbnb stays in Kenya's most scenic destinations"
              properties={exotic.data ?? []}
              isLoading={exotic.isLoading}
              seeAllLink="/airbnb"
              icon={<Palmtree className="h-6 w-6 text-primary" />}
            />
          </LazySection>

          <LazySection onVisible={() => onSectionVisible('land')}>
            <PropertyCarousel
              title="Prime Land & Plots"
              subtitle="Investment opportunities across Kenya"
              properties={land.data ?? []}
              isLoading={land.isLoading}
              seeAllLink="/buy?type=land"
              icon={<TreePine className="h-6 w-6 text-primary" />}
            />
          </LazySection>

          <LazySection onVisible={() => onSectionVisible('urban')}>
            <PropertyCarousel
              title="Urban Apartments"
              subtitle="Apartments for rent in major cities"
              properties={urban.data ?? []}
              isLoading={urban.isLoading}
              seeAllLink="/rent?type=apartment"
              icon={<Building2 className="h-6 w-6 text-primary" />}
            />
          </LazySection>

          <LazySection onVisible={() => onSectionVisible('family')}>
            <PropertyCarousel
              title="Family Homes for Sale"
              subtitle="Houses, villas, and bungalows ready for your family"
              properties={family.data ?? []}
              isLoading={family.isLoading}
              seeAllLink="/buy?type=house"
              icon={<Home className="h-6 w-6 text-primary" />}
            />
          </LazySection>
        </div>

        <LazySection>
          <LocationsSection />
        </LazySection>

        <LazySection>
          <FeaturesSection />
        </LazySection>

        <LazySection>
          <CTASection />
        </LazySection>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
