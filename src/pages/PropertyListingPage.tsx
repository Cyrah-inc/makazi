import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyGrid from '@/components/PropertyGrid';
import PropertyFilters from '@/components/PropertyFilters';
import CommuteChecker, { CommuteSettings, TransportMode, LocationFilterMode, NearMeSettings } from '@/components/CommuteChecker';
import CommuteBar from '@/components/CommuteBar';
import { useProperties } from '@/hooks/useProperties';
import { useGeolocation } from '@/hooks/useGeolocation';
import { haversineDistance, formatDistance } from '@/lib/geoUtils';
import { PropertyPurpose, PropertyFilter, PROPERTY_TYPES } from '@/types/property';
import { SlidersHorizontal, Grid3X3, List, Map, Loader2, Search, ShoppingCart, Home, Palmtree, Car, Bus, PersonStanding, X, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const browseTabs = [
  { purpose: 'buy' as PropertyPurpose, label: 'Buy', href: '/buy', icon: ShoppingCart },
  { purpose: 'rent' as PropertyPurpose, label: 'Rent', href: '/rent', icon: Home },
  { purpose: 'airbnb' as PropertyPurpose, label: 'Airbnb', href: '/airbnb', icon: Palmtree },
];

const getModeIcon = (mode: TransportMode) => {
  switch (mode) {
    case 'driving': return Car;
    case 'transit': return Bus;
    case 'walking': return PersonStanding;
  }
};

const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hour${hrs > 1 ? 's' : ''}`;
};

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

  // Location filter mode
  const [filterMode, setFilterMode] = useState<LocationFilterMode>('nearme');

  // Commute state
  const [commuteSettings, setCommuteSettings] = useState<CommuteSettings>({
    destination: '',
    mode: 'transit',
    maxMinutes: 60,
  });
  const [commuteTimes, setCommuteTimes] = useState<Record<string, number>>({});
  const [isLoadingCommute, setIsLoadingCommute] = useState(false);
  const [commuteActive, setCommuteActive] = useState(false);

  // Near Me state
  const [nearMeSettings, setNearMeSettings] = useState<NearMeSettings>({ maxDistanceKm: 15 });
  const [nearMeActive, setNearMeActive] = useState(false);
  const geo = useGeolocation();

  // Fetch properties
  const { data: properties = [], isLoading, error } = useProperties(purpose, false);

  // Calculate distances client-side when we have user location
  const distances = useMemo(() => {
    if (!geo.latitude || !geo.longitude) return {};
    const result: Record<string, number> = {};
    properties.forEach(p => {
      if (p.latitude && p.longitude) {
        result[p.id] = haversineDistance(geo.latitude!, geo.longitude!, p.latitude, p.longitude);
      }
    });
    return result;
  }, [geo.latitude, geo.longitude, properties]);

  // Handle Near Me activation
  const handleNearMeActivate = useCallback(() => {
    if (nearMeActive) {
      // Toggle off
      setNearMeActive(false);
      geo.clearLocation();
      return;
    }
    // Clear commute when activating near me
    setCommuteActive(false);
    setCommuteTimes({});

    geo.requestLocation();
    // We set nearMeActive once location arrives
  }, [nearMeActive, geo]);

  // Auto-activate near me when location is received
  useMemo(() => {
    if (geo.latitude && geo.longitude && !nearMeActive && !commuteActive) {
      setNearMeActive(true);
      const count = properties.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const dist = haversineDistance(geo.latitude!, geo.longitude!, p.latitude, p.longitude);
        return dist <= nearMeSettings.maxDistanceKm;
      }).length;
      toast.success(`Found ${count} properties within ${formatDistance(nearMeSettings.maxDistanceKm)}`);
    }
  }, [geo.latitude, geo.longitude]);

  // Clear all location filters
  const handleClearLocationFilter = useCallback(() => {
    setCommuteActive(false);
    setCommuteTimes({});
    setCommuteSettings(prev => ({ ...prev, destination: '' }));
    setNearMeActive(false);
    geo.clearLocation();
  }, [geo]);

  // Handle filter mode change
  const handleFilterModeChange = useCallback((mode: LocationFilterMode) => {
    setFilterMode(mode);
    // Clear the other mode when switching
    if (mode === 'nearme') {
      setCommuteActive(false);
      setCommuteTimes({});
    } else {
      setNearMeActive(false);
      geo.clearLocation();
    }
  }, [geo]);

  // Calculate real commute times using Google Distance Matrix API
  const handleCommuteSearch = useCallback(async () => {
    if (!commuteSettings.destination.trim()) return;
    
    // Clear near me when using commute
    setNearMeActive(false);
    geo.clearLocation();

    const propertiesWithLocation = properties.filter(
      p => p.latitude !== undefined && p.longitude !== undefined
    );

    if (propertiesWithLocation.length === 0) {
      toast.error('No properties with location data available');
      return;
    }

    setIsLoadingCommute(true);
    setCommuteActive(true);
    setCommuteTimes({});

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
  }, [commuteSettings.destination, commuteSettings.mode, properties, geo]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      if (filters.county && property.county !== filters.county) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!property.title.toLowerCase().includes(searchLower) &&
            !property.town.toLowerCase().includes(searchLower) &&
            !property.county.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (filters.propertyType && property.propertyType !== filters.propertyType) return false;
      if (filters.bedrooms && property.bedrooms < filters.bedrooms) return false;
      if (filters.furnished !== undefined && property.furnished !== filters.furnished) return false;
      const price = purpose === 'buy' ? property.salePrice : 
                   purpose === 'rent' ? property.monthlyRent : property.nightlyRate;
      if (filters.minPrice && price && price < filters.minPrice) return false;
      if (filters.maxPrice && price && price > filters.maxPrice) return false;

      // Commute filter
      if (commuteActive && commuteTimes[property.id] !== undefined) {
        if (commuteTimes[property.id] > commuteSettings.maxMinutes) return false;
      }

      // Near Me filter
      if (nearMeActive && geo.latitude && geo.longitude) {
        if (!property.latitude || !property.longitude) return false;
        const dist = distances[property.id];
        if (dist === undefined || dist > nearMeSettings.maxDistanceKm) return false;
      }

      return true;
    });
  }, [filters, properties, purpose, commuteActive, commuteTimes, commuteSettings.maxMinutes, nearMeActive, geo.latitude, geo.longitude, distances, nearMeSettings.maxDistanceKm]);

  const sortedProperties = useMemo(() => {
    const sorted = [...filteredProperties];

    // When near me is active, default sort by distance
    if (nearMeActive && !filters.sortBy) {
      return sorted.sort((a, b) => {
        const distA = distances[a.id] ?? Infinity;
        const distB = distances[b.id] ?? Infinity;
        return distA - distB;
      });
    }

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
  }, [filteredProperties, filters.sortBy, purpose, nearMeActive, distances]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get('search') as string;
    setFilters(prev => ({ ...prev, search: searchValue }));
  };

  const ModeIcon = getModeIcon(commuteSettings.mode);
  const anyLocationActive = commuteActive || nearMeActive;

  // Common location filter props
  const locationFilterProps = {
    filterMode,
    onFilterModeChange: handleFilterModeChange,
    settings: commuteSettings,
    onChange: setCommuteSettings,
    onSearch: handleCommuteSearch,
    isLoading: isLoadingCommute,
    nearMeSettings,
    onNearMeSettingsChange: setNearMeSettings,
    onNearMeActivate: handleNearMeActivate,
    isNearMeLoading: geo.isLoading,
    isNearMeActive: nearMeActive,
    nearMeError: geo.error,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-4 md:pt-8">
        {/* Mobile Browse Tabs + Category Filter */}
        <div className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border pb-3 -mx-4 px-4 pt-1">
          {/* Browse Tabs */}
          <div className="container mb-3">
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              {browseTabs.map((tab) => {
                const isActive = tab.purpose === purpose;
                return (
                  <Link
                    key={tab.purpose}
                    to={tab.href}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all',
                      isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="container">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
              <button
                onClick={() => setFilters(prev => ({ ...prev, propertyType: undefined }))}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  !filters.propertyType
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
                )}
              >
                All
              </button>
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    propertyType: prev.propertyType === type.value ? undefined : type.value,
                  }))}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    filters.propertyType === type.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Commute Bar */}
        <div className="lg:hidden mt-3 mb-4">
          <CommuteBar
            {...locationFilterProps}
            isActive={commuteActive}
            onClear={handleClearLocationFilter}
          />
        </div>

        {/* Header with Search */}
        <section className="container mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              {title}
            </h1>
            <form onSubmit={handleSearch} className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search properties..."
                defaultValue={filters.search || ''}
                className="pl-10 h-10"
              />
            </form>
          </div>
        </section>

        {/* Filters & Results */}
        <section className="container pb-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filters */}
            <aside className="hidden lg:block w-72 shrink-0 space-y-6">
              {/* Location Filter - Highlighted card */}
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 overflow-hidden">
                <CommuteChecker {...locationFilterProps} />
              </div>
              
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
              <div className="flex flex-col gap-3 mb-6 pb-4 border-b border-border">
                <div className="flex items-center justify-between">
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

                {/* Active Location Filter Chip */}
                {anyLocationActive && (
                  <div className="flex items-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {nearMeActive ? (
                        <>
                          <Navigation className="h-3.5 w-3.5" />
                          <span>Within {formatDistance(nearMeSettings.maxDistanceKm)} of you</span>
                        </>
                      ) : (
                        <>
                          <ModeIcon className="h-3.5 w-3.5" />
                          <span>Within {formatTime(commuteSettings.maxMinutes)} of {commuteSettings.destination}</span>
                        </>
                      )}
                      <button
                        onClick={handleClearLocationFilter}
                        className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
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
                  commuteTimes={commuteTimes}
                  commuteMode={commuteSettings.mode}
                  commuteDestination={commuteSettings.destination}
                  isLoadingCommute={isLoadingCommute}
                  showCommuteBadge={commuteActive || isLoadingCommute}
                  distances={distances}
                  showDistanceBadge={nearMeActive}
                />
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyListingPage;
