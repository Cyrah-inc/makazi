import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSearch, { HeroFilters } from '@/components/HeroSearch';
import PropertyCarousel from '@/components/PropertyCarousel';
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
  detectCounty,
} from '@/hooks/useHomeSections';
import { useGeolocation } from '@/hooks/useGeolocation';
import { TrendingUp, MapPin, Palmtree, TreePine, Building2, Home } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const geo = useGeolocation();

  // Auto-request location on mount
  useEffect(() => {
    geo.requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectedCounty = useMemo(
    () => (geo.latitude && geo.longitude ? detectCounty(geo.latitude, geo.longitude) : null),
    [geo.latitude, geo.longitude]
  );

  const nearbyCounty = detectedCounty || 'Nairobi';

  // All section hooks — fire in parallel
  const trending = useTrendingProperties();
  const nearby = useNearbyProperties(nearbyCounty);
  const exotic = useExoticGetaways();
  const land = useLandListings();
  const urban = useUrbanApartments();
  const family = useFamilyHomes();

  const handleSearch = (filters: HeroFilters) => {
    const params = new URLSearchParams();
    if (filters.search) params.set('q', filters.search);
    if (filters.county && filters.county !== 'all') params.set('county', filters.county);
    if (filters.propertyType && filters.propertyType !== 'all') params.set('type', filters.propertyType);
    params.set('purpose', filters.purpose);
    navigate(`/${filters.purpose}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section — compact */}
        <section className="relative bg-primary overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary-foreground blur-3xl animate-float" />
            <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-primary-foreground blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-gold blur-3xl animate-pulse-soft" />
          </div>

          <div className="relative container py-16 md:py-24">
            <div className="text-center mb-8 space-y-3">
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground animate-fade-in-up">
                Find Your Dream Home
                <span className="block text-gold">in Kenya</span>
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto animate-fade-in-up delay-200">
                Discover thousands of verified properties for sale, rent, or short-term stays across Kenya.
              </p>
            </div>

            <div className="animate-fade-in-up delay-300">
              <HeroSearch onFiltersChange={handleSearch} />
            </div>
          </div>
        </section>

        {/* Category Carousels */}
        <div className="bg-muted/30">
          <PropertyCarousel
            title="Trending Homes"
            subtitle="The most viewed properties right now"
            properties={trending.data ?? []}
            isLoading={trending.isLoading}
            seeAllLink="/buy"
            icon={<TrendingUp className="h-6 w-6 text-primary" />}
          />

          <PropertyCarousel
            title={detectedCounty ? `Near You in ${nearbyCounty}` : `Popular in ${nearbyCounty}`}
            subtitle={detectedCounty ? 'Properties close to your location' : 'Top listings in Nairobi'}
            properties={nearby.data ?? []}
            isLoading={nearby.isLoading}
            seeAllLink={`/buy?county=${nearbyCounty}`}
            icon={<MapPin className="h-6 w-6 text-primary" />}
          />

          <PropertyCarousel
            title="Exotic Getaways"
            subtitle="Airbnb stays in Kenya's most scenic destinations"
            properties={exotic.data ?? []}
            isLoading={exotic.isLoading}
            seeAllLink="/airbnb"
            icon={<Palmtree className="h-6 w-6 text-primary" />}
          />

          <PropertyCarousel
            title="Prime Land & Plots"
            subtitle="Investment opportunities across Kenya"
            properties={land.data ?? []}
            isLoading={land.isLoading}
            seeAllLink="/buy?type=land"
            icon={<TreePine className="h-6 w-6 text-primary" />}
          />

          <PropertyCarousel
            title="Urban Apartments"
            subtitle="Apartments for rent in major cities"
            properties={urban.data ?? []}
            isLoading={urban.isLoading}
            seeAllLink="/rent?type=apartment"
            icon={<Building2 className="h-6 w-6 text-primary" />}
          />

          <PropertyCarousel
            title="Family Homes for Sale"
            subtitle="Houses, villas, and bungalows ready for your family"
            properties={family.data ?? []}
            isLoading={family.isLoading}
            seeAllLink="/buy?type=house"
            icon={<Home className="h-6 w-6 text-primary" />}
          />
        </div>

        {/* Popular Locations */}
        <LocationsSection />

        {/* Why Choose Us */}
        <FeaturesSection />

        {/* CTA Section */}
        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
