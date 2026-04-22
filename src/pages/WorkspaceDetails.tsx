import { useState, useEffect } from "react";
import { ServiceProgressBar } from "@/components/booking/ServiceProgressBar";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import Footer from "@/components/Footer";
import { getWorkspaceById, WorkspaceData } from "@/services/workspaceService";
import { WorkspaceBookingForm } from "@/components/workspace/WorkspaceBookingForm";
import { WorkspaceAvailabilityCalendar } from "@/components/workspace/WorkspaceAvailabilityCalendar";
import { WorkspaceReviews } from "@/components/workspace/WorkspaceReviews";
import { WorkspaceReviewDialog } from "@/components/workspace/WorkspaceReviewDialog";
import { WorkspaceHeroGrid } from "@/components/workspace/WorkspaceHeroGrid";
import { WorkspaceHostCard } from "@/components/workspace/WorkspaceHostCard";
import { WorkspaceAmenityGrid } from "@/components/workspace/WorkspaceAmenityGrid";
import { WorkspaceRatingBreakdown } from "@/components/workspace/WorkspaceRatingBreakdown";
import { WorkspacePriceComparison } from "@/components/workspace/WorkspacePriceComparison";
import WorkspaceNearbyAttractions from "@/components/workspace/WorkspaceNearbyAttractions";
import SimilarWorkspaces from "@/components/workspace/SimilarWorkspaces";
import WorkspaceShareCard from "@/components/workspace/WorkspaceShareCard";
import WorkspaceTrustBanner from "@/components/workspace/WorkspaceTrustBanner";
import { RecurringBookingForm } from "@/components/recurring/RecurringBookingForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspaceDetailsSkeleton } from "@/components/ui/detail-page-skeletons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { MapPin, Users, Clock, CalendarClock, ChevronUp, Star } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PremiumDetailSection, PremiumInfoGrid } from "@/components/premium";
import { PropertyLocationMap } from "@/components/maps/PropertyLocationMap";
import { PremiumCTADrawerTrigger } from "@/components/premium/PremiumStickyCTA";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const WorkspaceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    if (id) {
      fetchWorkspace();
    }
  }, [id]);

  const fetchWorkspace = async () => {
    setIsLoading(true);
    try {
      const data = await getWorkspaceById(id!);
      setWorkspace(data);
    } catch (error) {
      console.error("Error fetching workspace:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch review stats
  const { data: reviewStats } = useQuery({
    queryKey: ['workspace-review-stats', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('workspace_reviews')
        .select('rating')
        .eq('workspace_id', id!);
      if (!data || data.length === 0) return { avg: 0, count: 0 };
      const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
      return { avg, count: data.length };
    },
    enabled: !!id,
  });

  // Fetch host info
  const { data: hostInfo } = useQuery({
    queryKey: ['workspace-host-info', workspace?.merchant_profile_id],
    queryFn: async () => {
      if (!workspace?.merchant_profile_id) return null;
      const { data: profile } = await supabase
        .from('merchant_profiles')
        .select('business_name')
        .eq('id', workspace.merchant_profile_id)
        .single();
      const { count } = await supabase
        .from('workspaces')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_profile_id', workspace.merchant_profile_id);
      return {
        name: profile?.business_name || 'Host',
        totalSpaces: count || 1,
      };
    },
    enabled: !!workspace?.merchant_profile_id,
  });

  if (isLoading) {
    return <WorkspaceDetailsSkeleton />;
  }

  if (!workspace) {
    return (
      <MobileAppLayout hideNav>
        <main className="flex-1 container mx-auto px-4 py-6 flex items-center justify-center">
          <p className="text-muted-foreground">Workspace not found</p>
        </main>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout hideNav className="pb-24 md:pb-0">
      <main className="flex-1 container mx-auto px-4 py-4 md:py-6">
        <BackButton className="mb-2" fallbackPath="/workspaces" />
        <ServiceProgressBar currentStep={3} className="mb-4" />
        
        {/* Hero Image Grid */}
        <WorkspaceHeroGrid
          images={workspace.images?.length ? workspace.images : ["/placeholder.svg"]}
          workspaceName={workspace.name}
          workspaceType={workspace.workspace_type}
          workspaceId={workspace.id}
          onShowGallery={() => setShowGallery(true)}
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{workspace.name}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{workspace.address}, {workspace.city}, {workspace.country}</span>
                  </div>
                  {reviewStats && reviewStats.count > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{reviewStats.avg.toFixed(1)}</span>
                      <span className="text-muted-foreground">· {reviewStats.count} reviews</span>
                    </div>
                  )}
                </div>
                <WorkspaceShareCard
                  name={workspace.name}
                  workspaceType={workspace.workspace_type}
                  city={workspace.city}
                  country={workspace.country}
                  capacity={workspace.capacity}
                  hourlyRate={workspace.hourly_rate}
                  image={workspace.images?.[0]}
                />
              </div>
            </motion.div>

            {/* Trust Banner */}
            <WorkspaceTrustBanner />

            {/* Quick Info Grid */}
            <PremiumInfoGrid
              items={[
                { icon: Users, label: "Capacity", value: `${workspace.capacity} people` },
                { icon: Clock, label: "Min Booking", value: "1 hour" },
              ]}
              columns={2}
            />

            {/* Host Card */}
            {hostInfo && (
              <WorkspaceHostCard
                hostName={hostInfo.name}
                totalSpaces={hostInfo.totalSpaces}
                reviewCount={reviewStats?.count}
                reviewScore={reviewStats?.avg}
              />
            )}

            {/* Description */}
            {workspace.description && (
              <PremiumDetailSection title="About this space" delay={0.1}>
                <p className="text-muted-foreground leading-relaxed">{workspace.description}</p>
              </PremiumDetailSection>
            )}

            {/* Categorized Amenities */}
            <WorkspaceAmenityGrid amenities={workspace.amenities} />

            {/* Price Comparison */}
            <WorkspacePriceComparison
              hourlyRate={workspace.hourly_rate}
              dailyRate={workspace.daily_rate}
              weeklyRate={workspace.weekly_rate}
              monthlyRate={workspace.monthly_rate}
            />

            {/* Operating Hours */}
            <PremiumDetailSection title="Operating Hours" icon={Clock} delay={0.2}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(workspace.operating_hours || {}).map(([day, hours]) => (
                  <div key={day} className="flex justify-between p-2 rounded-lg bg-muted/30">
                    <span className="capitalize text-muted-foreground">{day}</span>
                    <span className="font-medium">{hours ? `${hours.open} - ${hours.close}` : "Closed"}</span>
                  </div>
                ))}
              </div>
            </PremiumDetailSection>

            {/* Availability */}
            <WorkspaceAvailabilityCalendar workspace={workspace} />

            {/* Rating Breakdown */}
            {reviewStats && reviewStats.count > 0 && (
              <PremiumDetailSection title="Guest Reviews" delay={0.25}>
                <WorkspaceRatingBreakdown
                  overallRating={reviewStats.avg}
                  totalReviews={reviewStats.count}
                />
              </PremiumDetailSection>
            )}

            {/* Reviews */}
            <WorkspaceReviews workspaceId={workspace.id} />

            {/* Location Map */}
            <PropertyLocationMap
              address={workspace.address}
              city={workspace.city}
              country={workspace.country}
              latitude={workspace.latitude}
              longitude={workspace.longitude}
              propertyName={workspace.name}
            />

            {/* What's Nearby */}
            <WorkspaceNearbyAttractions city={workspace.city} />

            {/* Similar Workspaces */}
            <SimilarWorkspaces
              currentWorkspaceId={workspace.id}
              city={workspace.city}
              workspaceType={workspace.workspace_type}
            />

            {/* Leave a Review */}
            <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Leave a Review</h2>
                    <p className="text-sm text-muted-foreground">Share your experience with this workspace</p>
                  </div>
                  <WorkspaceReviewDialog
                    workspaceId={workspace.id}
                    workspaceName={workspace.name}
                    trigger={
                      <Button className="shadow-lg shadow-primary/20">
                        Write Review
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recurring Booking */}
            <Card className="bg-gradient-to-br from-card to-secondary/5 border-secondary/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-secondary/10">
                        <CalendarClock className="h-4 w-4 text-secondary-foreground" />
                      </div>
                      Recurring Booking
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Book this workspace on a regular schedule
                    </p>
                  </div>
                  <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-secondary/30 hover:bg-secondary/10">
                        <CalendarClock className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Set Up Recurring Booking</DialogTitle>
                      </DialogHeader>
                      <RecurringBookingForm
                        resourceType="workspace"
                        resourceId={workspace.id}
                        resourceName={workspace.name}
                        pricePerHour={workspace.hourly_rate}
                        onSuccess={() => setShowRecurringDialog(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar (hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-4"
            >
              <WorkspaceBookingForm workspace={workspace} />
            </motion.div>
          </div>
        </div>
      </main>
      <div className="hidden md:block"><Footer /></div>

      {/* Mobile Sticky CTA with Drawer */}
      <div className="lg:hidden">
        <Drawer open={isBookingDrawerOpen} onOpenChange={setIsBookingDrawerOpen}>
          <PremiumCTADrawerTrigger
            price={workspace.hourly_rate ? convertPrice(workspace.hourly_rate) : "Contact"}
            priceLabel={workspace.hourly_rate ? "/hr" : ""}
            ctaText="Book Now"
            subText="From"
          >
            <DrawerTrigger asChild>
              <Button 
                size="lg" 
                className="rounded-xl px-6 shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/80"
              >
                <span className="flex items-center gap-1">
                  Book Now <ChevronUp className="h-4 w-4" />
                </span>
              </Button>
            </DrawerTrigger>
          </PremiumCTADrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Book {workspace.name}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto">
              <WorkspaceBookingForm workspace={workspace} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </MobileAppLayout>
  );
};

export default WorkspaceDetails;
