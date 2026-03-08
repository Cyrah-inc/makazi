import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bed, Bath, Maximize, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/formatters';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { HeroProperty } from '@/hooks/useHeroProperties';
import { cn } from '@/lib/utils';

interface HeroCarouselProps {
  properties: HeroProperty[];
  isLoading: boolean;
}

const CATEGORY_CONFIG = {
  buy: { label: 'For Sale', className: 'bg-primary text-primary-foreground' },
  rent: { label: 'For Rent', className: 'bg-accent text-accent-foreground' },
  airbnb: { label: 'Airbnb', className: 'bg-gold text-gold-foreground' },
} as const;

const HeroCarousel = ({ properties, isLoading }: HeroCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  if (isLoading) {
    return (
      <div className="relative w-full h-[50vh] min-h-[360px] md:h-[65vh] md:min-h-[480px] bg-muted">
        <Skeleton className="w-full h-full rounded-none" />
      </div>
    );
  }

  if (properties.length === 0) return null;

  return (
    <section className="relative w-full group">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {properties.map((property, idx) => {
            const imgUrl = getOptimizedImageUrl(property.images[0], 1200);
            const cat = CATEGORY_CONFIG[property.heroCategory];

            return (
              <div
                key={property.id}
                className="relative flex-[0_0_100%] min-w-0 h-[50vh] min-h-[360px] md:h-[65vh] md:min-h-[480px]"
              >
                {/* Background image */}
                <img
                  src={imgUrl}
                  alt={property.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-end container pb-16 md:pb-20 px-4 sm:px-6">
                  <Badge className={cn('w-fit mb-3 text-xs font-semibold uppercase tracking-wider', cat.className)}>
                    {cat.label}
                  </Badge>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-2 line-clamp-2 max-w-2xl">
                    {property.title}
                  </h2>

                  <div className="flex items-center gap-1.5 text-white/80 mb-3">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="text-sm sm:text-base">{property.town}, {property.county}</span>
                  </div>

                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4">
                    {property.heroCategory === 'buy' && property.salePrice && formatPrice(property.salePrice)}
                    {property.heroCategory === 'rent' && property.monthlyRent && `${formatPrice(property.monthlyRent)}/mo`}
                    {property.heroCategory === 'airbnb' && property.nightlyRate && `${formatPrice(property.nightlyRate)}/night`}
                    {/* fallback */}
                    {!property.salePrice && !property.monthlyRent && !property.nightlyRate && formatPrice(0)}
                  </p>

                  {/* Quick stats */}
                  <div className="flex items-center gap-4 text-white/70 text-sm mb-5">
                    {property.bedrooms > 0 && (
                      <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{property.bedrooms} Beds</span>
                    )}
                    {property.bathrooms > 0 && (
                      <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{property.bathrooms} Baths</span>
                    )}
                    {property.size > 0 && (
                      <span className="flex items-center gap-1"><Maximize className="h-4 w-4" />{property.size} sqft</span>
                    )}
                  </div>

                  <Button asChild variant="hero" size="lg" className="w-fit rounded-xl">
                    <Link to={`/property/${property.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 transition opacity-0 group-hover:opacity-100"
        aria-label="Previous slide"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 transition opacity-0 group-hover:opacity-100"
        aria-label="Next slide"
      >
        <ArrowRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {properties.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={cn(
              'h-2 rounded-full transition-all',
              i === selectedIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
