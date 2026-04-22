import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  RefreshCw, MapPin, CarTaxiFront 
} from "lucide-react";
import { RideRequest } from "@/types/ride";
import { getAvailableRideRequests } from "@/services/rideService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RideRequestCard from "./RideRequestCard";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface DriverTransferRequestsProps {
  driverId: string;
  driverLocation: { lat: number; lng: number };
  onTransferAccepted?: (transferId: string) => void;
  /** @deprecated Use onTransferAccepted instead */
  onRideAccepted?: (rideId: string) => void;
}

export const DriverTransferRequests = ({ 
  driverId, 
  driverLocation,
  onTransferAccepted,
  onRideAccepted,
}: DriverTransferRequestsProps) => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { play } = useNotificationSound();
  const initialLoadRef = useRef(true);

  // Support both prop names for backwards compatibility
  const handleAccepted = onTransferAccepted || onRideAccepted;

  const fetchRequests = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const { data, error } = await getAvailableRideRequests(
        driverLocation.lat, 
        driverLocation.lng,
        10 // 10km radius
      );
      
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Subscribe to new transfer requests
    const channel = supabase
      .channel('driver-transfer-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transfer_requests',
        },
        (payload) => {
          toast.info("New transfer request nearby!");
          play('booking_success');
          fetchRequests(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transfer_requests',
        },
        () => {
          fetchRequests(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverLocation]);

  // Calculate ETA for each request based on distance
  const calculateEta = (request: RideRequest): number => {
    const R = 6371;
    const dLat = (request.pickup_lat - driverLocation.lat) * Math.PI / 180;
    const dLon = (request.pickup_lng - driverLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(driverLocation.lat * Math.PI / 180) * Math.cos(request.pickup_lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Assume average speed of 30 km/h in city
    return Math.ceil((distance / 30) * 60);
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <CarTaxiFront className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Available Transfers</h3>
          </div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CarTaxiFront className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Available Transfers</h3>
            {requests.length > 0 && (
              <Badge variant="secondary" className="rounded-full">{requests.length}</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => fetchRequests(false)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">No transfer requests nearby</p>
              <p className="text-sm text-muted-foreground">
                Stay online to receive new transfer requests
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-2">
            <div className="space-y-3">
              {requests.map((request) => (
                <RideRequestCard
                  key={request.id}
                  request={request}
                  driverId={driverId}
                  driverEta={calculateEta(request)}
                  onAccepted={handleAccepted}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

// Export with both names for backwards compatibility
export const DriverRideRequests = DriverTransferRequests;
export default DriverTransferRequests;