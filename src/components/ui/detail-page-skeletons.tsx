import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import MobileAppLayout from "@/components/MobileAppLayout";

// Stay Details Skeleton - matches PropertyDetails layout
export const StayDetailsSkeleton = () => (
  <MobileAppLayout hideNav>
    <main className="flex-1 container mx-auto px-4 py-4 md:py-6 animate-in fade-in duration-500">
      {/* Back button */}
      <Skeleton className="h-10 w-24 rounded-full mb-4" />
      
      {/* Hero Image Gallery */}
      <div className="relative h-56 sm:h-64 md:h-96 rounded-2xl overflow-hidden mb-6">
        <Skeleton className="absolute inset-0" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-2 h-2 rounded-full" />
          ))}
        </div>
        <Skeleton className="absolute top-4 left-4 h-6 w-20 rounded-full" />
        <div className="absolute top-4 right-4 flex gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <Skeleton className="h-9 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2 mb-4" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-5 w-5 rounded" />
              ))}
            </div>
          </div>

          {/* Description Card */}
          <Card className="rounded-2xl">
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>

          {/* Amenities Card */}
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rooms Section */}
          <div className="space-y-4">
            <Skeleton className="h-7 w-32" />
            {[1, 2].map((i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-4 flex gap-4">
                  <Skeleton className="h-24 w-32 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-6 w-20 ml-auto" />
                    <Skeleton className="h-10 w-24 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    </main>

    {/* Mobile CTA */}
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background border-t p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-12 w-32 rounded-full" />
      </div>
    </div>
  </MobileAppLayout>
);

// Experience Details Skeleton
export const ExperienceDetailsSkeleton = () => (
  <div className="min-h-screen bg-background pb-32 animate-in fade-in duration-500">
    {/* Hero Image */}
    <div className="relative h-72">
      <Skeleton className="absolute inset-0" />
      <div className="absolute top-4 left-4">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="absolute top-4 right-4 flex gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-2 w-2 rounded-full" />
        ))}
      </div>
    </div>

    {/* Content */}
    <div className="px-4 py-6 space-y-6">
      {/* Badges */}
      <div className="flex gap-2 mb-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      
      {/* Title */}
      <Skeleton className="h-8 w-3/4" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Quick Stats */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>

      {/* Host Card */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-5 w-5" />
        </CardContent>
      </Card>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* What's Included */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>

      {/* Date Selection */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-28" />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-20 rounded-xl shrink-0" />
          ))}
        </div>
      </div>

      {/* Guests */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-16" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-6 w-8" />
          <Skeleton className="h-10 w-10 rounded" />
        </div>
      </div>
    </div>

    {/* Fixed Bottom Bar */}
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="space-y-1">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>
    </div>
  </div>
);

// Workspace Details Skeleton
export const WorkspaceDetailsSkeleton = () => (
  <MobileAppLayout hideNav>
    <main className="flex-1 container mx-auto px-4 py-4 md:py-6 animate-in fade-in duration-500">
      <Skeleton className="h-10 w-24 rounded-full mb-4" />
      
      {/* Image Gallery */}
      <div className="mb-6">
        <Skeleton className="aspect-video max-h-[500px] rounded-lg mb-2" />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-20 h-14 rounded shrink-0" />
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <Skeleton className="h-9 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          {/* Capacity */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Description Card */}
          <Card className="rounded-2xl">
            <CardContent className="pt-6 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <Skeleton className="h-5 w-24 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <Skeleton className="h-[500px] rounded-2xl" />
        </div>
      </div>
    </main>
  </MobileAppLayout>
);

// Venue Details Skeleton
export const VenueDetailsSkeleton = () => (
  <MobileAppLayout hideNav>
    <div className="container mx-auto px-4 py-4 md:py-6 space-y-6 animate-in fade-in duration-500">
      <Skeleton className="h-10 w-24 rounded-full" />
      
      {/* Hero Image */}
      <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden">
        <Skeleton className="absolute inset-0" />
        <Skeleton className="absolute top-4 left-4 h-6 w-24 rounded-full" />
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="w-20 h-16 rounded-lg shrink-0" />
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <Skeleton className="h-9 w-3/4 mb-2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-4 w-40 mt-1" />
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="rounded-xl">
                <CardContent className="p-4 text-center space-y-2">
                  <Skeleton className="h-5 w-5 mx-auto" />
                  <Skeleton className="h-6 w-12 mx-auto" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-20 rounded-md shrink-0" />
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden md:block space-y-6">
          <Skeleton className="h-[300px] rounded-2xl" />
          <Skeleton className="h-[200px] rounded-2xl" />
        </div>
      </div>
    </div>
  </MobileAppLayout>
);
