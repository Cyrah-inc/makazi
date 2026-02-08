import { Property } from '@/types/property';
import PropertyCard from './PropertyCard';
import PropertyCardSkeleton from './PropertyCardSkeleton';
import { TransportMode } from './CommuteChecker';

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
  // Near me
  distances?: Record<string, number>;
  showDistanceBadge?: boolean;
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
}: PropertyGridProps) => {
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
            <PropertyCardSkeleton key={i} />
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

  return (
    <div className="space-y-8">
      {(title || subtitle) && (
        <div className="space-y-2">
          {title && <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{title}</h2>}
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {properties.map((property, index) => (
          <div 
            key={property.id} 
            className="animate-fade-in-up opacity-0"
            style={{ animationDelay: `${Math.min(index * 50, 400)}ms`, animationFillMode: 'forwards' }}
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
        ))}
      </div>
    </div>
  );
};

export default PropertyGrid;
