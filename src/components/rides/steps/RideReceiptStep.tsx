import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, MapPin, Clock, Route, Star } from "lucide-react";
import { format } from "date-fns";
import type { ActiveRide } from "@/types/ride";

interface RideReceiptStepProps {
  ride: ActiveRide;
  driverName: string;
  driverRating: number;
  formatPrice: (amount: number) => string;
  onDone: () => void;
}

export const RideReceiptStep = ({
  ride, driverName, driverRating, formatPrice, onDone,
}: RideReceiptStepProps) => {
  const req = ride.ride_request as any;
  const pickupTime = ride.pickup_time ? format(new Date(ride.pickup_time), 'h:mm a') : '--';
  const dropoffTime = ride.dropoff_time ? format(new Date(ride.dropoff_time), 'h:mm a') : '--';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-t-3xl relative z-30 border-t border-border/50"
    >
      <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-2" />
      <div className="px-5 pb-6 space-y-4">
        {/* Success header */}
        <div className="text-center py-4">
          <div className="h-16 w-16 rounded-full bg-green-500/10 mx-auto mb-3 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Ride Complete!</h3>
          <p className="text-3xl font-black text-foreground mt-2">{formatPrice(ride.final_price || 0)}</p>
        </div>

        {/* Route recap */}
        <div className="bg-secondary rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center mt-1">
              <div className="h-2.5 w-2.5 rounded-full border-2 border-green-500 bg-card" />
              <div className="w-[1.5px] h-8 bg-border" />
              <div className="h-2.5 w-2.5 rounded-sm border-2 border-primary bg-card" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-2xs text-muted-foreground">Picked up · {pickupTime}</p>
                <p className="text-sm font-medium text-foreground truncate">{req?.pickup_address}</p>
              </div>
              <div>
                <p className="text-2xs text-muted-foreground">Dropped off · {dropoffTime}</p>
                <p className="text-sm font-medium text-foreground truncate">{req?.dropoff_address}</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Route className="h-3.5 w-3.5" />
              <span>{req?.estimated_distance_km?.toFixed(1) || '—'} km</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{req?.estimated_duration_mins || '—'} min</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{driverName} · {driverRating}</span>
            </div>
          </div>
        </div>

        {/* Fare breakdown */}
        <div className="bg-secondary rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fare breakdown</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Trip fare</span>
            <span className="font-medium text-foreground">{formatPrice(ride.final_price || 0)}</span>
          </div>
          {(ride.tip_amount || 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tip</span>
              <span className="font-medium text-foreground">{formatPrice(ride.tip_amount || 0)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/50">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">{formatPrice((ride.final_price || 0) + (ride.tip_amount || 0))}</span>
          </div>
        </div>

        <Button className="w-full h-14 rounded-2xl text-base font-bold press-effect shadow-super" onClick={onDone}>
          Done
        </Button>
      </div>
    </motion.div>
  );
};
