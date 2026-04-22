import { useState, useEffect } from "react";
import { ServiceProgressBar } from "@/components/booking/ServiceProgressBar";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MobileAppLayout from "@/components/MobileAppLayout";
import Footer from "@/components/Footer";
import VenueAvailabilityCalendar from "@/components/venue/VenueAvailabilityCalendar";
import VenueBookingForm from "@/components/venue/VenueBookingForm";
import VenueQuoteRequestForm from "@/components/venue/VenueQuoteRequestForm";
import VenueHostCard from "@/components/venue/VenueHostCard";
import VenueNearbyAttractions from "@/components/venue/VenueNearbyAttractions";
import SimilarVenues from "@/components/venue/SimilarVenues";
import VenueShareCard from "@/components/venue/VenueShareCard";
import VenueTrustBanner from "@/components/venue/VenueTrustBanner";
import { MobileDateSelector } from "@/components/booking/MobileDateSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VenueDetailsSkeleton } from "@/components/ui/detail-page-skeletons";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";
import { getVenueById, VenueWithMerchant } from "@/services/venueService";
import { VENUE_SETUP_STYLES } from "@/types/venue";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format } from "date-fns";
import { 
  MapPin, Users, Clock, Theater,
  Phone, ChevronUp, CalendarDays, Star
} from "lucide-react";
import { toast } from "sonner";
import { 
  PremiumDetailSection, 
  PremiumInfoGrid,
  PremiumTabs
} from "@/components/premium";
import { PremiumCTADrawerTrigger } from "@/components/premium/PremiumStickyCTA";
import VenueHeroGrid from "@/components/venue/VenueHeroGrid";
import VenueRatingBreakdown from "@/components/venue/VenueRatingBreakdown";
import VenueAmenityGrid from "@/components/venue/VenueAmenityGrid";
import { PropertyLocationMap } from "@/components/maps/PropertyLocationMap";

const VenueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [venue, setVenue] = useState<VenueWithMerchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    if (id) fetchVenue();
  }, [id]);

  const fetchVenue = async () => {
    try {
      const data = await getVenueById(id!);
      setVenue(data);
    } catch (error) {
      console.error("Error fetching venue:", error);
      toast.error("Failed to load venue details");
    } finally {
      setLoading(false);
    }
  };

  const formatVenueType = (type: string) => type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  if (loading) return <VenueDetailsSkeleton />;

  if (!venue) {
    return (
      <MobileAppLayout hideNav>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">🏛️</div>
          <h1 className="text-2xl font-bold mb-2">Venue Not Found</h1>
          <p className="text-muted-foreground mb-4">The venue you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/venues')} className="mobile-button">Browse Venues</Button>
        </div>
      </MobileAppLayout>
    );
  }

  const images = venue.images as string[] || [];
  const maxCapacity = Math.max(
    venue.capacity_standing || 0,
    venue.capacity_seated || 0,
    venue.capacity_theater || 0,
    venue.capacity_banquet || 0
  );
  const capacities = [
    { icon: Users, label: 'Standing', value: venue.capacity_standing || 0 },
    { icon: Users, label: 'Seated', value: venue.capacity_seated || 0 },
    { icon: Theater, label: 'Theater', value: venue.capacity_theater || 0 },
    { icon: Users, label: 'Banquet', value: venue.capacity_banquet || 0 },
  ].filter(c => c.value);

  const renderTabContent = () => {
    switch (activeTab) {
      case "about":
        return (
          <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <p className="text-muted-foreground leading-relaxed">{venue.description || 'No description available.'}</p>
          </motion.div>
        );
      case "amenities":
        return (
          <motion.div key="amenities" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <VenueAmenityGrid amenities={venue.amenities} />
          </motion.div>
        );
      case "capacity":
        return (
          <motion.div key="capacity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {capacities.map((cap, idx) => (
                <motion.div key={cap.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/10">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-primary">{cap.value}</div>
                      <div className="text-sm text-muted-foreground">{cap.label} Style</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Setup Styles Available</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {VENUE_SETUP_STYLES.map((style, idx) => (
                  <motion.div key={style.id} className="p-3 bg-muted/50 rounded-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}>
                    <div className="font-medium">{style.name}</div>
                    <div className="text-xs text-muted-foreground">{style.description}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case "pricing":
        return (
          <motion.div key="pricing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {venue.hourly_rate && (
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{convertPrice(venue.hourly_rate)}</div>
                    <div className="text-sm text-muted-foreground">Per Hour</div>
                  </CardContent>
                </Card>
              )}
              {venue.half_day_rate && (
                <Card className="bg-gradient-to-br from-card to-secondary/5 border-secondary/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{convertPrice(venue.half_day_rate)}</div>
                    <div className="text-sm text-muted-foreground">Half Day (4h)</div>
                  </CardContent>
                </Card>
              )}
              {venue.full_day_rate && (
                <Card className="bg-gradient-to-br from-card to-muted/50 border-muted-foreground/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{convertPrice(venue.full_day_rate)}</div>
                    <div className="text-sm text-muted-foreground">Full Day (8h)</div>
                  </CardContent>
                </Card>
              )}
            </div>
            <p className="text-sm text-muted-foreground">* Minimum booking: {venue.min_hours} hours</p>
          </motion.div>
        );
      case "reviews":
        return (
          <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <VenueRatingBreakdown overallRating={4.7} reviewCount={24} />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <MobileAppLayout hideNav className="pb-24 md:pb-0">
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-2 md:py-6">
        {/* Hero Image Grid — Progress bar desktop only */}
        <ServiceProgressBar currentStep={3} className="mb-4 hidden md:flex" />
        <div className="mb-4 md:mb-6">
          <VenueHeroGrid
            images={images.length > 0 ? images : ["/placeholder.svg"]}
            name={venue.name}
            onBack={() => navigate(-1)}
            onFavorite={() => setIsFavorite(!isFavorite)}
            isFavorite={isFavorite}
            badge={formatVenueType(venue.venue_type)}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{venue.name}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4" />
                    <span>{venue.address}, {venue.city}, {venue.country}</span>
                  </div>
                </div>
                <VenueShareCard
                  name={venue.name}
                  venueType={venue.venue_type}
                  city={venue.city}
                  country={venue.country}
                  capacity={maxCapacity}
                  hourlyRate={venue.hourly_rate}
                  minHours={venue.min_hours}
                  image={images[0]}
                />
              </div>
            </motion.div>

            {/* Trust Banner */}
            <VenueTrustBanner />

            <PremiumInfoGrid
              items={[
                ...capacities.slice(0, 2).map(cap => ({ icon: cap.icon, label: cap.label, value: cap.value })),
                ...(venue.size_sqm ? [{ icon: Star, label: "Floor Area", value: `${venue.size_sqm}m²` }] : []),
                { icon: Clock, label: "Minimum", value: `${venue.min_hours}h` },
              ]}
              columns={4}
            />

            {/* Host Card */}
            {venue.merchant_profiles && (
              <VenueHostCard
                businessName={venue.merchant_profiles.business_name}
                businessPhone={venue.merchant_profiles.business_phone}
              />
            )}

            <PremiumTabs 
              tabs={[
                { value: "about", label: "About" },
                { value: "amenities", label: "Amenities" },
                { value: "capacity", label: "Capacity" },
                { value: "pricing", label: "Pricing" },
                { value: "reviews", label: "Reviews" },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            {renderTabContent()}

            {/* Location Map */}
            <PropertyLocationMap
              address={venue.address}
              city={venue.city}
              country={venue.country}
              latitude={venue.latitude}
              longitude={venue.longitude}
              propertyName={venue.name}
            />

            {/* What's Nearby */}
            <VenueNearbyAttractions city={venue.city} />

            {/* Similar Venues */}
            <SimilarVenues
              currentVenueId={venue.id}
              city={venue.city}
              venueType={venue.venue_type}
            />
          </div>

          {/* Sidebar */}
          <div className="hidden md:block space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="sticky top-4 space-y-6">
              <VenueAvailabilityCalendar venueId={venue.id} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
              <VenueBookingForm venue={venue} selectedDate={selectedDate} />
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2 text-center">Need a custom package?</p>
                <VenueQuoteRequestForm venueId={venue.id} venueName={venue.name} />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  You'll receive a payment link via email once the venue responds
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <MobileDateSelector mode="single" selectedDate={selectedDate} onDateSelect={setSelectedDate} label="Select Event Date" className="mt-6 md:hidden" />
        
        {selectedDate && (
          <motion.div className="md:hidden mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> {format(selectedDate, 'EEEE, MMMM d, yyyy')} selected
            </p>
          </motion.div>
        )}
      </main>

      <div className="hidden md:block"><Footer /></div>

      <div className="md:hidden">
        <Drawer open={isBookingDrawerOpen} onOpenChange={setIsBookingDrawerOpen}>
          <PremiumCTADrawerTrigger price={convertPrice(venue.hourly_rate || 0)} priceLabel="/hr" ctaText="Book Now" subText={selectedDate ? format(selectedDate, 'MMM d') : "From"}>
            <DrawerTrigger asChild>
              <Button size="lg" className="rounded-xl px-6 shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/80">
                <span className="flex items-center gap-1">Book Now <ChevronUp className="h-4 w-4" /></span>
              </Button>
            </DrawerTrigger>
          </PremiumCTADrawerTrigger>
          <DrawerContent className="max-h-[85vh] rounded-t-3xl">
            <DrawerHeader><DrawerTitle>Book {venue.name}</DrawerTitle></DrawerHeader>
            <div className="p-4 space-y-6 overflow-y-auto">
              <VenueAvailabilityCalendar venueId={venue.id} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
              <VenueBookingForm venue={venue} selectedDate={selectedDate} />
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2 text-center">Need a custom package?</p>
                <VenueQuoteRequestForm venueId={venue.id} venueName={venue.name} />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  You'll receive a payment link via email
                </p>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </MobileAppLayout>
  );
};

export default VenueDetails;
