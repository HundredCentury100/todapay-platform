import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation, MapPin, Star, Users, List, Map as MapIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/ui/empty-state";
import MobileAppLayout from "@/components/MobileAppLayout";
import { toast } from "sonner";
import { ResultsMapView } from "@/components/maps/ResultsMapView";
import { cn } from "@/lib/utils";
import { FadeTransition } from "@/components/ui/fade-transition";
import { useRecentVerticalSearches } from "@/hooks/useRecentVerticalSearches";

const TransferResults = () => {
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("price_low");
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";
  const passengers = searchParams.get("passengers") || "1";
  const { recent, addSearch } = useRecentVerticalSearches("transfers");

  // Save current search
  useEffect(() => {
    if (from && to) addSearch(`${from} → ${to}`, { from, to, date });
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from("transfer_services")
        .select("*, merchant_profiles(business_name, logo_url)") as any)
        .eq("is_active", true)
        .limit(50);
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error("Error fetching transfer services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const sorted = [...services].sort((a, b) => {
    if (sortBy === "price_low") return (a.base_price || 0) - (b.base_price || 0);
    if (sortBy === "price_high") return (b.base_price || 0) - (a.base_price || 0);
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  const sortOptions = [
    { value: "price_low", label: "Cheapest" },
    { value: "price_high", label: "Most Expensive" },
    { value: "rating", label: "Top Rated" },
  ];

  return (
    <MobileAppLayout onRefresh={fetchServices}>
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-40 bg-background border-b safe-area-pt">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <BackButton fallbackPath="/" />
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-lg">Transfers</h1>
                <p className="text-xs text-muted-foreground truncate">
                  {from && to ? `${from} → ${to}` : "Airport & city transfers"}
                  {date ? ` · ${format(new Date(date), "MMM d")}` : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                className="h-10 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-colors bg-secondary text-secondary-foreground flex items-center gap-1 press-effect"
              >
                {viewMode === 'list' ? <MapIcon className="h-3 w-3" /> : <List className="h-3 w-3" />}
                {viewMode === 'list' ? 'Map' : 'List'}
              </button>
              {sortOptions.map(o => (
                <button
                  key={o.value}
                  onClick={() => setSortBy(o.value)}
                  className={cn(
                    "h-10 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-all press-effect",
                    sortBy === o.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {/* Recent searches */}
          {recent.length > 0 && !loading && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
              {recent.slice(0, 3).map((r) => (
                <button
                  key={r.query}
                  onClick={() => {
                    if (r.filters?.from && r.filters?.to) {
                      window.location.href = `/transfers/results?from=${r.filters.from}&to=${r.filters.to}&date=${r.filters.date || ""}`;
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium whitespace-nowrap press-effect"
                >
                  <Clock className="h-3 w-3" />
                  {r.query}
                </button>
              ))}
            </div>
          )}
          {viewMode === 'map' ? (
            <ResultsMapView
              items={sorted
                .filter((s: any) => s.pickup_lat && s.pickup_lng)
                .map((s: any) => ({
                  id: s.id,
                  lat: s.pickup_lat,
                  lng: s.pickup_lng,
                  title: s.service_name,
                  subtitle: s.merchant_profiles?.business_name || 'Transfer Provider',
                  price: s.base_price ? `$${s.base_price}` : undefined,
                  rating: s.rating || undefined,
                }))}
              onItemClick={(id) => toast.info("Transfer booking details coming soon!")}
              markerType="default"
              className="h-[calc(100vh-200px)] rounded-2xl overflow-hidden"
            />
          ) : loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-2/3 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))
          ) : sorted.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Navigation className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No transfers found</h3>
              <p className="text-muted-foreground text-sm">Try adjusting your search</p>
            </div>
          ) : (
            sorted.map((service, idx) => (
              <motion.div key={service.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="rounded-2xl p-4 shadow-md transition-all press-effect border border-border/50" onClick={() => toast.info("Transfer booking details coming soon!")}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden">
                      {service.merchant_profiles?.logo_url ? (
                        <img src={service.merchant_profiles.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Navigation className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{service.service_name}</h3>
                      <p className="text-xs text-muted-foreground">{service.merchant_profiles?.business_name || "Transfer Provider"}</p>
                    </div>
                    {service.rating > 0 && (
                      <Badge variant="outline" className="gap-1 shrink-0"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{service.rating?.toFixed(1)}</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {service.vehicle_type && <Badge variant="secondary" className="text-xs capitalize rounded-full">{service.vehicle_type}</Badge>}
                    {service.max_passengers && (
                      <Badge variant="secondary" className="text-xs gap-1 rounded-full"><Users className="h-3 w-3" />{service.max_passengers} pax</Badge>
                    )}
                    {service.service_type && <Badge variant="secondary" className="text-xs capitalize rounded-full">{service.service_type.replace(/_/g, " ")}</Badge>}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-lg font-bold text-primary">
                      ${service.base_price || service.price_per_km || 0}
                      <span className="text-xs font-normal text-muted-foreground">{service.price_per_km ? "/km" : ""}</span>
                    </p>
                    <Button size="sm" className="rounded-full press-effect">Book</Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default TransferResults;
