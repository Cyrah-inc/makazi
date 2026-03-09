import { useState, useMemo } from 'react';
import { Property } from '@/types/property';
import PropertyCard from './PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TransportMode } from './LocationFilterBar';

interface PropertyGridProps {
  properties: Property[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  commuteTimes?: Record<string, number>;
  commuteMode?: TransportMode;
  commuteDestination?: string;
  isLoadingCommute?: boolean;
  showCommuteBadge?: boolean;
  isLoading?: boolean;
  distances?: Record<string, number>;
  showDistanceBadge?: boolean;
  priorityCount?: number;
  priorityLabel?: string;
  pageSize?: number;
}

const PropertyGrid = ({ 
  properties, 
  title, 
  subtitle, 
  emptyMessage = 'No properties found',
  commuteTimes,
  commuteMode,
  commuteDestination,
  isLoadingCommute,
  showCommuteBadge = false,
  isLoading = false,
  distances,
  showDistanceBadge = false,
  priorityCount,
  priorityLabel,
  pageSize = 16,
}: PropertyGridProps) => {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  if (isLoading) {
    return (
      <div className="space-y-8">
        {(title || subtitle) && (
          <div className="space-y-2">
            {title && <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{title}</h2>}
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-md">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4 space-y-3">
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
          ))}
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    );
  }

  const hasSections = priorityCount !== undefined && priorityCount > 0 && priorityCount < properties.length;
  const priorityProperties = hasSections ? properties.slice(0, priorityCount) : properties;
  const otherProperties = hasSections ? properties.slice(priorityCount) : [];

  const renderCard = (property: Property, index: number) => (
    <div 
      key={property.id} 
      className="animate-fade-in-up opacity-0"
      style={{ animationDelay: `${Math.min(index * 30, 150)}ms`, animationFillMode: 'forwards' }}
    >
      <PropertyCard 
        property={property}
        commuteTime={commuteTimes?.[property.id]}
        commuteMode={commuteMode}
        commuteDestination={commuteDestination}
        isLoadingCommute={isLoadingCommute}
        showCommuteBadge={showCommuteBadge}
        distanceKm={distances?.[property.id]}
        showDistanceBadge={showDistanceBadge}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {(title || subtitle) && (
        <div className="space-y-2">
          {title && <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{title}</h2>}
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {hasSections ? (
        <>
          {/* Matched section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary">{priorityLabel}</span>
              <span className="text-xs text-muted-foreground">({priorityCount} {priorityCount === 1 ? 'property' : 'properties'})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {priorityProperties.map((p, i) => renderCard(p, i))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">Other Properties</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Other section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {otherProperties.map((p, i) => renderCard(p, i + priorityCount!))}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.slice(0, visibleCount).map((property, index) => renderCard(property, index))}
          </div>
          {properties.length > visibleCount && (
            <div className="flex justify-center pt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setVisibleCount(prev => prev + pageSize)}
                className="min-w-[200px]"
              >
                Load More ({properties.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PropertyGrid;
