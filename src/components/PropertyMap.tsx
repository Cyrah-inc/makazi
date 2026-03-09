import { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

// Shared libraries constant — must match LocationPicker to prevent loader conflicts
const libraries: ("places")[] = ['places'];
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Satellite, Map, Navigation, ExternalLink, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
  height?: string;
  showDirections?: boolean;
}

const PropertyMapInner = ({ 
  latitude, longitude, title, address, height = '300px', apiKey, showDirections = false
}: PropertyMapProps & { apiKey: string }) => {
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'satellite' | 'street'>('map');
  const [gettingLocation, setGettingLocation] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
  });

  const containerStyle = { width: '100%', height: '100%', borderRadius: '0.5rem' };
  const center = { lat: latitude, lng: longitude };

  const onLoad = useCallback((map: google.maps.Map) => { setMap(map); }, []);

  const switchView = (mode: 'map' | 'satellite' | 'street') => {
    if (!map) return;
    const sv = map.getStreetView();
    if (mode === 'street') {
      sv.setPosition(center);
      sv.setPov({ heading: 0, pitch: 0 });
      sv.setVisible(true);
    } else {
      sv.setVisible(false);
      map.setMapTypeId(mode === 'satellite' ? 'hybrid' : 'roadmap');
    }
    setViewMode(mode);
  };

  // Sync state when user exits street view via Google's X button
  useEffect(() => {
    if (!map) return;
    const sv = map.getStreetView();
    const listener = sv.addListener('visible_changed', () => {
      if (!sv.getVisible() && viewMode === 'street') {
        setViewMode('map');
      }
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, viewMode]);

  const handleGetDirections = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`, '_blank');
      setGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${pos.coords.latitude},${pos.coords.longitude}&destination=${latitude},${longitude}&travelmode=driving`, '_blank');
        setGettingLocation(false);
      },
      () => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`, '_blank');
        setGettingLocation(false);
        toast({ title: 'Location unavailable', description: 'Opened directions without your current location.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (loadError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center text-center" style={{ height }}>
          <MapPin className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Map unavailable</p>
          {address && <p className="text-sm text-muted-foreground mt-1">{address}</p>}
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

  const viewButtons: { mode: 'map' | 'satellite' | 'street'; icon: React.ReactNode; label: string }[] = [
    { mode: 'map', icon: <Map className="w-3.5 h-3.5" />, label: 'Map' },
    { mode: 'satellite', icon: <Satellite className="w-3.5 h-3.5" />, label: 'Satellite' },
    { mode: 'street', icon: <Eye className="w-3.5 h-3.5" />, label: 'Street' },
  ];

  return (
    <div className="space-y-3">
      <div className="relative rounded-lg overflow-hidden border border-border" style={{ height }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={16}
          onLoad={onLoad}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            fullscreenControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            scaleControl: false,
            rotateControl: false,
            controlSize: 28,
            gestureHandling: 'cooperative',
            mapTypeId: viewMode === 'satellite' ? ('hybrid' as google.maps.MapTypeId) : ('roadmap' as google.maps.MapTypeId),
            styles: [
              { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            ],
          }}
        >
          <Marker position={center} onClick={() => setShowInfoWindow(true)} />
          {showInfoWindow && (title || address) && (
            <InfoWindow position={center} onCloseClick={() => setShowInfoWindow(false)}>
              <div className="p-1">
                {title && <h4 className="font-semibold text-sm">{title}</h4>}
                {address && <p className="text-xs text-gray-600 mt-1">{address}</p>}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* View Switcher */}
        <div className="absolute top-3 left-3 z-10 flex rounded-lg overflow-hidden shadow-md border border-border">
          {viewButtons.map(({ mode, icon, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => switchView(mode)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background/90 backdrop-blur-sm text-foreground hover:bg-muted'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {showDirections && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleGetDirections} disabled={gettingLocation} className="flex-1 gap-2" variant="default">
            {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            Get Directions
          </Button>
          <Button variant="outline" className="gap-2"
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank')}>
            <ExternalLink className="h-4 w-4" />
            Open in Maps
          </Button>
        </div>
      )}
    </div>
  );
};

export const PropertyMap = ({ 
  latitude, longitude, title, address, height = '300px', showDirections = false
}: PropertyMapProps) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-maps-key');
        if (error) { setError('Failed to load Google Maps'); return; }
        if (data?.apiKey) { setApiKey(data.apiKey); }
        else { setError('Google Maps API key not available'); }
      } catch { setError('Failed to load Google Maps'); }
      finally { setIsLoading(false); }
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
          {address && <p className="text-sm text-muted-foreground mt-1">{address}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <PropertyMapInner
      latitude={latitude} longitude={longitude} title={title}
      address={address} height={height} apiKey={apiKey} showDirections={showDirections}
    />
  );
};
