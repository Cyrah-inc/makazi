import { useEffect, useMemo, useCallback } from 'react';
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
import { TrendingUp, MapPin, Palmtree, TreePine, Building2, Home, Shield, Users, MapPinned } from 'lucide-react';

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
        {/* Hero Section — compact */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(200,15%,10%)] via-[hsl(180,10%,14%)] to-[hsl(150,15%,12%)]">
          {/* Decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/10 blur-[120px]" />
            <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-gold/5 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="relative container py-16 md:py-24">
            <div className="text-center mb-6 space-y-4">
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white animate-fade-in-up">
                Discover Exceptional
                <span className="block bg-gradient-to-r from-gold via-amber-400 to-gold bg-clip-text text-transparent">
                  Properties in Kenya
                </span>
              </h1>
              <div className="w-16 h-0.5 bg-gold/60 mx-auto" />
              <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto animate-fade-in-up delay-200">
                Verified homes, apartments, and land across 47 counties. Your next chapter starts here.
              </p>
            </div>

            {/* Trust Bar */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-8 animate-fade-in-up delay-200">
              {[
                { icon: <Home className="h-4 w-4" />, number: '10,000+', label: 'Properties' },
                { icon: <Users className="h-4 w-4" />, number: '5,000+', label: 'Happy Clients' },
                { icon: <MapPinned className="h-4 w-4" />, number: '47', label: 'Counties' },
                { icon: <Shield className="h-4 w-4" />, number: '100%', label: 'Verified' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2 text-center">
                  <span className="text-gold/60">{stat.icon}</span>
                  <span className="text-gold font-bold text-lg">{stat.number}</span>
                  <span className="text-white/50 text-sm">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="animate-fade-in-up delay-300">
              <HeroSearch />
            </div>
          </div>

          {/* Bottom curve transition */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" className="w-full h-8 md:h-12" preserveAspectRatio="none">
              <path d="M0 60L1440 60L1440 0C1440 0 1080 60 720 60C360 60 0 0 0 0L0 60Z" className="fill-muted/30" />
            </svg>
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
