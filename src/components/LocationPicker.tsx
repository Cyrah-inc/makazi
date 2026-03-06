import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Search, Loader2, Navigation, Satellite, Map, CheckCircle2, Crosshair } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
}

// Default center (Nairobi, Kenya)
const defaultCenter = { lat: -1.2921, lng: 36.8219 };

// Libraries array must be static to prevent reloads
const libraries: ("places")[] = ['places'];

// Inner component that uses the Google Maps API - only rendered when API key is available
const LocationPickerMap = ({ 
  latitude, 
  longitude, 
  onLocationChange,
  apiKey 
}: LocationPickerProps & { apiKey: string }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [mapType, setMapType] = useState<google.maps.MapTypeId | string>('roadmap');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
  });

  const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem',
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Reverse geocode to get address
  const reverseGeocode = useCallback((lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const addr = results[0].formatted_address;
        setResolvedAddress(addr);
        onLocationChange(lat, lng, addr);
      } else {
        setResolvedAddress(null);
        onLocationChange(lat, lng);
      }
    });
  }, [onLocationChange]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      reverseGeocode(lat, lng);
    }
  }, [reverseGeocode]);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      reverseGeocode(lat, lng);
    }
  }, [reverseGeocode]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !map) return;
    
    setIsSearching(true);
    const geocoder = new google.maps.Geocoder();
    
    // Try exact query first, then with Kenya suffix
    geocoder.geocode(
      { address: searchQuery },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          const addr = results[0].formatted_address;
          
          setMarker({ lat, lng });
          setResolvedAddress(addr);
          map.panTo({ lat, lng });
          map.setZoom(17);
          onLocationChange(lat, lng, addr);
          setIsSearching(false);
        } else {
          // Retry with Kenya suffix
          geocoder.geocode(
            { address: searchQuery + ', Kenya' },
            (results2, status2) => {
              setIsSearching(false);
              if (status2 === 'OK' && results2?.[0]) {
                const location = results2[0].geometry.location;
                const lat = location.lat();
                const lng = location.lng();
                const addr = results2[0].formatted_address;
                
                setMarker({ lat, lng });
                setResolvedAddress(addr);
                map.panTo({ lat, lng });
                map.setZoom(17);
                onLocationChange(lat, lng, addr);
              }
            }
          );
        }
      }
    );
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMarker({ lat, lng });
        map?.panTo({ lat, lng });
        map?.setZoom(18);
        reverseGeocode(lat, lng);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleCenterOnMarker = () => {
    if (marker && map) {
      map.panTo(marker);
      map.setZoom(18);
    }
  };

  const toggleMapType = () => {
    const next = mapType === 'roadmap' ? 'hybrid' : 'roadmap';
    setMapType(next);
    map?.setMapTypeId(next);
  };

  // Update marker if props change externally
  useEffect(() => {
    if (latitude && longitude) {
      setMarker({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  // Resolve address on initial load if marker exists but no address
  useEffect(() => {
    if (isLoaded && marker && !resolvedAddress) {
      reverseGeocode(marker.lat, marker.lng);
    }
  }, [isLoaded, marker, resolvedAddress, reverseGeocode]);

  if (loadError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <MapPin className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Unable to load Google Maps</p>
          <p className="text-xs text-muted-foreground mt-1">You can still enter coordinates manually</p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading map...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            ref={searchInputRef}
            placeholder="Search address, landmark, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
            className="h-10"
          />
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="icon"
          onClick={handleSearch}
          disabled={isSearching}
          title="Search location"
          className="h-10 w-10 shrink-0"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="icon"
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
          title="Use my current GPS location"
          className="h-10 w-10 shrink-0"
        >
          {isGettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-lg overflow-hidden border border-border" style={{ height: 'clamp(350px, 60vw, 420px)' }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={marker || defaultCenter}
          zoom={marker ? 17 : 12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: 'greedy',
            mapTypeId: mapType as google.maps.MapTypeId,
          }}
        >
          {marker && (
            <Marker
              position={marker}
              draggable
              onDragEnd={handleMarkerDragEnd}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>

        {/* Map Controls Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={toggleMapType}
            className="shadow-md bg-background/90 backdrop-blur-sm hover:bg-background gap-1.5 text-xs h-8 px-2.5"
          >
            {mapType === 'roadmap' ? (
              <>
                <Satellite className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Satellite</span>
              </>
            ) : (
              <>
                <Map className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Map</span>
              </>
            )}
          </Button>
          {marker && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCenterOnMarker}
              className="shadow-md bg-background/90 backdrop-blur-sm hover:bg-background gap-1.5 text-xs h-8 px-2.5"
              title="Center on pin"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Center</span>
            </Button>
          )}
        </div>

        {/* Tap hint when no marker */}
        {!marker && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-background/90 backdrop-blur-sm text-foreground text-xs px-3 py-1.5 rounded-full shadow-md border border-border flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Tap the map to pin location
            </div>
          </div>
        )}
      </div>

      {/* Resolved Address Confirmation */}
      {resolvedAddress && marker && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Pinned Location</p>
            <p className="text-xs text-muted-foreground mt-0.5 break-words">{resolvedAddress}</p>
          </div>
        </div>
      )}

      {/* Coordinates Display */}
      {marker && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Lat: <span className="font-mono text-foreground">{marker.lat.toFixed(6)}</span></span>
          <span>Lng: <span className="font-mono text-foreground">{marker.lng.toFixed(6)}</span></span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Search for an address, use GPS, or tap the map to pin. Drag the marker to fine-tune. Use satellite view for better accuracy.
      </p>
    </div>
  );
};

// Main component that fetches the API key first
export const LocationPicker = ({ latitude, longitude, onLocationChange }: LocationPickerProps) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-maps-key');
        if (error) {
          console.error('Error fetching maps key:', error);
          setError('Failed to load Google Maps');
          return;
        }
        if (data?.apiKey) {
          setApiKey(data.apiKey);
        } else {
          setError('Google Maps API key not available');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load Google Maps');
      } finally {
        setIsLoading(false);
      }
    };
    fetchApiKey();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading map...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !apiKey) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <MapPin className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Unable to load Google Maps</p>
          <p className="text-xs text-muted-foreground mt-1">You can still enter coordinates manually</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <LocationPickerMap
      latitude={latitude}
      longitude={longitude}
      onLocationChange={onLocationChange}
      apiKey={apiKey}
    />
  );
};
