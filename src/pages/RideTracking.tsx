import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ActiveRideTracker, RideRatingModal } from "@/components/rides";
import { CancelRideModal } from "@/components/rides/CancelRideModal";
import { PickupPinDisplay, RideTimeline } from "@/components/rides";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Car, Phone, MessageSquare, Shield, 
  Navigation, Share2, Star,
  User, X
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { ActiveRide, ActiveRideStatus } from "@/types/ride";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type RideTrackingStatus = ActiveRideStatus;

const RideTracking = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [completedRide, setCompletedRide] = useState<ActiveRide | null>(null);
  const [expandedSheet, setExpandedSheet] = useState(false);
  const [rideStatus, setRideStatus] = useState<RideTrackingStatus>('driver_assigned');
  const [matchTime, setMatchTime] = useState<Date | null>(null);
  const [pickupPin, setPickupPin] = useState<string | null>(null);
  const [ride, setRide] = useState<ActiveRide | null>(null);

  // Fetch ride data and subscribe to updates
  useEffect(() => {
    if (!rideId) return;

    const fetchRide = async () => {
      const { data } = await supabase
        .from('active_rides')
        .select(`
          *,
          driver:drivers(*),
          ride_request:ride_requests(*)
        `)
        .eq('id', rideId)
        .single();
      
      if (data) {
        setRide(data as unknown as ActiveRide);
        setPickupPin(data.pickup_pin);
        setMatchTime(new Date(data.driver_assigned_at));
        
        // Map database status to tracking status
        const statusMap: Record<string, RideTrackingStatus> = {
          'matched': 'driver_assigned',
          'driver_arriving': 'driver_arriving',
          'arrived_at_pickup': 'arrived_at_pickup',
          'in_progress': 'in_progress',
          'completed': 'completed'
        };
        setRideStatus(statusMap[data.status] || 'driver_assigned');
      }
    };

    fetchRide();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`ride-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'active_rides',
          filter: `id=eq.${rideId}`
        },
        (payload) => {
          const newData = payload.new as any;
          const oldStatus = ride?.status;
          const newStatus = newData.status;
          
          setRide(prev => prev ? { ...prev, ...newData } : null);
          
          const statusMap: Record<string, RideTrackingStatus> = {
            'matched': 'driver_assigned',
            'driver_arriving': 'driver_arriving',
            'arrived_at_pickup': 'arrived_at_pickup',
            'in_progress': 'in_progress',
            'completed': 'completed'
          };
          setRideStatus(statusMap[newData.status] || 'driver_assigned');

          // Haptic & audio feedback for key status changes
          if (oldStatus !== newStatus) {
            // Driver arrived at pickup - double vibration pattern
            if (newStatus === 'arrived_at_pickup') {
              if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
              }
              toast.success("Your driver has arrived!", {
                description: "Head to the pickup point"
              });
            }
            
            // Ride started
            if (newStatus === 'in_progress') {
              if ('vibrate' in navigator) {
                navigator.vibrate(100);
              }
              toast.info("Ride started", {
                description: "Enjoy your trip!"
              });
            }
            
            // Ride completed - celebration vibration
            if (newStatus === 'completed') {
              if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100, 50, 200]);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  const handleRideComplete = async () => {
    if (rideId) {
      const { data } = await supabase
        .from('active_rides')
        .select(`
          *,
          driver:drivers(*),
          ride_request:ride_requests(*)
        `)
        .eq('id', rideId)
        .single();
      
      if (data) {
        setCompletedRide(data as unknown as ActiveRide);
        setShowRatingModal(true);
      }
    }
  };

  const handleRatingClose = () => {
    setShowRatingModal(false);
    navigate('/taxis/history');
  };

  const handleCancelled = () => {
    navigate('/taxis');
  };

  const handleShareRide = async () => {
    const shareUrl = `${window.location.origin}/track/${ride?.share_code || rideId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Track My Ride',
          text: 'Follow my ride in real-time',
          url: shareUrl,
        });
      } catch (err) {
        navigator.clipboard.writeText(shareUrl);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  // Calculate minutes since match for cancellation fee logic
  const minutesSinceMatch = matchTime 
    ? Math.floor((new Date().getTime() - matchTime.getTime()) / 60000)
    : undefined;

  // Driver data from ride or mock
  const driver = ride?.driver ? {
    name: ride.driver.full_name || "Driver",
    rating: ride.driver.rating || 4.9,
    trips: ride.driver.total_rides || 0,
    car: `${ride.driver.vehicle_make || ''} ${ride.driver.vehicle_model || ''}`.trim() || "Vehicle",
    plate: ride.driver.license_plate || "---",
    photo: ride.driver.profile_photo_url,
    eta: 3,
  } : {
    name: "John Smith",
    rating: 4.9,
    trips: 2453,
    car: "Toyota Corolla",
    plate: "CA 123-456",
    photo: null,
    eta: 3,
  };

  const pickupAddress = ride?.ride_request?.pickup_address || "123 Main Street, City Center";
  const dropoffAddress = ride?.ride_request?.dropoff_address || "456 Oak Avenue, Business District";

  return (
    <div className="min-h-screen bg-background safe-area-pt relative">
      {/* Map Background Placeholder */}
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-b from-muted/30 via-muted/10 to-background">
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
          </div>
          
          {/* Animated Route Line */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 800">
            <motion.path
              d="M 200 700 Q 180 500 200 350 T 200 100"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              fill="none"
              strokeDasharray="10,10"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            {/* Pickup Point */}
            <circle cx="200" cy="700" r="12" fill="hsl(var(--primary))" />
            <circle cx="200" cy="700" r="6" fill="white" />
            {/* Destination Point */}
            <circle cx="200" cy="100" r="12" fill="hsl(var(--primary))" className="opacity-50" />
            
            {/* Driver Car */}
            <motion.g
              animate={{ 
                y: rideStatus === 'driver_arriving' || rideStatus === 'driver_assigned' ? [0, -200] : 
                   rideStatus === 'in_progress' ? [-350, -600] : -200
              }}
              transition={{ duration: 3, ease: "easeInOut" }}
            >
              <circle cx="200" cy="500" r="20" fill="hsl(var(--primary))" />
              <Car className="text-white" x="188" y="488" width="24" height="24" />
            </motion.g>
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 py-3 flex items-center justify-between">
        <BackButton fallbackPath="/orders" className="h-12 w-12 rounded-2xl bg-background/90 shadow-lg" />
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-2xl bg-background/90 shadow-lg"
            onClick={handleShareRide}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-2xl bg-destructive/10 shadow-lg text-destructive"
            onClick={() => setShowCancelModal(true)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="relative z-10 flex justify-center mt-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Badge className={cn(
            "px-6 py-2 text-base rounded-full shadow-lg",
            (rideStatus === 'driver_arriving' || rideStatus === 'driver_assigned') && "bg-blue-500 text-white",
            rideStatus === 'arrived_at_pickup' && "bg-green-500 text-white",
            rideStatus === 'in_progress' && "bg-primary text-primary-foreground",
          )}>
            {(rideStatus === 'driver_arriving' || rideStatus === 'driver_assigned') && `Driver arriving in ${driver.eta} min`}
            {rideStatus === 'arrived_at_pickup' && "Driver has arrived!"}
            {rideStatus === 'in_progress' && "On the way..."}
          </Badge>
        </motion.div>
      </div>

      {/* Pickup PIN Display - Show when driver is arriving/arrived */}
      {(rideStatus === 'driver_arriving' || rideStatus === 'arrived_at_pickup' || rideStatus === 'driver_assigned') && pickupPin && (
        <div className="relative z-10 px-4 mt-4">
          <PickupPinDisplay pin={pickupPin} driverName={driver.name} />
        </div>
      )}

      {/* Bottom Sheet */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
      >
        <div 
          className={cn(
            "bg-background rounded-t-[2rem] shadow-2xl transition-all duration-300",
            expandedSheet ? "min-h-[70vh]" : "min-h-[40vh]"
          )}
        >
          {/* Drag Handle */}
          <div 
            className="flex justify-center pt-3 pb-2 cursor-pointer"
            onClick={() => setExpandedSheet(!expandedSheet)}
          >
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          <div className="px-4 space-y-4 pb-8">
            {/* Driver Card */}
            <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Driver Photo */}
                  <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center overflow-hidden">
                      {driver.photo ? (
                        <img src={driver.photo} alt={driver.name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-primary-foreground" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                      <Car className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* Driver Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{driver.name}</h3>
                      <Badge variant="outline" className="rounded-lg">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-1" />
                        {driver.rating}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{driver.trips.toLocaleString()} trips</p>
                    <p className="text-sm font-medium mt-1">{driver.car} • {driver.plate}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button size="icon" className="h-12 w-12 rounded-2xl bg-green-500 hover:bg-green-600">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-12 w-12 rounded-2xl">
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ride Timeline */}
            <RideTimeline
              currentStatus={rideStatus}
              etaMinutes={driver.eta}
            />

            {/* Route Summary */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <div className="w-0.5 h-10 bg-gradient-to-b from-green-500 to-primary" />
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Pickup</p>
                      <p className="font-medium">{pickupAddress}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="font-medium">{dropoffAddress}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Features */}
            <AnimatePresence>
              {expandedSheet && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                          <Shield className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">Safety Features Active</p>
                          <p className="text-sm text-muted-foreground">Trip is being monitored</p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                          Protected
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Tracker */}
            <ActiveRideTracker 
              rideId={rideId}
              onRideComplete={handleRideComplete}
            />
          </div>
        </div>
      </motion.div>

      {/* Rating Modal */}
      {completedRide && (
        <RideRatingModal
          open={showRatingModal}
          onClose={handleRatingClose}
          rideId={completedRide.id}
          driverName={completedRide.driver?.full_name || 'Driver'}
          driverPhoto={completedRide.driver?.profile_photo_url}
          finalPrice={completedRide.final_price || completedRide.ride_request?.system_estimated_price || 0}
        />
      )}

      {/* Cancel Ride Modal */}
      <CancelRideModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        activeRideId={rideId}
        cancelledBy="passenger"
        onCancelled={handleCancelled}
        minutesSinceMatch={minutesSinceMatch}
      />
    </div>
  );
};

export default RideTracking;
