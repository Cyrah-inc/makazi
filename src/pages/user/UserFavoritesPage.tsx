import { useState, useEffect } from 'react';
import { UserLayout } from '@/components/user/UserLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Loader2, MapPin, Bed, Bath, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';

interface FavoriteProperty {
  id: string;
  title: string;
  property_type: 'sale' | 'rent' | 'airbnb';
  price: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  state: string | null;
  images: string[];
  status: string;
}

export default function UserFavoritesPage() {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavoritesContext();
  const [properties, setProperties] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favorites.length > 0) {
      fetchFavoriteProperties();
    } else {
      setProperties([]);
      setLoading(false);
    }
  }, [favorites]);

  const fetchFavoriteProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('id, title, property_type, price, bedrooms, bathrooms, city, state, images, status')
      .in('id', favorites);

    if (error) {
      console.error('Error fetching favorite properties:', error);
    } else {
      setProperties(data as FavoriteProperty[]);
    }
    setLoading(false);
  };

  const formatPrice = (price: number, type: string) => {
    const formatted = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(price);
    
    if (type === 'rent') return `${formatted}/mo`;
    if (type === 'airbnb') return `${formatted}/night`;
    return formatted;
  };

  const typeLabels: Record<string, string> = {
    sale: 'For Sale',
    rent: 'For Rent',
    airbnb: 'Airbnb',
  };

  return (
    <UserLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Saved Properties</h1>
          <p className="text-muted-foreground mt-1">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} saved
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Saved Properties</h3>
              <p className="text-muted-foreground mb-4">
                When you save properties, they'll appear here for quick access.
              </p>
              <Link to="/">
                <Button>Browse Properties</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden group">
                <div className="relative aspect-[4/3] bg-muted">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={getOptimizedImageUrl(property.images[0], IMAGE_SIZES.CARD.width, IMAGE_SIZES.CARD.quality)}
                      alt={property.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="capitalize">
                      {typeLabels[property.property_type]}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm hover:bg-card text-destructive"
                    onClick={() => toggleFavorite(property.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-heading font-bold text-primary">
                      {formatPrice(property.price, property.property_type)}
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold text-foreground line-clamp-1">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{property.city}{property.state ? `, ${property.state}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <Bed className="h-4 w-4" />
                      <span>{property.bedrooms} Beds</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bath className="h-4 w-4" />
                      <span>{property.bathrooms} Baths</span>
                    </div>
                  </div>
                  <Link to={`/property/${property.id}`}>
                    <Button variant="outline" className="w-full mt-2 gap-2">
                      <Eye className="h-4 w-4" />
                      View Property
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
