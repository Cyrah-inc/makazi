import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroCarousel from '@/components/HeroCarousel';
import HeroSearch, { HeroFilters } from '@/components/HeroSearch';
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
import { TrendingUp, MapPin, Palmtree, TreePine, Building2, Home, Sparkles } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const geo = useGeolocation();

  // Track which below-fold sections are visible
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

  // Hero carousel
  const heroProperties = useHeroProperties();

  // Above-fold: fetch immediately
  const newlyListed = useNewlyListed();
  const trending = useTrendingProperties();

  // Below-fold: fetch only when section is near viewport
  const nearby = useNearbyProperties(nearbyCounty, visibleSections.nearby);
  const exotic = useExoticGetaways(visibleSections.exotic);
  const land = useLandListings(visibleSections.land);
  const urban = useUrbanApartments(visibleSections.urban);
  const family = useFamilyHomes(visibleSections.family);

  const handleSearch = useCallback((filters: HeroFilters) => {
    const params = new URLSearchParams();
    if (filters.search) params.set('q', filters.search);
    if (filters.county && filters.county !== 'all') params.set('county', filters.county);
    if (filters.propertyType && filters.propertyType !== 'all') params.set('type', filters.propertyType);
    params.set('purpose', filters.purpose);
    navigate(`/${filters.purpose}?${params.toString()}`);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Carousel */}
        <HeroCarousel
          properties={heroProperties.data ?? []}
          isLoading={heroProperties.isLoading}
        />

        {/* Compact Search Bar */}
        <section className="bg-card border-b border-border shadow-sm">
          <div className="container py-4">
            <HeroSearch />
          </div>
        </section>

        {/* Category Carousels */}
        <div className="bg-muted/30">
          {/* Above-fold: render immediately */}
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

          {/* Below-fold: lazy-render + deferred fetch */}
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

        {/* Popular Locations */}
        <LazySection>
          <LocationsSection />
        </LazySection>

        {/* Why Choose Us */}
        <LazySection>
          <FeaturesSection />
        </LazySection>

        {/* CTA Section */}
        <LazySection>
          <CTASection />
        </LazySection>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
