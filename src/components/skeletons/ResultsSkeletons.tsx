import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/** Skeleton for bus/transport result cards */
export const BusResultCardSkeleton = () => (
  <Card className="p-4 rounded-2xl space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16" />
      <div className="space-y-1 text-right">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <div className="flex items-center gap-2">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-6 w-14 rounded-full" />
      ))}
    </div>
  </Card>
);

/** Skeleton for event result cards */
export const EventResultCardSkeleton = () => (
  <Card className="overflow-hidden rounded-2xl">
    <Skeleton className="h-44 w-full" />
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-4/5" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </Card>
);

/** Skeleton for stay/property result cards */
export const StayResultCardSkeleton = () => (
  <Card className="overflow-hidden rounded-2xl">
    <Skeleton className="h-48 w-full" />
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-2/5" />
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-5 w-14 rounded-full" />
        ))}
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </Card>
);

/** Generic list of skeleton cards */
export const ResultsListSkeleton = ({ 
  Card: CardComponent, 
  count = 4 
}: { 
  Card: React.ComponentType; 
  count?: number;
}) => (
  <div className="space-y-3 skeleton-stagger animate-in fade-in duration-500">
    {Array.from({ length: count }).map((_, i) => (
      <CardComponent key={i} />
    ))}
  </div>
);

/** Generic grid of skeleton cards */
export const ResultsGridSkeleton = ({ 
  Card: CardComponent, 
  count = 6,
  cols = "grid-cols-1 md:grid-cols-2" 
}: { 
  Card: React.ComponentType; 
  count?: number;
  cols?: string;
}) => (
  <div className={`grid gap-4 ${cols} skeleton-stagger animate-in fade-in duration-500`}>
    {Array.from({ length: count }).map((_, i) => (
      <CardComponent key={i} />
    ))}
  </div>
);
