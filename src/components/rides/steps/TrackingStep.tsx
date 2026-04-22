import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Phone, MessageSquare, Share2, Star, X,
  Banknote, CreditCard, Wallet, Navigation2, Shield, AlertTriangle,
  Clock, MapPin, Route, Copy, CheckCheck
} from "lucide-react";
import { PickupPinDisplay } from "@/components/rides/PickupPinDisplay";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ActiveRide, ActiveRideStatus } from "@/types/ride";

interface DriverInfo {
  name: string;
  rating: number;
  trips: number;
  car: string;
  plate: string;
  photo?: string;
  phone?: string;
  color: string;
}

interface TrackingStepProps {
  ride: ActiveRide;
  driver: DriverInfo;
  rideStatus: ActiveRideStatus;
  pickupPin: string | null;
  paymentMethod: 'cash' | 'card' | 'wallet';
  estimatedPrice: number;
  formatPrice: (amount: number) => string;
  onShareRide: () => void;
  onCancel: () => void;
  onChat: () => void;
}

function computeETA(ride: ActiveRide, rideStatus: ActiveRideStatus): string {
  const driverLat = ride.current_driver_lat;
  const driverLng = ride.current_driver_lng;
  const req = ride.ride_request as any;
  if (!driverLat || !driverLng || !req) return "~3 min";
  let targetLat: number, targetLng: number;
  if (rideStatus === 'in_progress') { targetLat = req.dropoff_lat; targetLng = req.dropoff_lng; }
  else { targetLat = req.pickup_lat; targetLng = req.pickup_lng; }
  if (!targetLat || !targetLng) return "~3 min";
  const R = 6371;
  const dLat = (targetLat - driverLat) * (Math.PI / 180);
  const dLng = (targetLng - driverLng) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(driverLat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const mins = Math.max(1, Math.round(dist / 0.5));
  return `~${mins} min`;
}

// Trust score badge
const TrustBadge = ({ rating, trips }: { rating: number; trips: number }) => {
  const level = rating >= 4.8 && trips >= 500 ? 'platinum' : rating >= 4.5 && trips >= 100 ? 'gold' : 'verified';
  const config = {
    platinum: { label: 'Platinum Driver', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
    gold: { label: 'Gold Driver', color: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
    verified: { label: 'Verified', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  };
  return (
    <Badge variant="outline" className={cn("text-2xs font-bold border", config[level].color)}>
      <Shield className="h-2.5 w-2.5 mr-1" />
      {config[level].label}
    </Badge>
  );
};

export const TrackingStep = ({
  ride, driver, rideStatus, pickupPin, paymentMethod,
  estimatedPrice, formatPrice, onShareRide, onCancel, onChat,
}: TrackingStepProps) => {
  const [eta, setEta] = useState("~3 min");
  const [plateCopied, setPlateCopied] = useState(false);

  useEffect(() => {
    setEta(computeETA(ride, rideStatus));
  }, [ride.current_driver_lat, ride.current_driver_lng, rideStatus]);

  const copyPlate = () => {
    navigator.clipboard.writeText(driver.plate);
    setPlateCopied(true);
    toast.success("License plate copied");
    setTimeout(() => setPlateCopied(false), 2000);
  };

  const statusConfig = (() => {
    switch (rideStatus) {
      case 'driver_arriving': case 'driver_assigned':
        return { label: `Arriving in ${eta}`, color: 'bg-primary text-primary-foreground', icon: <Clock className="h-3.5 w-3.5 mr-1.5" /> };
      case 'arrived_at_pickup':
        return { label: "Driver arrived", color: 'bg-emerald-500 text-white', icon: <MapPin className="h-3.5 w-3.5 mr-1.5" /> };
      case 'in_progress':
        return { label: `Arriving in ${eta}`, color: 'bg-foreground text-background', icon: <Navigation2 className="h-3.5 w-3.5 mr-1.5 animate-pulse" /> };
      default:
        return { label: "", color: '', icon: null };
    }
  })();

  return (
    <motion.div key="tracking" initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
      className="bg-card rounded-t-3xl relative z-30 border-t border-border/50">
      <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-1" />
      <div className="px-5 pb-6 space-y-3">
        {/* Status badge */}
        <div className="text-center">
          <Badge className={cn("px-5 py-2.5 text-sm rounded-full font-bold shadow-lg", statusConfig.color)}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>

        {/* Live route deviation safety banner */}
        {rideStatus === 'in_progress' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
          >
            <Route className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="text-2xs font-medium text-emerald-700">Route monitored · AI safety active</span>
            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </motion.div>
        )}

        {/* PIN display */}
        {pickupPin && (rideStatus === 'driver_arriving' || rideStatus === 'arrived_at_pickup' || rideStatus === 'driver_assigned') && (
          <PickupPinDisplay pin={pickupPin} driverName={driver.name} />
        )}

        {/* Driver card - redesigned with trust scores */}
        <div className="bg-gradient-to-br from-secondary to-secondary/50 rounded-2xl p-4 border border-border/30">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="h-16 w-16 border-3 border-card shadow-lg">
                <AvatarImage src={driver.photo} />
                <AvatarFallback className="text-lg font-black bg-primary/10 text-primary">
                  {driver.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-foreground text-base">{driver.name}</span>
                <TrustBadge rating={driver.rating} trips={driver.trips} />
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-foreground">{driver.rating}</span>
                </div>
                <span className="text-xs text-muted-foreground">{driver.trips.toLocaleString()} trips</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-sm font-medium text-muted-foreground">{driver.color} {driver.car}</p>
              </div>
              <button onClick={copyPlate} className="flex items-center gap-1.5 mt-1 press-effect">
                <span className="text-sm font-mono font-black text-foreground bg-muted px-2 py-0.5 rounded-lg">{driver.plate}</span>
                {plateCopied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm press-effect shadow-lg"
              onClick={() => driver.phone && (window.location.href = `tel:${driver.phone}`)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button
              className="flex-1 h-12 rounded-xl font-bold text-sm press-effect"
              variant="outline"
              onClick={onChat}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-start gap-3 py-2">
          <div className="flex flex-col items-center mt-1">
            <div className="h-3 w-3 rounded-full border-2 border-emerald-500 bg-emerald-500/20" />
            <div className="w-[1.5px] h-8 bg-gradient-to-b from-emerald-500/50 to-primary/50" />
            <div className="h-3 w-3 rounded-sm border-2 border-primary bg-primary/20" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">Pickup</p>
              <p className="text-sm font-medium text-foreground">{(ride.ride_request as any)?.pickup_address}</p>
            </div>
            <div>
              <p className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">Dropoff</p>
              <p className="text-sm font-medium text-foreground">{(ride.ride_request as any)?.dropoff_address}</p>
            </div>
          </div>
        </div>

        {/* Price + payment */}
        <div className="flex items-center justify-between py-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {paymentMethod === 'cash' && <Banknote className="h-4 w-4 text-emerald-600" />}
            {paymentMethod === 'card' && <CreditCard className="h-4 w-4 text-blue-600" />}
            {paymentMethod === 'wallet' && <Wallet className="h-4 w-4 text-purple-600" />}
            <span className="capitalize font-bold">{paymentMethod}</span>
          </div>
          <span className="text-2xl font-black text-foreground">{formatPrice(ride.final_price || estimatedPrice)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-12 rounded-xl press-effect border-border font-bold" onClick={onShareRide}>
            <Share2 className="h-4 w-4 mr-2" />
            Share trip
          </Button>
          {rideStatus !== 'in_progress' && (
            <Button variant="outline" className="flex-1 h-12 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10 press-effect font-bold" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          {rideStatus === 'in_progress' && (
            <Button variant="outline" className="flex-1 h-12 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10 press-effect font-bold"
              onClick={() => toast.info("Emergency SOS activated. Our safety team has been notified.")}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              SOS
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
