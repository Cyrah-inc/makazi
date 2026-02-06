import { useState } from 'react';
import { PropertyMap } from '@/components/PropertyMap';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Loader2, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BookingLocationMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
}

export function BookingLocationMap({ latitude, longitude, title, address }: BookingLocationMapProps) {
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleGetDirections = () => {
    setGettingLocation(true);

    if (!navigator.geolocation) {
      // Fallback: open Google Maps with just the destination
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`,
        '_blank'
      );
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: userLat, longitude: userLng } = position.coords;
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${latitude},${longitude}&travelmode=driving`,
          '_blank'
        );
        setGettingLocation(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        // Fallback: open without origin
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`,
          '_blank'
        );
        setGettingLocation(false);
        toast({
          title: 'Location unavailable',
          description: 'Opened directions without your current location. Allow location access for better directions.',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <PropertyMap
        latitude={latitude}
        longitude={longitude}
        title={title}
        address={address}
        height="250px"
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={handleGetDirections}
          disabled={gettingLocation}
          className="flex-1 gap-2"
          variant="default"
        >
          {gettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          Get Directions
        </Button>

        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
              '_blank'
            )
          }
        >
          <ExternalLink className="h-4 w-4" />
          Open in Maps
        </Button>
      </div>

      {address && (
        <p className="text-sm text-muted-foreground flex items-start gap-1.5">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
          {address}
        </p>
      )}
    </div>
  );
}
