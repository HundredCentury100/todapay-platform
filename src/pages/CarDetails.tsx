import { useState, useEffect } from "react";
import { ServiceProgressBar } from "@/components/booking/ServiceProgressBar";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, MapPin, Star, Users, Fuel, Settings2, Shield, Check, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import MobileAppLayout from "@/components/MobileAppLayout";
import { StickyCTABar } from "@/components/ui/sticky-cta-bar";
import { useCurrency } from "@/contexts/CurrencyContext";
import { MobileDateSelector } from "@/components/booking/MobileDateSelector";
import { toast } from "sonner";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";
import { format, differenceInDays } from "date-fns";

const CarDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);

  // Booking form state
  const [pickupDate, setPickupDate] = useState<Date | undefined>();
  const [dropoffDate, setDropoffDate] = useState<Date | undefined>();
  const [driverName, setDriverName] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverLicense, setDriverLicense] = useState("");

  const pickup = searchParams.get("pickup") || "";
  const dropoff = searchParams.get("dropoff") || "";

  const rentalDays = pickupDate && dropoffDate
    ? Math.max(1, differenceInDays(dropoffDate, pickupDate))
    : 1;

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase.from("vehicles").select("*").eq("id", id).single();
      if (error) { console.error(error); toast.error("Vehicle not found"); }
      else setVehicle(data);
      setLoading(false);
    };
    fetchVehicle();
  }, [id]);

  const handleBooking = () => {
    if (!driverName || !driverEmail || !driverPhone) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!pickupDate || !dropoffDate) {
      toast.error("Please select pickup and drop-off dates");
      return;
    }
    toast.success("Booking flow coming soon!");
    setIsBookingDrawerOpen(false);
  };

  if (loading) {
    return (
      <MobileAppLayout>
        <div className="min-h-screen bg-background p-4 space-y-4 pt-16">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </MobileAppLayout>
    );
  }

  if (!vehicle) {
    return (
      <MobileAppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">Vehicle not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/cars")}>Browse Cars</Button>
          </div>
        </div>
      </MobileAppLayout>
    );
  }

  const img = Array.isArray(vehicle.images) ? vehicle.images[0] : vehicle.images?.url || "";
  const features: string[] = vehicle.features || [];
  const totalPrice = (vehicle.price_per_day || 0) * rentalDays;

  return (
    <MobileAppLayout hideAttribution>
      <div className="min-h-screen bg-background pb-32">
        {/* Hero Image */}
        <div className="relative h-72 bg-muted">
          {img ? (
            <img src={img} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Car className="h-16 w-16 text-muted-foreground/30" /></div>
          )}
          <div className="absolute top-4 left-4 safe-area-pt">
            <BackButton fallbackPath="/cars" className="bg-background rounded-full" />
          </div>
        </div>

        <div className="px-4 -mt-6 relative z-10 space-y-4">
          <ServiceProgressBar currentStep={3} />
          {/* Main Info Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-2xl">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{vehicle.make} {vehicle.model}</h1>
                    <p className="text-muted-foreground">{vehicle.year} · {vehicle.vehicle_type}</p>
                  </div>
                  {vehicle.rating > 0 && (
                    <Badge variant="outline" className="gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{vehicle.rating.toFixed(1)}</Badge>
                  )}
                </div>
                {vehicle.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4" />{vehicle.location}</p>
                )}
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" />{vehicle.seats} seats</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Settings2 className="h-4 w-4" />{vehicle.transmission}</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Fuel className="h-4 w-4" />{vehicle.fuel_type}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features */}
          {features.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="rounded-2xl">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-3">Features</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Insurance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="rounded-2xl">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Insurance Included</p>
                  <p className="text-xs text-muted-foreground">Basic coverage included with every rental</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sticky Bottom CTA */}
        <StickyCTABar showOnMobile showOnDesktop={false}>
          <Drawer open={isBookingDrawerOpen} onOpenChange={setIsBookingDrawerOpen}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-bold text-primary">{convertPrice(vehicle.price_per_day)}<span className="text-sm font-normal text-muted-foreground">/day</span></p>
                {pickupDate && dropoffDate && (
                  <p className="text-xs text-muted-foreground">{convertPrice(totalPrice)} for {rentalDays} day{rentalDays > 1 ? 's' : ''}</p>
                )}
              </div>
              <DrawerTrigger asChild>
                <Button size="lg" className="rounded-xl px-8">Book Now</Button>
              </DrawerTrigger>
            </div>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader>
                <DrawerTitle>Book {vehicle.make} {vehicle.model}</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 space-y-5 overflow-y-auto">
                {/* Date Selection */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" /> Rental Period</h4>
                  <MobileDateSelector
                    mode="single"
                    selectedDate={pickupDate}
                    onDateSelect={setPickupDate}
                    label="Pickup Date"
                    minDate={new Date()}
                  />
                  <MobileDateSelector
                    mode="single"
                    selectedDate={dropoffDate}
                    onDateSelect={setDropoffDate}
                    label="Drop-off Date"
                    minDate={pickupDate || new Date()}
                  />
                  {pickupDate && dropoffDate && (
                    <div className="bg-muted/50 rounded-xl p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{convertPrice(vehicle.price_per_day)} × {rentalDays} day{rentalDays > 1 ? 's' : ''}</span>
                        <span className="font-bold">{convertPrice(totalPrice)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Driver Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Driver Details</h4>
                  <div className="space-y-2">
                    <Label htmlFor="driverName">Full Name *</Label>
                    <Input id="driverName" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Enter full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverEmail">Email *</Label>
                    <Input id="driverEmail" type="email" value={driverEmail} onChange={(e) => setDriverEmail(e.target.value)} placeholder="your@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverPhone">Phone *</Label>
                    <Input id="driverPhone" type="tel" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="+27 123 456 7890" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverLicense">Driver's License Number</Label>
                    <Input id="driverLicense" value={driverLicense} onChange={(e) => setDriverLicense(e.target.value)} placeholder="License number" />
                  </div>
                </div>

                <Button className="w-full h-14 text-lg font-semibold rounded-xl" onClick={handleBooking} disabled={!pickupDate || !dropoffDate || !driverName}>
                  {pickupDate && dropoffDate ? `Book Now — ${convertPrice(totalPrice)}` : 'Select dates to continue'}
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        </StickyCTABar>
      </div>
    </MobileAppLayout>
  );
};

export default CarDetails;
