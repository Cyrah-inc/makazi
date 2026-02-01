import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
}

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem',
};

// Default center (Nairobi, Kenya)
const defaultCenter = {
  lat: -1.2921,
  lng: 36.8219,
};

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

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      onLocationChange(lat, lng);
      
      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          onLocationChange(lat, lng, results[0].formatted_address);
        }
      });
    }
  }, [onLocationChange]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !map) return;
    
    setIsSearching(true);
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode(
      { address: searchQuery + ', Kenya' },
      (results, status) => {
        setIsSearching(false);
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          setMarker({ lat, lng });
          map.panTo({ lat, lng });
          map.setZoom(15);
          onLocationChange(lat, lng, results[0].formatted_address);
        }
      }
    );
  };

  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMarker({ lat, lng });
          map?.panTo({ lat, lng });
          map?.setZoom(17); // Higher zoom for better accuracy
          onLocationChange(lat, lng);
          
          // Reverse geocode
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              onLocationChange(lat, lng, results[0].formatted_address);
            }
          });
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true, // Request high accuracy GPS
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  };

  // Update marker if props change
  useEffect(() => {
    if (latitude && longitude) {
      setMarker({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

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
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search for a location in Kenya..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
          title="Use my current location (high accuracy)"
        >
          {isGettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
        </Button>
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-border">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={marker || defaultCenter}
          zoom={marker ? 15 : 12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {marker && (
            <Marker
              position={marker}
              draggable
              onDragEnd={(e) => {
                if (e.latLng) {
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();
                  setMarker({ lat, lng });
                  onLocationChange(lat, lng);
                }
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Coordinates Display */}
      {marker && (
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground">Latitude:</Label>
            <span className="font-mono">{marker.lat.toFixed(6)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground">Longitude:</Label>
            <span className="font-mono">{marker.lng.toFixed(6)}</span>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Click on the map to pin the property location, or search for an address. You can also drag the marker to adjust.
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

  // Only render the map component after we have the API key
  return (
    <LocationPickerMap
      latitude={latitude}
      longitude={longitude}
      onLocationChange={onLocationChange}
      apiKey={apiKey}
    />
  );
};
