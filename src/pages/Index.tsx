import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSearch from '@/components/HeroSearch';
import CategorySection from '@/components/CategorySection';
import PropertyGrid from '@/components/PropertyGrid';
import LocationsSection from '@/components/LocationsSection';
import FeaturesSection from '@/components/FeaturesSection';
import CTASection from '@/components/CTASection';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { data: featuredProperties = [], isLoading } = useFeaturedProperties();

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
              <HeroSearch />
            </div>

          </div>
        </section>

        {/* Category Cards */}
        <CategorySection />

        {/* Featured Properties */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : featuredProperties.length > 0 ? (
              <PropertyGrid 
                properties={featuredProperties}
                title="Featured Properties"
                subtitle="Hand-picked properties by our team for exceptional value and quality"
              />
            ) : (
              <div className="text-center py-16">
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">Featured Properties</h2>
                <p className="text-muted-foreground">No properties available yet. Check back soon!</p>
              </div>
            )}
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
