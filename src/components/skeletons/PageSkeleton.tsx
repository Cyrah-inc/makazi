import { Skeleton } from '@/components/ui/skeleton';

/** Full-page skeleton fallback for Suspense (replaces the spinner in App.tsx) */
export function PageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar skeleton */}
      <div className="h-16 border-b border-border bg-background flex items-center px-6 gap-8">
        <Skeleton className="h-8 w-28" />
        <div className="hidden md:flex gap-4 flex-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-9 w-20 rounded-md ml-auto" />
      </div>
      {/* Content area skeleton */}
      <div className="flex-1 container py-12 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
