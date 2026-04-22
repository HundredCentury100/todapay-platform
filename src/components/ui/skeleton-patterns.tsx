import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  variant?: "default" | "horizontal" | "compact" | "feature" | "promo";
  className?: string;
}

/**
 * Reusable skeleton card patterns for loading states
 */
export const SkeletonCard = ({ variant = "default", className }: SkeletonCardProps) => {
  if (variant === "horizontal") {
    return (
      <div className={cn("flex gap-4 p-4 rounded-2xl bg-card border border-border/50", className)}>
        <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40", className)}>
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      </div>
    );
  }

  if (variant === "feature") {
    return (
      <div className={cn("rounded-3xl bg-secondary/30 overflow-hidden", className)}>
        <Skeleton className="w-full aspect-video" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "promo") {
    return (
      <div className={cn("rounded-3xl bg-muted overflow-hidden min-w-[280px] h-[140px]", className)}>
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  // Default vertical card
  return (
    <div className={cn("rounded-2xl bg-card border border-border/50 overflow-hidden", className)}>
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
};

/**
 * Grid of skeleton cards for list loading states
 */
interface SkeletonGridProps {
  count?: number;
  variant?: "default" | "horizontal" | "compact" | "feature";
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const SkeletonGrid = ({ 
  count = 6, 
  variant = "default",
  columns = 2,
  className 
}: SkeletonGridProps) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
};

/**
 * Horizontal scrollable skeleton list
 */
interface SkeletonCarouselProps {
  count?: number;
  itemWidth?: string;
  height?: string;
  variant?: "card" | "promo" | "event";
  className?: string;
}

export const SkeletonCarousel = ({ 
  count = 4, 
  itemWidth = "w-44",
  height = "h-48",
  variant = "card",
  className 
}: SkeletonCarouselProps) => {
  if (variant === "promo") {
    return (
      <div className={cn("flex gap-3 overflow-hidden px-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="min-w-[280px] h-[140px] rounded-3xl shrink-0" />
        ))}
      </div>
    );
  }

  if (variant === "event") {
    return (
      <div className={cn("flex gap-4 overflow-hidden px-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-44 shrink-0">
            <Skeleton className="w-full h-24 rounded-t-2xl" />
            <div className="p-3 space-y-2 bg-muted/30 rounded-b-2xl">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-4 overflow-hidden", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("shrink-0", itemWidth)}>
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
};

/**
 * Section skeleton with header
 */
interface SkeletonSectionProps {
  title?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const SkeletonSection = ({ 
  title = true, 
  children, 
  className 
}: SkeletonSectionProps) => (
  <div className={cn("space-y-4", className)}>
    {title && (
      <div className="flex items-center justify-between px-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
    )}
    {children}
  </div>
);

/**
 * Activity/list item skeleton for simple lists
 */
export const SkeletonListItem = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-4 p-3 rounded-2xl bg-secondary/30", className)}>
    <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="w-5 h-5 rounded shrink-0" />
  </div>
);

/**
 * Stats/metrics skeleton
 */
export const SkeletonStats = ({ count = 4, className }: { count?: number; className?: string }) => (
  <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-4 rounded-2xl bg-card border border-border/50">
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
    ))}
  </div>
);

/**
 * Form skeleton for input forms
 */
export const SkeletonForm = ({ fields = 4, className }: { fields?: number; className?: string }) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    ))}
    <Skeleton className="h-12 w-full rounded-full mt-6" />
  </div>
);

/**
 * Wallet widget skeleton
 */
export const SkeletonWallet = ({ className }: { className?: string }) => (
  <div className={cn("rounded-3xl bg-muted overflow-hidden p-5", className)}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-28" />
        </div>
      </div>
      <Skeleton className="h-9 w-20 rounded-full" />
    </div>
    <div className="flex gap-3">
      <Skeleton className="flex-1 h-12 rounded-2xl" />
      <Skeleton className="flex-1 h-12 rounded-2xl" />
      <Skeleton className="flex-1 h-12 rounded-2xl" />
    </div>
  </div>
);

/**
 * Service grid skeleton
 */
export const SkeletonServiceGrid = ({ className }: { className?: string }) => (
  <div className={cn("rounded-3xl bg-card border border-border/30 p-4", className)}>
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2.5 py-3">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Quick actions skeleton (horizontal scroll)
 */
export const SkeletonQuickActions = ({ count = 8, className }: { count?: number; className?: string }) => (
  <div className={cn("flex gap-3 overflow-hidden", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex flex-col items-center gap-2 min-w-[72px]">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <Skeleton className="h-3 w-12" />
      </div>
    ))}
  </div>
);

/**
 * Search bar skeleton
 */
export const SkeletonSearchBar = ({ className }: { className?: string }) => (
  <Skeleton className={cn("h-14 w-full rounded-2xl", className)} />
);

/**
 * Page header skeleton
 */
export const SkeletonPageHeader = ({ className }: { className?: string }) => (
  <div className={cn("space-y-2", className)}>
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-64" />
  </div>
);

/**
 * Hero section skeleton
 */
export const SkeletonHero = ({ className }: { className?: string }) => (
  <div className={cn("space-y-4", className)}>
    <Skeleton className="w-full aspect-[16/9] rounded-3xl" />
    <div className="space-y-2 px-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  </div>
);
