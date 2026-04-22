import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Car, MapPin, Clock, Shield, Navigation, Phone
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { ActiveRide, ActiveRideStatus } from "@/types/ride";

const STATUS_LABELS: Record<string, string> = {
  driver_assigned: 'Driver assigned',
  driver_arriving: 'Driver on the way',
  arrived_at_pickup: 'Driver waiting',
  in_progress: 'Trip in progress',
  completed: 'Trip completed',
  cancelled: 'Trip cancelled',
};

const STATUS_PROGRESS: Record<string, number> = {
  driver_assigned: 15,
  driver_arriving: 35,
  arrived_at_pickup: 55,
  in_progress: 80,
  completed: 100,
  cancelled: 0,
};

const RideShare = () => {
  const { shareCode } = useParams();
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRide = async () => {
      if (!shareCode) {
        setError("Invalid share code");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('active_rides')
        .select(`
          *,
          driver:drivers(*),
          ride_request:ride_requests(*)
        `)
        .eq('share_code', shareCode.toUpperCase())
        .single();

      if (fetchError) {
        setError("Ride not found or share code expired");
      } else if (data) {
        setRide(data as unknown as ActiveRide);
      }
      setLoading(false);
    };

    fetchRide();

    // Subscribe to updates
    if (shareCode) {
      const channel = supabase
        .channel(`shared-ride-${shareCode}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'active_rides',
            filter: `share_code=eq.${shareCode.toUpperCase()}`,
          },
          (payload) => {
            setRide(prev => prev ? { ...prev, ...payload.new } as ActiveRide : null);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [shareCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Ride Not Found</h2>
            <p className="text-muted-foreground">
              {error || "This ride share link may have expired or is invalid."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = STATUS_PROGRESS[ride.status] || 0;
  const rideRequest = ride.ride_request;
  const driver = ride.driver;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto max-w-2xl flex items-center gap-3">
          <BackButton className="text-primary-foreground hover:bg-white/10" fallbackPath="/" />
          <Car className="h-6 w-6" />
          <div>
            <h1 className="font-semibold">Live Ride Tracking</h1>
            <p className="text-sm opacity-80">Share Code: {shareCode?.toUpperCase()}</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Trip Status</CardTitle>
              <Badge variant={ride.status === 'in_progress' ? 'default' : 'secondary'}>
                {STATUS_LABELS[ride.status] || ride.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-4" />
            
            {/* Driver Info */}
            {driver && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg">
                    {driver.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{driver.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {driver.vehicle_color} {driver.vehicle_make} {driver.vehicle_model}
                  </p>
                  <Badge variant="outline" className="mt-1 font-mono">
                    {driver.license_plate}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <span className="font-semibold">{driver.rating.toFixed(1)}</span>
                    <span>★</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {driver.total_rides} rides
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Route
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="h-3 w-3 rounded-full bg-green-500 ring-2 ring-green-500/20" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="font-medium">{rideRequest?.pickup_address}</p>
              </div>
            </div>
            <div className="ml-1.5 border-l-2 border-dashed border-border h-4" />
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-500/20" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dropoff</p>
                <p className="font-medium">{rideRequest?.dropoff_address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Notice */}
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Shield className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">
                Ride is being tracked
              </p>
              <p className="text-sm text-muted-foreground">
                Location updates in real-time for safety
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RideShare;
