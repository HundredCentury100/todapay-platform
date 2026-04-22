import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bus, Calendar, MapPin, Home as HomeIcon,
  Car, Search, TrendingUp, Sparkles, ArrowRight, Compass, ChevronRight,
  Navigation, Star, Flame, Ticket, Map as MapIcon, List
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import MobileAppLayout from "@/components/MobileAppLayout";
import { ResultsMapView } from "@/components/maps/ResultsMapView";

import BackButton from "@/components/BackButton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceLocation } from "@/hooks/useDeviceLocation";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";

type DiscoveryFilter = "all" | "buses" | "events" | "stays" | "rides" | "experiences";

const filterChips: { key: DiscoveryFilter; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "All", icon: Sparkles },
  { key: "buses", label: "Buses", icon: Bus },
  { key: "events", label: "Events", icon: Calendar },
  { key: "stays", label: "Stays", icon: HomeIcon },
  { key: "rides", label: "Rides", icon: Car },
  { key: "experiences", label: "Experiences", icon: Compass },
];

const categoryEmojis: Record<string, string> = {
  Music: "🎵", Sports: "⚽", Cultural: "🎭", Comedy: "😂", Conference: "💼", Festival: "🎉",
};

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<DiscoveryFilter>("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { location: deviceLocation, isDetecting } = useDeviceLocation();
  const { convertPrice } = useCurrency();

  const { data: trendingEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["explore-trending-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, venue, location, event_date, event_time, type, image, status, event_ticket_tiers(id, name, price, available_tickets)")
        .eq("status", "active")
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  const { data: popularRoutes = [], isLoading: routesLoading } = useQuery({
    queryKey: ["explore-popular-routes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("from_location, to_location")
        .eq("booking_type", "bus")
        .eq("status", "confirmed")
        .not("from_location", "is", null)
        .not("to_location", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      const routeCounts: Record<string, { from: string; to: string; count: number }> = {};
      (data || []).forEach((b: any) => {
        const key = `${b.from_location}→${b.to_location}`;
        if (!routeCounts[key]) routeCounts[key] = { from: b.from_location, to: b.to_location, count: 0 };
        routeCounts[key].count++;
      });

      return Object.values(routeCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: nearbyPlaces = [], isLoading: nearbyLoading } = useQuery({
    queryKey: ["explore-nearby", deviceLocation?.city],
    queryFn: async () => {
      const city = deviceLocation?.city;
      if (!city) return [];

      const { data: venues } = await supabase
        .from("venues")
        .select("id, name, location, category, rating, price_per_hour, images, latitude, longitude")
        .ilike("location", `%${city}%`)
        .limit(5);

      return (venues || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        type: v.category || "Venue",
        location: v.location,
        rating: v.rating || 4.0,
        price: v.price_per_hour ? `$${v.price_per_hour}/hr` : "",
        path: `/venues/${v.id}`,
        lat: v.latitude,
        lng: v.longitude,
      }));
    },
    enabled: !!deviceLocation?.city,
    staleTime: 5 * 60 * 1000,
  });

  const [showNearMeMap, setShowNearMeMap] = useState(false);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["explore-trending-events"] }),
      queryClient.invalidateQueries({ queryKey: ["explore-popular-routes"] }),
      queryClient.invalidateQueries({ queryKey: ["explore-nearby"] }),
    ]);
  }, [queryClient]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const showRoutes = activeFilter === "all" || activeFilter === "buses";
  const showEvents = activeFilter === "all" || activeFilter === "events";
  const showNearby = activeFilter === "all" || activeFilter === "stays";

  return (
    <MobileAppLayout onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background px-4 py-4 safe-area-pt border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <BackButton fallbackPath="/" />
            <h1 className="text-xl font-bold">Discover</h1>
            {deviceLocation && (
              <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                <Navigation className="h-3 w-3 text-primary" />
                {deviceLocation.displayName}
              </span>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search destinations, events, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 rounded-xl bg-muted/50 border-0 text-sm focus-visible:ring-primary"
              />
            </div>
          </form>
        </div>

        <div className="px-4 py-4 pb-24 space-y-6">
          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setActiveFilter(chip.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition-all active:scale-[0.97] ${
                  activeFilter === chip.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                <chip.icon className="h-3.5 w-3.5" />
                {chip.label}
              </button>
            ))}
          </div>

          {/* Popular Routes */}
          {showRoutes && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Popular Routes
                </h2>
                <Link to="/buses" className="text-xs text-primary font-medium flex items-center gap-0.5">
                  See all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {routesLoading ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : popularRoutes.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {popularRoutes.map((route: any, idx: number) => (
                    <motion.div
                      key={`${route.from}-${route.to}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <Link
                        to={`/buses?from=${route.from}&to=${route.to}`}
                        className="block p-3 bg-card rounded-xl border border-border/50 hover:border-primary/30 transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit mb-1.5">
                          <TrendingUp className="h-2.5 w-2.5" />
                          <span>{route.count} booked</span>
                        </div>
                        <p className="font-semibold text-sm">{route.from} → {route.to}</p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-xl">
                  No route data yet — check back soon!
                </div>
              )}
            </section>
          )}

          {/* Trending Events */}
          {showEvents && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Trending Events
                </h2>
                <Link to="/events" className="text-xs text-primary font-medium flex items-center gap-0.5">
                  See all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {eventsLoading ? (
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-4 px-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-44 w-40 rounded-xl shrink-0" />
                  ))}
                </div>
              ) : trendingEvents.length > 0 ? (
                <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide snap-x-mandatory">
                  {trendingEvents.map((event: any, idx: number) => {
                    const minPrice = event.event_ticket_tiers?.length
                      ? Math.min(...event.event_ticket_tiers.map((t: any) => t.price))
                      : 0;
                    const totalAvailable = event.event_ticket_tiers?.reduce(
                      (sum: number, t: any) => sum + t.available_tickets, 0
                    ) || 0;
                    const emoji = categoryEmojis[event.type] || "🎉";

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex-shrink-0 snap-start"
                      >
                        <Link
                          to={`/events/${event.id}`}
                          className="group block w-40 bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all"
                        >
                          <div className="relative h-22 bg-secondary flex items-center justify-center overflow-hidden">
                            {event.image ? (
                              <img src={event.image} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <span className="text-3xl">{emoji}</span>
                            )}
                            {totalAvailable < 20 && totalAvailable > 0 && (
                              <Badge className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[9px] px-1.5 py-0 border-0">
                                🔥 HOT
                              </Badge>
                            )}
                          </div>
                          <div className="p-2.5">
                            <h3 className="font-semibold text-xs mb-1 truncate group-hover:text-primary transition-colors">
                              {event.name}
                            </h3>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                              <MapPin className="h-2.5 w-2.5 text-primary" />
                              <span className="truncate">{event.location}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="flex items-center gap-1 text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                                <Calendar className="h-2.5 w-2.5" />
                                {new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                              <span className="flex items-center gap-0.5 text-primary font-semibold">
                                <Ticket className="h-2.5 w-2.5" />
                                {minPrice === 0 ? "FREE" : convertPrice(minPrice)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-xl">
                  No upcoming events found
                </div>
              )}
            </section>
          )}

          {/* Near You */}
          {showNearby && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  Near You
                </h2>
                {nearbyPlaces.some((p: any) => p.lat && p.lng) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs rounded-full gap-1 press-effect"
                    onClick={() => setShowNearMeMap(!showNearMeMap)}
                  >
                    {showNearMeMap ? <List className="h-3 w-3" /> : <MapIcon className="h-3 w-3" />}
                    {showNearMeMap ? 'List' : 'Map'}
                  </Button>
                )}
              </div>
              {nearbyLoading || isDetecting ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-18 rounded-xl" />
                  ))}
                </div>
              ) : showNearMeMap && nearbyPlaces.some((p: any) => p.lat && p.lng) ? (
                <div className="h-[40vh] rounded-2xl overflow-hidden border">
                    <ResultsMapView
                      items={nearbyPlaces
                        .filter((p: any) => p.lat && p.lng)
                        .map((p: any) => ({
                          id: p.id,
                          lat: p.lat,
                          lng: p.lng,
                          title: p.name,
                          subtitle: p.type,
                          price: p.price,
                          rating: p.rating,
                        }))}
                      onItemClick={(id) => navigate(`/venues/${id}`)}
                      markerType="property"
                      className="h-full w-full"
                    />
                  </div>
              ) : nearbyPlaces.length > 0 ? (
                <div className="space-y-2">
                  {nearbyPlaces.map((place: any, idx: number) => (
                    <motion.div
                      key={place.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <Link
                        to={place.path}
                        className="group flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 hover:border-primary/30 transition-all active:scale-[0.98]"
                      >
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{place.name}</p>
                            <div className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-500">
                              <Star className="h-3 w-3 fill-current" />
                              <span>{place.rating}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{place.type}</p>
                          {place.price && <span className="text-xs font-bold text-primary">{place.price}</span>}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-xl">
                  {deviceLocation ? "No nearby places found" : "Enable location to see places near you"}
                </div>
              )}
            </section>
          )}

          {/* Rewards Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground"
          >
            <div className="relative z-10">
              <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">New</span>
              <h3 className="text-lg font-bold mt-2.5">Earn Rewards</h3>
              <p className="text-sm opacity-80 mt-1 mb-3 leading-relaxed">
                Book more, earn points, get discounts on your next trip
              </p>
              <Link
                to="/rewards"
                className="inline-flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-full text-xs font-bold shadow-sm"
              >
                Learn More
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full" />
            <div className="absolute -right-2 -top-2 w-20 h-20 bg-white/5 rounded-full" />
          </motion.div>
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default Explore;
