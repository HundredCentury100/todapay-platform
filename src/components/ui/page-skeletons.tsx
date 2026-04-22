import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ServiceGridSkeletonProps {
  items?: number;
  columns?: number;
  className?: string;
}

export const ServiceGridSkeleton = ({
  items = 6,
  columns = 3,
  className,
}: ServiceGridSkeletonProps) => (
  <div
    className={cn("grid gap-3", className)}
    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
  >
    {Array.from({ length: items }).map((_, i) => (
      <div
        key={i}
        className="flex flex-col items-center p-4 rounded-2xl bg-card border border-border/50"
      >
        <Skeleton className="w-14 h-14 rounded-2xl mb-3" />
        <Skeleton className="h-4 w-16 mb-1" />
        <Skeleton className="h-3 w-12" />
      </div>
    ))}
  </div>
);

interface TrendingSkeletonProps {
  items?: number;
  className?: string;
}

export const TrendingSkeleton = ({ items = 3, className }: TrendingSkeletonProps) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/50"
      >
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-5 shrink-0" />
      </div>
    ))}
  </div>
);

interface PaymentMethodsSkeletonProps {
  className?: string;
}

export const PaymentMethodsSkeleton = ({ className }: PaymentMethodsSkeletonProps) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: 2 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-5" />
      </div>
    ))}
  </div>
);

interface WalletHeaderSkeletonProps {
  className?: string;
}

export const WalletHeaderSkeleton = ({ className }: WalletHeaderSkeletonProps) => (
  <div className={cn("space-y-6", className)}>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 bg-primary-foreground/20" />
        <Skeleton className="h-10 w-32 bg-primary-foreground/20" />
      </div>
      <Skeleton className="h-14 w-14 rounded-2xl bg-primary-foreground/20" />
    </div>
    <div className="flex justify-between gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="flex-1 h-20 rounded-2xl bg-primary-foreground/20" />
      ))}
    </div>
  </div>
);

interface QuickActionSkeletonProps {
  items?: number;
  className?: string;
}

export const QuickActionSkeleton = ({ items = 3, className }: QuickActionSkeletonProps) => (
  <div className={cn("flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4", className)}>
    {Array.from({ length: items }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />
    ))}
  </div>
);

interface TransactionSkeletonProps {
  items?: number;
  className?: string;
}

export const TransactionSkeleton = ({ items = 3, className }: TransactionSkeletonProps) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 p-3 rounded-xl bg-card border"
      >
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    ))}
  </div>
);

interface BookingCardSkeletonProps {
  items?: number;
  className?: string;
}

export const BookingCardSkeleton = ({ items = 3, className }: BookingCardSkeletonProps) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div
        key={i}
        className="bg-card rounded-2xl border border-border/50 p-4"
      >
        <div className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <Skeleton className="h-5 w-5 shrink-0" />
        </div>
      </div>
    ))}
  </div>
);
