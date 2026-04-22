import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Plus, Search, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { GoogleMapsLink } from "@/components/ui/GoogleMapsLink";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Ride {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  created_at: string;
  final_price?: number;
  source: 'active_ride' | 'ride_request';
}

const Rides = () => {
  const { user, loading: authLoading } = useAuth();
  const { convertPrice } = useCurrency();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { returnTo: "/rides" } });
      return;
    }
    if (user) fetchRides();
  }, [user, authLoading]);

  const fetchRides = async () => {
    try {
      // Fetch active rides (matched, in_progress, completed, cancelled)
      const { data: activeRides } = await supabase
        .from("active_rides")
        .select(`id, status, created_at, final_price, ride_request:ride_requests(pickup_address, dropoff_address)`)
        .eq("passenger_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch pending ride requests (searching/bidding — not yet matched)
      const { data: pendingRequests } = await supabase
        .from("ride_requests")
        .select("id, pickup_address, dropoff_address, status, created_at, passenger_offered_price")
        .eq("passenger_id", user?.id)
        .in("status", ["searching", "bidding"])
        .order("created_at", { ascending: false })
        .limit(10);

      const activeRideItems: Ride[] = (activeRides || []).map((ride: any) => ({
        id: ride.id,
        pickup_address: ride.ride_request?.pickup_address || "Unknown",
        dropoff_address: ride.ride_request?.dropoff_address || "Unknown",
        status: ride.status,
        created_at: ride.created_at,
        final_price: ride.final_price,
        source: 'active_ride' as const,
      }));

      const pendingItems: Ride[] = (pendingRequests || []).map((req: any) => ({
        id: req.id,
        pickup_address: req.pickup_address || "Unknown",
        dropoff_address: req.dropoff_address || "Unknown",
        status: req.status,
        created_at: req.created_at,
        final_price: req.passenger_offered_price,
        source: 'ride_request' as const,
      }));

      // Merge and sort by date
      const all = [...pendingItems, ...activeRideItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRides(all);
    } catch (error) {
      console.error("Error fetching rides:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      searching: { label: "Searching", className: "bg-amber-500/10 text-amber-600" },
      bidding: { label: "Receiving bids", className: "bg-blue-500/10 text-blue-600" },
      matched: { label: "Matched", className: "bg-primary/10 text-primary" },
      driver_arriving: { label: "Driver arriving", className: "bg-primary/10 text-primary" },
      arrived_at_pickup: { label: "Driver arrived", className: "bg-green-500/10 text-green-600" },
      in_progress: { label: "On trip", className: "bg-blue-500/10 text-blue-600" },
      completed: { label: "Completed", className: "bg-green-500/10 text-green-600" },
      cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive" },
    };
    const info = map[status] || { label: status.replace("_", " "), className: "bg-muted text-muted-foreground" };
    return (
      <Badge variant="secondary" className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", info.className)}>
        {status === 'searching' && <Search className="h-3 w-3 mr-1 animate-pulse" />}
        {status === 'bidding' && <Clock className="h-3 w-3 mr-1 animate-pulse" />}
        {info.label}
      </Badge>
    );
  };

  const activeRides = rides.filter(r => ["searching", "bidding", "matched", "driver_arriving", "arrived_at_pickup", "in_progress"].includes(r.status));
  const completedRides = rides.filter(r => r.status === "completed");
  const cancelledRides = rides.filter(r => r.status === "cancelled");

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-background border-b safe-area-pt">
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath="/profile" />
            <div className="flex-1">
              <h1 className="font-bold text-lg">My Rides</h1>
              <p className="text-xs text-muted-foreground">Your ride history</p>
            </div>
            <Button size="sm" className="rounded-xl" onClick={() => navigate("/ride-booking")}>
              <Plus className="w-4 h-4 mr-1" />
              Book
            </Button>
          </div>
        </header>

        <Tabs defaultValue="upcoming" className="px-4 py-4">
          <TabsList className="w-full grid grid-cols-3 h-11 rounded-xl">
            <TabsTrigger value="upcoming" className="rounded-lg text-xs">
              Active ({activeRides.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg text-xs">
              Past ({completedRides.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-lg text-xs">
              Cancelled ({cancelledRides.length})
            </TabsTrigger>
          </TabsList>

          {["upcoming", "completed", "cancelled"].map((tab) => {
            const data = tab === "upcoming" ? activeRides : tab === "completed" ? completedRides : cancelledRides;
            return (
              <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
                {data.length > 0 ? (
                  data.map((ride, index) => (
                    <RideCard key={ride.id} ride={ride} index={index} getStatusBadge={getStatusBadge} />
                  ))
                ) : (
                  <EmptyRidesState type={tab as any} />
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </MobileAppLayout>
  );
};

const RideCard = ({ ride, index, getStatusBadge }: { ride: Ride; index: number; getStatusBadge: (s: string) => React.ReactNode }) => {
  const { convertPrice } = useCurrency();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className="p-4 rounded-2xl border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => {
          if (ride.source === 'ride_request' && ['searching', 'bidding'].includes(ride.status)) {
            navigate('/ride-booking');
          }
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              {getStatusBadge(ride.status)}
              {ride.final_price && (
                <span className="font-semibold text-sm">{convertPrice(ride.final_price)}</span>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <span className="truncate">
                  <GoogleMapsLink address={ride.pickup_address} className="text-sm text-muted-foreground hover:text-primary" />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                <span className="truncate">
                  <GoogleMapsLink address={ride.dropoff_address} className="text-sm text-muted-foreground hover:text-primary" />
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(ride.created_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const EmptyRidesState = ({ type }: { type: "upcoming" | "completed" | "cancelled" }) => (
  <Card className="p-8 text-center rounded-2xl border-0 shadow-md">
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
      <Car className="w-8 h-8 text-primary" />
    </div>
    <h3 className="text-lg font-semibold mb-2">
      {type === "upcoming" ? "No Active Rides" : type === "completed" ? "No Past Rides" : "No Cancelled Rides"}
    </h3>
    <p className="text-muted-foreground text-sm">
      {type === "upcoming" ? "Your active trips will appear here" : "Your ride history will appear here"}
    </p>
  </Card>
);

export default Rides;
