import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, MapPin, Clock, DollarSign, Navigation, CarTaxiFront, Plane, Users, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GoogleMapsLink } from "@/components/ui/GoogleMapsLink";

const DriverRequestsPage = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      const { data: driver } = await supabase
        .from("drivers")
        .select("id, is_online")
        .eq("user_id", user.id)
        .single();

      if (driver) {
        setIsOnline(driver.is_online);

        if (driver.is_online) {
          // Fetch from transfer_requests (new system)
          const { data: transferRequests } = await supabase
            .from("transfer_requests")
            .select("*")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(10);

          // Also fetch legacy ride_requests for backwards compatibility
          const { data: legacyRequests } = await supabase
            .from("ride_requests")
            .select("*")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(10);

          // Merge and normalize both types
          const normalizedTransfers = (transferRequests || []).map(t => ({
            ...t,
            pickup_address: t.pickup_location,
            dropoff_address: t.dropoff_location,
            system_estimated_price: t.price_quoted,
            is_transfer: true,
          }));

          const normalizedLegacy = (legacyRequests || []).map(r => ({
            ...r,
            service_type: 'on_demand_taxi',
            vehicle_category: r.vehicle_type,
            num_passengers: 1,
            is_transfer: false,
          }));

          setRequests([...normalizedTransfers, ...normalizedLegacy]);
        }
      }
      setLoading(false);
    };

    fetchRequests();

    // Subscribe to new requests
    const channel = supabase
      .channel("transfer-requests")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transfer_requests",
          filter: "status=eq.pending",
        },
        (payload) => {
          const newRequest = {
            ...payload.new as any,
            pickup_address: (payload.new as any).pickup_location,
            dropoff_address: (payload.new as any).dropoff_location,
            system_estimated_price: (payload.new as any).price_quoted,
            is_transfer: true,
          };
          setRequests((prev) => [newRequest, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      // Get current driver
      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!driver) {
        toast.error("Driver profile not found");
        return;
      }

      // Call the accept_transfer_request function
      const { data, error } = await supabase.rpc('accept_transfer_request' as any, {
        p_transfer_request_id: requestId,
        p_driver_id: driver.id,
        p_vehicle_id: null
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; credits_deducted?: number; new_balance?: number };

      if (result.success) {
        toast.success("Transfer accepted!", {
          description: `${result.credits_deducted} credits deducted. Balance: ${result.new_balance}`
        });
        // Remove from list
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        toast.error(result.error || "Failed to accept transfer");
      }
    } catch (error: any) {
      console.error('Accept error:', error);
      toast.error(error.message || "Failed to accept transfer");
    }
  };

  const getServiceTypeIcon = (serviceType: string) => {
    if (serviceType === 'airport_pickup' || serviceType === 'airport_dropoff') {
      return <Plane className="h-3 w-3" />;
    }
    return <CarTaxiFront className="h-3 w-3" />;
  };

  const getServiceTypeLabel = (serviceType: string) => {
    const labels: Record<string, string> = {
      airport_pickup: 'Airport Pickup',
      airport_dropoff: 'Airport Dropoff',
      point_to_point: 'City Transfer',
      hourly_hire: 'Hourly Hire',
      shuttle: 'Shuttle',
      tour_transfer: 'Tour',
      on_demand_taxi: 'On-Demand Ride',
    };
    return labels[serviceType] || serviceType;
  };

  if (!isOnline) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Compass className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">You're Offline</h2>
          <p className="text-muted-foreground mb-6 max-w-xs">
            Go online from your dashboard to start receiving transfer requests
          </p>
          <Button asChild>
            <a href="/driver">Go to Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transfer Requests</h1>
        <p className="text-muted-foreground">Accept transfers in your area</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-40" />
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CarTaxiFront className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No requests right now</h3>
            <p className="text-muted-foreground text-sm">
              New transfer requests will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getServiceTypeIcon(request.service_type)}
                      {getServiceTypeLabel(request.service_type)}
                    </Badge>
                    {request.vehicle_category && (
                      <Badge variant="outline" className="capitalize">
                        {request.vehicle_category?.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                  <span className="text-lg font-bold text-primary">
                    R{request.system_estimated_price?.toFixed(0)}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pickup</p>
                      <p className="text-sm font-medium">
                        <GoogleMapsLink address={request.pickup_address} />
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Dropoff</p>
                      <p className="text-sm font-medium">
                        <GoogleMapsLink address={request.dropoff_address} />
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  {request.estimated_distance_km && (
                    <div className="flex items-center gap-1">
                      <Navigation className="h-4 w-4" />
                      <span>{request.estimated_distance_km?.toFixed(1)} km</span>
                    </div>
                  )}
                  {request.estimated_duration_min && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{request.estimated_duration_min} min</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{request.num_passengers || 1}</span>
                  </div>
                  {request.num_luggage > 0 && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{request.num_luggage}</span>
                    </div>
                  )}
                </div>

                {request.flight_number && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Plane className="h-4 w-4" />
                    <span>Flight: {request.flight_number}</span>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={() => handleAcceptRequest(request.id)}
                >
                  Accept Transfer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverRequestsPage;
