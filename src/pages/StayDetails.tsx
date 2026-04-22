import { useState, useEffect, useMemo, useRef } from "react";
import { ServiceProgressBar } from "@/components/booking/ServiceProgressBar";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StayDetailsSkeleton } from "@/components/ui/detail-page-skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobileDateSelector } from "@/components/booking/MobileDateSelector";
import { ResponsiveModal, ResponsiveModalHeader, ResponsiveModalTitle, ResponsiveModalDescription } from "@/components/ui/responsive-modal";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  Building2, MapPin, Star, Wifi, Car, Dumbbell, 
  UtensilsCrossed, Clock, Check,
  Bed, Square, Calendar, ShoppingCart, CalendarDays,
  Users, Shield, ChevronLeft, ChevronRight, Share2, ImageIcon, Eye, Gem
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { getPropertyById } from "@/services/stayService";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Property, Room } from "@/types/stay";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PropertyCategoryForm from "@/components/booking/PropertyCategoryForm";
import BookingSpecialtyAddOns from "@/components/booking/BookingSpecialtyAddOns";
import { cn } from "@/lib/utils";
import { PropertyReviews } from "@/components/stays/PropertyReviews";
import { PropertyReviewDialog } from "@/components/stays/PropertyReviewDialog";
import { CancellationPolicy, getCancellationPolicyFromPolicies } from "@/components/stays/CancellationPolicy";
import RoomAvailabilityBadge from "@/components/stays/RoomAvailabilityBadge";
import { PropertyShareDialog } from "@/components/stays/PropertyShareDialog";
import { PropertyGallery } from "@/components/stays/PropertyGallery";
import { StayPriceCalendar } from "@/components/stays/StayPriceCalendar";
import { StayBookingCartProvider, useStayBookingCart } from "@/contexts/StayBookingCartContext";
import { StayBookingCart } from "@/components/stays/StayBookingCart";
import { PropertyLocationMap } from "@/components/maps/PropertyLocationMap";
import { useIsMobile } from "@/hooks/use-mobile";

// Airbnb-style components
import { PropertyHeroGrid } from "@/components/stays/PropertyHeroGrid";
import { AmenityGrid } from "@/components/stays/AmenityGrid";
import { HostProfileCard } from "@/components/stays/HostProfileCard";
import { RatingBreakdown } from "@/components/stays/RatingBreakdown";
import { MobileBookingBar } from "@/components/stays/MobileBookingBar";
import { GuestCounter } from "@/components/stays/GuestCounter";
import { SimilarProperties } from "@/components/stays/SimilarProperties";
import { StayShareCard } from "@/components/stays/StayShareCard";
import { NearbyAttractions } from "@/components/stays/NearbyAttractions";
import { ExpandableText } from "@/components/ui/ExpandableText";
import { motion } from "framer-motion";

const ID_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'drivers_license', label: 'Driver\'s License' },
];

const StayDetailsContent = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { convertPrice } = useCurrency();
  const { addToCart } = useStayBookingCart();
  const isMobile = useIsMobile();
  const roomsSectionRef = useRef<HTMLDivElement>(null);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showPriceCalendar, setShowPriceCalendar] = useState(false);
  const [selectedRoomForCalendar, setSelectedRoomForCalendar] = useState<Room | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [dynamicRoomPrices, setDynamicRoomPrices] = useState<Record<string, number>>({});
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [propertyCategoryData, setPropertyCategoryData] = useState<Record<string, any>>({});
  const [specialtyAddOns, setSpecialtyAddOns] = useState<Record<string, any>>({});

  // Search params for dates
  const checkInParam = searchParams.get("checkIn") || "";
  const checkOutParam = searchParams.get("checkOut") || "";
  const guestsParam = parseInt(searchParams.get("guests") || "2");
  const roomCount = parseInt(searchParams.get("rooms") || "1");

  const [checkInDate, setCheckInDate] = useState<Date | undefined>(
    checkInParam ? new Date(checkInParam) : undefined
  );
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(
    checkOutParam ? new Date(checkOutParam) : undefined
  );
  const [adults, setAdults] = useState(Math.max(1, guestsParam));
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const guests = adults + children;

  const checkIn = checkInDate ? format(checkInDate, 'yyyy-MM-dd') : checkInParam;
  const checkOut = checkOutDate ? format(checkOutDate, 'yyyy-MM-dd') : checkOutParam;

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    return differenceInDays(new Date(checkOut), new Date(checkIn)) || 1;
  }, [checkIn, checkOut]);

  const handleCheckInChange = (date: Date | undefined) => {
    setCheckInDate(date);
    if (date) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('checkIn', format(date, 'yyyy-MM-dd'));
      setSearchParams(newParams, { replace: true });
    }
  };

  const handleCheckOutChange = (date: Date | undefined) => {
    setCheckOutDate(date);
    if (date) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('checkOut', format(date, 'yyyy-MM-dd'));
      setSearchParams(newParams, { replace: true });
    }
  };

  // Booking form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getPropertyById(id);
        setProperty(data);
      } catch (error) {
        console.error("Error fetching property:", error);
        toast.error("Failed to load property details");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  useEffect(() => {
    if (user) {
      setGuestEmail(user.email || "");
      setGuestName(user.user_metadata?.full_name || "");
    }
  }, [user]);

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setShowBookingDialog(true);
  };

  const handleAddToCart = (room: Room) => {
    if (!property) return;
    const price = dynamicRoomPrices[room.id] || room.base_price;
    addToCart(room, 1, checkIn, checkOut, price, nights, property.id, property.name);
  };

  const handlePriceChange = (roomId: string, price: number) => {
    setDynamicRoomPrices(prev => ({ ...prev, [roomId]: price }));
  };

  const getRoomPrice = (room: Room) => dynamicRoomPrices[room.id] || room.base_price;

  const minPrice = property?.rooms && property.rooms.length > 0
    ? Math.min(...property.rooms.map(r => getRoomPrice(r)))
    : undefined;

  const totalPrice = selectedRoom ? getRoomPrice(selectedRoom) * nights * roomCount : 0;
  const serviceFee = Math.floor(totalPrice / 50);
  const taxes = Math.round(totalPrice * 0.15);
  const grandTotal = totalPrice + serviceFee + taxes;

  // Navigate to checkout instead of direct booking
  const handleBooking = async () => {
    if (!selectedRoom || !property) return;
    if (!guestName || !guestEmail || !guestPhone) {
      toast.error("Please fill in all required fields");
      return;
    }
    setShowBookingDialog(false);
    navigate("/booking/confirm", {
      state: {
        type: "stay",
        itemId: property.id,
        itemName: property.name,
        passengerName: guestName,
        passengerEmail: guestEmail,
        passengerPhone: guestPhone,
        totalPrice: grandTotal,
        serviceFee,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        propertyCity: property.city,
        roomName: selectedRoom.name,
        numGuests: guests,
        numRooms: roomCount,
        operator: property.name,
      },
    });
  };

  const scrollToRooms = () => {
    roomsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Desktop sidebar: update when room is selected via sidebar
  const handleSidebarRoomSelect = (room: Room) => {
    setSelectedRoom(room);
  };

  if (loading) return <StayDetailsSkeleton />;

  if (!property) {
    return (
      <MobileAppLayout hideNav>
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Property not found</h1>
          <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/stays")} className="mobile-button">Back to Search</Button>
        </main>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout hideNav className="pb-24 md:pb-0">
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-2 md:py-6">
        {/* Desktop: back + progress bar */}
        <div className="hidden md:block">
          <BackButton className="mb-2" fallbackPath="/stays" />
          <ServiceProgressBar currentStep={3} className="mb-4" />
        </div>

        {/* Airbnb-style Hero Image Grid — BackButton overlaid on mobile */}
        <div className="relative">
          <div className="md:hidden absolute top-3 left-3 z-20">
            <BackButton fallbackPath="/stays" className="bg-background/80 backdrop-blur-sm rounded-full shadow-md px-3 py-1.5 text-sm" />
          </div>
          <PropertyHeroGrid
          images={property.images || []}
          propertyName={property.name}
          propertyType={property.property_type}
          propertyId={property.id}
          onShowGallery={() => setShowGallery(true)}
            onShowShare={() => setShowShareDialog(true)}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Rare Find / Urgency Banner */}
            {((property.review_score || 0) >= 4.5 || (property.rooms && property.rooms.some(r => r.quantity <= 2))) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-pink-500/10 border border-pink-500/20"
              >
                <Gem className="h-5 w-5 text-pink-600 dark:text-pink-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-pink-700 dark:text-pink-300">Rare find</p>
                  <p className="text-xs text-muted-foreground">{property.name} is usually booked. Don't miss out!</p>
                </div>
              </motion.div>
            )}

            {/* Live Viewing Indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-500/10 w-fit"
            >
              <Eye className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {((property.id.charCodeAt(0) + property.id.charCodeAt(1)) % 8) + 3} people viewing this right now
              </span>
            </motion.div>

            {/* Header */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{property.name}</h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {property.address}, {property.city}, {property.country}
                  </p>
                </div>
                {property.star_rating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: property.star_rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Trust badges + Share — compact horizontal scroll on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {property.policies?.cancellation && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full whitespace-nowrap shrink-0">
                  <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {property.policies.cancellation === 'flexible' ? 'Free cancellation' : 'Cancellation available'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full whitespace-nowrap shrink-0">
                <Check className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Instant confirmation</span>
              </div>
              {(property.review_score || 0) >= 4.5 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full whitespace-nowrap shrink-0">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Guest favourite</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full shrink-0 h-8 px-3 text-xs"
                onClick={() => setShowShareCard(true)}
              >
                <Share2 className="h-3.5 w-3.5 mr-1" />
                Share
              </Button>
            </div>

            <Separator />

            {/* Host Profile Card */}
            <HostProfileCard
              hostName={property.name}
              reviewScore={property.review_score}
              reviewCount={property.review_count}
            />

            {/* Description */}
            {property.description && (
              <div>
                <h3 className="text-xl font-semibold mb-3">About this property</h3>
                <ExpandableText text={property.description} />
              </div>
            )}

            <Separator />

            {/* Amenities - Airbnb categorized grid */}
            {property.amenities && property.amenities.length > 0 && (
              <AmenityGrid amenities={property.amenities} />
            )}

            <Separator />

            {/* Check-in/out & House Rules */}
            <div>
              <h3 className="text-xl font-semibold mb-4">House Rules</h3>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">Check-in: <strong>{property.check_in_time}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">Check-out: <strong>{property.check_out_time}</strong></span>
                  </div>
                </div>
                {property.policies?.house_rules && (
                  <div className="space-y-2">
                    {property.policies.house_rules.map((rule, i) => (
                      <p key={i} className="text-sm text-muted-foreground">• {rule}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Cancellation Policy */}
            <CancellationPolicy 
              policyType={getCancellationPolicyFromPolicies(property.policies)}
              checkInDate={checkIn}
              compact={false}
            />

            <Separator />

            {/* Rating Breakdown */}
            <RatingBreakdown
              overallRating={property.review_score || 0}
              totalReviews={property.review_count || 0}
            />

            {/* Reviews Section */}
            <PropertyReviews 
              propertyId={property.id}
              showWriteButton={!!user}
              onWriteReview={() => setShowReviewDialog(true)}
            />

            <Separator />

            {/* What's Nearby */}
            <NearbyAttractions
              city={property.city}
              country={property.country}
              latitude={property.latitude}
              longitude={property.longitude}
            />

            <Separator />

            {/* Location Map */}
            <PropertyLocationMap
              address={property.address}
              city={property.city}
              country={property.country}
              propertyName={property.name}
            />

            {/* Mobile: Date + Guest selector above rooms */}
            <div className="space-y-4 md:hidden">
              <h3 className="text-lg font-semibold">Select your stay</h3>
              <MobileDateSelector
                mode="range"
                checkIn={checkInDate}
                checkOut={checkOutDate}
                onCheckInChange={handleCheckInChange}
                onCheckOutChange={handleCheckOutChange}
                label="Select Stay Dates"
              />
              <Button
                variant="outline"
                className="w-full justify-start rounded-xl h-12"
                onClick={() => setShowGuestPicker(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                {adults} adult{adults !== 1 ? 's' : ''}{children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}{infants > 0 ? `, ${infants} infant${infants !== 1 ? 's' : ''}` : ''}
              </Button>
              {(!checkIn || !checkOut) && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Please select your check-in and check-out dates above to view room prices
                  </p>
                </div>
              )}
              {checkIn && checkOut && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {nights} night(s): {format(new Date(checkIn), 'MMM d')} - {format(new Date(checkOut), 'MMM d')}
                  </p>
                </div>
              )}
            </div>

            {/* Desktop: Guest Counter (hidden on mobile, shown inline) */}
            <div className="hidden md:block space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Guests
              </h3>
              <Popover open={showGuestPicker} onOpenChange={setShowGuestPicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start rounded-xl h-12">
                    <Users className="h-4 w-4 mr-2" />
                    {adults} adult{adults !== 1 ? 's' : ''}{children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}{infants > 0 ? `, ${infants} infant${infants !== 1 ? 's' : ''}` : ''}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <GuestCounter
                    adults={adults}
                    children={children}
                    infants={infants}
                    onAdultsChange={setAdults}
                    onChildrenChange={setChildren}
                    onInfantsChange={setInfants}
                    maxGuests={16}
                  />
                </PopoverContent>
              </Popover>

            </div>

            {/* Available Rooms */}
            <div id="rooms-section" ref={roomsSectionRef}>
              <Card>
                <CardHeader>
                  <CardTitle>Available Rooms</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select a room for {nights} {nights === 1 ? 'night' : 'nights'} · {guests} guest{guests !== 1 ? 's' : ''}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {property.rooms && property.rooms.length > 0 ? (
                    property.rooms.map(room => (
                      <RoomCard 
                        key={room.id} 
                        room={room} 
                        nights={nights}
                        checkIn={checkIn}
                        checkOut={checkOut}
                        onSelect={() => handleRoomSelect(room)}
                        onAddToCart={() => handleAddToCart(room)}
                        onViewPriceCalendar={() => {
                          setSelectedRoomForCalendar(room);
                          setShowPriceCalendar(true);
                        }}
                        onPriceChange={(price) => handlePriceChange(room.id, price)}
                        isSelected={selectedRoom?.id === room.id}
                        onSidebarSelect={() => handleSidebarRoomSelect(room)}
                      />
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No rooms available for the selected dates
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Similar Properties */}
            <SimilarProperties
              currentPropertyId={property.id}
              city={property.city}
              propertyType={property.property_type}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              rooms={roomCount}
            />
          </div>

          {/* Interactive Booking Sidebar - Desktop only */}
          <div className="hidden lg:block space-y-4">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-baseline justify-between">
                  <CardTitle className="text-xl">
                    {minPrice ? convertPrice(minPrice) : '—'}
                    <span className="text-sm font-normal text-muted-foreground"> / night</span>
                  </CardTitle>
                  {property.review_score && property.review_score > 0 && (
                    <span className="text-sm flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {property.review_score.toFixed(1)}
                      {property.review_count ? <span className="text-muted-foreground">({property.review_count})</span> : null}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Interactive date pickers */}
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left h-auto py-2 px-3">
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground">Check-in</div>
                          <div className="text-sm font-medium">
                            {checkIn ? format(new Date(checkIn), "MMM d, yyyy") : "Add date"}
                          </div>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={checkInDate}
                        onSelect={handleCheckInChange}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left h-auto py-2 px-3">
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground">Check-out</div>
                          <div className="text-sm font-medium">
                            {checkOut ? format(new Date(checkOut), "MMM d, yyyy") : "Add date"}
                          </div>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={checkOutDate}
                        onSelect={handleCheckOutChange}
                        disabled={(date) => date <= (checkInDate || new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Guest picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left h-auto py-2 px-3">
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-muted-foreground">Guests</div>
                        <div className="text-sm font-medium">
                          {guests} guest{guests !== 1 ? 's' : ''}{infants > 0 ? `, ${infants} infant${infants !== 1 ? 's' : ''}` : ''}
                        </div>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <GuestCounter
                      adults={adults}
                      children={children}
                      infants={infants}
                      onAdultsChange={setAdults}
                      onChildrenChange={setChildren}
                      onInfantsChange={setInfants}
                      maxGuests={16}
                    />
                  </PopoverContent>
                </Popover>

                <Separator />

                {/* Dynamic price summary */}
                {selectedRoom ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{selectedRoom.name}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{convertPrice(getRoomPrice(selectedRoom))} × {nights} nights</span>
                      <span>{convertPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service fee</span>
                      <span>{convertPrice(serviceFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxes</span>
                      <span>{convertPrice(taxes)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{convertPrice(grandTotal)}</span>
                    </div>
                    <Button className="w-full mt-2 h-12 rounded-xl" onClick={() => setShowBookingDialog(true)}>
                      Reserve
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                      Select a room below to see total price
                    </p>
                    <Button variant="outline" className="w-full h-12 rounded-xl" onClick={scrollToRooms}>
                      View Available Rooms
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Mobile Booking Bar - enhanced with dates/guests */}
      <MobileBookingBar
        minPrice={minPrice}
        nights={nights}
        reviewScore={property.review_score}
        reviewCount={property.review_count}
        onReserve={scrollToRooms}
        checkIn={checkIn}
        checkOut={checkOut}
        guests={guests}
      />

      {/* Booking Dialog - Responsive (Drawer on mobile, Dialog on desktop) */}
      <ResponsiveModal open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <div className="max-h-[85vh] overflow-y-auto">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>Complete Your Booking</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Fill in your details to complete the reservation
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
          
          {selectedRoom && (
            <div className="space-y-6 p-4 md:p-6">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">{selectedRoom.name}</h4>
                <p className="text-sm text-muted-foreground capitalize">
                  {selectedRoom.room_type.replace('_', ' ')} • Max {selectedRoom.max_guests} guests
                </p>
                <div className="text-sm text-muted-foreground">
                  {checkIn && checkOut && (
                    <span>{format(new Date(checkIn), 'MMM d')} – {format(new Date(checkOut), 'MMM d')} · {nights} night{nights !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{convertPrice(getRoomPrice(selectedRoom))} × {nights} nights × {roomCount} room(s)</span>
                  <span>{convertPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Service fee</span>
                  <span>{convertPrice(serviceFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxes</span>
                  <span>{convertPrice(taxes)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{convertPrice(grandTotal)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Full Name *</Label>
                  <Input id="guestName" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Enter your full name" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestEmail">Email *</Label>
                  <Input id="guestEmail" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="your@email.com" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestPhone">Phone *</Label>
                  <Input id="guestPhone" type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+27 123 456 7890" className="h-12" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="idType">ID Type</Label>
                    <Select value={idType} onValueChange={setIdType}>
                      <SelectTrigger className="h-12"><SelectValue placeholder="Select ID type" /></SelectTrigger>
                      <SelectContent>
                        {ID_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number</Label>
                    <Input id="idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="ID number" className="h-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea id="specialRequests" value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} placeholder="Any special requests? (optional)" rows={3} />
                </div>
              </div>

              <PropertyCategoryForm
                propertyType={property?.property_type}
                data={propertyCategoryData}
                onChange={setPropertyCategoryData}
              />
              <BookingSpecialtyAddOns
                vertical="property"
                data={specialtyAddOns}
                onChange={setSpecialtyAddOns}
              />

              <div className="flex gap-3 sticky bottom-0 bg-background pt-3 pb-safe">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowBookingDialog(false)}>Cancel</Button>
                <Button className="flex-1 h-12 rounded-xl" onClick={handleBooking} disabled={bookingLoading}>
                  {bookingLoading ? "Processing..." : `Continue – ${convertPrice(grandTotal)}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </ResponsiveModal>

      {/* Mobile Guest Picker Drawer */}
      <ResponsiveModal open={showGuestPicker && isMobile} onOpenChange={setShowGuestPicker}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Guests</ResponsiveModalTitle>
          <ResponsiveModalDescription>Select the number of guests</ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <div className="p-4">
          <GuestCounter
            adults={adults}
            children={children}
            infants={infants}
            onAdultsChange={setAdults}
            onChildrenChange={setChildren}
            onInfantsChange={setInfants}
            maxGuests={16}
          />
          <Button className="w-full mt-4 h-12 rounded-xl" onClick={() => setShowGuestPicker(false)}>
            Done
          </Button>
        </div>
      </ResponsiveModal>

      <PropertyReviewDialog propertyId={property.id} propertyName={property.name} open={showReviewDialog} onOpenChange={setShowReviewDialog} onReviewSubmitted={() => toast.success("Review submitted successfully!")} />
      <PropertyShareDialog open={showShareDialog} onOpenChange={setShowShareDialog} property={{ id: property.id, name: property.name, city: property.city, country: property.country, star_rating: property.star_rating }} />
      <StayShareCard
        open={showShareCard}
        onOpenChange={setShowShareCard}
        property={{
          name: property.name,
          city: property.city,
          country: property.country,
          star_rating: property.star_rating,
          review_score: property.review_score,
          review_count: property.review_count,
          images: property.images || [],
          min_price: minPrice,
          property_type: property.property_type,
        }}
      />
      <PropertyGallery open={showGallery} onOpenChange={setShowGallery} images={property.images || []} propertyName={property.name} initialIndex={0} />
      {selectedRoomForCalendar && (
        <StayPriceCalendar open={showPriceCalendar} onOpenChange={setShowPriceCalendar} roomId={selectedRoomForCalendar.id} roomName={selectedRoomForCalendar.name} basePrice={selectedRoomForCalendar.base_price} />
      )}
      <StayBookingCart />
      <div className="hidden md:block"><Footer /></div>
    </MobileAppLayout>
  );
};

// Room Card Component with Image Carousel
const RoomCard = ({ room, nights, checkIn, checkOut, onSelect, onAddToCart, onViewPriceCalendar, onPriceChange, isSelected, onSidebarSelect }: { 
  room: Room; nights: number; checkIn: string; checkOut: string;
  onSelect: () => void; onAddToCart: () => void; onViewPriceCalendar: () => void; onPriceChange: (price: number) => void;
  isSelected?: boolean; onSidebarSelect?: () => void;
}) => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(room.base_price);
  const [imgIndex, setImgIndex] = useState(0);
  const { convertPrice } = useCurrency();

  const displayImages = room.images && room.images.length > 0 ? room.images : [];

  const handlePriceUpdate = (price: number) => {
    setCurrentPrice(price);
    onPriceChange(price);
  };

  const totalPrice = currentPrice * nights;

  const getBedConfig = () => {
    const beds = [];
    if (room.bed_configuration?.king_beds) beds.push(`${room.bed_configuration.king_beds} King`);
    if (room.bed_configuration?.queen_beds) beds.push(`${room.bed_configuration.queen_beds} Queen`);
    if (room.bed_configuration?.double_beds) beds.push(`${room.bed_configuration.double_beds} Double`);
    if (room.bed_configuration?.single_beds) beds.push(`${room.bed_configuration.single_beds} Single`);
    return beds.join(', ') || 'Standard bedding';
  };

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden hover:shadow-md transition-shadow",
      isSelected && "ring-2 ring-primary border-primary"
    )}>
      <div className="flex flex-col sm:flex-row">
        {displayImages.length > 0 && (
          <div className="sm:w-44 h-36 sm:h-auto relative group/room overflow-hidden">
            <img src={displayImages[imgIndex]} alt={room.name} className="w-full h-full object-cover" />
            {displayImages.length > 1 && (
              <>
                <Button
                  variant="ghost" size="icon"
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-background/80 h-8 w-8 rounded-full md:opacity-0 md:group-hover/room:opacity-100 transition-opacity"
                  onClick={() => setImgIndex(i => i === 0 ? displayImages.length - 1 : i - 1)}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-background/80 h-8 w-8 rounded-full md:opacity-0 md:group-hover/room:opacity-100 transition-opacity"
                  onClick={() => setImgIndex(i => i === displayImages.length - 1 ? 0 : i + 1)}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
                <div className="absolute bottom-1 right-1 bg-background/80 rounded-full px-1.5 py-0.5 text-[10px] flex items-center gap-0.5">
                  <ImageIcon className="h-2.5 w-2.5" />
                  {imgIndex + 1}/{displayImages.length}
                </div>
              </>
            )}
          </div>
        )}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold">{room.name}</h4>
              <p className="text-sm text-muted-foreground capitalize">{room.room_type.replace('_', ' ')}</p>
            </div>
            <RoomAvailabilityBadge
              roomId={room.id} checkIn={checkIn} checkOut={checkOut}
              roomQuantity={room.quantity}
              onAvailabilityChange={(v) => setIsAvailable(v)}
              onPriceChange={handlePriceUpdate}
            />
          </div>
          
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{getBedConfig()}</span>
            {room.size_sqm && <span className="flex items-center gap-1"><Square className="h-4 w-4" />{room.size_sqm} m²</span>}
            <span className="flex items-center gap-1"><Users className="h-4 w-4" />Max {room.max_guests}</span>
          </div>

          {room.amenities && room.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {room.amenities.slice(0, 4).map(amenity => (
                <Badge key={amenity} variant="secondary" className="text-xs capitalize">{amenity.replace('_', ' ')}</Badge>
              ))}
              {room.amenities.length > 4 && <Badge variant="secondary" className="text-xs">+{room.amenities.length - 4} more</Badge>}
            </div>
          )}

          <div className="flex items-end justify-between pt-3 border-t">
            <div>
              <button onClick={onViewPriceCalendar} className="text-xs text-primary hover:underline flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3" />View price calendar
              </button>
              <p className="text-2xl font-bold">{convertPrice(totalPrice)}</p>
              <p className="text-xs text-muted-foreground">{convertPrice(currentPrice)}/night × {nights} nights</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-10 touch-manipulation" onClick={onAddToCart} disabled={!isAvailable}>
                <ShoppingCart className="h-4 w-4 mr-1" />Add
              </Button>
              <Button className="h-10 touch-manipulation" onClick={onSelect} disabled={!isAvailable}>Book Now</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StayDetails = () => (
  <StayBookingCartProvider>
    <StayDetailsContent />
  </StayBookingCartProvider>
);

export default StayDetails;
