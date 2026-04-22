import { useState, useEffect, useCallback, useRef } from "react";
import { ServiceProgressBar } from "@/components/booking/ServiceProgressBar";
import { useNavigate, useParams } from "react-router-dom";
import { saveBookingProgress, clearBookingProgress } from "@/hooks/useBookingProgress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { mockBuses, generateSeats } from "@/data/mockData";
import MobileAppLayout from "@/components/MobileAppLayout";
import { PropertyLocationMap } from "@/components/maps/PropertyLocationMap";
import { BusDetailsSkeleton } from "@/components/booking/BusDetailsSkeleton";
import BusHero from "@/components/bus/BusHero";
import RouteTimeline from "@/components/RouteTimeline";
import SeatMap from "@/components/SeatMap";
import SeatPreferenceDialog from "@/components/SeatPreferenceDialog";
import FlexiBookingOptions from "@/components/FlexiBookingOptions";
import MealSelection from "@/components/MealSelection";
import SpecialAssistanceForm from "@/components/SpecialAssistanceForm";
import OperatorReviews from "@/components/OperatorReviews";
import MerchantChatButton from "@/components/MerchantChatButton";
import { MerchantContactInfo } from "@/components/MerchantContactInfo";
import { BookForClient } from "@/components/agent/BookForClient";
import { AgentCommissionPreview } from "@/components/agent/AgentCommissionPreview";
import TripInsurance, { InsuranceOption } from "@/components/TripInsurance";
import SmartPricePrediction from "@/components/SmartPricePrediction";
import PriceAlertDialog from "@/components/PriceAlertDialog";
import { SmartTravelerForm, SmartTravelerFormRef } from "@/components/booking/SmartTravelerForm";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAgentBooking } from "@/contexts/AgentBookingContext";
import { useDashboardMode } from "@/hooks/useDashboardMode";
import { useAuth } from "@/contexts/AuthContext";
import { PassengerInfo } from "@/types/booking";
import { MerchantProfile } from "@/types/merchant";
import { SeatPreference, SpecialAssistance, PetTravel, MealOption } from "@/types/enhancements";
import { 
  Calendar as CalendarIcon, Plus, Trash2, Sparkles, Loader2, UserPlus, 
  ChevronUp, User, Mail, Phone, CreditCard, Armchair,
  Utensils, Star, ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/dateFormatters";
import { getBusSchedule, getSeatsForSchedule } from "@/services/busService";
import { getMerchantByOperatorName } from "@/services/operatorService";
import { supabase } from "@/integrations/supabase/client";

const BusDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { convertPrice } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const { isAgentBooking, selectedClient, agentProfileId, agentCommissionRate, setAgentBooking } = useAgentBooking();
  const { currentMode } = useDashboardMode();
  const travelerFormRef = useRef<SmartTravelerFormRef>(null);
  const [agentProfile, setAgentProfile] = useState<MerchantProfile | null>(null);
  const [bus, setBus] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookForClient, setShowBookForClient] = useState(false);
  const [travelerDetails, setTravelerDetails] = useState<{ name: string; email: string; phone: string; passportNumber?: string }>({ name: "", email: "", phone: "", passportNumber: "" });
  const [nextOfKinNumber, setNextOfKinNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [finalDestinationCity, setFinalDestinationCity] = useState("");
  const [isReturnTicket, setIsReturnTicket] = useState(false);
  const [returnDate, setReturnDate] = useState<Date>();
  const [isBookingForOthers, setIsBookingForOthers] = useState(false);
  const [numberOfAdults, setNumberOfAdults] = useState(1);
  const [numberOfChildren, setNumberOfChildren] = useState(0);
  const [numberOfBags, setNumberOfBags] = useState(1);
  const [luggageWeight, setLuggageWeight] = useState(20);
  const [passengers, setPassengers] = useState<PassengerInfo[]>([]);
  const [showSeatPreferences, setShowSeatPreferences] = useState(false);
  const [seatPreferences, setSeatPreferences] = useState<SeatPreference | null>(null);
  const [flexiOptions, setFlexiOptions] = useState({ flexiTicket: false, cancellationInsurance: false, payLater: false });
  const [flexiAddOnPrice, setFlexiAddOnPrice] = useState(0);
  const [groupDiscount, setGroupDiscount] = useState(0);
  const [selectedMeals, setSelectedMeals] = useState<MealOption[]>([]);
  const [mealPrice, setMealPrice] = useState(0);
  const [specialAssistance, setSpecialAssistance] = useState<SpecialAssistance>({
    wheelchair: false,
    elderly: false,
    childTravelingAlone: false,
    medical: '',
  });
  const [petTravel, setPetTravel] = useState<PetTravel>({
    hasPet: false,
    petType: '',
    petWeight: 0,
    petCarrier: false,
  });
  const [selectedInsurance, setSelectedInsurance] = useState<InsuranceOption | null>(null);
  const [insurancePrice, setInsurancePrice] = useState(0);
  const [isCashReservation, setIsCashReservation] = useState(false);
  const [merchantContact, setMerchantContact] = useState<any>(null);
  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
  const [agentStatusLoading, setAgentStatusLoading] = useState(true);

  // Convenience aliases for backward compatibility
  const passengerName = travelerDetails.name;
  const passengerEmail = travelerDetails.email;
  const passengerPhone = travelerDetails.phone;
  const passportNumber = travelerDetails.passportNumber || "";

  // Auto-fill user details when logged in
  useEffect(() => {
    if (user) {
      setTravelerDetails(prev => ({
        ...prev,
        name: prev.name || user.user_metadata?.full_name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

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
    const fetchBusAndSeats = async () => {
      if (!id) return;
      
      setLoading(true);
      
      const { data: scheduleData, error: scheduleError } = await getBusSchedule(id);
      const { data: seatsData, error: seatsError } = await getSeatsForSchedule(id);
      
      if (scheduleError || !scheduleData || seatsError) {
        const mockBus = mockBuses.find((b) => b.id === id);
        if (mockBus) {
          setBus(mockBus);
          setSeats(generateSeats(id));
        }
      } else {
        const transformedBus = {
          id: scheduleData.id,
          operator: scheduleData.buses.operator,
          from: scheduleData.from_location,
          to: scheduleData.to_location,
          departureTime: scheduleData.departure_time,
          arrivalTime: scheduleData.arrival_time,
          duration: scheduleData.duration,
          price: Number(scheduleData.base_price),
          totalSeats: scheduleData.buses.total_seats,
          amenities: scheduleData.buses.amenities || [],
          type: scheduleData.buses.type,
          stops: scheduleData.stops || [],
          pickupAddress: scheduleData.pickup_address,
          dropoffAddress: scheduleData.dropoff_address,
        };
        
        const transformedSeats = seatsData.map((seat: any) => ({
          id: seat.id,
          number: seat.seat_number,
          row: seat.seat_row,
          column: seat.seat_column,
          status: seat.status,
          type: seat.type,
        }));
        
        setBus(transformedBus);
        setSeats(transformedSeats);
        
        const { data: merchantData } = await getMerchantByOperatorName(scheduleData.buses.operator);
        if (merchantData) {
          setMerchantContact(merchantData);
        }
      }
      
      setLoading(false);
    };

    fetchBusAndSeats();
  }, [id]);

  const handleSeatSelect = (seatNumber: string) => {
    const newSelectedSeats = selectedSeats.includes(seatNumber)
      ? selectedSeats.filter((s) => s !== seatNumber)
      : [...selectedSeats, seatNumber];
    
    setSelectedSeats(newSelectedSeats);
    
    // Auto-open booking drawer on mobile when first seat is selected
    if (newSelectedSeats.length === 1 && !selectedSeats.includes(seatNumber) && window.innerWidth < 768) {
      setIsBookingDrawerOpen(true);
    }

    // Save booking progress when seats are selected
    if (bus && newSelectedSeats.length > 0) {
      saveBookingProgress({
        type: "bus",
        itemId: bus.id,
        itemName: `${bus.operator} - ${bus.from} to ${bus.to}`,
        path: `/buses/${id}`,
        selectedSeats: newSelectedSeats,
        date: bus.date || new Date().toISOString().split('T')[0],
        from: bus.from,
        to: bus.to,
        price: newSelectedSeats.length * getEffectivePrice(),
        operator: bus.operator,
        imageUrl: bus.image,
      });
    } else if (newSelectedSeats.length === 0) {
      clearBookingProgress();
    }
  };

  const getEffectivePrice = () => {
    if (bus?.priceByDate) {
      const today = new Date().toISOString().split('T')[0];
      return bus.priceByDate[today] || bus.price;
    }
    return bus?.price || 0;
  };
  
  const effectivePrice = getEffectivePrice();
  const basePrice = selectedSeats.length * effectivePrice * (isReturnTicket ? 2 : 1);
  const discountAmount = basePrice * groupDiscount;
  const subtotal = basePrice - discountAmount + flexiAddOnPrice + mealPrice + insurancePrice;
  const serviceFee = Math.floor(subtotal / 50); // $1 per $50
  const totalPrice = subtotal + serviceFee;

  const handleAddPassenger = () => {
    setPassengers([...passengers, {
      name: "",
      email: "",
      phone: "",
      passportNumber: "",
      nextOfKinNumber: "",
      whatsappNumber: "",
    }]);
  };

  const handleRemovePassenger = (index: number) => {
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handlePassengerChange = (index: number, field: keyof PassengerInfo, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleBooking = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "No seats selected",
        description: "Please select at least one seat",
        variant: "destructive",
      });
      return;
    }

    // Auth check at booking time, not seat selection
    if (!user) {
      navigate("/auth", { state: { returnTo: `/buses/${id}` } });
      return;
    }

    if (!passengerName || !passengerEmail || !passengerPhone || !passportNumber || 
        !nextOfKinNumber || !whatsappNumber || !finalDestinationCity) {
      toast({
        title: "Missing information",
        description: "Please fill in all required passenger details",
        variant: "destructive",
      });
      return;
    }

    if (isReturnTicket && !returnDate) {
      toast({
        title: "Missing return date",
        description: "Please select a return date",
        variant: "destructive",
      });
      return;
    }

    if (isBookingForOthers && passengers.some(p => !p.name || !p.email || !p.phone || !p.passportNumber)) {
      toast({
        title: "Missing passenger information",
        description: "Please fill in all details for additional passengers",
        variant: "destructive",
      });
      return;
    }

    const departureDateTime = new Date();
    const [hours, minutes] = bus.departureTime.split(':');
    departureDateTime.setHours(parseInt(hours), parseInt(minutes));
    const reservationExpiry = new Date(departureDateTime.getTime() - 60 * 60 * 1000);

    // Clear booking progress when navigating to confirm
    clearBookingProgress();

    navigate("/booking/confirm", {
      state: {
        type: "bus",
        itemId: bus.id,
        scheduleId: bus.id,
        itemName: `${bus.operator} - ${bus.from} to ${bus.to}`,
        selectedSeats,
        selectedSeatIds: selectedSeats.map(seatNum => {
          const seat = seats.find(s => s.number === seatNum);
          return seat?.id;
        }).filter(Boolean),
        passengerName,
        passengerEmail,
        passengerPhone,
        passportNumber,
        nextOfKinNumber,
        whatsappNumber,
        finalDestinationCity,
        isReturnTicket,
        returnDate: returnDate ? format(returnDate, "PPP") : undefined,
        numberOfAdults,
        numberOfChildren,
        numberOfBags,
        luggageWeight,
        passengers: isBookingForOthers ? passengers : undefined,
        totalPrice: subtotal,
        serviceFee,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        operator: bus.operator,
        from: bus.from,
        to: bus.to,
        seatPreferences,
        flexiOptions,
        selectedMeals,
        specialAssistance,
        petTravel,
        groupDiscount,
        tripInsurance: selectedInsurance,
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

  if (loading) {
    return <BusDetailsSkeleton />;
  }

  if (!bus) {
    return (
      <MobileAppLayout hideNav>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-6xl mb-4">🚌</div>
          <h2 className="text-xl font-semibold mb-2">Bus not found</h2>
          <p className="text-muted-foreground text-center mb-4">
            This schedule may have been removed or doesn't exist
          </p>
          <Button onClick={() => navigate('/buses')}>Browse Buses</Button>
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout hideNav hideAttribution className="pb-20 md:pb-0">
      {/* Hero Section */}
      <BusHero bus={bus} />

      {/* Main Content */}
      <div className="px-4 pb-24 md:pb-8">
        <ServiceProgressBar currentStep={3} className="mb-4" />

        {/* Itinerary Timeline - Always visible above tabs */}
        {bus.stops && bus.stops.length > 0 && (
          <Card className="p-4 mb-4 rounded-2xl">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              Route Itinerary
            </h2>
            <RouteTimeline stops={bus.stops} from={bus.from} to={bus.to} />
            {bus.pickupAddress && (
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground space-y-1">
                <p>📍 Pickup: {bus.pickupAddress}</p>
                {bus.dropoffAddress && <p>📍 Drop-off: {bus.dropoffAddress}</p>}
              </div>
            )}
          </Card>
        )}

        {/* Fare Breakdown Card */}
        {bus.busClass && bus.busClass.length > 0 && (
          <Card className="p-4 mb-4 rounded-2xl">
            <h2 className="font-semibold text-sm mb-3">Fare Classes</h2>
            <div className="space-y-2">
              {bus.busClass.map((cls: any) => (
                <div key={cls.tier} className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                  <div>
                    <p className="font-semibold text-sm capitalize">{cls.tier}</p>
                    <p className="text-xs text-muted-foreground">{cls.seatType} · {cls.baggage.bags} bag × {cls.baggage.weightPerBag}kg</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {cls.amenities.slice(0, 3).map((a: string) => (
                        <Badge key={a} variant="outline" className="text-[10px] px-1.5 py-0">{a}</Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-lg font-bold text-primary">{convertPrice(cls.price)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Terminal Location Maps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <PropertyLocationMap
            address={bus.pickupAddress || bus.from}
            city={bus.from}
            country=""
            propertyName={`Departure: ${bus.from}`}
          />
          <PropertyLocationMap
            address={bus.dropoffAddress || bus.to}
            city={bus.to}
            country=""
            propertyName={`Arrival: ${bus.to}`}
          />
        </div>

        <div className="md:grid md:grid-cols-3 md:gap-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-4">
            {/* Agent Mode */}
            {currentMode !== 'consumer' && !agentStatusLoading && agentProfile?.role === 'travel_agent' && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">Agent Booking Mode</h3>
                    {isAgentBooking && selectedClient ? (
                      <p className="text-xs text-muted-foreground">
                        Booking for: {selectedClient.client_name}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Book on behalf of clients
                      </p>
                    )}
                  </div>
                  <Button onClick={() => setShowBookForClient(true)} size="sm">
                    <UserPlus className="w-4 h-4 mr-1" />
                    {isAgentBooking ? "Change" : "Select"}
                  </Button>
                </div>
              </Card>
            )}

            {currentMode !== 'consumer' && !agentStatusLoading && agentProfile?.role === 'travel_agent' && isAgentBooking && (
              <AgentCommissionPreview
                bookingAmount={totalPrice}
                commissionRate={agentCommissionRate}
              />
            )}

            {/* Tabs */}
            <Tabs defaultValue="seats" className="space-y-4">
              <ScrollArea className="w-full">
                <TabsList className="inline-flex w-max">
                  <TabsTrigger value="seats" className="gap-1.5">
                    <Armchair className="h-4 w-4" />
                    Seats
                  </TabsTrigger>
                  <TabsTrigger value="options" className="gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    Options
                  </TabsTrigger>
                  <TabsTrigger value="extras" className="gap-1.5">
                    <Utensils className="h-4 w-4" />
                    Extras
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="gap-1.5">
                    <Star className="h-4 w-4" />
                    Reviews
                  </TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {/* Seats Tab */}
              <TabsContent value="seats" className="space-y-4 mt-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Select Your Seats</h2>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowSeatPreferences(true)}
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Smart Pick
                    </Button>
                  </div>
                  <SeatMap
                    seats={seats}
                    selectedSeats={selectedSeats}
                    onSeatSelect={handleSeatSelect}
                  />
                  {seatPreferences && (
                    <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
                      <p className="font-medium">✨ Based on your preferences:</p>
                      <p className="text-muted-foreground mt-1">
                        We recommend seats near the {seatPreferences.position} with {seatPreferences.windowOrAisle} seats
                      </p>
                    </div>
                  )}
                  
                  {/* Mobile hint to complete booking */}
                  {selectedSeats.length > 0 && (
                    <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm md:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <p className="font-medium text-primary flex items-center gap-2">
                        <ChevronUp className="h-4 w-4" />
                        {selectedSeats.length} seat(s) selected - Tap "Complete Booking" below to continue
                      </p>
                    </div>
                  )}
                </Card>

                {merchantContact && (
                  <MerchantContactInfo
                    websiteUrl={merchantContact.website_url}
                    whatsappNumber={merchantContact.whatsapp_number}
                    address={merchantContact.business_address}
                    supportPhone={merchantContact.support_phone}
                    supportEmail={merchantContact.support_email}
                  />
                )}
              </TabsContent>

              {/* Options Tab */}
              <TabsContent value="options" className="space-y-4 mt-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Booking Options</h3>
                  <div className="space-y-4">
                    {/* Cash Reservation */}
                    <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <div>
                        <Label htmlFor="cash-mobile" className="text-sm font-medium">Reserve for Cash</Label>
                        <p className="text-xs text-muted-foreground">Pay at office before departure</p>
                      </div>
                      <Switch
                        id="cash-mobile"
                        checked={isCashReservation}
                        onCheckedChange={setIsCashReservation}
                      />
                    </div>

                    {/* Return Ticket */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="return-mobile">Return Ticket</Label>
                      <Switch
                        id="return-mobile"
                        checked={isReturnTicket}
                        onCheckedChange={setIsReturnTicket}
                      />
                    </div>

                    {isReturnTicket && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !returnDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {returnDate ? format(returnDate, "PPP") : "Pick return date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
                          <Calendar
                            mode="single"
                            selected={returnDate}
                            onSelect={setReturnDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    )}

                    {/* Passengers */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Adults</Label>
                        <Input
                          type="number"
                          min="1"
                          value={numberOfAdults}
                          onChange={(e) => setNumberOfAdults(parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Children</Label>
                        <Input
                          type="number"
                          min="0"
                          value={numberOfChildren}
                          onChange={(e) => setNumberOfChildren(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Luggage */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Bags</Label>
                        <Input
                          type="number"
                          min="0"
                          value={numberOfBags}
                          onChange={(e) => setNumberOfBags(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Weight (kg)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={luggageWeight}
                          onChange={(e) => setLuggageWeight(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Flexi Options */}
                <FlexiBookingOptions 
                  numberOfSeats={selectedSeats.length}
                  onOptionsChange={(options, price, discount) => {
                    setFlexiOptions(options);
                    setFlexiAddOnPrice(price);
                    setGroupDiscount(discount);
                  }}
                />
              </TabsContent>

              {/* Extras Tab */}
              <TabsContent value="extras" className="space-y-4 mt-4">
                <MealSelection
                  duration={bus.duration}
                  onMealsChange={(meals, price) => {
                    setSelectedMeals(meals);
                    setMealPrice(price);
                  }}
                />

                <SpecialAssistanceForm
                  onAssistanceChange={setSpecialAssistance}
                  onPetChange={setPetTravel}
                />

                <TripInsurance
                  basePrice={basePrice}
                  onInsuranceChange={(insurance, price) => {
                    setSelectedInsurance(insurance);
                    setInsurancePrice(price);
                  }}
                />
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-4 mt-4">
                <OperatorReviews operator={bus.operator} maxReviews={5} />
                
                <SmartPricePrediction 
                  basePrice={basePrice}
                  operatorTier={bus.operatorTier || 'standard'}
                  itemName={`${bus.from} to ${bus.to}`}
                />
                
                <div className="flex justify-center">
                  <PriceAlertDialog
                    itemId={bus.id}
                    itemName={bus.operator}
                    itemType="bus"
                    currentPrice={basePrice}
                    routeFrom={bus.from}
                    routeTo={bus.to}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Desktop Summary */}
          <div className="hidden md:block">
            <div className="sticky top-24 space-y-4">
              {/* Passenger Details Form */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Passenger Details</h3>
                <SmartTravelerForm
                  value={travelerDetails}
                  onChange={setTravelerDetails}
                  showPassport
                />
                <div className="space-y-3 mt-3">
                  <Input
                    placeholder="Next of Kin Number"
                    value={nextOfKinNumber}
                    onChange={(e) => setNextOfKinNumber(e.target.value)}
                  />
                  <Input
                    placeholder="WhatsApp Number"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                  <Input
                    placeholder="Final Destination City"
                    value={finalDestinationCity}
                    onChange={(e) => setFinalDestinationCity(e.target.value)}
                  />
                </div>
              </Card>

              {/* Summary */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Booking Summary</h3>
                {selectedSeats.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seats</span>
                      <span>{selectedSeats.join(", ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span>{isReturnTicket ? "Return" : "One-way"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price each</span>
                      <span>{convertPrice(effectivePrice)}</span>
                    </div>
                    {groupDiscount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Discount</span>
                        <span>-{convertPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-xl text-primary">{convertPrice(totalPrice)}</span>
                    </div>
                    <Button className="w-full mt-2" size="lg" onClick={handleBooking}>
                      Proceed to Payment
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select seats to continue
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-pb">
        <Drawer open={isBookingDrawerOpen} onOpenChange={setIsBookingDrawerOpen}>
          <div className="bg-background border-t px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {selectedSeats.length > 0 ? `${selectedSeats.length} seat(s)` : 'From'}
                </p>
                <p className="text-lg font-bold">
                  {selectedSeats.length > 0 
                    ? convertPrice(totalPrice) 
                    : convertPrice(effectivePrice)
                  }
                </p>
              </div>
              <DrawerTrigger asChild>
                <Button size="lg" className="gap-2 px-6" disabled={selectedSeats.length === 0}>
                  <CreditCard className="h-4 w-4" />
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
                  {/* Passenger Details Section */}
                  <AccordionItem value="details" className="border rounded-xl px-4 mb-2 bg-card">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          passengerName && passengerEmail && passengerPhone 
                            ? "bg-primary/20 text-primary" 
                            : "bg-primary/10 text-primary"
                        )}>
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-medium text-sm">Passenger Details</span>
                          {passengerName && passengerEmail && passengerPhone && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              ✓ Done
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">Required information</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-2 space-y-3">
                      <SmartTravelerForm
                        ref={travelerFormRef}
                        value={travelerDetails}
                        onChange={setTravelerDetails}
                        showPassport
                      />
                      <Input
                        placeholder="Next of Kin Number *"
                        value={nextOfKinNumber}
                        onChange={(e) => setNextOfKinNumber(e.target.value)}
                        className="mt-3"
                      />
                      <Input
                        placeholder="WhatsApp Number *"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="mt-3"
                      />
                      <Input
                        placeholder="Final Destination City *"
                        value={finalDestinationCity}
                        onChange={(e) => setFinalDestinationCity(e.target.value)}
                        className="mt-3"
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Additional Passengers Section */}
                  <AccordionItem value="passengers" className="border rounded-xl px-4 mb-2 bg-card">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                          <Plus className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-medium text-sm">Additional Passengers</span>
                          {passengers.length > 0 && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {passengers.length} added
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">Optional</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-2 space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <Label htmlFor="others-mobile" className="text-sm">Booking for Others</Label>
                        <Switch
                          id="others-mobile"
                          checked={isBookingForOthers}
                          onCheckedChange={setIsBookingForOthers}
                        />
                      </div>

                      {isBookingForOthers && (
                        <div className="space-y-3">
                          <Button onClick={handleAddPassenger} size="sm" variant="outline" className="w-full">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Passenger
                          </Button>
                          {passengers.map((passenger, index) => (
                            <Card key={index} className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Passenger {index + 2}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemovePassenger(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <Input
                                placeholder="Full Name"
                                value={passenger.name}
                                onChange={(e) => handlePassengerChange(index, "name", e.target.value)}
                              />
                              <Input
                                placeholder="Email"
                                value={passenger.email}
                                onChange={(e) => handlePassengerChange(index, "email", e.target.value)}
                              />
                              <Input
                                placeholder="Phone"
                                value={passenger.phone}
                                onChange={(e) => handlePassengerChange(index, "phone", e.target.value)}
                              />
                              <Input
                                placeholder="ID/Passport"
                                value={passenger.passportNumber}
                                onChange={(e) => handlePassengerChange(index, "passportNumber", e.target.value)}
                              />
                            </Card>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Payment Options Section */}
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
                          <Label htmlFor="cash-drawer" className="text-sm font-medium">
                            Reserve for Cash
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Pay at office before departure
                          </p>
                        </div>
                        <Switch
                          id="cash-drawer"
                          checked={isCashReservation}
                          onCheckedChange={setIsCashReservation}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Summary - Always visible */}
                <Card className="p-4 bg-muted/50">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seats</span>
                      <span>{selectedSeats.join(", ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span>{isReturnTicket ? "Return" : "One-way"}</span>
                    </div>
                    {groupDiscount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Discount</span>
                        <span>-{convertPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{convertPrice(subtotal)}</span>
                    </div>
                    {serviceFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service fee</span>
                        <span>{convertPrice(serviceFee)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-primary">{convertPrice(totalPrice)}</span>
                    </div>
                  </div>
                </Card>

                <Button className="w-full" size="lg" onClick={handleBooking}>
                  Proceed to Payment
                </Button>
              </div>
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Dialogs */}
      <SeatPreferenceDialog
        open={showSeatPreferences}
        onOpenChange={setShowSeatPreferences}
        onSave={(preferences) => {
          setSeatPreferences(preferences);
          toast({
            title: "Preferences saved!",
            description: "We'll recommend the best seats for you",
          });
        }}
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

export default BusDetails;
