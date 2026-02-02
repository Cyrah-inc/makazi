import { Property } from '@/types/property';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Bed, Bath, Car as CarIcon, Maximize, Eye, Star } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import CommuteBadge from './CommuteBadge';
import { TransportMode } from './CommuteChecker';

interface PropertyCardProps {
  property: Property;
  variant?: 'default' | 'featured' | 'compact';
  commuteTime?: number | null;
  commuteMode?: TransportMode;
  commuteDestination?: string;
  isLoadingCommute?: boolean;
}

const PropertyCard = ({ 
  property, 
  variant = 'default',
  commuteTime,
  commuteMode = 'transit',
  commuteDestination = '',
  isLoadingCommute = false,
}: PropertyCardProps) => {
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const [imageLoaded, setImageLoaded] = useState(false);
  const favorited = isFavorite(property.id);

  const getPrice = () => {
    if (property.purposes.includes('buy') && property.salePrice) {
      return { price: formatPrice(property.salePrice), label: '' };
    }
    if (property.purposes.includes('rent') && property.monthlyRent) {
      return { price: formatPrice(property.monthlyRent), label: '/mo' };
    }
    if (property.purposes.includes('airbnb') && property.nightlyRate) {
      return { price: formatPrice(property.nightlyRate), label: '/night' };
    }
    return { price: 'Price on request', label: '' };
  };

  const { price, label } = getPrice();

  return (
    <Link to={`/property/${property.id}`} className="block group">
      <article 
        className={cn(
          "bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1",
          variant === 'featured' && "ring-2 ring-gold/30"
        )}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={property.images[0]}
            alt={property.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {property.featured && (
              <Badge variant="featured" className="gap-1">
                <Star className="h-3 w-3 fill-current" />
                Featured
              </Badge>
            )}
            {property.purposes.map((p) => (
              <Badge key={p} variant={p}>
                {p === 'buy' ? 'For Sale' : p === 'rent' ? 'For Rent' : 'Airbnb'}
              </Badge>
            ))}
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-3 right-3 h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card shadow-md",
              favorited && "text-airbnb"
            )}
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(property.id);
            }}
          >
            <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
          </Button>

          {/* Views */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-card/80 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-medium">
            <Eye className="h-3.5 w-3.5" />
            {property.views.toLocaleString()}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Price and Commute Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-heading font-bold text-primary">{price}</span>
              {label && <span className="text-sm text-muted-foreground">{label}</span>}
            </div>
            {(commuteTime !== undefined || isLoadingCommute) && commuteDestination && (
              <CommuteBadge
                minutes={commuteTime ?? null}
                mode={commuteMode}
                destination={commuteDestination}
                isLoading={isLoadingCommute}
              />
            )}
          </div>

          {/* Title */}
          <h3 className="font-heading font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{property.town}, {property.county}</span>
          </div>

          {/* Features */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border">
            {property.bedrooms > 0 && (
              <div className="flex items-center gap-1.5">
                <Bed className="h-4 w-4" />
                <span>{property.bedrooms} Beds</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center gap-1.5">
                <Bath className="h-4 w-4" />
                <span>{property.bathrooms} Baths</span>
              </div>
            )}
            {property.parkingSpaces > 0 && (
              <div className="flex items-center gap-1.5">
                <CarIcon className="h-4 w-4" />
                <span>{property.parkingSpaces}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <Maximize className="h-4 w-4" />
              <span>{property.size} m²</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default PropertyCard;
