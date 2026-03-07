import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyGrid from '@/components/PropertyGrid';
import PropertyFilters from '@/components/PropertyFilters';
import ListingHero from '@/components/ListingHero';
import { useProperties } from '@/hooks/useProperties';
import { useGeolocation } from '@/hooks/useGeolocation';
import { haversineDistance, formatDistance } from '@/lib/geoUtils';
import { PropertyPurpose, PropertyFilter, PropertyType } from '@/types/property';
import { SlidersHorizontal, Grid3X3, List, Loader2, ShoppingCart, Home, Palmtree, Car, Bus, PersonStanding, X, Navigation, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { LocationFilterMode, CommuteSettings, NearMeSettings, TransportMode } from '@/components/LocationFilterBar';

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
  heroIcon: React.ReactNode;
  categorySections?: React.ReactNode;
}

const getCategoryLabel = (purpose: PropertyPurpose, type: string | null, category: string | null): string | null => {
  const purposeLabel = purpose === 'buy' ? 'for Sale' : purpose === 'rent' ? 'for Rent' : 'Stays';
  
  if (type) {
    const typeLabels: Record<string, string> = {
      house: 'Houses', villa: 'Villas', bungalow: 'Bungalows', apartment: 'Apartments',
      studio: 'Studios', bedsitter: 'Bedsitters', land: 'Land & Plots',
      commercial: 'Commercial Properties', townhouse: 'Townhouses & Maisonettes',
      maisonette: 'Maisonettes', mansion: 'Mansions', office: 'Offices',
      warehouse: 'Warehouses', shop: 'Shops',
    };
    const label = typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);
    return `${label} ${purposeLabel}`;
  }
  
  if (category) {
    const categoryLabels: Record<string, string> = {
      new: 'Just Added', trending: 'Trending', luxury: 'Luxury',
      furnished: 'Furnished', budget: 'Budget', exotic: 'Exotic',
      beach: 'Beach', safari: 'Safari', mountain: 'Mountain Retreats',
      city: 'City Breaks',
    };
    const label = categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1);
    return `${label} ${purposeLabel}`;
  }
  
  return null;
};

const PropertyListingPage = ({ purpose, title, subtitle, heroIcon, categorySections }: PropertyListingPageProps) => {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') as PropertyType | null;
  const categoryParam = searchParams.get('category');
  const [filters, setFilters] = useState<PropertyFilter>({
    purpose,
    county: searchParams.get('county') || undefined,
    search: searchParams.get('q') || undefined,
    propertyType: typeParam || undefined,
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

  // When a category/type param is in the URL, we're in "see all" mode — hide carousels
  const isCategoryView = !!(typeParam || categoryParam);

  // Fetch properties
  // Check if any sidebar filter is active early (for query gating)
  const hasAnyFilter = Object.keys(filters).some(key => 
    key !== 'purpose' && filters[key as keyof PropertyFilter] !== undefined
  );

  // Defer main grid query when category sections exist and no filters active (but always fetch in category view)
  const shouldFetchMain = isCategoryView || !categorySections || hasAnyFilter || nearMeActive || commuteActive;
  const { data: properties = [], isLoading, error } = useProperties(purpose, false, shouldFetchMain);

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
      setNearMeActive(false);
      geo.clearLocation();
      return;
    }
    setCommuteActive(false);
    setCommuteTimes({});
    geo.requestLocation();
  }, [nearMeActive, geo]);

  // Auto-activate near me when location is received
  const prevGeoRef = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })[0];
  useEffect(() => {
    if (geo.latitude && geo.longitude && !nearMeActive && !commuteActive) {
      if (prevGeoRef.lat === geo.latitude && prevGeoRef.lng === geo.longitude) return;
      prevGeoRef.lat = geo.latitude;
      prevGeoRef.lng = geo.longitude;
      setNearMeActive(true);
      const count = properties.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const dist = haversineDistance(geo.latitude!, geo.longitude!, p.latitude, p.longitude);
        return dist <= nearMeSettings.maxDistanceKm;
      }).length;
      toast.success(`Found ${count} properties within ${formatDistance(nearMeSettings.maxDistanceKm)}`);
    }
  }, [geo.latitude, geo.longitude, nearMeActive, commuteActive, properties, nearMeSettings.maxDistanceKm]);

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
    if (mode === 'nearme') {
      setCommuteActive(false);
      setCommuteTimes({});
    } else {
      setNearMeActive(false);
      geo.clearLocation();
    }
  }, [geo]);

  // Calculate real commute times
  const handleCommuteSearch = useCallback(async () => {
    if (!commuteSettings.destination.trim()) return;
    setNearMeActive(false);
    geo.clearLocation();
    const propertiesWithLocation = properties.filter(p => p.latitude !== undefined && p.longitude !== undefined);
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
          properties: propertiesWithLocation.map(p => ({ id: p.id, latitude: p.latitude, longitude: p.longitude })),
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
        if (successCount > 0) toast.success(`Calculated commute times for ${successCount} properties`);
        else toast.warning('Could not calculate commute times for any properties');
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
    let result = properties.filter((property) => {
      if (filters.county && property.county !== filters.county) return false;
      if (filters.town && property.town !== filters.town) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!property.title.toLowerCase().includes(searchLower) &&
            !property.town.toLowerCase().includes(searchLower) &&
            !property.county.toLowerCase().includes(searchLower) &&
            !property.address.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (filters.propertyType && property.propertyType !== filters.propertyType) return false;
      if (filters.bedrooms && property.bedrooms < filters.bedrooms) return false;
      if (filters.bathrooms && property.bathrooms < filters.bathrooms) return false;
      if (filters.furnished !== undefined && property.furnished !== filters.furnished) return false;
      const price = purpose === 'buy' ? property.salePrice : 
                   purpose === 'rent' ? property.monthlyRent : property.nightlyRate;
      if (filters.minPrice !== undefined) {
        if (price === undefined || price === null || price < filters.minPrice) return false;
      }
      if (filters.maxPrice !== undefined) {
        if (price === undefined || price === null || price > filters.maxPrice) return false;
      }
      // Location filters no longer exclude — they only affect sort order
      return true;
    });

    // Apply category-based filtering/sorting for "See All" views
    if (categoryParam) {
      switch (categoryParam) {
        case 'new':
          result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'trending':
          result = [...result].sort((a, b) => b.views - a.views);
          break;
        case 'luxury': {
          const priceKey = purpose === 'buy' ? 'salePrice' : purpose === 'rent' ? 'monthlyRent' : 'nightlyRate';
          result = [...result].sort((a, b) => (b[priceKey] ?? 0) - (a[priceKey] ?? 0));
          break;
        }
        case 'furnished':
          result = result.filter(p => p.amenities.some(a => a.toLowerCase().includes('furnished')));
          break;
        case 'budget': {
          const pk = purpose === 'buy' ? 'salePrice' : purpose === 'rent' ? 'monthlyRent' : 'nightlyRate';
          result = [...result].sort((a, b) => (a[pk] ?? Infinity) - (b[pk] ?? Infinity));
          break;
        }
      }
    }

    return result;
  }, [filters, properties, purpose, categoryParam]);
  }, [filters, properties, purpose]);

  // Check if any sidebar filter is active (beyond just purpose)
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => 
      key !== 'purpose' && filters[key as keyof PropertyFilter] !== undefined
    );
  }, [filters]);

  const isAnyFilterActive = hasActiveFilters || nearMeActive || commuteActive;

  // Count how many properties match the active location/search filter (for search results section)
  const priorityCount = useMemo(() => {
    // For location-based filters, prioritize properties within range
    if (nearMeActive && geo.latitude && geo.longitude) {
      return filteredProperties.filter(p => {
        const dist = distances[p.id];
        return dist !== undefined && dist <= nearMeSettings.maxDistanceKm;
      }).length;
    }
    if (commuteActive) {
      return filteredProperties.filter(p => {
        const time = commuteTimes[p.id];
        return time !== undefined && time <= commuteSettings.maxMinutes;
      }).length;
    }
    // For text search or sidebar filters, ALL filtered properties are the results
    if (hasActiveFilters) {
      return filteredProperties.length;
    }
    return 0;
  }, [filteredProperties, hasActiveFilters, nearMeActive, commuteActive, geo.latitude, geo.longitude, distances, nearMeSettings.maxDistanceKm, commuteTimes, commuteSettings.maxMinutes]);

  const sortedProperties = useMemo(() => {
    const sorted = [...filteredProperties];

    // Priority sorting: matched properties first, then others
    if (nearMeActive && geo.latitude && geo.longitude && !filters.sortBy) {
      return sorted.sort((a, b) => {
        const distA = distances[a.id] ?? Infinity;
        const distB = distances[b.id] ?? Infinity;
        const aInRange = distA <= nearMeSettings.maxDistanceKm;
        const bInRange = distB <= nearMeSettings.maxDistanceKm;
        if (aInRange && !bInRange) return -1;
        if (!aInRange && bInRange) return 1;
        return distA - distB;
      });
    }

    if (commuteActive && !filters.sortBy) {
      return sorted.sort((a, b) => {
        const timeA = commuteTimes[a.id];
        const timeB = commuteTimes[b.id];
        const aInRange = timeA !== undefined && timeA <= commuteSettings.maxMinutes;
        const bInRange = timeB !== undefined && timeB <= commuteSettings.maxMinutes;
        if (aInRange && !bInRange) return -1;
        if (!aInRange && bInRange) return 1;
        if (timeA === undefined && timeB === undefined) return 0;
        if (timeA === undefined) return 1;
        if (timeB === undefined) return -1;
        return timeA - timeB;
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
  }, [filteredProperties, filters.sortBy, purpose, nearMeActive, distances, nearMeSettings.maxDistanceKm, commuteActive, commuteTimes, commuteSettings.maxMinutes, geo.latitude, geo.longitude]);

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query || undefined }));
  };

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
    commuteActive,
    onClear: handleClearLocationFilter,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Mobile Browse Tabs */}
        <div className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container py-2">
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
        </div>

        {/* Hero Banner with integrated location filters */}
        <ListingHero
          purpose={purpose}
          title={title}
          subtitle={subtitle}
          icon={heroIcon}
          onSearch={handleSearch}
          defaultSearch={filters.search}
          locationFilterProps={locationFilterProps}
        />

        {/* Main Content: Sidebar + Results */}
        <section className="container py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Sticky Sidebar */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-20 space-y-0 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide">
                <PropertyFilters filters={filters} onChange={setFilters} purpose={purpose} />
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1 min-w-0">
              {/* Category Breadcrumb */}
              {getCategoryLabel(purpose, typeParam, categoryParam) && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <Link to={`/${purpose === 'buy' ? 'buy' : purpose === 'rent' ? 'rent' : 'airbnb'}`} className="text-muted-foreground hover:text-foreground transition-colors">
                    {title}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="font-semibold text-foreground">
                    {getCategoryLabel(purpose, typeParam, categoryParam)}
                  </span>
                </div>
              )}
              {/* Results Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      <>
                        <span className="font-semibold text-foreground text-lg">{sortedProperties.length}</span>
                        <span className="ml-1">properties</span>
                      </>
                    )}
                  </p>

                  {/* Active location filter chips */}
                  {nearMeActive && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      <Navigation className="h-3 w-3" />
                      Within {nearMeSettings.maxDistanceKm} km
                      <button onClick={handleClearLocationFilter} className="ml-1 hover:text-primary/70">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {commuteActive && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {(() => { const Icon = getModeIcon(commuteSettings.mode); return <Icon className="h-3 w-3" />; })()}
                      {formatTime(commuteSettings.maxMinutes)} to {commuteSettings.destination}
                      <button onClick={handleClearLocationFilter} className="ml-1 hover:text-primary/70">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>

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
                        <PropertyFilters filters={filters} onChange={setFilters} purpose={purpose} />
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
                  </div>
                </div>
              </div>

              {/* Search Results Section - shown above carousels when any filter is active */}
              {!isLoading && !error && isAnyFilterActive && priorityCount > 0 && (
                <div className="mb-6 border-b border-border/50 pb-6">
                  <PropertyGrid 
                    properties={sortedProperties.slice(0, priorityCount)}
                    title="Search Results"
                    subtitle={
                      filters.search ? `Matching "${filters.search}"` :
                      nearMeActive ? `Within ${nearMeSettings.maxDistanceKm} km of your location` :
                      commuteActive ? `Within ${formatTime(commuteSettings.maxMinutes)} to ${commuteSettings.destination}` :
                      `${priorityCount} ${priorityCount === 1 ? 'property' : 'properties'} matching your filters`
                    }
                    commuteTimes={commuteTimes}
                    commuteMode={commuteSettings.mode}
                    commuteDestination={commuteSettings.destination}
                    isLoadingCommute={isLoadingCommute}
                    showCommuteBadge={commuteActive || isLoadingCommute}
                    distances={distances}
                    showDistanceBadge={nearMeActive}
                  />
                </div>
              )}

              {/* Category Carousels (inside results area) — hidden when viewing a specific category */}
              {categorySections && !isCategoryView && (
                <div className="mb-6 border-b border-border/50 pb-6">
                  {categorySections}
                </div>
              )}

              {/* Loading State — uses skeleton grid instead of spinner */}
              {isLoading && !categorySections && (
                <PropertyGrid
                  properties={[]}
                  isLoading={true}
                />
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-16">
                  <p className="text-destructive">Failed to load properties. Please try again.</p>
                </div>
              )}

              {/* Property Grid - remaining properties or all */}
              {!isLoading && !error && (
                <PropertyGrid 
                  properties={isAnyFilterActive && priorityCount > 0 && (nearMeActive || commuteActive) ? sortedProperties.slice(priorityCount) : (isAnyFilterActive && priorityCount > 0 && !nearMeActive && !commuteActive ? [] : sortedProperties)}
                  title={isAnyFilterActive && priorityCount > 0 && (nearMeActive || commuteActive) ? "Other Properties" : undefined}
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
