import { Skeleton } from '@/components/ui/skeleton';

const PropertyCardSkeleton = () => {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-md">
      {/* Image skeleton */}
      <Skeleton className="aspect-[4/3] w-full rounded-none" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Price */}
        <Skeleton className="h-6 w-28" />

        {/* Title */}
        <Skeleton className="h-5 w-3/4" />

        {/* Location */}
        <Skeleton className="h-4 w-1/2" />

        {/* Features */}
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14 ml-auto" />
        </div>
      </div>
    </div>
  );
};

export default PropertyCardSkeleton;
