import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Car, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { TransferBookingForm, TransferFormData } from "@/components/transfers/TransferBookingForm";
import TransferCategoryForm from "@/components/booking/TransferCategoryForm";
import BookingSpecialtyAddOns from "@/components/booking/BookingSpecialtyAddOns";
import { TransferProviderResults, TransferProvider } from "@/components/transfers/TransferProviderResults";
import { TransferBookingSummary } from "@/components/transfers/TransferBookingSummary";
import { TransferPassengerForm } from "@/components/transfers/TransferPassengerForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { VEHICLE_CATEGORIES } from "@/types/transfer";
import { Button } from "@/components/ui/button";
import { ServiceProgressBar } from "@/components/booking/ServiceProgressBar";
import MobileAppLayout from "@/components/MobileAppLayout";
import { StickyCTABar } from "@/components/ui/sticky-cta-bar";
import { MapPin as MapPinIcon } from "lucide-react";

const SERVICE_MULTIPLIERS: Record<string, number> = {
  airport_pickup: 1.25,
  airport_dropoff: 1.2,
  point_to_point: 1.0,
  hourly_hire: 0.85,
  shuttle: 0.65,
  tour_transfer: 1.4,
  on_demand_taxi: 1.15,
};

const TRANSFER_STEPS = ["Route", "Provider", "Details", "Pay"];

export interface PassengerData {
  name: string;
  email: string;
  phone: string;
  specialRequirements?: string;
}

const TransferBooking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<TransferFormData | null>(null);
  const [providers, setProviders] = useState<TransferProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<TransferProvider | null>(null);
  const [passengerData, setPassengerData] = useState<PassengerData>({
    name: '',
    email: '',
    phone: '',
  });
  const [transferCategoryData, setTransferCategoryData] = useState<Record<string, any>>({});
  const [specialtyAddOns, setSpecialtyAddOns] = useState<Record<string, any>>({});

  const calculateBasePrice = (data: TransferFormData, distance?: number) => {
    const basePrice = 25;
    const catMultiplier = VEHICLE_CATEGORIES.find((c) => c.id === data.vehicleCategory)?.multiplier || 1;
    const svcMultiplier = SERVICE_MULTIPLIERS[data.serviceType] || 1;
    const distFactor = distance ? Math.max(1, distance / 15) : 1;
    return Math.round(basePrice * catMultiplier * svcMultiplier * distFactor);
  };

  const estimateDistance = async (pickup: string, dropoff: string): Promise<number> => {
    try {
      if (window.google?.maps) {
        const service = new google.maps.DistanceMatrixService();
        const result = await service.getDistanceMatrix({
          origins: [pickup],
          destinations: [dropoff],
          travelMode: google.maps.TravelMode.DRIVING,
        });
        const distMeters = result.rows?.[0]?.elements?.[0]?.distance?.value;
        if (distMeters) return Math.round(distMeters / 1000);
      }
    } catch (err) {
      console.warn('Distance estimation failed, using default:', err);
    }
    return 15; // Fallback
  };

  const loadProviders = async (data: TransferFormData) => {
    setProvidersLoading(true);
    try {
      // Estimate actual distance
      const estimatedDistance = await estimateDistance(data.pickupLocation, data.dropoffLocation);
      console.log(`Estimated distance: ${estimatedDistance} km`);

      // Fetch active drivers
      const { data: drivers, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'approved')
        .order('rating', { ascending: false });

      if (error) throw error;

      const svcMultiplier = SERVICE_MULTIPLIERS[data.serviceType] || 1;

      const driverProviders: TransferProvider[] = (drivers || []).map((d: any) => {
        const baseFare = d.base_fare || 3;
        const perKm = d.price_per_km || 1;
        const minFare = d.minimum_fare || 5;
        const raw = baseFare + perKm * estimatedDistance * svcMultiplier;
        const estimated = Math.max(raw, minFare);

        // Check for fixed route match
        const routes = (d.fixed_routes as any[]) || [];
        const matchedRoute = routes.find((r: any) =>
          (data.pickupLocation.toLowerCase().includes(r.from?.toLowerCase() || '') &&
           data.dropoffLocation.toLowerCase().includes(r.to?.toLowerCase() || ''))
        );

        return {
          id: d.id,
          type: 'driver' as const,
          name: d.full_name,
          vehicle_info: `${d.vehicle_color || ''} ${d.vehicle_make || ''} ${d.vehicle_model || ''} • ${d.license_plate}`.trim(),
          vehicle_type: d.vehicle_type,
          rating: d.rating,
          total_rides: d.total_rides,
          max_passengers: VEHICLE_CATEGORIES.find(c => c.id === d.vehicle_type)?.passengers || 4,
          max_luggage: VEHICLE_CATEGORIES.find(c => c.id === d.vehicle_type)?.luggage || 3,
          base_fare: baseFare,
          price_per_km: perKm,
          minimum_fare: minFare,
          estimated_price: Math.round(estimated),
          fixed_route_price: matchedRoute ? matchedRoute.price : undefined,
          profile_photo: d.profile_photo_url,
        };
      });

      // Also fetch transfer services from merchants
      const { data: services } = await supabase
        .from('transfer_services')
        .select('*, merchant_profiles(business_name)')
        .eq('status', 'active');

      const serviceProviders: TransferProvider[] = (services || []).map((s: any) => {
        const baseFare = s.base_price || 5;
        const perKm = s.price_per_km || 1.5;
        const raw = baseFare + perKm * estimatedDistance * svcMultiplier;
        return {
          id: `svc_${s.id}`,
          type: 'company' as const,
          name: s.merchant_profiles?.business_name || s.name,
          vehicle_info: `${s.vehicle_type} • Up to ${s.max_passengers} pax`,
          vehicle_type: s.vehicle_type,
          rating: null,
          total_rides: null,
          max_passengers: s.max_passengers,
          max_luggage: s.max_luggage || 4,
          base_fare: baseFare,
          price_per_km: perKm,
          minimum_fare: 0,
          estimated_price: Math.round(raw),
          amenities: s.amenities,
        };
      });

      setProviders([...driverProviders, ...serviceProviders]);
    } catch (err) {
      console.error('Error loading providers:', err);
    } finally {
      setProvidersLoading(false);
    }
  };

  const handleRouteSubmit = (data: TransferFormData) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to book a transfer", variant: "destructive" });
      navigate("/auth", { state: { returnTo: "/transfers" } });
      return;
    }
    setFormData(data);
    setCurrentStep(1);
    loadProviders(data);
    window.scrollTo(0, 0);
  };

  const handleProviderSelect = (provider: TransferProvider) => {
    setSelectedProvider(provider);
  };

  const handleConfirm = async (paymentMethod: string) => {
    if (!user || !formData || !selectedProvider) return;
    setIsLoading(true);

    try {
      const price = selectedProvider.fixed_route_price || selectedProvider.estimated_price;
      const { data: transferRequest, error } = await supabase
        .from("transfer_requests")
        .insert({
          user_id: user.id,
          booking_type: formData.bookingType,
          service_type: formData.serviceType,
          vehicle_category: formData.vehicleCategory,
          pickup_location: formData.pickupLocation,
          dropoff_location: formData.dropoffLocation,
          scheduled_datetime:
            formData.scheduledDate && formData.scheduledTime
              ? `${formData.scheduledDate}T${formData.scheduledTime}:00`
              : null,
          num_passengers: formData.passengers,
          num_luggage: formData.luggage,
          flight_number: formData.flightNumber,
          meet_and_greet: formData.meetAndGreet,
          special_requirements: passengerData.specialRequirements || formData.specialRequirements,
          passenger_name: passengerData.name,
          passenger_phone: passengerData.phone,
          passenger_email: passengerData.email,
          price_quoted: price,
          payment_method: paymentMethod,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Transfer booked!",
        description: formData.bookingType === "scheduled"
          ? "Your transfer has been scheduled."
          : "Finding your driver...",
      });

      addNotification("success", "🚗 Transfer Booked", `${formData.pickupLocation} → ${formData.dropoffLocation}. ${formData.bookingType === 'scheduled' ? 'Scheduled transfer confirmed.' : 'Finding your driver...'}`, {
        category: 'booking',
        actionUrl: `/transfers/${transferRequest.id}/track`,
        metadata: { amount: price, routeFrom: formData.pickupLocation, routeTo: formData.dropoffLocation },
      });

      navigate(`/transfers/${transferRequest.id}/track`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <MobileAppLayout hideAttribution hideNav={false}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 bg-background border-b border-border"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            {currentStep > 0 ? (
              <Button variant="ghost" size="icon" onClick={() => setCurrentStep(s => s - 1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <BackButton fallbackPath="/transfers" />
            )}
            <div className="flex items-center gap-2 flex-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Car className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-base font-bold">{TRANSFER_STEPS[currentStep]}</h1>
            </div>
          </div>
          <div className="px-4 pb-2">
            <ServiceProgressBar currentStep={currentStep + 1} steps={TRANSFER_STEPS} />
          </div>
        </motion.header>

        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Main content */}
          <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full pb-32 lg:pb-6">
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div key="route" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <TransferBookingForm onSubmit={handleRouteSubmit} isLoading={isLoading} />
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div key="providers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <TransferProviderResults
                    providers={providers}
                    loading={providersLoading}
                    onSelect={handleProviderSelect}
                    selectedId={selectedProvider?.id}
                  />
                  {selectedProvider && (
                    <Button className="w-full h-14 text-lg font-semibold" onClick={() => { setCurrentStep(2); window.scrollTo(0, 0); }}>
                      Continue with {selectedProvider.name}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  )}
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div key="passenger" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <TransferPassengerForm
                    data={passengerData}
                    onChange={setPassengerData}
                    onContinue={() => { setCurrentStep(3); window.scrollTo(0, 0); }}
                  />
                  <TransferCategoryForm
                    serviceType={formData?.serviceType}
                    data={transferCategoryData}
                    onChange={setTransferCategoryData}
                  />
                  <BookingSpecialtyAddOns
                    vertical="transfer"
                    data={specialtyAddOns}
                    onChange={setSpecialtyAddOns}
                  />
                </motion.div>
              )}

              {currentStep === 3 && formData && selectedProvider && (
                <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <TransferBookingSummary
                    formData={formData}
                    provider={selectedProvider}
                    passengerData={passengerData}
                    onConfirm={handleConfirm}
                    isLoading={isLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Sidebar summary (desktop only, steps 2-4) */}
          {currentStep >= 1 && formData && (
            <aside className="hidden lg:block w-80 border-l p-6 space-y-4 sticky top-16 h-fit">
              <h3 className="font-semibold text-sm">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pickup</span>
                  <span className="font-medium text-right max-w-[180px] truncate">{formData.pickupLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dropoff</span>
                  <span className="font-medium text-right max-w-[180px] truncate">{formData.dropoffLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passengers</span>
                  <span className="font-medium">{formData.passengers}</span>
                </div>
                {selectedProvider && (
                  <>
                    <hr className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provider</span>
                      <span className="font-medium">{selectedProvider.name}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${selectedProvider.fixed_route_price || selectedProvider.estimated_price}</span>
                    </div>
                  </>
                )}
              </div>
            </aside>
          )}
        </div>

        {/* Mobile Summary Strip (visible on steps 1-3 on mobile) */}
        {currentStep >= 1 && formData && (
          <StickyCTABar showOnMobile showOnDesktop={false}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                  <MapPinIcon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{formData.pickupLocation.split(',')[0]}</span>
                  <span>→</span>
                  <span className="truncate">{formData.dropoffLocation.split(',')[0]}</span>
                </div>
                {selectedProvider && (
                  <p className="text-lg font-bold mt-0.5">
                    ${selectedProvider.fixed_route_price || selectedProvider.estimated_price}
                  </p>
                )}
              </div>
              {currentStep < 3 && (
                <Button size="sm" className="rounded-xl shrink-0 ml-3" onClick={() => { setCurrentStep(s => s + 1); window.scrollTo(0, 0); }}
                  disabled={currentStep === 1 && !selectedProvider}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </StickyCTABar>
        )}
      </div>
    </MobileAppLayout>
  );
};

export default TransferBooking;
