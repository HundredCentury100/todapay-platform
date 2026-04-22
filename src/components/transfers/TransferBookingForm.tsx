import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Calendar, Clock, Users, Briefcase, Plane, ToggleLeft, ToggleRight, Navigation,
  Plus, X, GripVertical, Music, Thermometer, Baby, Wine, Wifi, Shield,
  ChevronDown, Sparkles, TrendingUp, AlertCircle, Check, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceTypePills } from "./ServiceTypePills";
import { VehicleCategoryList } from "./VehicleCategoryList";
import { VehicleComparisonSlider } from "./VehicleComparisonSlider";
import { PopularRoutes } from "./PopularRoutes";
import { FlightStatusBanner } from "./FlightStatusBanner";
import { TransferServiceType, VehicleCategory, VEHICLE_CATEGORIES } from "@/types/transfer";
import { cn } from "@/lib/utils";
import { LazyLocationPicker } from "@/components/maps/LazyLocationPicker";
import { useCurrency } from "@/contexts/CurrencyContext";

interface TransferBookingFormProps {
  onSubmit: (data: TransferFormData) => void;
  isLoading?: boolean;
}

export interface TransferFormData {
  bookingType: 'instant' | 'scheduled';
  serviceType: TransferServiceType;
  vehicleCategory: VehicleCategory;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledDate?: string;
  scheduledTime?: string;
  passengers: number;
  luggage: number;
  flightNumber?: string;
  meetAndGreet: boolean;
  specialRequirements?: string;
  // New fields
  stops?: { address: string; order: number }[];
  conciergeExtras?: ConciergeExtra[];
}

// Concierge extras
export type ConciergeExtra = 'child_seat' | 'champagne' | 'wifi_hotspot' | 'music_playlist' | 'temperature' | 'newspaper';

const CONCIERGE_OPTIONS: { id: ConciergeExtra; label: string; desc: string; emoji: string; price: number }[] = [
  { id: 'child_seat', label: 'Child seat', desc: 'Rear-facing or booster', emoji: '👶', price: 5 },
  { id: 'champagne', label: 'Welcome drink', desc: 'Champagne or sparkling water', emoji: '🥂', price: 15 },
  { id: 'wifi_hotspot', label: 'Wi-Fi hotspot', desc: 'Portable high-speed', emoji: '📶', price: 3 },
  { id: 'music_playlist', label: 'Music choice', desc: 'Your Spotify or genre', emoji: '🎵', price: 0 },
  { id: 'temperature', label: 'Climate control', desc: 'Pre-set temperature', emoji: '❄️', price: 0 },
  { id: 'newspaper', label: 'Press & reading', desc: 'Newspapers & magazines', emoji: '📰', price: 2 },
];

export const TransferBookingForm = ({ onSubmit, isLoading }: TransferBookingFormProps) => {
  const { convertPrice } = useCurrency();
  const [bookingType, setBookingType] = useState<'instant' | 'scheduled'>('scheduled');
  const [serviceType, setServiceType] = useState<TransferServiceType>('point_to_point');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('sedan');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(1);
  const [flightNumber, setFlightNumber] = useState('');
  const [meetAndGreet, setMeetAndGreet] = useState(false);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('compare');
  
  // Multi-stop state
  const [multiStops, setMultiStops] = useState<string[]>([]);
  const [showMultiStop, setShowMultiStop] = useState(false);
  
  // Concierge state
  const [conciergeExtras, setConciergeExtras] = useState<ConciergeExtra[]>([]);
  const [showConcierge, setShowConcierge] = useState(false);
  
  // Flight tracking state
  const [flightTracked, setFlightTracked] = useState(false);

  const isAirportTransfer = serviceType === 'airport_pickup' || serviceType === 'airport_dropoff';
  
  const basePrice = 25;
  const categoryMultiplier = VEHICLE_CATEGORIES.find(c => c.id === vehicleCategory)?.multiplier || 1;
  const serviceTypeMultipliers: Record<TransferServiceType, number> = {
    airport_pickup: 1.25, airport_dropoff: 1.2, point_to_point: 1.0,
    hourly_hire: 0.85, shuttle: 0.65, tour_transfer: 1.4, on_demand_taxi: 1.15,
  };
  const serviceMultiplier = serviceTypeMultipliers[serviceType] || 1;
  const vehiclePrice = Math.round(basePrice * categoryMultiplier * serviceMultiplier);
  const conciergePrice = conciergeExtras.reduce((sum, e) => sum + (CONCIERGE_OPTIONS.find(o => o.id === e)?.price || 0), 0);
  const stopsSurcharge = multiStops.filter(s => s).length * 5;
  const estimatedPrice = vehiclePrice + conciergePrice + stopsSurcharge;

  // Auto-detect airport from location
  useEffect(() => {
    const lower = (pickupLocation + dropoffLocation).toLowerCase();
    if (lower.includes('airport') && serviceType === 'point_to_point') {
      setServiceType(pickupLocation.toLowerCase().includes('airport') ? 'airport_pickup' : 'airport_dropoff');
    }
  }, [pickupLocation, dropoffLocation]);

  // Simulate flight tracking
  useEffect(() => {
    if (flightNumber && flightNumber.length >= 4) {
      const timer = setTimeout(() => setFlightTracked(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setFlightTracked(false);
    }
  }, [flightNumber]);

  const handlePopularRoute = (from: string, to: string) => {
    setPickupLocation(from);
    setDropoffLocation(to);
    if (from.toLowerCase().includes('airport') || to.toLowerCase().includes('airport')) {
      setServiceType(from.toLowerCase().includes('airport') ? 'airport_pickup' : 'airport_dropoff');
    }
  };

  const toggleConcierge = (extra: ConciergeExtra) => {
    setConciergeExtras(prev => prev.includes(extra) ? prev.filter(e => e !== extra) : [...prev, extra]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      bookingType, serviceType, vehicleCategory, pickupLocation, dropoffLocation,
      scheduledDate: bookingType === 'scheduled' ? scheduledDate : undefined,
      scheduledTime: bookingType === 'scheduled' ? scheduledTime : undefined,
      passengers, luggage,
      flightNumber: isAirportTransfer ? flightNumber : undefined,
      meetAndGreet,
      specialRequirements: specialRequirements || undefined,
      stops: multiStops.filter(s => s).map((s, i) => ({ address: s, order: i })),
      conciergeExtras,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Popular Routes */}
      <PopularRoutes onSelectRoute={handlePopularRoute} />

      {/* Booking Type - redesigned */}
      <div className="flex gap-1 p-1 bg-secondary rounded-2xl">
        <button type="button"
          onClick={() => setBookingType('instant')}
          className={cn("flex-1 py-3 rounded-xl text-xs font-bold transition-all press-effect flex items-center justify-center gap-1.5",
            bookingType === 'instant' ? "bg-card shadow-super-sm text-foreground" : "text-muted-foreground"
          )}>
          <Sparkles className="h-3.5 w-3.5" />
          Book Now
        </button>
        <button type="button"
          onClick={() => setBookingType('scheduled')}
          className={cn("flex-1 py-3 rounded-xl text-xs font-bold transition-all press-effect flex items-center justify-center gap-1.5",
            bookingType === 'scheduled' ? "bg-card shadow-super-sm text-foreground" : "text-muted-foreground"
          )}>
          <Calendar className="h-3.5 w-3.5" />
          Schedule
        </button>
      </div>

      {/* Service Type Pills */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Service Type</Label>
        <ServiceTypePills selectedType={serviceType} onSelectType={setServiceType} />
      </div>

      {/* Route Builder - Visual multi-stop */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Route</Label>
          <button type="button" onClick={() => setShowMultiStop(!showMultiStop)}
            className="flex items-center gap-1 text-xs text-primary font-semibold press-effect">
            <Plus className="h-3 w-3" />
            Add stops
          </button>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-super-sm">
          <div className="flex">
            <div className="flex flex-col items-center py-4 pl-4 gap-0">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-3.5 w-3.5 rounded-full border-[3px] border-emerald-500 bg-emerald-500/20"
              />
              {multiStops.map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-[2px] h-4 bg-gradient-to-b from-emerald-500/40 to-amber-500/40" />
                  <div className="h-3 w-3 rounded-full border-[3px] border-amber-500 bg-amber-500/20" />
                </div>
              ))}
              <div className="w-[2px] flex-1 bg-gradient-to-b from-emerald-500/50 via-border to-primary/50 my-1" style={{ minHeight: 24 }} />
              <div className="h-3.5 w-3.5 rounded-sm border-[3px] border-primary bg-primary/20" />
            </div>
            <div className="flex-1 py-1">
              {/* Pickup */}
              <div className="px-3 py-3">
                <LazyLocationPicker
                  onLocationSelect={(loc) => setPickupLocation(loc.address)}
                  initialAddress={pickupLocation}
                  placeholder="Pickup location..."
                  compact
                />
              </div>

              {/* Multi-stops */}
              <AnimatePresence>
                {multiStops.map((stop, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border/30"
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <Input
                        placeholder={`Stop ${i + 1}`}
                        value={stop}
                        onChange={(e) => {
                          const next = [...multiStops];
                          next[i] = e.target.value;
                          setMultiStops(next);
                        }}
                        className="h-9 border-0 bg-transparent px-0 text-sm"
                      />
                      <button type="button" onClick={() => setMultiStops(multiStops.filter((_, idx) => idx !== i))}
                        className="p-1 hover:bg-destructive/10 rounded shrink-0">
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {showMultiStop && multiStops.length < 4 && (
                <div className="border-t border-border/30 px-3 py-2">
                  <button type="button"
                    onClick={() => { setMultiStops([...multiStops, '']); }}
                    className="flex items-center gap-2 text-xs text-primary font-semibold press-effect w-full py-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Add stop (+$5 per stop)
                  </button>
                </div>
              )}

              <div className="h-px bg-border mx-3" />

              {/* Dropoff */}
              <div className="px-3 py-3">
                <LazyLocationPicker
                  onLocationSelect={(loc) => setDropoffLocation(loc.address)}
                  initialAddress={dropoffLocation}
                  placeholder="Dropoff location..."
                  compact
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Tracking - Enhanced */}
      {isAirportTransfer && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3 p-4 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl border border-blue-500/15">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-bold text-foreground">Flight tracking</span>
            {flightTracked && <Badge className="text-2xs bg-emerald-500/15 text-emerald-700 border-emerald-500/20">Tracking active</Badge>}
          </div>
          <div className="relative">
            <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
            <Input placeholder="Enter flight number (e.g., BA2490)" value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} className="pl-10 h-12 rounded-xl" />
          </div>
          {flightTracked && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-emerald-700">Flight {flightNumber} is being monitored</p>
                <p className="text-emerald-600/70 mt-0.5">We'll auto-adjust pickup time if your flight is delayed</p>
              </div>
            </motion.div>
          )}

          {/* Flight status banner */}
          {flightNumber && flightNumber.length >= 3 && (
            <FlightStatusBanner
              flightNumber={flightNumber}
              scheduledTime={scheduledDate && scheduledTime ? `${scheduledDate}T${scheduledTime}` : undefined}
            />
          )}

          {/* Meet & Greet - redesigned */}
          <button type="button" onClick={() => setMeetAndGreet(!meetAndGreet)}
            className={cn("w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all press-effect",
              meetAndGreet ? "border-primary bg-primary/5 shadow-lg" : "border-border/50 bg-card")}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">👋</span>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Meet & Greet</p>
                <p className="text-xs text-muted-foreground">Driver waits with name sign at arrivals</p>
              </div>
            </div>
            <div className={cn("h-6 w-11 rounded-full transition-colors flex items-center px-0.5",
              meetAndGreet ? "bg-primary justify-end" : "bg-muted justify-start")}>
              <div className="h-5 w-5 rounded-full bg-background shadow-sm" />
            </div>
          </button>
        </motion.div>
      )}

      {/* Schedule fields */}
      {bookingType === 'scheduled' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">Date</Label>
            <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} required={bookingType === 'scheduled'}
              className="h-12 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">Time</Label>
            <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)}
              required={bookingType === 'scheduled'} className="h-12 rounded-xl" />
          </div>
        </motion.div>
      )}

      {/* Passengers & Luggage - redesigned */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-card border border-border/50 space-y-2">
          <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Passengers</Label>
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="icon" onClick={() => setPassengers(Math.max(1, passengers - 1))}
              className="h-10 w-10 rounded-xl">−</Button>
            <span className="text-2xl font-black text-foreground">{passengers}</span>
            <Button type="button" variant="outline" size="icon" onClick={() => setPassengers(Math.min(50, passengers + 1))}
              className="h-10 w-10 rounded-xl">+</Button>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/50 space-y-2">
          <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" /> Luggage</Label>
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="icon" onClick={() => setLuggage(Math.max(0, luggage - 1))}
              className="h-10 w-10 rounded-xl">−</Button>
            <span className="text-2xl font-black text-foreground">{luggage}</span>
            <Button type="button" variant="outline" size="icon" onClick={() => setLuggage(Math.min(50, luggage + 1))}
              className="h-10 w-10 rounded-xl">+</Button>
          </div>
        </div>
      </div>

      {/* Vehicle Selection - with comparison default */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Choose your ride</Label>
          <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
            <button type="button" onClick={() => setViewMode('list')}
              className={cn("px-2.5 py-1 rounded-md text-2xs font-bold transition-colors",
                viewMode === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
              List
            </button>
            <button type="button" onClick={() => setViewMode('compare')}
              className={cn("px-2.5 py-1 rounded-md text-2xs font-bold transition-colors",
                viewMode === 'compare' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
              Compare
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <VehicleCategoryList
            selectedCategory={vehicleCategory} onSelectCategory={setVehicleCategory}
            basePrice={basePrice} passengers={passengers} luggage={luggage} serviceType={serviceType}
          />
        ) : (
          <VehicleComparisonSlider
            selectedCategory={vehicleCategory} onSelect={setVehicleCategory}
            basePrice={basePrice} passengers={passengers} luggage={luggage} serviceType={serviceType}
          />
        )}
      </div>

      {/* Concierge Extras - NEW */}
      <div className="space-y-2">
        <button type="button" onClick={() => setShowConcierge(!showConcierge)}
          className="w-full flex items-center justify-between py-2">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Concierge extras
            {conciergeExtras.length > 0 && (
              <Badge variant="secondary" className="text-2xs ml-1">{conciergeExtras.length} selected</Badge>
            )}
          </Label>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showConcierge && "rotate-180")} />
        </button>

        <AnimatePresence>
          {showConcierge && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2">
                {CONCIERGE_OPTIONS.map((opt) => {
                  const selected = conciergeExtras.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleConcierge(opt.id)}
                      className={cn(
                        "flex flex-col items-start p-3 rounded-xl border-2 transition-all press-effect text-left",
                        selected
                          ? "border-primary bg-primary/5 shadow-lg"
                          : "border-border/50 bg-card hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-xl">{opt.emoji}</span>
                        {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <p className="text-xs font-bold text-foreground">{opt.label}</p>
                      <p className="text-2xs text-muted-foreground mt-0.5">{opt.desc}</p>
                      {opt.price > 0 && (
                        <Badge variant="secondary" className="text-2xs mt-1.5">+${opt.price}</Badge>
                      )}
                      {opt.price === 0 && (
                        <Badge className="text-2xs mt-1.5 bg-emerald-500/15 text-emerald-700 border-emerald-500/20">Free</Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Price breakdown */}
      {(conciergePrice > 0 || stopsSurcharge > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-3 rounded-xl bg-secondary/50 space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span className="font-medium">${vehiclePrice}</span></div>
          {conciergePrice > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Concierge extras</span><span className="font-medium">+${conciergePrice}</span></div>}
          {stopsSurcharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Extra stops ({multiStops.filter(s => s).length})</span><span className="font-medium">+${stopsSurcharge}</span></div>}
          <div className="h-px bg-border my-1" />
          <div className="flex justify-between text-sm font-bold"><span>Total estimate</span><span className="text-primary">{convertPrice(estimatedPrice)}</span></div>
        </motion.div>
      )}

      {/* Submit - enhanced */}
      <div className="space-y-2">
        <Button type="submit" className="w-full h-14 text-base font-black gap-2 rounded-2xl press-effect shadow-super"
          disabled={isLoading || !pickupLocation || !dropoffLocation}>
          {isLoading ? "Finding vehicles..." : <>Book Transfer · {convertPrice(estimatedPrice)}</>}
        </Button>
        <div className="flex items-center justify-center gap-4 text-2xs text-muted-foreground">
          <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-500" />Free cancellation</span>
          <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" />Verified drivers</span>
          {isAirportTransfer && <span className="flex items-center gap-1"><Plane className="h-3 w-3 text-blue-500" />Flight tracked</span>}
        </div>
      </div>
    </form>
  );
};
