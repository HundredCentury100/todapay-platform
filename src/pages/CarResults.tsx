import { useState, useEffect } from "react";
import { ServiceProgressBar } from "@/components/booking/ServiceProgressBar";
import { useSearchParams, Link } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, MapPin, Star, Users, SlidersHorizontal, Calendar, Fuel, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/ui/empty-state";
import MobileAppLayout from "@/components/MobileAppLayout";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicle_type: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  price_per_day: number;
  images: any;
  features: string[];
  rating: number;
  location: string;
  available: boolean;
}

const sortOptions = [
  { value: "price_low", label: "Cheapest" },
  { value: "price_high", label: "Most Expensive" },
  { value: "rating", label: "Top Rated" },
];

const CarResults = () => {
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("price_low");
  const [vehicleType, setVehicleType] = useState("all");

  const location = searchParams.get("location") || "";
  const pickup = searchParams.get("pickup") || "";
  const dropoff = searchParams.get("dropoff") || "";

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from("vehicles").select("*") as any).eq("available", true).limit(50);
      if (error) throw error;
      let results = (data as any[]) || [];
      if (location) results = results.filter((v: any) => v.location?.toLowerCase().includes(location.toLowerCase()));
      if (vehicleType !== "all") results = results.filter((v: any) => v.vehicle_type === vehicleType);
      setVehicles(results);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [location, vehicleType]);

  const sorted = [...vehicles].sort((a, b) => {
    if (sortBy === "price_low") return (a.price_per_day || 0) - (b.price_per_day || 0);
    if (sortBy === "price_high") return (b.price_per_day || 0) - (a.price_per_day || 0);
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  return (
    <MobileAppLayout onRefresh={fetchVehicles}>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background border-b safe-area-pt">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <BackButton fallbackPath="/" />
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-lg truncate">Car Rentals</h1>
                {location && <p className="text-xs text-muted-foreground truncate">{location}</p>}
              </div>
              <ServiceProgressBar currentStep={2} className="mt-2" />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-xl shrink-0">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl">
                  <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                  <div className="py-4 space-y-4">
                    <Select value={vehicleType} onValueChange={setVehicleType}>
                      <SelectTrigger><SelectValue placeholder="Vehicle Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sedan">Sedan</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="hatchback">Hatchback</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger><SelectValue placeholder="Sort By" /></SelectTrigger>
                      <SelectContent>
                        {sortOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            {/* Sort chips */}
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
              {sortOptions.map(o => (
                <button key={o.value} onClick={() => setSortBy(o.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${sortBy === o.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-card p-4 space-y-3">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : sorted.length === 0 ? (
            <EmptyState type="no-results" title="No cars found" description="Try adjusting your search filters" />
          ) : (
            <AnimatePresence>
              {sorted.map((vehicle, idx) => {
                const img = Array.isArray(vehicle.images) ? vehicle.images[0] : vehicle.images?.url || "";
                return (
                  <motion.div key={vehicle.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <Link to={`/cars/${vehicle.id}?pickup=${pickup}&dropoff=${dropoff}`}>
                      <Card className="rounded-2xl overflow-hidden border hover:shadow-lg transition-all active:scale-[0.98]">
                        <div className="h-44 bg-muted relative">
                          {img ? (
                            <img src={img} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Car className="h-12 w-12 text-muted-foreground/30" /></div>
                          )}
                          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground capitalize">{vehicle.vehicle_type}</Badge>
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold">{vehicle.make} {vehicle.model} <span className="text-muted-foreground font-normal">{vehicle.year}</span></h3>
                              {vehicle.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{vehicle.location}</p>}
                            </div>
                            {vehicle.rating > 0 && (
                              <Badge variant="outline" className="gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{vehicle.rating.toFixed(1)}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{vehicle.seats} seats</span>
                            <span className="flex items-center gap-1"><Settings2 className="h-3.5 w-3.5" />{vehicle.transmission}</span>
                            <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5" />{vehicle.fuel_type}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <p className="text-lg font-bold text-primary">${vehicle.price_per_day}<span className="text-xs font-normal text-muted-foreground">/day</span></p>
                            <Button size="sm" className="rounded-xl">View</Button>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default CarResults;
