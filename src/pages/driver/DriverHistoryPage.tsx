import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, CarTaxiFront, MapPin, Calendar, Clock, Star,
  CheckCircle, XCircle, Filter, Plane, Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { GoogleMapsLink } from "@/components/ui/GoogleMapsLink";

const DriverHistoryPage = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled">("all");

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (driver) {
        // Fetch from transfer_requests (new system)
        let transferQuery = supabase
          .from("transfer_requests")
          .select("*")
          .eq("assigned_driver_id", driver.id)
          .in("status", ["completed", "cancelled"])
          .order("created_at", { ascending: false })
          .limit(50);

        if (statusFilter !== "all") {
          transferQuery = transferQuery.eq("status", statusFilter);
        }

        const { data: transferData } = await transferQuery;

        // Also fetch legacy active_rides
        let legacyQuery = supabase
          .from("active_rides")
          .select(`
            *,
            ride_request:ride_requests(
              pickup_address,
              dropoff_address,
              estimated_distance_km
            )
          `)
          .eq("driver_id", driver.id)
          .in("status", ["completed", "cancelled"])
          .order("created_at", { ascending: false })
          .limit(50);

        if (statusFilter !== "all") {
          legacyQuery = legacyQuery.eq("status", statusFilter);
        }

        const { data: legacyData } = await legacyQuery;

        // Normalize legacy data to match transfer format
        const normalizedTransfers = (transferData || []).map(t => ({
          ...t,
          pickup_address: t.pickup_location,
          dropoff_address: t.dropoff_location,
          final_price: t.price_final || t.price_quoted,
          is_transfer: true,
        }));

        const normalizedLegacy = (legacyData || []).map(r => ({
          ...r,
          pickup_address: r.ride_request?.pickup_address,
          dropoff_address: r.ride_request?.dropoff_address,
          estimated_distance_km: r.ride_request?.estimated_distance_km,
          service_type: 'on_demand_taxi',
          is_transfer: false,
        }));

        // Combine and sort by date
        const combined = [...normalizedTransfers, ...normalizedLegacy]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setTransfers(combined);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [user, statusFilter]);

  const filteredTransfers = transfers.filter((transfer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      transfer.pickup_address?.toLowerCase().includes(query) ||
      transfer.dropoff_address?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    if (status === "completed") {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
        <XCircle className="h-3 w-3 mr-1" />
        Cancelled
      </Badge>
    );
  };

  const getServiceTypeIcon = (serviceType: string) => {
    if (serviceType === 'airport_pickup' || serviceType === 'airport_dropoff') {
      return <Plane className="h-3 w-3" />;
    }
    return <CarTaxiFront className="h-3 w-3" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transfer History</h1>
        <p className="text-muted-foreground">View your past transfers</p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("completed")}
          >
            Completed
          </Button>
          <Button
            variant={statusFilter === "cancelled" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("cancelled")}
          >
            Cancelled
          </Button>
        </div>
      </div>

      {/* Transfers List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : filteredTransfers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CarTaxiFront className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No transfers found</h3>
            <p className="text-muted-foreground text-sm">
              Your completed transfers will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTransfers.map((transfer) => (
            <Card key={transfer.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(transfer.status)}
                    {transfer.service_type && (
                      <Badge variant="outline" className="flex items-center gap-1 capitalize">
                        {getServiceTypeIcon(transfer.service_type)}
                        {transfer.service_type.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                  <span className="font-semibold text-primary">
                    R{transfer.final_price?.toFixed(0) || 0}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <p className="text-sm truncate flex-1">
                      <GoogleMapsLink address={transfer.pickup_address || "Pickup"} className="text-sm" />
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <p className="text-sm truncate flex-1">
                      <GoogleMapsLink address={transfer.dropoff_address || "Dropoff"} className="text-sm" />
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(transfer.created_at), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{format(new Date(transfer.created_at), "h:mm a")}</span>
                  </div>
                  {transfer.estimated_distance_km && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{transfer.estimated_distance_km.toFixed(1)} km</span>
                    </div>
                  )}
                  {transfer.num_passengers && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{transfer.num_passengers}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverHistoryPage;
