import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  message?: string;
  className?: string;
}

export const PageLoader = ({ message = "Loading...", className }: PageLoaderProps) => (
  <div className={cn("flex flex-col items-center justify-center min-h-[50vh] gap-4", className)}>
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
  </div>
);

interface CardSkeletonProps {
  className?: string;
  showImage?: boolean;
  lines?: number;
}

export const CardSkeleton = ({ className, showImage = true, lines = 3 }: CardSkeletonProps) => (
  <div className={cn("rounded-lg border bg-card p-4 space-y-4", className)}>
    {showImage && <Skeleton className="h-40 w-full rounded-lg" />}
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === 0 ? "w-3/4" : i === lines - 1 ? "w-1/2" : "w-full")}
        />
      ))}
    </div>
  </div>
);

interface ListSkeletonProps {
  items?: number;
  className?: string;
}

export const ListSkeleton = ({ items = 5, className }: ListSkeletonProps) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20 shrink-0" />
      </div>
    ))}
  </div>
);

interface GridSkeletonProps {
  items?: number;
  columns?: number;
  className?: string;
}

export const GridSkeleton = ({ items = 6, columns = 2, className }: GridSkeletonProps) => (
  <div
    className={cn("grid gap-4", className)}
    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
  >
    {Array.from({ length: items }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton = ({ rows = 5, columns = 4, className }: TableSkeletonProps) => (
  <div className={cn("rounded-lg border bg-card overflow-hidden", className)}>
    {/* Header */}
    <div className="flex gap-4 p-4 bg-muted/50 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4 p-4 border-b last:border-0">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

interface InlineLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const InlineLoader = ({ className, size = "md" }: InlineLoaderProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />;
};

interface ButtonLoaderProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ButtonLoader = ({ loading, children, className }: ButtonLoaderProps) => (
  <span className={cn("inline-flex items-center gap-2", className)}>
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </span>
);
