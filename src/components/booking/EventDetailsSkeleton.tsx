import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const EventDetailsSkeleton = () => (
  <div className="min-h-screen bg-background animate-in fade-in duration-500">
    {/* Hero Skeleton */}
    <div className="relative h-72 md:h-96">
      <Skeleton className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      
      {/* Share button */}
      <div className="absolute top-4 right-4 z-10">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      
      {/* Hero content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <Skeleton className="h-6 w-24 rounded-full mb-2" /> {/* Category badge */}
        <Skeleton className="h-8 w-4/5 mb-2" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>

    {/* Countdown Skeleton */}
    <div className="px-4 py-4">
      <Card className="p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-10 w-10 rounded-lg mb-1" />
                <Skeleton className="h-3 w-8 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>

    {/* Main Content */}
    <div className="px-4 pb-24 space-y-6">
      {/* Tabs Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />
        ))}
      </div>

      {/* Ticket Tiers Skeleton */}
      <div>
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 w-36 shrink-0">
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-7 w-24 mb-1" />
              <Skeleton className="h-4 w-16" />
            </Card>
          ))}
        </div>
      </div>

      {/* Seat Map Skeleton */}
      <Card className="p-4">
        <Skeleton className="h-6 w-40 mb-4" />
        
        {/* Stage */}
        <Skeleton className="h-10 w-32 mx-auto rounded-lg mb-6" />
        
        {/* Seat rows */}
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center justify-center gap-1">
              <Skeleton className="h-4 w-4 mr-2" />
              {Array.from({ length: 10 }).map((_, seatIndex) => (
                <Skeleton key={seatIndex} className="h-7 w-7 rounded" />
              ))}
              <Skeleton className="h-4 w-4 ml-2" />
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      </Card>

      {/* Event Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <Skeleton className="h-5 w-24 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Card>
        <Card className="p-4">
          <Skeleton className="h-5 w-20 mb-3" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </Card>
      </div>
    </div>

    {/* Bottom CTA Skeleton */}
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="bg-background border-t px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-12 w-36 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);
