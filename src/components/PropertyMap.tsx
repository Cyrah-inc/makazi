import { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
  height?: string;
}

// Inner component that uses the Google Maps API
const PropertyMapInner = ({ 
  latitude, 
  longitude, 
  title, 
  address,
  height = '300px',
  apiKey
}: PropertyMapProps & { apiKey: string }) => {
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const containerStyle = {
    width: '100%',
    height,
    borderRadius: '0.5rem',
  };

  const center = { lat: latitude, lng: longitude };

  const onLoad = useCallback((map: google.maps.Map) => {
    // Optional: Add any map configuration here
  }, []);

  if (loadError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center text-center" style={{ height }}>
          <MapPin className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Map unavailable</p>
          {address && (
            <p className="text-sm text-muted-foreground mt-1">{address}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        onLoad={onLoad}
        options={{
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        <Marker
          position={center}
          onClick={() => setShowInfoWindow(true)}
        />
        
        {showInfoWindow && (title || address) && (
          <InfoWindow
            position={center}
            onCloseClick={() => setShowInfoWindow(false)}
          >
            <div className="p-1">
              {title && <h4 className="font-semibold text-sm">{title}</h4>}
              {address && <p className="text-xs text-gray-600 mt-1">{address}</p>}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

// Main component that fetches the API key first
export const PropertyMap = ({ 
  latitude, 
  longitude, 
  title, 
  address,
  height = '300px' 
}: PropertyMapProps) => {
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
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading map...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !apiKey) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center text-center" style={{ height }}>
          <MapPin className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Map unavailable</p>
          {address && (
            <p className="text-sm text-muted-foreground mt-1">{address}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Only render the map component after we have the API key
  return (
    <PropertyMapInner
      latitude={latitude}
      longitude={longitude}
      title={title}
      address={address}
      height={height}
      apiKey={apiKey}
    />
  );
};
