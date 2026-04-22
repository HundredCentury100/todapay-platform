import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, Navigation, Phone, MessageSquare, 
  CheckCircle, Loader2, ArrowRight, DollarSign,
  User, Clock, AlertTriangle, X, Banknote
} from "lucide-react";
import { ActiveRide, ActiveRideStatus } from "@/types/ride";
import { updateRideStatus, getDriverActiveRide } from "@/services/rideService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CancelRideModal } from "./CancelRideModal";
import { RidePaymentConfirmation } from "./RidePaymentConfirmation";
import { GoogleMapsLink } from "@/components/ui/GoogleMapsLink";

interface DriverActiveRideProps {
  driverId: string;
  onRideComplete?: () => void;
}

const STATUS_FLOW: { status: ActiveRideStatus; label: string; action: string }[] = [
  { status: 'driver_arriving', label: 'On the way', action: 'Arrived at Pickup' },
  { status: 'arrived_at_pickup', label: 'At pickup', action: 'Start Trip' },
  { status: 'in_progress', label: 'Trip in progress', action: 'Complete Trip' },
  { status: 'completed', label: 'Completed', action: '' },
];

const STATUS_PROGRESS: Record<ActiveRideStatus, number> = {
  driver_assigned: 10,
  driver_arriving: 30,
  arrived_at_pickup: 50,
  in_progress: 75,
  completed: 100,
  cancelled: 0,
};

export const DriverActiveRide = ({ driverId, onRideComplete }: DriverActiveRideProps) => {
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);

  const fetchRide = async () => {
    try {
      const { data, error } = await getDriverActiveRide(driverId);
      if (error) throw error;
      setRide(data);
    } catch (error) {
      console.error("Failed to fetch active ride:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRide();

    // Subscribe to ride updates
    const channel = supabase
      .channel(`driver-active-ride-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_rides',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setRide(prev => prev ? { ...prev, ...payload.new } as ActiveRide : null);
          } else if (payload.eventType === 'INSERT') {
            fetchRide();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  const getNextStatus = (): ActiveRideStatus | null => {
    if (!ride) return null;
    const currentIndex = STATUS_FLOW.findIndex(s => s.status === ride.status);
    if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[currentIndex + 1].status;
  };

  const getCurrentAction = (): string => {
    if (!ride) return '';
    const current = STATUS_FLOW.find(s => s.status === ride.status);
    return current?.action || '';
  };

  const handleStatusUpdate = async () => {
    const nextStatus = getNextStatus();
    if (!nextStatus || !ride) return;

    // If completing the trip, show payment confirmation first
    if (nextStatus === 'completed') {
      setShowPaymentConfirmation(true);
      return;
    }

    setUpdating(true);
    try {
      const { error } = await updateRideStatus(ride.id, nextStatus);
      if (error) throw error;

      if (nextStatus === 'arrived_at_pickup') {
        toast.success("Passenger notified of your arrival");
      } else if (nextStatus === 'in_progress') {
        toast.success("Trip started. Drive safely!");
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentConfirmed = async () => {
    if (!ride) return;
    
    setUpdating(true);
    try {
      const { error } = await updateRideStatus(ride.id, 'completed');
      if (error) throw error;

      toast.success("Trip completed! Great job.");
      onRideComplete?.();
    } catch (error) {
      toast.error("Failed to complete trip");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelled = () => {
    setRide(null);
    toast.info("Ride cancelled");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!ride) {
    return (
      <Card>
        <CardContent className="text-center py-12 space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Navigation className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No active ride</p>
            <p className="text-sm text-muted-foreground">
              Accept a ride request to start
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = STATUS_PROGRESS[ride.status as ActiveRideStatus] || 0;
  const rideRequest = ride.ride_request;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Active Trip
          </CardTitle>
          <Badge variant={ride.status === 'in_progress' ? 'default' : 'secondary'}>
            {STATUS_FLOW.find(s => s.status === ride.status)?.label || ride.status}
          </Badge>
        </div>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Passenger Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {rideRequest?.passenger_name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{rideRequest?.passenger_name || 'Passenger'}</p>
              <p className="text-sm text-muted-foreground">{rideRequest?.passenger_phone}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="outline">
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Route */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="h-3 w-3 rounded-full bg-green-500 ring-2 ring-green-500/20" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="font-medium">
                <GoogleMapsLink address={rideRequest?.pickup_address || ""} />
              </p>
            </div>
          </div>
          <div className="ml-1.5 border-l-2 border-dashed border-border h-4" />
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-500/20" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Dropoff</p>
              <p className="font-medium">
                <GoogleMapsLink address={rideRequest?.dropoff_address || ""} />
              </p>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="font-semibold">{rideRequest?.estimated_distance_km?.toFixed(1)} km</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-semibold">{rideRequest?.estimated_duration_mins} min</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Fare</p>
            <p className="font-semibold text-primary">R{ride.final_price || rideRequest?.system_estimated_price || 0}</p>
          </div>
        </div>

        {/* Share Code */}
        {ride.share_code && (
          <div className="flex items-center justify-between p-2 rounded bg-muted/50">
            <span className="text-sm text-muted-foreground">Share Code</span>
            <Badge variant="outline" className="font-mono">{ride.share_code}</Badge>
          </div>
        )}

        {/* Action Button */}
        {getCurrentAction() && (
          <Button
            className="w-full h-12"
            onClick={handleStatusUpdate}
            disabled={updating}
          >
            {updating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : ride.status === 'in_progress' ? (
              <Banknote className="h-4 w-4 mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            {getCurrentAction()}
          </Button>
        )}

        {/* Cancel Ride - only show before trip starts */}
        {ride.status !== 'in_progress' && ride.status !== 'completed' && (
          <Button 
            variant="outline" 
            className="w-full text-destructive border-destructive/30"
            onClick={() => setShowCancelModal(true)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Ride
          </Button>
        )}

        {/* Emergency - show during trip */}
        {ride.status === 'in_progress' && (
          <Button variant="outline" className="w-full text-destructive border-destructive/30">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        )}
      </CardContent>

      {/* Cancel Modal */}
      <CancelRideModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        activeRideId={ride.id}
        cancelledBy="driver"
        onCancelled={handleCancelled}
      />

      {/* Payment Confirmation Modal */}
      <RidePaymentConfirmation
        open={showPaymentConfirmation}
        onOpenChange={setShowPaymentConfirmation}
        rideId={ride.id}
        expectedAmount={ride.final_price || ride.ride_request?.system_estimated_price || 0}
        currency="ZAR"
        onConfirmed={handlePaymentConfirmed}
      />
    </Card>
  );
};

export default DriverActiveRide;
