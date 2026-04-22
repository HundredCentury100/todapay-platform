import { Skeleton } from "@/components/ui/skeleton";

export const BookingCheckoutSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    {/* Progress Stepper Skeleton */}
    <div className="flex items-center justify-between px-4 py-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          {i < 5 && <Skeleton className="h-0.5 w-8 md:w-16" />}
        </div>
      ))}
    </div>

    {/* Alert Skeleton */}
    <Skeleton className="h-16 w-full rounded-2xl" />

    {/* Booking Summary Card Skeleton */}
    <div className="rounded-3xl border-0 shadow-lg overflow-hidden">
      <div className="p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-7 w-24 ml-auto" />
            <Skeleton className="h-3 w-12 ml-auto" />
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Route Details */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>

        {/* Passenger Details */}
        <div className="border-t pt-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Payment Section Skeleton */}
    <div className="rounded-3xl border-0 shadow-lg p-4 space-y-4">
      <Skeleton className="h-6 w-24" />
      
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        ))}
      </div>

      <Skeleton className="h-14 w-full rounded-full mt-4" />
    </div>
  </div>
);

export const PaymentMethodsSkeleton = () => (
  <div className="space-y-3 animate-in fade-in duration-300">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    ))}
  </div>
);
