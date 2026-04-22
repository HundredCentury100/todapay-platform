import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { 
  MapPin, Navigation, Clock, DollarSign, 
  User, ArrowRight, Loader2, MessageSquare
} from "lucide-react";
import { RideRequest, VEHICLE_TYPES } from "@/types/ride";
import { submitBid, acceptFixedRide } from "@/services/rideService";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface RideRequestCardProps {
  request: RideRequest;
  driverId: string;
  driverEta: number;
  onAccepted?: (rideId: string) => void;
}

export const RideRequestCard = ({ 
  request, 
  driverId, 
  driverEta,
  onAccepted 
}: RideRequestCardProps) => {
  const [bidAmount, setBidAmount] = useState(request.system_estimated_price.toString());
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);

  const isNegotiation = request.pricing_mode === 'negotiation';
  const displayPrice = isNegotiation 
    ? request.passenger_offered_price || request.system_estimated_price
    : request.system_estimated_price;

  const handleAcceptFixed = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await acceptFixedRide(request.id, driverId);
      if (error) throw error;
      
      toast.success("Ride accepted! Head to pickup location.");
      onAccepted?.(data?.id || '');
    } catch (error) {
      toast.error("Failed to accept ride");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitBid = async () => {
    if (!bidAmount || Number(bidAmount) <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await submitBid(
        request.id, 
        driverId, 
        Number(bidAmount), 
        driverEta,
        message || undefined
      );
      
      if (error) throw error;
      
      toast.success("Bid submitted! Waiting for passenger response.");
      setShowBidForm(false);
    } catch (error) {
      toast.error("Failed to submit bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  const vehicleType = VEHICLE_TYPES.find(v => v.id === request.vehicle_type);

  return (
    <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="font-semibold text-sm">{request.passenger_name}</span>
          </div>
          <Badge variant={isNegotiation ? "secondary" : "default"} className="rounded-full">
            {isNegotiation ? "Make Offer" : "Fixed Price"}
          </Badge>
        </div>

        {/* Locations - matches transfer route display */}
        <div className="flex gap-3">
          <div className="flex flex-col items-center pt-1">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <div className="w-0.5 h-8 bg-gradient-to-b from-green-500 to-primary" />
            <div className="h-3 w-3 rounded-full bg-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="text-sm font-medium truncate">{request.pickup_address}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dropoff</p>
              <p className="text-sm font-medium truncate">{request.dropoff_address}</p>
            </div>
          </div>
        </div>

        {/* Trip Info - badge style matches transfers */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <Navigation className="h-3 w-3" />
            {request.estimated_distance_km.toFixed(1)} km
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="h-3 w-3" />
            ~{request.estimated_duration_mins} min
          </Badge>
          {vehicleType && (
            <Badge variant="outline" className="text-xs">
              {vehicleType.name}
            </Badge>
          )}
        </div>

        {/* Price Display */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
          <div>
            <p className="text-xs text-muted-foreground">
              {isNegotiation ? "Passenger Offer" : "Trip Fare"}
            </p>
            <p className="text-xl font-bold text-primary">
              R{displayPrice.toFixed(0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Your ETA</p>
            <div className="flex items-center gap-1 justify-end">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="font-semibold">{driverEta} min</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isNegotiation ? (
          showBidForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 overflow-hidden"
            >
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Your bid amount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="flex-1 rounded-xl h-12"
                />
                <span className="flex items-center text-muted-foreground text-sm">ZAR</span>
              </div>
              <Textarea
                placeholder="Optional message to passenger..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="h-16 rounded-xl"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setShowBidForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 h-12 rounded-xl font-semibold"
                  onClick={handleSubmitBid}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Submit Bid</>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button 
              className="w-full h-14 rounded-xl font-semibold text-base"
              onClick={() => setShowBidForm(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Make an Offer
            </Button>
          )
        ) : (
          <Button 
            className="w-full h-14 rounded-xl font-semibold text-base"
            onClick={handleAcceptFixed}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Accept Ride
          </Button>
        )}
      </div>
    </Card>
  );
};

export default RideRequestCard;