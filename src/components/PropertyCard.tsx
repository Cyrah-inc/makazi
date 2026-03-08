import React, { memo, useState, useCallback } from 'react';
import { Property } from '@/types/property';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Bed, Bath, Car as CarIcon, Maximize, Eye, Star, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { type TransportMode } from './LocationFilterBar';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';

interface PropertyCardProps {
  property: Property;
  variant?: 'default' | 'featured' | 'compact';
  commuteTime?: number | null;
  commuteMode?: TransportMode;
  commuteDestination?: string;
  isLoadingCommute?: boolean;
  showCommuteBadge?: boolean;
  distanceKm?: number | null;
  showDistanceBadge?: boolean;
}

const PropertyCard = ({ 
  property, 
  variant = 'default',
  commuteTime,
  commuteMode = 'transit',
  commuteDestination = '',
  isLoadingCommute = false,
  showCommuteBadge = false,
  distanceKm,
  showDistanceBadge = false,
}: PropertyCardProps) => {
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const favorited = isFavorite(property.id);
  const images = property.images?.length ? property.images : [];
  const hasMultipleImages = images.length > 1;

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleDotClick = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  }, []);




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
  const showBadge = showDistanceBadge || showCommuteBadge;

  return (
    <Link to={`/property/${property.id}`} className="block group">
      <article 
        className={cn(
          "bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1",
          variant === 'featured' && "ring-2 ring-gold/30"
        )}
      >
        {/* Image Slideshow */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted group/image">
          {images.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
              <ImageOff className="w-8 h-8 mb-1" />
              <span className="text-xs">No image</span>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* Only render active image + preload adjacent */}
              {images.map((img, i) => {
                const isActive = i === currentIndex;
                const isAdjacent = i === (currentIndex + 1) % images.length || i === (currentIndex - 1 + images.length) % images.length;
                if (!isActive && !isAdjacent) return null;

                const url = getOptimizedImageUrl(img, IMAGE_SIZES.CARD.width, IMAGE_SIZES.CARD.quality);
                return (
                  <img
                    key={i}
                    src={url}
                    alt={`${property.title} - ${i + 1}`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    className={cn(
                      "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  />
                );
              })}

              {/* Prev/Next arrows */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity shadow-md hover:bg-card"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity shadow-md hover:bg-card"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Dot indicators */}
          {hasMultipleImages && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
              {images.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => handleDotClick(e, i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === currentIndex ? "w-3 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
                  )}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
              {images.length > 5 && (
                <span className="text-[9px] text-white/80 ml-0.5 self-center">+{images.length - 5}</span>
              )}
            </div>
          )}
          
          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
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
              "absolute top-3 right-3 h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card shadow-md z-10",
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
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-card/80 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-medium z-10">
            <Eye className="h-3.5 w-3.5" />
            {property.views.toLocaleString()}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Price and Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-heading font-bold text-primary">{price}</span>
              {label && <span className="text-sm text-muted-foreground">{label}</span>}
            </div>
          {showBadge && showDistanceBadge && distanceKm != null && (
              <Badge variant="secondary" className="text-xs">
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}
              </Badge>
            )}
            {showBadge && showCommuteBadge && commuteTime != null && commuteDestination && (
              <Badge variant="secondary" className="text-xs">
                {commuteTime} min
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-heading font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="block truncate">{property.address}</span>
              <span className="block truncate text-xs">{property.town}, {property.county}</span>
            </div>
          </div>

          {/* Features — always shown for uniform height */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border">
            <div className="flex items-center gap-1.5">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms || '—'} Beds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms || '—'} Baths</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <Maximize className="h-4 w-4" />
              <span>{property.size || '—'} m²</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default memo(PropertyCard);
