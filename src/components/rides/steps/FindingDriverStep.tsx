import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, X, Shield, Clock, Users, Sparkles } from "lucide-react";
import { DriverBidsList } from "@/components/rides/DriverBidsList";
import type { PricingMode } from "@/types/ride";

interface FindingDriverStepProps {
  currentRideId: string;
  pricingMode: PricingMode;
  formatPrice: (amount: number) => string;
  offerPrice: number;
  onBidAccepted: (rideId: string) => void;
  onCancel: () => void;
}

export const FindingDriverStep = ({
  currentRideId, pricingMode, formatPrice, offerPrice,
  onBidAccepted, onCancel,
}: FindingDriverStepProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [nearbyDrivers] = useState(Math.floor(Math.random() * 6) + 3);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div key="finding" initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
      className="bg-card rounded-t-3xl relative z-30 border-t border-border/50">
      <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-2" />
      <div className="px-5 pb-6 space-y-4">
        <div className="text-center py-6">
          {/* Animated radar pulse */}
          <div className="relative h-24 w-24 mx-auto mb-4">
            <motion.div
              animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-primary/20"
            />
            <motion.div
              animate={{ scale: [1, 2], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              className="absolute inset-0 rounded-full bg-primary/15"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Car className="h-10 w-10 text-primary" />
            </motion.div>
          </div>

          <h3 className="font-black text-lg text-foreground">
            {pricingMode === 'negotiation' ? 'Sending your offer...' : 'Finding your driver'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {pricingMode === 'negotiation'
              ? `Your ${formatPrice(offerPrice)} offer is being sent to nearby drivers`
              : 'Matching you with the best available driver'}
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-bold text-foreground">{formatTime(elapsed)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10">
              <Users className="h-3 w-3 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">{nearbyDrivers} drivers nearby</span>
            </div>
          </div>

          {/* Animated dots */}
          <div className="flex justify-center gap-2 mt-4">
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div key={i}
                animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                className="h-2 w-2 rounded-full bg-primary" />
            ))}
          </div>
        </div>

        {/* Safety assurance */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="text-2xs font-medium text-emerald-700">Your ride will be PIN-verified and GPS-tracked for safety</span>
        </div>

        <DriverBidsList
          rideRequestId={currentRideId}
          onBidAccepted={onBidAccepted}
        />

        <Button variant="outline" className="w-full h-12 rounded-2xl press-effect border-border font-bold" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel search
        </Button>
      </div>
    </motion.div>
  );
};
