import { useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSearch, { HeroFilters } from '@/components/HeroSearch';
import PropertyGrid from '@/components/PropertyGrid';
import LocationsSection from '@/components/LocationsSection';
import FeaturesSection from '@/components/FeaturesSection';
import CTASection from '@/components/CTASection';
import { useHomeProperties, HomeFilters } from '@/hooks/useProperties';

const purposeLabels = {
  buy: 'For Sale',
  rent: 'For Rent',
  airbnb: 'Airbnb Stays',
};

const Index = () => {
  const [filters, setFilters] = useState<HomeFilters>({ purpose: 'buy' });

  const handleFiltersChange = useCallback((heroFilters: HeroFilters) => {
    setFilters({
      purpose: heroFilters.purpose,
      search: heroFilters.search || undefined,
      county: heroFilters.county || undefined,
      propertyType: heroFilters.propertyType || undefined,
    });
  }, []);

  const { data: properties = [], isLoading } = useHomeProperties(filters);

  const activeLabel = filters.purpose ? purposeLabels[filters.purpose] : 'Featured';
  const hasActiveFilters = !!(filters.search || (filters.county && filters.county !== 'all') || (filters.propertyType && filters.propertyType !== 'all'));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-primary overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary-foreground blur-3xl animate-float" />
            <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-primary-foreground blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-gold blur-3xl animate-pulse-soft" />
          </div>

          <div className="relative container py-20 md:py-32">
            <div className="text-center mb-10 space-y-4">
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground animate-fade-in-up">
                Find Your Dream Home
                <span className="block text-gold">in Kenya</span>
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto animate-fade-in-up delay-200">
                Discover thousands of verified properties for sale, rent, or short-term stays across Kenya's most desirable locations.
              </p>
            </div>

            <div className="animate-fade-in-up delay-300">
              <HeroSearch onFiltersChange={handleFiltersChange} />
            </div>
          </div>
        </section>

        {/* Properties Section - driven by hero filters */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <PropertyGrid 
              properties={properties}
              isLoading={isLoading}
              title={`${activeLabel} Properties`}
              subtitle={
                hasActiveFilters
                  ? `Showing filtered results${filters.county && filters.county !== 'all' ? ` in ${filters.county}` : ''}`
                  : `Browse top properties ${filters.purpose === 'buy' ? 'for sale' : filters.purpose === 'rent' ? 'for rent' : 'for short stays'} across Kenya`
              }
              emptyMessage={`No ${activeLabel.toLowerCase()} properties found. Try adjusting your filters.`}
            />
          </div>
        </section>

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
