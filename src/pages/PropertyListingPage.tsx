import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyGrid from '@/components/PropertyGrid';
import PropertyFilters from '@/components/PropertyFilters';
import CommuteChecker, { CommuteSettings, TransportMode } from '@/components/CommuteChecker';
import { useProperties } from '@/hooks/useProperties';
import { PropertyPurpose, PropertyFilter } from '@/types/property';
import { Building, SlidersHorizontal, Grid3X3, List, Map, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PropertyListingPageProps {
  purpose: PropertyPurpose;
  title: string;
  subtitle: string;
}

const PropertyListingPage = ({ purpose, title, subtitle }: PropertyListingPageProps) => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<PropertyFilter>({
    purpose,
    county: searchParams.get('county') || undefined,
    search: searchParams.get('q') || undefined,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Commute state
  const [commuteSettings, setCommuteSettings] = useState<CommuteSettings>({
    destination: '',
    mode: 'transit',
    maxMinutes: 60,
  });
  const [commuteTimes, setCommuteTimes] = useState<Record<string, number>>({});
  const [isLoadingCommute, setIsLoadingCommute] = useState(false);
  const [commuteActive, setCommuteActive] = useState(false);

  // Fetch real properties from Supabase - don't require location by default
  const { data: properties = [], isLoading, error } = useProperties(purpose, false);

  // Calculate real commute times using Google Distance Matrix API
  const handleCommuteSearch = useCallback(async () => {
    if (!commuteSettings.destination.trim()) return;
    
    // Filter properties with valid coordinates
    const propertiesWithLocation = properties.filter(
      p => p.latitude !== undefined && p.longitude !== undefined
    );

    if (propertiesWithLocation.length === 0) {
      toast.error('No properties with location data available');
      return;
    }

    setIsLoadingCommute(true);
    setCommuteActive(true);
    setCommuteTimes({}); // Clear previous times

    try {
      const { data, error } = await supabase.functions.invoke('calculate-commute', {
        body: {
          destination: commuteSettings.destination.trim(),
          mode: commuteSettings.mode,
          properties: propertiesWithLocation.map(p => ({
            id: p.id,
            latitude: p.latitude,
            longitude: p.longitude,
          })),
        },
      });

      if (error) {
        console.error('Commute calculation error:', error);
        toast.error('Failed to calculate commute times');
        setCommuteActive(false);
        return;
      }

      if (data?.results) {
        const times: Record<string, number> = {};
        data.results.forEach((result: { propertyId: string; durationMinutes: number | null }) => {
          if (result.durationMinutes !== null) {
            times[result.propertyId] = result.durationMinutes;
          }
        });
        setCommuteTimes(times);
        
        const successCount = Object.keys(times).length;
        if (successCount > 0) {
          toast.success(`Calculated commute times for ${successCount} properties`);
        } else {
          toast.warning('Could not calculate commute times for any properties');
        }
      }
    } catch (err) {
      console.error('Error calling commute function:', err);
      toast.error('Failed to calculate commute times');
      setCommuteActive(false);
    } finally {
      setIsLoadingCommute(false);
    }
  }, [commuteSettings.destination, commuteSettings.mode, properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      // County filter
      if (filters.county && property.county !== filters.county) return false;
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!property.title.toLowerCase().includes(searchLower) &&
            !property.town.toLowerCase().includes(searchLower) &&
            !property.county.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Property type filter
      if (filters.propertyType && property.propertyType !== filters.propertyType) return false;
      
      // Bedrooms filter
      if (filters.bedrooms && property.bedrooms < filters.bedrooms) return false;
      
      // Furnished filter
      if (filters.furnished !== undefined && property.furnished !== filters.furnished) return false;
      
      // Price filter
      const price = purpose === 'buy' ? property.salePrice : 
                   purpose === 'rent' ? property.monthlyRent : property.nightlyRate;
      if (filters.minPrice && price && price < filters.minPrice) return false;
      if (filters.maxPrice && price && price > filters.maxPrice) return false;
      
      // Commute time filter
      if (commuteActive && commuteTimes[property.id] !== undefined) {
        if (commuteTimes[property.id] > commuteSettings.maxMinutes) return false;
      }
      
      return true;
    });
  }, [filters, properties, purpose, commuteActive, commuteTimes, commuteSettings.maxMinutes]);

  const sortedProperties = useMemo(() => {
    const sorted = [...filteredProperties];
    
    switch (filters.sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => {
          const priceA = purpose === 'buy' ? a.salePrice : purpose === 'rent' ? a.monthlyRent : a.nightlyRate;
          const priceB = purpose === 'buy' ? b.salePrice : purpose === 'rent' ? b.monthlyRent : b.nightlyRate;
          return (priceA || 0) - (priceB || 0);
        });
      case 'price-desc':
        return sorted.sort((a, b) => {
          const priceA = purpose === 'buy' ? a.salePrice : purpose === 'rent' ? a.monthlyRent : a.nightlyRate;
          const priceB = purpose === 'buy' ? b.salePrice : purpose === 'rent' ? b.monthlyRent : b.nightlyRate;
          return (priceB || 0) - (priceA || 0);
        });
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'popular':
        return sorted.sort((a, b) => b.views - a.views);
      default:
        return sorted;
    }
  }, [filteredProperties, filters.sortBy, purpose]);


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <section className="bg-primary py-12 md:py-16">
          <div className="container">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Building className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground">
                  {title}
                </h1>
                <p className="text-primary-foreground/80">{subtitle}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters & Results */}
        <section className="py-8">
          <div className="container">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Desktop Filters */}
              <aside className="hidden lg:block w-72 shrink-0 space-y-6">
                {/* Commute Checker */}
                <CommuteChecker
                  settings={commuteSettings}
                  onChange={setCommuteSettings}
                  onSearch={handleCommuteSearch}
                  isLoading={isLoadingCommute}
                />
                
                {/* Property Filters */}
                <PropertyFilters 
                  filters={filters} 
                  onChange={setFilters} 
                  purpose={purpose}
                />
              </aside>

              {/* Results */}
              <div className="flex-1">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                  <p className="text-muted-foreground">
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading properties...
                      </span>
                    ) : (
                      <>
                        <span className="font-semibold text-foreground">{sortedProperties.length}</span> properties found
                      </>
                    )}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    {/* Mobile Filters */}
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="lg:hidden gap-2">
                          <SlidersHorizontal className="h-4 w-4" />
                          Filters
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-80 overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-6">
                          {/* Commute Checker (Mobile) */}
                          <CommuteChecker
                            settings={commuteSettings}
                            onChange={setCommuteSettings}
                            onSearch={handleCommuteSearch}
                            isLoading={isLoadingCommute}
                          />
                          
                          <PropertyFilters 
                            filters={filters} 
                            onChange={setFilters} 
                            purpose={purpose}
                          />
                        </div>
                      </SheetContent>
                    </Sheet>

                    {/* View Mode */}
                    <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Map className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="text-center py-16">
                    <p className="text-destructive">Failed to load properties. Please try again.</p>
                  </div>
                )}

                {/* Property Grid */}
                {!isLoading && !error && (
                  <PropertyGrid 
                    properties={sortedProperties}
                    emptyMessage="No properties match your criteria. Try adjusting your filters."
                    commuteTimes={commuteActive ? commuteTimes : undefined}
                    commuteMode={commuteSettings.mode}
                    commuteDestination={commuteSettings.destination}
                    isLoadingCommute={isLoadingCommute}
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyListingPage;
