import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSearch from '@/components/HeroSearch';
import CategorySection from '@/components/CategorySection';
import PropertyGrid from '@/components/PropertyGrid';
import LocationsSection from '@/components/LocationsSection';
import FeaturesSection from '@/components/FeaturesSection';
import CTASection from '@/components/CTASection';
import { mockProperties } from '@/data/mockProperties';

const Index = () => {
  const featuredProperties = mockProperties.filter(p => p.featured);

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

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-12 pt-12 border-t border-primary-foreground/20 animate-fade-in delay-500">
              {[
                { value: '5,000+', label: 'Properties Listed' },
                { value: '2,500+', label: 'Happy Customers' },
                { value: '47', label: 'Counties Covered' },
                { value: '500+', label: 'Verified Agents' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-heading font-bold text-primary-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-primary-foreground/70">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Category Cards */}
        <CategorySection />

        {/* Featured Properties */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <PropertyGrid 
              properties={featuredProperties}
              title="Featured Properties"
              subtitle="Hand-picked properties by our team for exceptional value and quality"
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
