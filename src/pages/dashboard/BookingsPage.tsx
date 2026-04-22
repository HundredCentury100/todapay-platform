import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bus, Calendar, Building2, Briefcase, Search, 
  ArrowRight, Clock, MapPin, Ticket, Plane, 
  Train, Car, Tent, Music, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PremiumTabs } from "@/components/premium";
import { PremiumEmptyState } from "@/components/premium";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const BookingsPage = () => {
  const { user } = useAuth();
  const { convertPrice } = useCurrency();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (user) loadBookings();
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .or(`user_id.eq.${user.id},guest_email.eq.${user.email}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        booking.item_name?.toLowerCase().includes(q) ||
        booking.booking_reference?.toLowerCase().includes(q) ||
        booking.from_location?.toLowerCase().includes(q) ||
        booking.to_location?.toLowerCase().includes(q);

      if (activeTab === "all") return matchesSearch;
      if (activeTab === "upcoming") {
        const d = booking.travel_date || booking.event_date;
        return matchesSearch && d && new Date(d) > new Date() && booking.status !== "cancelled";
      }
      if (activeTab === "completed") {
        const d = booking.travel_date || booking.event_date;
        return matchesSearch && d && new Date(d) <= new Date();
      }
      if (activeTab === "cancelled") {
        return matchesSearch && booking.status === "cancelled";
      }
      return matchesSearch;
    });
  }, [bookings, searchQuery, activeTab]);

  const counts = useMemo(() => {
    const now = new Date();
    return {
      all: bookings.length,
      upcoming: bookings.filter(b => {
        const d = b.travel_date || b.event_date;
        return d && new Date(d) > now && b.status !== "cancelled";
      }).length,
      completed: bookings.filter(b => {
        const d = b.travel_date || b.event_date;
        return d && new Date(d) <= now;
      }).length,
      cancelled: bookings.filter(b => b.status === "cancelled").length,
    };
  }, [bookings]);

  const getBookingIcon = (type: string) => {
    switch (type) {
      case "bus": return Bus;
      case "stay": return Building2;
      case "workspace": return Briefcase;
      case "flight": return Plane;
      case "rail": return Train;
      case "car_rental": return Car;
      case "experience": return Tent;
      case "event": return Music;
      default: return Ticket;
    }
  };

  const getBookingColor = (type: string) => {
    switch (type) {
      case "bus": return "bg-blue-500/15 text-blue-500";
      case "stay": return "bg-violet-500/15 text-violet-500";
      case "workspace": return "bg-amber-500/15 text-amber-500";
      case "flight": return "bg-sky-500/15 text-sky-500";
      case "rail": return "bg-emerald-500/15 text-emerald-500";
      case "car_rental": return "bg-orange-500/15 text-orange-500";
      case "experience": return "bg-rose-500/15 text-rose-500";
      case "event": return "bg-fuchsia-500/15 text-fuchsia-500";
      default: return "bg-primary/15 text-primary";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "pending": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      case "completed": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const tabs = [
    { value: "all", label: "All", count: counts.all },
    { value: "upcoming", label: "Upcoming", count: counts.upcoming },
    { value: "completed", label: "Past", count: counts.completed },
    { value: "cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Booking History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {bookings.length} total booking{bookings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="sm" className="rounded-xl gap-1.5">
          <Link to="/">
            New Booking
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, reference, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 rounded-xl bg-secondary/50 border-0 text-[16px] focus-visible:ring-1 focus-visible:ring-primary/30"
        />
      </div>

      {/* Tabs */}
      <PremiumTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border">
              <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <PremiumEmptyState
          icon={Calendar}
          title={searchQuery ? "No results found" : "No bookings yet"}
          description={searchQuery ? "Try a different search term" : "Start exploring and book your next trip across Zimbabwe"}
          action={
            <Button asChild className="rounded-xl">
              <Link to="/">Browse Services</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filteredBookings.map((booking, index) => {
            const Icon = getBookingIcon(booking.booking_type);
            const colorClass = getBookingColor(booking.booking_type);
            const [iconBg, iconText] = colorClass.split(" ");
            const travelDate = booking.travel_date || booking.event_date;

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
              >
                <Link
                  to={`/orders`}
                  className="group flex items-center gap-3.5 p-3.5 md:p-4 rounded-2xl bg-card border border-border hover:border-primary/20 hover:shadow-sm transition-all duration-200 active:scale-[0.98]"
                >
                  {/* Icon */}
                  <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shrink-0", iconBg)}>
                    <Icon className={cn("h-5 w-5", iconText)} strokeWidth={2.2} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {booking.item_name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-5 rounded-full font-medium capitalize shrink-0",
                          getStatusStyle(booking.status)
                        )}
                      >
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {booking.from_location && booking.to_location ? (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{booking.from_location} → {booking.to_location}</span>
                        </span>
                      ) : null}
                      {travelDate && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {format(new Date(travelDate), "d MMM yyyy")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-foreground">
                      {convertPrice(booking.total_price)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
