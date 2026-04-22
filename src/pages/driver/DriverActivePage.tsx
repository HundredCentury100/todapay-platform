import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CarTaxiFront, MapPin, Phone, MessageSquare, Navigation, CheckCircle, Plane, Users, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DriverPinEntry } from "@/components/rides/DriverPinEntry";
import { toast } from "sonner";
import { GoogleMapsLink } from "@/components/ui/GoogleMapsLink";

const DriverActivePage = () => {
  const { user } = useAuth();
  const [activeTransfer, setActiveTransfer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPinEntry, setShowPinEntry] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchActiveTransfer = async () => {
      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (driver) {
        // First try transfer_requests (new system)
        const { data: transfer } = await supabase
          .from("transfer_requests")
          .select("*")
          .eq("assigned_driver_id", driver.id)
          .in("status", ["driver_assigned", "driver_arriving", "arrived_at_pickup", "in_progress"])
          .single();

        if (transfer) {
          setActiveTransfer(transfer);
        } else {
          // Fallback to legacy active_rides
          const { data: legacyRide } = await supabase
            .from("active_rides")
            .select(`*, ride_request:ride_requests(*)`)
            .eq("driver_id", driver.id)
            .in("status", ["matched", "driver_arriving", "arrived_at_pickup", "in_progress"])
            .single();
          
          if (legacyRide) {
            // Convert to transfer format
            setActiveTransfer({
              ...legacyRide,
              pickup_location: legacyRide.ride_request?.pickup_address,
              dropoff_location: legacyRide.ride_request?.dropoff_address,
              pickup_lat: legacyRide.ride_request?.pickup_lat,
              pickup_lng: legacyRide.ride_request?.pickup_lng,
              dropoff_lat: legacyRide.ride_request?.dropoff_lat,
              dropoff_lng: legacyRide.ride_request?.dropoff_lng,
              price_quoted: legacyRide.ride_request?.system_estimated_price,
              num_passengers: legacyRide.ride_request?.passenger_id ? 1 : 1,
              is_legacy: true,
            });
          }
        }
      }
      setLoading(false);
    };

    fetchActiveTransfer();
  }, [user]);

  const handleArrivedAtPickup = async () => {
    if (!activeTransfer) return;

    const table = activeTransfer.is_legacy ? "active_rides" : "transfer_requests";
    await supabase
      .from(table)
      .update({ 
        status: "arrived_at_pickup",
        ...(activeTransfer.is_legacy ? { driver_arrived_at: new Date().toISOString() } : {})
      })
      .eq("id", activeTransfer.id);

    setShowPinEntry(true);
    toast.success("Status updated - waiting for passenger");
  };

  const handlePinVerified = async () => {
    if (!activeTransfer) return;

    const table = activeTransfer.is_legacy ? "active_rides" : "transfer_requests";
    await supabase
      .from(table)
      .update({ 
        status: "in_progress",
        ...(activeTransfer.is_legacy ? { pickup_time: new Date().toISOString() } : {})
      })
      .eq("id", activeTransfer.id);

    setShowPinEntry(false);
    toast.success("Transfer started!");
  };

  const handleCompleteTransfer = async () => {
    if (!activeTransfer) return;

    try {
      if (activeTransfer.is_legacy) {
        // Legacy ride completion
        await supabase
          .from("active_rides")
          .update({ 
            status: "completed",
            dropoff_time: new Date().toISOString()
          })
          .eq("id", activeTransfer.id);
        toast.success("Ride completed!");
      } else {
        // Use the complete_transfer_request function for proper earnings tracking
        const { data, error } = await supabase.rpc('complete_transfer_request' as any, {
          p_transfer_request_id: activeTransfer.id,
          p_final_price: activeTransfer.price_quoted || null
        });

        if (error) throw error;

        const result = data as { success: boolean; net_amount?: number; platform_fee?: number; error?: string };

        if (result.success) {
           toast.success("Transfer completed!", {
             description: `Earned $${result.net_amount?.toFixed(0)} (after $${result.platform_fee?.toFixed(0)} platform fee)`
          });
        } else {
          throw new Error(result.error || "Failed to complete transfer");
        }
      }

      setActiveTransfer(null);
    } catch (error: any) {
      console.error('Complete transfer error:', error);
      toast.error(error.message || "Failed to complete transfer");
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!activeTransfer) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <CarTaxiFront className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Active Transfer</h2>
          <p className="text-muted-foreground mb-6 max-w-xs">
            Accept a transfer request to start your next trip
          </p>
          <Button asChild>
            <a href="/driver/requests">View Transfers</a>
          </Button>
        </div>
      </div>
    );
  }

  const isAirportTransfer = activeTransfer.service_type === 'airport_pickup' || activeTransfer.service_type === 'airport_dropoff';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Active Transfer</h1>
          <p className="text-muted-foreground">
            {activeTransfer.status === "in_progress" ? "Trip in progress" : "Heading to pickup"}
          </p>
        </div>
        <Badge variant={activeTransfer.status === "in_progress" ? "default" : "secondary"}>
          {activeTransfer.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Service Type Badge */}
      {activeTransfer.service_type && (
        <div className="flex items-center gap-2">
          {isAirportTransfer && <Plane className="h-4 w-4 text-primary" />}
          <Badge variant="outline" className="capitalize">
            {activeTransfer.service_type.replace(/_/g, " ")}
          </Badge>
          {activeTransfer.flight_number && (
            <Badge variant="secondary">
              Flight: {activeTransfer.flight_number}
            </Badge>
          )}
        </div>
      )}

      {/* Route Card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div className="w-0.5 h-12 bg-border" />
              <div className="h-3 w-3 rounded-full bg-red-500" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="font-medium">
                  <GoogleMapsLink address={activeTransfer.pickup_location} lat={activeTransfer.pickup_lat} lng={activeTransfer.pickup_lng} />
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dropoff</p>
                <p className="font-medium">
                  <GoogleMapsLink address={activeTransfer.dropoff_location} lat={activeTransfer.dropoff_lat} lng={activeTransfer.dropoff_lng} />
                </p>
              </div>
            </div>
          </div>
          
          {/* Passenger & Luggage Info */}
          <div className="flex items-center gap-4 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{activeTransfer.num_passengers || 1} passengers</span>
            </div>
            {activeTransfer.num_luggage > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{activeTransfer.num_luggage} bags</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Passenger Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {activeTransfer.passenger_name?.charAt(0) || "P"}
                </span>
              </div>
              <div>
                <p className="font-semibold">{activeTransfer.passenger_name || "Passenger"}</p>
                 <p className="text-sm text-muted-foreground">
                   ${activeTransfer.price_quoted?.toFixed(0) || 0}
                 </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" className="rounded-full">
                <Phone className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="rounded-full">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PIN Entry */}
      {showPinEntry && activeTransfer.pickup_pin && (
        <DriverPinEntry
          expectedPin={activeTransfer.pickup_pin}
          passengerName={activeTransfer.passenger_name || "Passenger"}
          onPinVerified={handlePinVerified}
        />
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {activeTransfer.status === "driver_assigned" || activeTransfer.status === "matched" || activeTransfer.status === "driver_arriving" ? (
          <>
            <Button className="w-full" size="lg" asChild>
              <GoogleMapsLink 
                address={activeTransfer.pickup_location} 
                lat={activeTransfer.pickup_lat} 
                lng={activeTransfer.pickup_lng}
                showIcon={false}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate to Pickup
              </GoogleMapsLink>
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              size="lg"
              onClick={handleArrivedAtPickup}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              I've Arrived
            </Button>
          </>
        ) : activeTransfer.status === "in_progress" ? (
          <>
            <Button className="w-full" size="lg" asChild>
              <GoogleMapsLink 
                address={activeTransfer.dropoff_location} 
                lat={activeTransfer.dropoff_lat} 
                lng={activeTransfer.dropoff_lng}
                showIcon={false}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate to Dropoff
              </GoogleMapsLink>
            </Button>
            <Button 
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700" 
              size="lg"
              onClick={handleCompleteTransfer}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Transfer
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default DriverActivePage;
