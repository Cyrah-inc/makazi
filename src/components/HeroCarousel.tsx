import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/formatters';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { HeroProperty } from '@/hooks/useHeroProperties';
import HeroSearch from '@/components/HeroSearch';
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

  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  if (isLoading) {
    return (
      <div className="relative w-full h-[55vh] min-h-[420px] md:h-[70vh] md:min-h-[520px] bg-muted">
        <Skeleton className="w-full h-full rounded-none" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <section className="relative w-full h-[55vh] min-h-[420px] md:h-[70vh] md:min-h-[520px] bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col items-center gap-6 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white text-center">
            Find Your Perfect Home in Kenya
          </h1>
          <p className="text-white/70 text-center text-sm sm:text-base max-w-lg">
            Browse properties for sale, rent, or short stays across the country
          </p>
          <HeroSearch />
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full group">
      {/* Slideshow background */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {properties.map((property, idx) => {
            const imgUrl = getOptimizedImageUrl(property.images[0], 1200);

            return (
              <div
                key={property.id}
                className="relative flex-[0_0_100%] min-w-0 h-[55vh] min-h-[420px] md:h-[70vh] md:min-h-[520px]"
              >
                <img
                  src={imgUrl}
                  alt={property.title}
                  className="absolute inset-0 w-full h-full object-cover hero-ken-burns"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20 pointer-events-none" />

      {/* Centered search overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 pointer-events-none">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white text-center mb-2 drop-shadow-lg">
          Find Your Perfect Home in Kenya
        </h1>
        <p className="text-white/70 text-center text-sm sm:text-base mb-6 max-w-lg">
          Browse properties for sale, rent, or short stays across the country
        </p>
        <div className="pointer-events-auto w-full max-w-4xl">
          <HeroSearch />
        </div>
      </div>

      {/* Bottom strip: badge + price for current slide */}
      {properties[selectedIndex] && (() => {
        const p = properties[selectedIndex];
        const cat = CATEGORY_CONFIG[p.heroCategory];
        const price =
          p.heroCategory === 'buy' && p.salePrice ? formatPrice(p.salePrice) :
          p.heroCategory === 'rent' && p.monthlyRent ? `${formatPrice(p.monthlyRent)}/mo` :
          p.heroCategory === 'airbnb' && p.nightlyRate ? `${formatPrice(p.nightlyRate)}/night` :
          null;

        return (
          <div className="absolute bottom-10 left-4 sm:left-6 z-10 flex items-center gap-3">
            <Badge className={cn('text-xs font-semibold uppercase tracking-wider', cat.className)}>
              {cat.label}
            </Badge>
            {price && (
              <span className="text-white font-bold text-sm sm:text-base drop-shadow-md">
                {price}
              </span>
            )}
          </div>
        );
      })()}

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
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
