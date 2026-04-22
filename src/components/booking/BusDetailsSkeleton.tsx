import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const BusDetailsSkeleton = () => (
  <div className="min-h-screen bg-background animate-in fade-in duration-500">
    {/* Hero Skeleton */}
    <div className="relative h-64 md:h-80">
      <Skeleton className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      
      {/* Back button placeholder */}
      <div className="absolute top-4 left-4 z-10">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      
      {/* Hero content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>

    {/* Route Card Skeleton */}
    <div className="px-4 -mt-6 relative z-20">
      <Card className="p-4 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </Card>
    </div>

    {/* Main Content */}
    <div className="px-4 py-6 space-y-4">
      {/* Tabs Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />
        ))}
      </div>

      {/* Seat Map Skeleton */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        
        {/* Seat grid */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-20 mx-auto" /> {/* Driver */}
          <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
            {Array.from({ length: 25 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-lg" />
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </Card>

      {/* Amenities Skeleton */}
      <Card className="p-4">
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </Card>
    </div>

    {/* Bottom CTA Skeleton */}
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="bg-background border-t px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);
