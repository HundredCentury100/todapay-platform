import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import { getWorkspaceById, WorkspaceData } from "@/services/workspaceService";
import { WorkspaceBookingForm } from "@/components/workspace/WorkspaceBookingForm";
import { WorkspaceDetailsSkeleton } from "@/components/ui/detail-page-skeletons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Clock, Star, Info, Calendar, MessageSquare, Share2, ArrowLeft } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceAmenityGrid } from "@/components/workspace/WorkspaceAmenityGrid";
import { WorkspaceReviews } from "@/components/workspace/WorkspaceReviews";
import { PropertyLocationMap } from "@/components/maps/PropertyLocationMap";
import { WorkspaceAvailabilityCalendar } from "@/components/workspace/WorkspaceAvailabilityCalendar";

const WorkspaceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

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

  if (isLoading) {
    return <WorkspaceDetailsSkeleton />;
  }

  if (!workspace) {
    return (
      <MobileAppLayout hideNav>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Workspace not found</p>
            <Button onClick={() => navigate('/workspaces')}>Browse Workspaces</Button>
          </div>
        </main>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout hideNav>
      {/* Hero Image */}
      <div className="relative w-full h-64 bg-muted">
        <img
          src={workspace.images?.[0] || "/placeholder.svg"}
          alt={workspace.name}
          className="w-full h-full object-cover"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 safe-area-pt bg-background/80 backdrop-blur-sm rounded-full"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 safe-area-pt bg-background/80 backdrop-blur-sm rounded-full"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Header Info */}
      <div className="px-4 py-4 border-b">
        <h1 className="text-2xl font-bold mb-2">{workspace.name}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4" />
          <span>{workspace.city}, {workspace.country}</span>
        </div>
        {reviewStats && reviewStats.count > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{reviewStats.avg.toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground">({reviewStats.count} reviews)</span>
          </div>
        )}
        {/* Quick Stats */}
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{workspace.capacity} people</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">1 hour min</span>
          </div>
        </div>
        {/* Price */}
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-sm text-muted-foreground">From</span>
              <span className="text-2xl font-bold text-primary ml-2">
                {workspace.hourly_rate ? convertPrice(workspace.hourly_rate) : 'Contact for pricing'}
              </span>
              {workspace.hourly_rate && <span className="text-sm text-muted-foreground ml-1">/hour</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
          <TabsTrigger
            value="overview"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Info className="h-4 w-4 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="book"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Book
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Reviews
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="overview" className="m-0 p-4 space-y-4">
            {/* Description */}
            {workspace.description && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">About this space</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{workspace.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Amenities</h3>
                <WorkspaceAmenityGrid amenities={workspace.amenities} />
              </CardContent>
            </Card>

            {/* Operating Hours */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Operating Hours</h3>
                <div className="space-y-2">
                  {Object.entries(workspace.operating_hours || {}).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-sm p-2 rounded bg-muted/30">
                      <span className="capitalize text-muted-foreground">{day}</span>
                      <span className="font-medium">{hours ? `${hours.open} - ${hours.close}` : "Closed"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Location</h3>
                <div className="h-48 bg-muted rounded-lg overflow-hidden">
                  <PropertyLocationMap
                    address={workspace.address}
                    city={workspace.city}
                    country={workspace.country}
                    latitude={workspace.latitude}
                    longitude={workspace.longitude}
                    propertyName={workspace.name}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">{workspace.address}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="book" className="m-0 p-4">
            <WorkspaceBookingForm workspace={workspace} />
          </TabsContent>

          <TabsContent value="reviews" className="m-0 p-4">
            <WorkspaceReviews workspaceId={workspace.id} />
          </TabsContent>
        </div>
      </Tabs>
    </MobileAppLayout>
  );
};

export default WorkspaceDetails;
