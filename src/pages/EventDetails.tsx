import { useState, useEffect } from "react";
import { ServiceProgressBar } from "@/components/booking/ServiceProgressBar";
import { useNavigate, useParams } from "react-router-dom";
import { saveBookingProgress, clearBookingProgress } from "@/hooks/useBookingProgress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MobileAppLayout from "@/components/MobileAppLayout";
import { EventDetailsSkeleton } from "@/components/booking/EventDetailsSkeleton";
import EventHeroGrid from "@/components/event/EventHeroGrid";
import { OrganizerProfileCard } from "@/components/event/OrganizerProfileCard";
import { EventRatingBreakdown } from "@/components/event/EventRatingBreakdown";
import { EventPriceComparison } from "@/components/event/EventPriceComparison";
import { EventWhatToExpect } from "@/components/event/EventWhatToExpect";
import TicketTierCards from "@/components/event/TicketTierCards";
import QuickQuantitySelector from "@/components/event/QuickQuantitySelector";
import SimilarEvents from "@/components/event/SimilarEvents";
import EventLineup from "@/components/event/EventLineup";
import EventShareCard from "@/components/event/EventShareCard";
import EventSeatMap from "@/components/EventSeatMap";
import EventReviewDialog from "@/components/EventReviewDialog";
import EventWaitlistDialog from "@/components/EventWaitlistDialog";
import EventCategoryForm from "@/components/EventCategoryForm";
import GroupBookingDialog from "@/components/GroupBookingDialog";
import PaymentPlanSelector from "@/components/PaymentPlanSelector";
import EventAddonSelector from "@/components/EventAddonSelector";
import AccessibilityOptionsForm from "@/components/AccessibilityOptionsForm";
import BookingSpecialtyAddOns from "@/components/booking/BookingSpecialtyAddOns";
import MerchantChatButton from "@/components/MerchantChatButton";
import { MerchantContactInfo } from "@/components/MerchantContactInfo";
import { BookForClient } from "@/components/agent/BookForClient";
import { AgentCommissionPreview } from "@/components/agent/AgentCommissionPreview";
import EventCountdown from "@/components/EventCountdown";
import EventSchedule from "@/components/EventSchedule";
import EventVenueInfo from "@/components/EventVenueInfo";
import { PropertyLocationMap } from "@/components/maps/PropertyLocationMap";
import ExperienceDetailsCard from "@/components/ExperienceDetailsCard";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  TheaterDetailsCard,
  ComedyDetailsCard,
  FestivalDetailsCard,
  ConferenceDetailsCard,
  VirtualEventDetailsCard,
  TheaterBookingForm,
  ComedyBookingForm,
  FestivalBookingForm,
  ConferenceBookingForm,
  VirtualEventBookingForm,
  SportsBookingForm,
  MusicBookingForm,
  CulturalBookingForm,
  MarathonBookingForm,
  SeasonTicketForm,
  SchoolBookingForm,
  ReligiousBookingForm,
  ExhibitionBookingForm,
  CharityBookingForm,
  NightlifeBookingForm,
  WorkshopBookingForm,
  FoodDrinkBookingForm,
} from "@/components/event-types";
import { useToast } from "@/hooks/use-toast";
import { useDashboardMode } from "@/hooks/useDashboardMode";
import { 
  MapPin, Star, Loader2, Users, UserPlus, 
  Ticket, ChevronUp, User, Mail, Phone, Info, CalendarDays, Package, CreditCard, Accessibility
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentBooking } from "@/contexts/AgentBookingContext";
import { getEventById, getEventReviews, type EventTicketTier } from "@/services/eventService";
import { getMerchantByOrganizerName } from "@/services/organizerService";
import { supabase } from "@/integrations/supabase/client";
import { MerchantProfile } from "@/types/merchant";
import { cn } from "@/lib/utils";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { convertPrice } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const { isAgentBooking, selectedClient, agentProfileId, agentCommissionRate, setAgentBooking } = useAgentBooking();
  const { currentMode } = useDashboardMode();
  
  const [agentProfile, setAgentProfile] = useState<MerchantProfile | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookForClient, setShowBookForClient] = useState(false);
  const [selectedTier, setSelectedTier] = useState<EventTicketTier | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<string[]>([]);
  const [passengerName, setPassengerName] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false);
  const [showGroupBookingDialog, setShowGroupBookingDialog] = useState(false);
  const [categoryData, setCategoryData] = useState<any>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [addonsTotalPrice, setAddonsTotalPrice] = useState(0);
  const [accessibilityData, setAccessibilityData] = useState<any>({});
  const [specialtyAddOns, setSpecialtyAddOns] = useState<Record<string, any>>({});
  const [paymentPlan, setPaymentPlan] = useState("full");
  const [groupBookingData, setGroupBookingData] = useState<any>(null);
  const [isCashReservation, setIsCashReservation] = useState(false);
  const [merchantContact, setMerchantContact] = useState<any>(null);
  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
  const [agentStatusLoading, setAgentStatusLoading] = useState(true);
  const [ticketQuantity, setTicketQuantity] = useState(0);
  const [hasSeats, setHasSeats] = useState(true);

  // Check if user is an agent
  useEffect(() => {
    const checkAgentStatus = async () => {
      if (authLoading) return;

      if (!user) {
        setAgentProfile(null);
        setAgentStatusLoading(false);
        return;
      }
      
      try {
        setAgentStatusLoading(true);
        const { data, error } = await supabase
          .from('merchant_profiles')
          .select('*')
          .eq('user_id', user.id)
          .in('role', ['travel_agent', 'booking_agent'])
          .eq('verification_status', 'verified')
          .maybeSingle();
        
        if (data && !error) {
          setAgentProfile(data as MerchantProfile);
        } else {
          setAgentProfile(null);
        }
      } catch (error) {
        console.error('Error checking agent status:', error);
        setAgentProfile(null);
      } finally {
        setAgentStatusLoading(false);
      }
    };
    
    checkAgentStatus();
  }, [user, authLoading]);

  useEffect(() => {
    if (id) {
      fetchEventData();
    }
  }, [id]);

  const fetchEventData = async () => {
    if (!id) return;
    
    setLoading(true);
    const { data: eventData } = await getEventById(id);
    const { data: reviewsData } = await getEventReviews(id);
    
    if (eventData) {
      setEvent(eventData);
      if (eventData.event_ticket_tiers?.length > 0) {
        setSelectedTier(eventData.event_ticket_tiers[0] as any);
      }
      
      if (eventData.organizer) {
        const { data: merchantData } = await getMerchantByOrganizerName(eventData.organizer);
        if (merchantData) {
          setMerchantContact(merchantData);
        }
      }
    }
    
    if (reviewsData) {
      setReviews(reviewsData);
    }
    
    setLoading(false);
  };

  const handleSeatsSelected = (seatIds: string[], seatNumbers: string[]) => {
    const wasEmpty = selectedSeatIds.length === 0;
    setSelectedSeatIds(seatIds);
    setSelectedSeatNumbers(seatNumbers);
    
    // Auto-open booking drawer on mobile when first seat is selected
    if (wasEmpty && seatIds.length > 0 && window.innerWidth < 768) {
      setIsBookingDrawerOpen(true);
    }

    // Save booking progress when seats are selected
    if (event && seatIds.length > 0 && selectedTier) {
      saveBookingProgress({
        type: "event",
        itemId: event.id,
        itemName: event.name,
        path: `/events/${id}`,
        selectedSeats: seatNumbers,
        ticketQuantity: seatIds.length,
        date: event.event_date,
        price: seatIds.length * selectedTier.price,
        operator: event.organizer?.business_name || event.organizer_name,
        imageUrl: event.image_url,
      });
    } else if (seatIds.length === 0) {
      clearBookingProgress();
    }
  };

  // Auto-fill user details when logged in
  useEffect(() => {
    if (user) {
      if (!passengerName) setPassengerName(user.user_metadata?.full_name || "");
      if (!passengerEmail) setPassengerEmail(user.email || "");
    }
  }, [user]);

  const handleBooking = () => {
    if (!selectedTier) {
      toast({
        title: "No ticket tier selected",
        description: "Please select a ticket tier",
        variant: "destructive",
      });
      return;
    }

    if (selectedSeatIds.length === 0) {
      toast({
        title: "No seats selected",
        description: "Please select at least one seat",
        variant: "destructive",
      });
      return;
    }

    // Auth check at booking time, not seat selection
    if (!user) {
      navigate("/auth", { state: { returnTo: `/events/${id}` } });
      return;
    }

    if (!passengerName || !passengerEmail || !passengerPhone) {
      toast({
        title: "Missing information",
        description: "Please fill in all details",
        variant: "destructive",
      });
      return;
    }

    const basePrice = selectedSeatIds.length * selectedTier.price;
    const subtotal = basePrice + addonsTotalPrice;
    const serviceFee = Math.floor(subtotal / 50); // $1 per $50
    const totalPrice = subtotal + serviceFee;

    const eventDateTime = new Date(`${event.event_date}T${event.event_time}`);
    const reservationExpiry = new Date(eventDateTime.getTime() - 60 * 60 * 1000);

    // Clear booking progress when navigating to confirm
    clearBookingProgress();

    navigate("/booking/confirm", {
      state: {
        type: "event",
        itemId: event.id,
        itemName: event.name,
        selectedSeats: selectedSeatNumbers,
        selectedSeatIds,
        ticketQuantity: selectedSeatIds.length,
        passengerName,
        passengerEmail,
        passengerPhone,
        totalPrice: subtotal,
        serviceFee,
        ticketTierId: selectedTier.id,
        eventDate: event.event_date,
        eventTime: event.event_time,
        venue: event.venue,
        operator: event.organizer?.business_name || event.organizer_name || "Event Organizer",
        eventCategory: event.type,
        categorySpecificData: Object.keys(categoryData).length > 0 ? categoryData : undefined,
        selectedAddons: Object.keys(selectedAddons).length > 0 ? selectedAddons : undefined,
        accessibilityNeeds: Object.keys(accessibilityData).length > 0 ? accessibilityData : undefined,
        paymentPlan,
        groupBooking: groupBookingData,
        isCashReservation,
        reservationType: isCashReservation ? 'cash_reserved' : 'paid',
        reservationExpiresAt: isCashReservation ? reservationExpiry.toISOString() : undefined,
        isAgentBooking,
        agentProfileId,
        agentCommissionRate,
        agentClient: selectedClient,
      },
    });
  };

  const handleJoinWaitlist = () => {
    if (!selectedTier) {
      toast({
        title: "No ticket tier selected",
        description: "Please select a ticket tier first",
        variant: "destructive",
      });
      return;
    }
    setShowWaitlistDialog(true);
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return <EventDetailsSkeleton />;
  }

  if (!event) {
    return (
      <MobileAppLayout hideNav>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-6xl mb-4">🎭</div>
          <h2 className="text-xl font-semibold mb-2">Event not found</h2>
          <p className="text-muted-foreground text-center mb-4">
            This event may have been removed or doesn't exist
          </p>
          <Button onClick={() => navigate('/events')}>Browse Events</Button>
        </div>
      </MobileAppLayout>
    );
  }

  const totalAvailable = event.event_ticket_tiers?.reduce(
    (sum: number, tier: EventTicketTier) => sum + tier.available_tickets, 0
  ) || 0;
  const totalTickets = event.event_ticket_tiers?.reduce(
    (sum: number, tier: EventTicketTier) => sum + tier.total_tickets, 0
  ) || 0;

  const lowestPrice = event.event_ticket_tiers?.reduce(
    (min: number, tier: EventTicketTier) => Math.min(min, tier.price),
    Infinity
  ) || 0;

  const currentSubtotal = selectedSeatIds.length * (selectedTier?.price || 0) + addonsTotalPrice;
  const currentServiceFee = Math.floor(currentSubtotal / 50);
  const currentTotalPrice = currentSubtotal + currentServiceFee;

  return (
    <MobileAppLayout hideNav hideAttribution className="pb-20 md:pb-0">
      {/* Immersive Hero Grid */}
      <EventHeroGrid 
        event={event} 
        averageRating={averageRating} 
        reviewCount={reviews.length} 
      />

      {/* Countdown & Urgency */}
      <ServiceProgressBar currentStep={3} className="px-4 pt-3" />
      <div className="px-4 py-4 space-y-3">
        <EventCountdown
          eventDate={event.event_date}
          eventTime={event.event_time}
          availableTickets={totalAvailable}
          totalTickets={totalTickets}
        />
        {/* Live Sales Feed */}
        {totalTickets > 0 && totalAvailable < totalTickets * 0.8 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>{Math.floor(Math.random() * 20) + 5} people viewing</span>
            <span className="text-border">•</span>
            <span>{Math.floor(Math.random() * 15) + 3} tickets sold in the last hour</span>
          </div>
        )}
        {/* Share as Story */}
        <div className="flex gap-2">
          <EventShareCard event={event} />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-24 md:pb-8">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          {/* Left Column - Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Agent Booking Mode */}
            {currentMode !== 'consumer' && !agentStatusLoading && agentProfile?.role === 'travel_agent' && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Agent Booking Mode</h3>
                    {isAgentBooking && selectedClient ? (
                      <p className="text-sm text-muted-foreground">
                        Booking for: {selectedClient.client_name}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Book tickets on behalf of your clients
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => setShowBookForClient(true)}
                    size="sm"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isAgentBooking ? "Change" : "Select"}
                  </Button>
                </div>
              </Card>
            )}

            {currentMode !== 'consumer' && !agentStatusLoading && agentProfile?.role === 'travel_agent' && isAgentBooking && (
              <AgentCommissionPreview
                bookingAmount={currentTotalPrice}
                commissionRate={agentCommissionRate}
              />
            )}

            {/* Tabs */}
            <Tabs defaultValue="tickets" className="space-y-4">
              <ScrollArea className="w-full">
                <TabsList className="inline-flex w-max">
                  <TabsTrigger value="tickets" className="gap-1.5">
                    <Ticket className="h-4 w-4" />
                    Tickets
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    Schedule
                  </TabsTrigger>
                  <TabsTrigger value="venue" className="gap-1.5">
                    <MapPin className="h-4 w-4" />
                    Venue
                  </TabsTrigger>
                  <TabsTrigger value="details" className="gap-1.5">
                    <Info className="h-4 w-4" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="gap-1.5">
                    <Star className="h-4 w-4" />
                    Reviews ({reviews.length})
                  </TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              <TabsContent value="tickets" className="space-y-6 mt-4">
                {/* Ticket Tier Cards */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Select Ticket Type</h3>
                  <TicketTierCards
                    tiers={event.event_ticket_tiers || []}
                    selectedTier={selectedTier}
                    onSelect={setSelectedTier}
                  />
                </div>

                {selectedTier && selectedTier.available_tickets > 0 && (
                  <>
                    {/* Quick Quantity Selector for GA events (no seats) */}
                    {!hasSeats ? (
                      <QuickQuantitySelector
                        quantity={ticketQuantity}
                        onQuantityChange={(qty) => {
                          setTicketQuantity(qty);
                          // Generate virtual seat IDs for GA
                          const ids = Array.from({ length: qty }, (_, i) => `ga-${selectedTier.id}-${i}`);
                          const nums = Array.from({ length: qty }, (_, i) => `GA${i + 1}`);
                          handleSeatsSelected(ids, nums);
                        }}
                        pricePerTicket={selectedTier.price}
                        tierName={selectedTier.name}
                        availableTickets={selectedTier.available_tickets}
                      />
                    ) : (
                      /* Seat Map for assigned seating */
                      <EventSeatMap
                        eventId={event.id}
                        ticketTierId={selectedTier.id}
                        onSeatsSelected={handleSeatsSelected}
                        maxSeats={10}
                      />
                    )}

                    {/* Mobile hint to complete booking */}
                    {selectedSeatIds.length > 0 && (
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm md:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <p className="font-medium text-primary flex items-center gap-2">
                          <ChevronUp className="h-4 w-4" />
                          {selectedSeatIds.length} ticket(s) selected - Tap "Complete Booking" below
                        </p>
                      </div>
                    )}

                    {/* Group Booking Prompt */}
                    {selectedSeatIds.length >= 5 && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Button
                          variant="outline"
                          onClick={() => setShowGroupBookingDialog(true)}
                          className="w-full"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Set up Group Booking (Get up to 20% off!)
                        </Button>
                      </div>
                    )}

                    {/* Event Type Specific Forms - Hidden on mobile, shown in desktop */}
                    <div className="hidden md:block space-y-4">
                      {event.type === "Theater" ? (
                        <TheaterBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Comedy" ? (
                        <ComedyBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Festival" ? (
                        <FestivalBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Conference" ? (
                        <ConferenceBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Virtual" ? (
                        <VirtualEventBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Sports" ? (
                        <SportsBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Music" ? (
                        <MusicBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Cultural" ? (
                        <CulturalBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Marathon" ? (
                        <MarathonBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Season" ? (
                        <SeasonTicketForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "School" ? (
                        <SchoolBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Religious" ? (
                        <ReligiousBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Exhibition" ? (
                        <ExhibitionBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Charity" ? (
                        <CharityBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Nightlife" ? (
                        <NightlifeBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Workshop" ? (
                        <WorkshopBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Food & Drink" ? (
                        <FoodDrinkBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : (
                        <EventCategoryForm
                          eventType={event.type}
                          data={categoryData}
                          onChange={setCategoryData}
                        />
                      )}

                      <EventAddonSelector
                        eventId={event.id}
                        selectedAddons={selectedAddons}
                        onAddonsChange={setSelectedAddons}
                        onAddonsTotalChange={setAddonsTotalPrice}
                      />

                      <BookingSpecialtyAddOns
                        vertical="event"
                        data={specialtyAddOns}
                        onChange={setSpecialtyAddOns}
                      />

                      <PaymentPlanSelector
                        totalPrice={currentTotalPrice}
                        selectedPlan={paymentPlan}
                        onPlanChange={setPaymentPlan}
                      />

                      {/* Cash Reservation */}
                      <Card className="p-4 bg-orange-500/10 border-orange-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="cash-desktop" className="font-medium">
                              Reserve for Cash Payment
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Reservation expires 1 hour before the event
                            </p>
                          </div>
                          <Switch
                            id="cash-desktop"
                            checked={isCashReservation}
                            onCheckedChange={setIsCashReservation}
                          />
                        </div>
                      </Card>

                      {/* Desktop User Details */}
                      <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Your Details</h2>
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="name-desktop">Full Name</Label>
                            <Input
                              id="name-desktop"
                              value={passengerName}
                              onChange={(e) => setPassengerName(e.target.value)}
                              placeholder="John Doe"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email-desktop">Email</Label>
                            <Input
                              id="email-desktop"
                              type="email"
                              value={passengerEmail}
                              onChange={(e) => setPassengerEmail(e.target.value)}
                              placeholder="john@example.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone-desktop">Phone</Label>
                            <Input
                              id="phone-desktop"
                              type="tel"
                              value={passengerPhone}
                              onChange={(e) => setPassengerPhone(e.target.value)}
                              placeholder="+1 234 567 8900"
                            />
                          </div>
                        </div>
                      </Card>
                    </div>
                  </>
                )}

                {selectedTier?.available_tickets === 0 && (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground mb-3">
                      This tier is sold out
                    </p>
                    <Button onClick={handleJoinWaitlist}>
                      Join Waitlist
                    </Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="schedule">
                <EventSchedule eventDate={event.event_date} />
              </TabsContent>

              <TabsContent value="venue" className="space-y-4">
                <EventVenueInfo
                  venue={event.venue}
                  location={event.location}
                  eventType={event.type}
                />
                {/* Location Map */}
                <PropertyLocationMap
                  address={event.venue || event.location || ''}
                  city={event.location || ''}
                  country=""
                  propertyName={event.name}
                />
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {event.type === "Experiences" && (
                  <ExperienceDetailsCard
                    experienceType="Tours"
                    duration="3 hours"
                    difficulty="Moderate"
                    groupSize="2-12 people"
                  />
                )}
                {event.type === "Theater" && <TheaterDetailsCard event={event} />}
                {event.type === "Comedy" && <ComedyDetailsCard event={event} />}
                {event.type === "Festival" && <FestivalDetailsCard event={event} />}
                {event.type === "Conference" && <ConferenceDetailsCard event={event} />}
                {event.type === "Virtual" && <VirtualEventDetailsCard event={event} />}

                {/* What to Expect */}
                <EventWhatToExpect eventType={event.type} />

                {/* Price Comparison */}
                {event.event_ticket_tiers?.length > 1 && (
                  <EventPriceComparison
                    tiers={event.event_ticket_tiers}
                    selectedTierId={selectedTier?.id}
                    onSelectTier={(tier) => setSelectedTier(tier as any)}
                  />
                )}

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">About This Event</h3>
                  <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <Badge variant="secondary">{event.type}</Badge>
                    </div>
                  </div>
                </Card>

                {/* Organizer Profile Card */}
                {event.organizer && (
                  <OrganizerProfileCard organizerName={event.organizer} />
                )}

                {merchantContact && (
                  <MerchantContactInfo
                    websiteUrl={merchantContact.website_url}
                    whatsappNumber={merchantContact.whatsapp_number}
                    address={merchantContact.business_address || event.venue}
                    supportPhone={merchantContact.support_phone}
                    supportEmail={merchantContact.support_email}
                  />
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                {/* Rating Breakdown */}
                <Card className="p-4">
                  <EventRatingBreakdown
                    overallRating={averageRating}
                    totalReviews={reviews.length}
                    reviews={reviews}
                  />
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Customer Reviews</h3>
                    {user && (
                      <Button size="sm" onClick={() => setShowReviewDialog(true)}>
                        Write Review
                      </Button>
                    )}
                  </div>

                  {reviews.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">
                      No reviews yet. Be the first!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <Card key={review.id} className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {review.profiles?.full_name || "Anonymous"}
                                </span>
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-muted-foreground"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <h4 className="text-sm font-medium mt-1">{review.title}</h4>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>

            {/* Lineup / Speakers / Performers */}
            <EventLineup eventType={event.type} eventName={event.name} />

            {/* Similar Events */}
            <SimilarEvents
              currentEventId={event.id}
              eventType={event.type}
              location={event.location}
            />
          </div>

          {/* Right Column - Desktop Booking Summary */}
          <div className="hidden md:block">
            <div className="sticky top-24">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Booking Summary</h3>
                {selectedTier && selectedSeatIds.length > 0 ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ticket Type</span>
                      <span className="font-medium">{selectedTier.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-medium">{selectedSeatIds.length}</span>
                    </div>
                    {selectedSeatNumbers.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Seats</span>
                        <span className="font-medium text-right max-w-[150px] truncate">
                          {selectedSeatNumbers.join(", ")}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price each</span>
                      <span className="font-medium">{convertPrice(selectedTier.price)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold text-primary">
                        {convertPrice(currentTotalPrice)}
                      </span>
                    </div>
                    <Button
                      className="w-full mt-2"
                      size="lg"
                      onClick={handleBooking}
                      disabled={selectedSeatIds.length === 0}
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select tickets and seats to continue
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom CTA with Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-pb">
        <Drawer open={isBookingDrawerOpen} onOpenChange={setIsBookingDrawerOpen}>
          <div className="bg-background border-t border-border px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {selectedSeatIds.length > 0 ? `${selectedSeatIds.length} ticket(s)` : 'From'}
                </p>
                <p className="text-lg font-bold">
                  {selectedSeatIds.length > 0 
                    ? convertPrice(currentTotalPrice) 
                    : convertPrice(lowestPrice)
                  }
                </p>
              </div>
              <DrawerTrigger asChild>
                <Button size="lg" className="gap-2 px-6" disabled={selectedSeatIds.length === 0}>
                  <Ticket className="h-4 w-4" />
                  Complete Booking
                  <ChevronUp className={`h-4 w-4 transition-transform ${isBookingDrawerOpen ? 'rotate-180' : ''}`} />
                </Button>
              </DrawerTrigger>
            </div>
          </div>

          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="border-b pb-4">
              <DrawerTitle>Complete Your Booking</DrawerTitle>
            </DrawerHeader>

            <ScrollArea className="flex-1 overflow-auto max-h-[85vh]">
              <div className="p-4 space-y-3">
                <Accordion type="multiple" defaultValue={["details"]} className="space-y-0">
                  {/* Your Details Section */}
                  <AccordionItem value="details" className="border rounded-xl px-4 mb-2 bg-card">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          passengerName && passengerEmail && passengerPhone 
                            ? "bg-green-500/20 text-green-600" 
                            : "bg-primary/10 text-primary"
                        )}>
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-medium text-sm">Your Details</span>
                          {passengerName && passengerEmail && passengerPhone && (
                            <span className="ml-2 text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">
                              ✓ Done
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">Required information</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-2 space-y-3">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Full Name *"
                          value={passengerName}
                          onChange={(e) => setPassengerName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Email *"
                          value={passengerEmail}
                          onChange={(e) => setPassengerEmail(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="Phone *"
                          value={passengerPhone}
                          onChange={(e) => setPassengerPhone(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Event Type Options Section */}
                  <AccordionItem value="options" className="border rounded-xl px-4 mb-2 bg-card">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                          <Info className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-medium text-sm">Event Options</span>
                          <p className="text-xs text-muted-foreground">Customize your experience</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-2">
                      {event.type === "Theater" ? (
                        <TheaterBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Comedy" ? (
                        <ComedyBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Festival" ? (
                        <FestivalBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Conference" ? (
                        <ConferenceBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Virtual" ? (
                        <VirtualEventBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Sports" ? (
                        <SportsBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Music" ? (
                        <MusicBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Cultural" ? (
                        <CulturalBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Marathon" ? (
                        <MarathonBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Season" ? (
                        <SeasonTicketForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "School" ? (
                        <SchoolBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Religious" ? (
                        <ReligiousBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Exhibition" ? (
                        <ExhibitionBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Charity" ? (
                        <CharityBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Nightlife" ? (
                        <NightlifeBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Workshop" ? (
                        <WorkshopBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : event.type === "Food & Drink" ? (
                        <FoodDrinkBookingForm formData={categoryData} setFormData={setCategoryData} />
                      ) : (
                        <EventCategoryForm
                          eventType={event.type}
                          data={categoryData}
                          onChange={setCategoryData}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Add-ons Section */}
                  <AccordionItem value="addons" className="border rounded-xl px-4 mb-2 bg-card">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-medium text-sm">Add-ons</span>
                          {Object.keys(selectedAddons).length > 0 && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {Object.keys(selectedAddons).length} selected
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">Merchandise, VIP packages</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-2">
                      <EventAddonSelector
                        eventId={event.id}
                        selectedAddons={selectedAddons}
                        onAddonsChange={setSelectedAddons}
                        onAddonsTotalChange={setAddonsTotalPrice}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Accessibility Section */}
                  <AccordionItem value="accessibility" className="border rounded-xl px-4 mb-2 bg-card">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                          <Accessibility className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-medium text-sm">Accessibility</span>
                          <p className="text-xs text-muted-foreground">Special requirements</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-2">
                      <BookingSpecialtyAddOns
                        vertical="event"
                        data={specialtyAddOns}
                        onChange={setSpecialtyAddOns}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Payment Section */}
                  <AccordionItem value="payment" className="border rounded-xl px-4 mb-2 bg-card">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-medium text-sm">Payment Options</span>
                          {isCashReservation && (
                            <span className="ml-2 text-xs bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full">
                              Cash
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">Choose payment method</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <div>
                          <Label htmlFor="cash-mobile" className="text-sm font-medium">
                            Reserve for Cash Payment
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Pay at our office before the event
                          </p>
                        </div>
                        <Switch
                          id="cash-mobile"
                          checked={isCashReservation}
                          onCheckedChange={setIsCashReservation}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Summary - Always visible */}
                {selectedTier && selectedSeatIds.length > 0 && (
                  <Card className="p-4 bg-muted/50">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{selectedTier.name}</span>
                        <span>x{selectedSeatIds.length}</span>
                      </div>
                      {selectedSeatNumbers.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Seats</span>
                          <span className="truncate max-w-[150px]">
                            {selectedSeatNumbers.join(", ")}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{convertPrice(currentSubtotal)}</span>
                      </div>
                      {currentServiceFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service fee</span>
                          <span>{convertPrice(currentServiceFee)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-primary">{convertPrice(currentTotalPrice)}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Book Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBooking}
                  disabled={selectedSeatIds.length === 0}
                >
                  Proceed to Payment
                </Button>
              </div>
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Dialogs */}
      <EventReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        eventId={event.id}
        eventName={event.name}
        onReviewSubmitted={fetchEventData}
      />

      {selectedTier && (
        <EventWaitlistDialog
          open={showWaitlistDialog}
          onOpenChange={setShowWaitlistDialog}
          eventId={event.id}
          eventName={event.name}
          ticketTierId={selectedTier.id}
          ticketTierName={selectedTier.name}
        />
      )}

      <GroupBookingDialog
        open={showGroupBookingDialog}
        onOpenChange={setShowGroupBookingDialog}
        ticketQuantity={selectedSeatIds.length}
        onGroupBookingConfirm={setGroupBookingData}
      />

      {currentMode !== 'consumer' && agentProfile && (
        <BookForClient
          open={showBookForClient}
          onClose={() => setShowBookForClient(false)}
          onClientSelected={(client) => {
            setAgentBooking(client, agentProfile.id, agentProfile.commission_rate || 10);
            toast({
              title: "Client Selected",
              description: `Now booking for ${client.client_name}`,
            });
          }}
        />
      )}
    </MobileAppLayout>
  );
};

export default EventDetails;
