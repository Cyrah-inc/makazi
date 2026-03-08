import { useRef, useState, useEffect, useCallback } from 'react';
import { Property } from '@/types/property';
import PropertyCard from './PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PropertyCarouselProps {
  properties: Property[];
  title: string;
  subtitle?: string;
  seeAllLink?: string;
  seeAllLabel?: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const PropertyCarousel = ({
  properties,
  title,
  subtitle,
  seeAllLink,
  seeAllLabel = 'See all',
  isLoading = false,
  icon,
}: PropertyCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, properties]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(':scope > div')?.clientWidth ?? 300;
    el.scrollBy({ left: dir === 'left' ? -cardWidth * 2 : cardWidth * 2, behavior: 'smooth' });
  };

  // Don't render if not loading and no properties
  if (!isLoading && properties.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
            </div>
            {subtitle && <p className="text-muted-foreground text-sm md:text-base">{subtitle}</p>}
          </div>
          {seeAllLink && (
            <Link
              to={seeAllLink}
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
            >
              {seeAllLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Carousel */}
        <div className="relative group/carousel">
          {/* Scroll arrows — desktop only */}
          {canScrollLeft && (
            <Button
              variant="outline"
              size="icon"
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 rounded-full shadow-lg bg-card/90 backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {canScrollRight && (
            <Button
              variant="outline"
              size="icon"
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 rounded-full shadow-lg bg-card/90 backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-[300px] shrink-0 snap-start">
                    <div className="bg-card rounded-2xl overflow-hidden shadow-md">
                      <Skeleton className="aspect-[4/3] w-full" />
                      <div className="p-4 space-y-3 min-h-[180px]">
                        <Skeleton className="h-7 w-28" />
                        <Skeleton className="h-5 w-3/4" />
                        <div className="flex items-start gap-1.5">
                          <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-0.5" />
                          <div className="space-y-1 flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2 border-t border-border">
                          <Skeleton className="h-4 w-14" />
                          <Skeleton className="h-4 w-14" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              : properties.map((property, index) => (
                  <div
                    key={property.id}
                    className={cn(
                      "w-[300px] shrink-0 snap-start animate-fade-in-up opacity-0"
                    )}
                    style={{ animationDelay: `${Math.min(index * 40, 160)}ms`, animationFillMode: 'forwards' }}
                  >
                    <PropertyCard property={property} />
                  </div>
                ))}
          </div>
        </div>

        {/* Mobile "See all" link */}
        {seeAllLink && (
          <Link
            to={seeAllLink}
            className="sm:hidden flex items-center justify-center gap-1 mt-4 text-sm font-medium text-primary hover:underline"
          >
            {seeAllLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  );
};

export default PropertyCarousel;
