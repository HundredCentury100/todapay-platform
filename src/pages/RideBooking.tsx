import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Share2, AlertTriangle, Loader2
} from "lucide-react";
import { RideHomeStep } from "@/components/rides/steps/RideHomeStep";
import { VehicleSelectStep, type VehicleOption } from "@/components/rides/steps/VehicleSelectStep";
import { FindingDriverStep } from "@/components/rides/steps/FindingDriverStep";
import { TrackingStep } from "@/components/rides/steps/TrackingStep";
import { RideReceiptStep } from "@/components/rides/steps/RideReceiptStep";
import { RideRatingModal } from "@/components/rides/RideRatingModal";
import { CancelRideModal } from "@/components/rides/CancelRideModal";
import { EmergencyActionsModal } from "@/components/rides/EmergencyActionsModal";
import { RideChat } from "@/components/rides/RideChat";
import { calculateFareEstimate, createRideRequest, getSurgePricing } from "@/services/rideService";
import { VEHICLE_TYPES, type PricingMode, type FareEstimate, type VehicleType, type ActiveRide, type ActiveRideStatus } from "@/types/ride";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDeviceLocation } from "@/hooks/useDeviceLocation";
import { useNotifications } from "@/contexts/NotificationContext";

const RideMap = lazy(() => import("@/components/rides/RideMap"));

const VEHICLES: VehicleOption[] = [
  { id: 'economy', name: 'Go', desc: 'Affordable, everyday rides', seats: 4, multiplier: 1.0, eta: 3 },
  { id: 'sedan', name: 'Comfort', desc: 'Newer cars with extra legroom', seats: 4, multiplier: 1.2, eta: 5 },
  { id: 'suv', name: 'Plus', desc: 'Spacious rides for groups up to 6', seats: 6, multiplier: 1.5, eta: 7 },
  { id: 'van', name: 'Max', desc: 'Groups of up to 8', seats: 8, multiplier: 1.8, eta: 10 },
  { id: 'luxury', name: 'Elite', desc: 'Premium rides in luxury cars', seats: 4, multiplier: 2.5, eta: 8 },
];

type FlowStep = 'home' | 'vehicle' | 'finding' | 'tracking' | 'receipt';

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

const RideBooking = () => {
  const navigate = useNavigate();
  const { currency, convertValue } = useCurrency();
  const deviceLocation = useDeviceLocation();
  const { addNotification } = useNotifications();

  const [step, setStep] = useState<FlowStep>('home');

  // Location
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [pickupCoords, setPickupCoords] = useState({ lat: 0, lng: 0 });
  const [dropoffCoords, setDropoffCoords] = useState({ lat: 0, lng: 0 });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [locationResolved, setLocationResolved] = useState(false);
  const locationInitialized = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Vehicle & pricing
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | 'any'>('economy');
  const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);
  const [surgeData, setSurgeData] = useState<{ multiplier: number; reason: string | null } | null>(null);
  const [pricingMode, setPricingMode] = useState<PricingMode>('fixed');
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');

  // Passenger
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");

  // Book for someone else
  const [bookingForOther, setBookingForOther] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  // Multi-stop
  const [stops, setStops] = useState<{ address: string; coords: { lat: number; lng: number } }[]>([]);

  // Booking / tracking
  const [isBooking, setIsBooking] = useState(false);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [rideStatus, setRideStatus] = useState<ActiveRideStatus>('driver_assigned');
  const [pickupPin, setPickupPin] = useState<string | null>(null);
  const [matchTime, setMatchTime] = useState<Date | null>(null);

  // Modals
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [completedRide, setCompletedRide] = useState<ActiveRide | null>(null);

  // Recent trips
  const [recentTrips, setRecentTrips] = useState<any[]>([]);

  // Auto-populate profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single();
      if (data) {
        setPassengerName(data.full_name || '');
        setPassengerPhone(data.phone || '');
      }
    };
    fetchProfile();
  }, []);

  // Sync device location — use GPS if available, otherwise show map with default center
  useEffect(() => {
    if (locationInitialized.current) return;

    const loc = deviceLocation.location;
    if (loc && loc.lat !== 0 && loc.lng !== 0) {
      const coords = { lat: loc.lat, lng: loc.lng };
      setPickupCoords(coords);
      setUserLocation(coords);
      setPickupAddress(loc.displayName || "Current Location");
      setLocationResolved(true);
      locationInitialized.current = true;
      if (fallbackTimerRef.current) { clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }
      if (typeof google !== 'undefined' && google?.maps?.Geocoder) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: coords }).then(result => {
          if (result?.results?.[0]) setPickupAddress(result.results[0].formatted_address);
        }).catch(() => {});
      }
      loadRecentTrips();
      return;
    }

    // If geolocation finished without a result, resolve immediately
    if (!deviceLocation.isDetecting && !loc) {
      setLocationResolved(true);
      locationInitialized.current = true;
      setPickupAddress("Set pickup location");
      loadRecentTrips();
    }
  }, [deviceLocation.location, deviceLocation.isDetecting]);

  // Safety fallback: never leave the UI stuck longer than 6 seconds
  useEffect(() => {
    if (locationResolved) return;
    fallbackTimerRef.current = setTimeout(() => {
      if (!locationResolved) {
        setLocationResolved(true);
        locationInitialized.current = true;
        setPickupAddress("Set pickup location");
        loadRecentTrips();
      }
    }, 6000);
    return () => { if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current); };
  }, [locationResolved]);

  useEffect(() => {
    if (!deviceLocation.location) return;
    setUserLocation({ lat: deviceLocation.location.lat, lng: deviceLocation.location.lng });
  }, [deviceLocation.location]);

  // Surge
  useEffect(() => {
    if (!pickupCoords.lat) return;
    getSurgePricing(pickupCoords.lat, pickupCoords.lng).then(setSurgeData);
  }, [pickupCoords.lat, pickupCoords.lng]);

  // Fare
  useEffect(() => {
    if (!dropoffCoords.lat || dropoffCoords.lat === 0) { setFareEstimate(null); return; }
    const dist = haversine(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng);
    const dur = Math.round(dist * 2.5);
    const vm = VEHICLE_TYPES.find(v => v.id === selectedVehicle)?.multiplier || 1;
    const est = calculateFareEstimate(dist, dur, surgeData?.multiplier || 1, vm);
    setFareEstimate(est);
    if (pricingMode === 'negotiation' && offerPrice === 0) setOfferPrice(Math.round(est.total_estimate));
  }, [pickupCoords, dropoffCoords, selectedVehicle, surgeData]);

  // Track active ride
  useEffect(() => {
    if (!activeRideId) return;
    const fetchRide = async () => {
      const { data } = await supabase
        .from('active_rides')
        .select('*, driver:drivers(*), ride_request:ride_requests(*)')
        .eq('id', activeRideId).single();
      if (data) {
        setRide(data as unknown as ActiveRide);
        setPickupPin(data.pickup_pin);
        setMatchTime(new Date(data.driver_assigned_at));
        const sm: Record<string, ActiveRideStatus> = {
          matched: 'driver_assigned', driver_arriving: 'driver_arriving',
          arrived_at_pickup: 'arrived_at_pickup', in_progress: 'in_progress', completed: 'completed'
        };
        setRideStatus(sm[data.status] || 'driver_assigned');
      }
    };
    fetchRide();

    const channel = supabase.channel(`ride-${activeRideId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'active_rides', filter: `id=eq.${activeRideId}` },
        (payload) => {
          const n = payload.new as any;
          setRide(prev => prev ? { ...prev, ...n } : null);
          const sm: Record<string, ActiveRideStatus> = {
            matched: 'driver_assigned', driver_arriving: 'driver_arriving',
            arrived_at_pickup: 'arrived_at_pickup', in_progress: 'in_progress', completed: 'completed'
          };
          setRideStatus(sm[n.status] || 'driver_assigned');
          if (n.status === 'arrived_at_pickup') { navigator.vibrate?.([200, 100, 200]); toast.success("Your driver has arrived!"); }
          if (n.status === 'in_progress') { navigator.vibrate?.(100); toast.info("Ride started!"); }
          if (n.status === 'completed') { handleRideComplete(); }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeRideId]);

  const loadRecentTrips = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('active_rides')
      .select('id, final_price, dropoff_time, ride_request:ride_requests(pickup_address, dropoff_address)')
      .eq('passenger_id', user.id).eq('status', 'completed')
      .order('dropoff_time', { ascending: false }).limit(5);
    setRecentTrips(data || []);
  };

  const formatPrice = (amount: number) => {
    return `${currency.symbol}${Math.round(convertValue(amount, 'USD')).toLocaleString()}`;
  };

  const handleBookRide = async () => {
    if (!passengerName) { toast.error("Please update your profile with your name before booking"); return; }
    setIsBooking(true);
    const { data, error } = await createRideRequest({
      passenger_name: passengerName,
      passenger_phone: passengerPhone,
      pickup_address: pickupAddress,
      pickup_lat: pickupCoords.lat, pickup_lng: pickupCoords.lng,
      dropoff_address: dropoffAddress,
      dropoff_lat: dropoffCoords.lat, dropoff_lng: dropoffCoords.lng,
      pricing_mode: pricingMode,
      offered_price: pricingMode === 'negotiation' ? offerPrice : undefined,
      vehicle_type: selectedVehicle,
      recipient_name: bookingForOther ? recipientName : undefined,
      recipient_phone: bookingForOther ? recipientPhone : undefined,
    });
    setIsBooking(false);
    if (error) { toast.error("Failed to create ride"); return; }
    if (data) {
      setCurrentRideId(data.id);
      setStep('finding');
      addNotification("info", "Ride Requested", `Finding a driver for your trip to ${dropoffAddress}`, {
        category: 'booking',
        metadata: { routeFrom: pickupAddress, routeTo: dropoffAddress },
      });
      toast.success(
        bookingForOther
          ? `Ride booked for ${recipientName}! Finding a driver...`
          : pricingMode === 'negotiation' ? "Your offer has been sent to drivers!" : "Finding you a driver..."
      );
    }
  };

  const handleBidAccepted = (rideId: string) => {
    setCurrentRideId(null);
    setActiveRideId(rideId);
    setStep('tracking');
  };

  const handleRideComplete = async () => {
    if (!activeRideId) return;
    const { data } = await supabase
      .from('active_rides')
      .select('*, driver:drivers(*), ride_request:ride_requests(*)')
      .eq('id', activeRideId).single();
    if (data) {
      const completed = data as unknown as ActiveRide;
      setCompletedRide(completed);
      setRide(completed);
      setStep('receipt');
      addNotification("success", "Ride Completed 🎉", `Your ride is complete. Fare: ${formatPrice(data.final_price || 0)}`, {
        category: 'payment',
        metadata: { amount: data.final_price || 0 },
      });
    }
  };

  const handleReset = () => {
    setStep('home');
    setActiveRideId(null); setCurrentRideId(null); setRide(null);
    setDropoffAddress(""); setDropoffCoords({ lat: 0, lng: 0 });
    setPricingMode('fixed'); setOfferPrice(0); setStops([]);
    setBookingForOther(false); setRecipientName(""); setRecipientPhone("");
    setCompletedRide(null);
  };

  const handleShareRide = async () => {
    const url = `${window.location.origin}/track/${ride?.share_code || activeRideId}`;
    try { await navigator.share?.({ title: 'Track My Ride', url }); } catch { navigator.clipboard.writeText(url); toast.success("Link copied!"); }
  };

  const driver = ride?.driver ? {
    name: (ride.driver as any).full_name || "Driver",
    rating: (ride.driver as any).rating || 4.9,
    trips: (ride.driver as any).total_rides || 0,
    car: `${(ride.driver as any).vehicle_make || ''} ${(ride.driver as any).vehicle_model || ''}`.trim() || "Vehicle",
    plate: (ride.driver as any).license_plate || "---",
    photo: (ride.driver as any).profile_photo_url,
    phone: (ride.driver as any).phone,
    color: (ride.driver as any).vehicle_color || "",
  } : null;

  const estimatedPrice = fareEstimate?.total_estimate || 0;
  const minutesSinceMatch = matchTime ? Math.floor((Date.now() - matchTime.getTime()) / 60000) : undefined;

  const handleBack = () => {
    if (step === 'tracking' || step === 'receipt') return;
    if (step === 'finding') { setStep('vehicle'); setCurrentRideId(null); }
    else if (step === 'vehicle') setStep('home');
    else navigate(-1);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* ── MAP — top half ── */}
      <div className="relative h-[50vh] shrink-0 z-0" style={{ touchAction: 'none' }}>
        <Suspense fallback={<div className="h-full bg-muted animate-pulse" />}>
          {locationResolved ? (
            <RideMap
              pickupCoords={
                step === 'tracking' && ride
                  ? { lat: (ride.ride_request as any)?.pickup_lat || pickupCoords.lat, lng: (ride.ride_request as any)?.pickup_lng || pickupCoords.lng }
                  : pickupCoords.lat !== 0 ? pickupCoords : { lat: -17.8292, lng: 31.0522 }
              }
              dropoffCoords={
                step === 'tracking' && ride
                  ? { lat: (ride.ride_request as any)?.dropoff_lat || dropoffCoords.lat, lng: (ride.ride_request as any)?.dropoff_lng || dropoffCoords.lng }
                  : dropoffCoords
              }
              driverCoords={
                step === 'tracking' && ride?.current_driver_lat && ride?.current_driver_lng
                  ? { lat: ride.current_driver_lat, lng: ride.current_driver_lng }
                  : null
              }
              pickupAddress={step === 'tracking' ? (ride?.ride_request as any)?.pickup_address : pickupAddress}
              dropoffAddress={step === 'tracking' ? (ride?.ride_request as any)?.dropoff_address : dropoffAddress}
              driverName={driver?.name}
              showRoute={dropoffCoords.lat !== 0 && dropoffCoords.lng !== 0}
              rideStatus={step === 'tracking' ? rideStatus : undefined}
              className="h-full w-full"
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Detecting your location…</p>
              </div>
            </div>
          )}
        </Suspense>

        {/* ── FLOATING TOP CONTROLS ── */}
        <div className="absolute top-0 left-0 right-0 z-30 safe-area-pt">
          <div className="px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost" size="icon"
              className="h-11 w-11 rounded-full bg-card/90 backdrop-blur-md shadow-lg border border-border/30 press-effect"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1" />
            {step === 'tracking' && (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full bg-card/90 backdrop-blur-md shadow-lg border border-border/30 press-effect" onClick={handleShareRide}>
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full bg-destructive/10 backdrop-blur-md border border-destructive/20 shadow-lg text-destructive press-effect" onClick={() => setShowEmergency(true)}>
                  <AlertTriangle className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM CONTENT PANEL — fills remaining 50vh ── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain rounded-t-3xl -mt-4 z-10 bg-card/95 backdrop-blur-xl border-t border-border/30 shadow-[0_-8px_40px_rgba(0,0,0,0.15)] safe-area-pb" style={{ touchAction: 'pan-y' }}>
        {/* Drag handle for visual affordance */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <AnimatePresence mode="wait">
          {step === 'home' && (
            <RideHomeStep
              pickupAddress={pickupAddress}
              dropoffAddress={dropoffAddress}
              userLocation={userLocation}
              recentTrips={recentTrips}
              onPickupChange={(addr, coords) => { setPickupAddress(addr); setPickupCoords(coords); }}
              onDropoffChange={(addr, coords) => { setDropoffAddress(addr); setDropoffCoords(coords); }}
              onProceed={() => setStep('vehicle')}
            />
          )}

          {step === 'vehicle' && (
            <VehicleSelectStep
              pickupAddress={pickupAddress}
              dropoffAddress={dropoffAddress}
              selectedVehicle={selectedVehicle}
              fareEstimate={fareEstimate}
              surgeData={surgeData}
              pricingMode={pricingMode}
              offerPrice={offerPrice}
              paymentMethod={paymentMethod}
              isBooking={isBooking}
              bookingForOther={bookingForOther}
              recipientName={recipientName}
              recipientPhone={recipientPhone}
              vehicles={VEHICLES}
              formatPrice={formatPrice}
              onVehicleSelect={(id) => { setSelectedVehicle(id); }}
              onPricingModeChange={(mode) => {
                setPricingMode(mode);
                if (mode === 'negotiation' && fareEstimate && offerPrice === 0) setOfferPrice(Math.round(fareEstimate.total_estimate));
              }}
              onOfferPriceChange={setOfferPrice}
              onPaymentMethodChange={setPaymentMethod}
              onBookingForOtherChange={setBookingForOther}
              onRecipientNameChange={setRecipientName}
              onRecipientPhoneChange={setRecipientPhone}
              onBook={handleBookRide}
              stops={stops}
              onAddStop={() => setStops([...stops, { address: '', coords: { lat: 0, lng: 0 } }])}
              onRemoveStop={(i) => setStops(stops.filter((_, idx) => idx !== i))}
            />
          )}

          {step === 'finding' && currentRideId && (
            <FindingDriverStep
              currentRideId={currentRideId}
              pricingMode={pricingMode}
              formatPrice={formatPrice}
              offerPrice={offerPrice}
              onBidAccepted={handleBidAccepted}
              onCancel={() => { setCurrentRideId(null); setStep('vehicle'); }}
            />
          )}

          {step === 'tracking' && activeRideId && ride && driver && (
            <TrackingStep
              ride={ride}
              driver={driver}
              rideStatus={rideStatus}
              pickupPin={pickupPin}
              paymentMethod={paymentMethod}
              estimatedPrice={estimatedPrice}
              formatPrice={formatPrice}
              onShareRide={handleShareRide}
              onCancel={() => setShowCancelModal(true)}
              onChat={() => setShowChat(true)}
            />
          )}

          {step === 'receipt' && completedRide && (
            <RideReceiptStep
              ride={completedRide}
              driverName={(completedRide.driver as any)?.full_name || 'Driver'}
              driverRating={(completedRide.driver as any)?.rating || 4.9}
              formatPrice={formatPrice}
              onDone={() => {
                setShowRatingModal(true);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* MODALS */}
      {completedRide && (
        <RideRatingModal open={showRatingModal} onClose={() => { setShowRatingModal(false); handleReset(); }}
          rideId={completedRide.id}
          driverName={(completedRide.driver as any)?.full_name || 'Driver'}
          driverPhoto={(completedRide.driver as any)?.profile_photo_url}
          finalPrice={completedRide.final_price || 0} />
      )}
      {activeRideId && (
        <CancelRideModal open={showCancelModal} onOpenChange={setShowCancelModal}
          activeRideId={activeRideId} cancelledBy="passenger"
          onCancelled={handleReset} minutesSinceMatch={minutesSinceMatch} />
      )}
      {activeRideId && ride && (
        <>
          <EmergencyActionsModal open={showEmergency} onOpenChange={setShowEmergency}
            rideId={activeRideId} shareCode={ride.share_code}
            driverName={driver?.name} driverPhone={driver?.phone} />
          <RideChat rideId={activeRideId} driverName={driver?.name || ''}
            driverPhoto={driver?.photo} senderType="passenger"
            isOpen={showChat} onClose={() => setShowChat(false)} />
        </>
      )}
    </div>
  );
};

export default RideBooking;
