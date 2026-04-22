import { useEffect, useState, lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Phone,
  MessageCircle,
  Star,
  Navigation,
  Shield,
  Share2,
  Car,
  AlertTriangle,
  Wallet,
  Map as MapIcon,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPassengerActiveRide } from "@/services/rideService";
import { createRideReceipt, getRideReceipt, sendReceiptEmail, type RideReceipt } from "@/services/rideReceiptService";
import type { ActiveRide, ActiveRideStatus } from "@/types/ride";
import { toast } from "sonner";
import { RidePaymentModal } from "./RidePaymentModal";
import { RideChat } from "./RideChat";
import { EmergencyActionsModal } from "./EmergencyActionsModal";
import { RideReceiptCard } from "./RideReceiptCard";

// Lazy load the map component
const RideMap = lazy(() => import('./RideMap'));

interface ActiveRideTrackerProps {
  rideId?: string;
  onRideComplete?: () => void;
}

const STATUS_LABELS: Record<ActiveRideStatus, string> = {
  driver_assigned: 'Driver assigned',
  driver_arriving: 'Driver on the way',
  arrived_at_pickup: 'Driver arrived',
  in_progress: 'On your trip',
  completed: 'Trip completed',
  cancelled: 'Cancelled',
};

const STATUS_PROGRESS: Record<ActiveRideStatus, number> = {
  driver_assigned: 20,
  driver_arriving: 40,
  arrived_at_pickup: 60,
  in_progress: 80,
  completed: 100,
  cancelled: 0,
};

export const ActiveRideTracker = ({ rideId, onRideComplete }: ActiveRideTrackerProps) => {
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [receipt, setReceipt] = useState<RideReceipt | null>(null);
  const [showMap, setShowMap] = useState(false);

  const fetchRide = async () => {
    if (rideId) {
      const { data } = await supabase
        .from('active_rides')
        .select('*, driver:drivers(*), ride_request:ride_requests(*)')
        .eq('id', rideId)
        .single();
      setRide(data as ActiveRide | null);
    } else {
      const { data } = await getPassengerActiveRide();
      setRide(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRide();

    const channel = supabase
      .channel(`ride-${rideId || 'active'}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'active_rides',
        },
        async (payload) => {
          console.log('Ride update:', payload);
          setRide(prev => prev ? { ...prev, ...payload.new } as ActiveRide : null);
          
          const newStatus = payload.new.status as ActiveRideStatus;
          if (newStatus === 'arrived_at_pickup') {
            toast.info("Your driver has arrived!");
          } else if (newStatus === 'completed') {
            toast.success("Trip completed!");
            const newReceipt = await createRideReceipt(payload.new.id);
            if (newReceipt) {
              setReceipt(newReceipt);
              const emailSent = await sendReceiptEmail(payload.new.id);
              if (emailSent) {
                toast.success("Receipt sent to your email");
              }
            }
            if (payload.new.payment_status !== 'paid') {
              setShowPaymentModal(true);
            }
            onRideComplete?.();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  const handleShareRide = () => {
    if (!ride?.share_code) return;
    const shareUrl = `${window.location.origin}/ride/track/${ride.share_code}`;
    navigator.share?.({
      title: 'Track my ride',
      text: `Track my ride live. Share code: ${ride.share_code}`,
      url: shareUrl,
    }).catch(() => {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied!");
    });
  };

  const handlePaymentComplete = async (method: string) => {
    await fetchRide();
    if (ride?.id) {
      const existingReceipt = await getRideReceipt(ride.id);
      if (existingReceipt) {
        setReceipt(existingReceipt);
      } else {
        const newReceipt = await createRideReceipt(ride.id);
        if (newReceipt) setReceipt(newReceipt);
      }
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border-0 shadow-lg animate-pulse">
        <CardContent className="p-6">
          <div className="h-40 bg-muted rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (!ride) {
    return null;
  }

  const driver = ride.driver as any;
  const request = ride.ride_request as any;
  const status = ride.status as ActiveRideStatus;
  const isCompleted = status === 'completed';
  const isPaid = ride.payment_status === 'paid';

  return (
    <>
      <div className="space-y-4">
        {/* Status Card */}
        <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Your Ride</h3>
              <Badge variant={status === 'in_progress' ? 'default' : 'secondary'} className="rounded-full">
                {STATUS_LABELS[status]}
              </Badge>
            </div>
            <Progress value={STATUS_PROGRESS[status]} className="h-2" />
          </CardContent>
        </Card>

        {/* Driver Info Card */}
        <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20 shadow-md">
                <AvatarImage src={driver?.profile_photo_url} />
                <AvatarFallback className="bg-primary/10 text-lg">
                  {driver?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'DR'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg truncate">{driver?.full_name}</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{driver?.rating?.toFixed(1) || '5.0'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Car className="h-3 w-3" />
                  <span className="truncate">{driver?.vehicle_color} {driver?.vehicle_make} {driver?.vehicle_model}</span>
                </div>
                <p className="text-sm font-semibold text-primary">{driver?.license_plate}</p>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="rounded-full h-10 w-10"
                  onClick={() => driver?.phone && (window.location.href = `tel:${driver.phone}`)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="rounded-full h-10 w-10"
                  onClick={() => setShowChat(true)}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Toggle */}
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl"
          onClick={() => setShowMap(!showMap)}
        >
          <MapIcon className="h-4 w-4 mr-2" />
          {showMap ? 'Hide Map' : 'Show Live Map'}
        </Button>

        {/* Map */}
        {showMap && (
          <Suspense fallback={<div className="h-[300px] bg-muted animate-pulse rounded-2xl" />}>
            <RideMap
              pickupCoords={{ lat: request?.pickup_lat || 0, lng: request?.pickup_lng || 0 }}
              dropoffCoords={{ lat: request?.dropoff_lat || 0, lng: request?.dropoff_lng || 0 }}
              driverCoords={
                ride.current_driver_lat && ride.current_driver_lng
                  ? { lat: ride.current_driver_lat, lng: ride.current_driver_lng }
                  : null
              }
              pickupAddress={request?.pickup_address}
              dropoffAddress={request?.dropoff_address}
              driverName={driver?.full_name}
            />
          </Suspense>
        )}

        {/* Route Info Card - matches transfer style */}
        <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">Trip Details</h3>
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <div className="w-0.5 h-8 bg-gradient-to-b from-green-500 to-primary" />
                <div className="h-3 w-3 rounded-full bg-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  <p className="text-sm font-medium">{request?.pickup_address}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dropoff</p>
                  <p className="text-sm font-medium">{request?.dropoff_address}</p>
                </div>
              </div>
            </div>

            {/* Price & Payment */}
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
              <div>
                <span className="text-sm text-muted-foreground">Trip fare</span>
                {isPaid && (
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 rounded-full">
                    Paid
                  </Badge>
                )}
              </div>
              <span className="text-xl font-bold text-primary">
                R{ride.final_price || request?.final_price}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Button */}
        {isCompleted && !isPaid && (
          <Button 
            className="w-full h-14 rounded-xl text-lg font-semibold" 
            onClick={() => setShowPaymentModal(true)}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Pay Now
          </Button>
        )}

        {/* Receipt */}
        {receipt && (
          <RideReceiptCard receipt={receipt} />
        )}

        {/* Share Code */}
        {ride.share_code && !isCompleted && (
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm">Share Code: <strong>{ride.share_code}</strong></span>
                </div>
                <Button size="sm" variant="ghost" onClick={handleShareRide} className="rounded-full">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emergency */}
        {!isCompleted && (
          <Button 
            variant="destructive" 
            className="w-full h-14 rounded-xl text-lg font-semibold" 
            onClick={() => setShowEmergency(true)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency
          </Button>
        )}
      </div>

      {/* Modals */}
      <RidePaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        rideId={ride.id}
        amount={ride.final_price || request?.final_price || 0}
        onPaymentComplete={handlePaymentComplete}
      />

      <RideChat
        rideId={ride.id}
        driverName={driver?.full_name}
        driverPhoto={driver?.profile_photo_url}
        senderType="passenger"
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />

      <EmergencyActionsModal
        open={showEmergency}
        onOpenChange={setShowEmergency}
        rideId={ride.id}
        shareCode={ride.share_code}
        driverName={driver?.full_name}
        driverPhone={driver?.phone}
      />
    </>
  );
};

export default ActiveRideTracker;
