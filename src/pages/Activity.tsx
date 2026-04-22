import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Ticket, Clock, CheckCircle2, XCircle, 
  ChevronRight, Calendar, MapPin, Car, Bus, Building2, Briefcase, Home as HomeIcon, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import MobileAppLayout from "@/components/MobileAppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumPageHeader } from "@/components/premium/PremiumPageHeader";
import BackButton from "@/components/BackButton";
import { PremiumTabs, PremiumTabContent } from "@/components/premium/PremiumTabs";
import { PremiumEmptyState } from "@/components/premium/PremiumEmptyState";
import { PremiumCard } from "@/components/premium/PremiumCard";
import { useCurrency } from "@/contexts/CurrencyContext";

interface UnifiedBooking {
  id: string;
  reference: string;
  title: string;
  type: 'bus' | 'event' | 'ride' | 'stay' | 'workspace' | 'venue' | 'experience';
  status: string;
  date?: string;
  fromLocation?: string;
  toLocation?: string;
  price: number;
  createdAt: string;
}

const Activity = () => {
  const { user } = useAuth();
  const { convertPrice } = useCurrency();
  const [bookings, setBookings] = useState<UnifiedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  const mapRideStatus = (status: string): string => {
    switch (status) {
      case 'driver_assigned':
      case 'driver_arriving':
      case 'arrived_at_pickup':
      case 'in_progress':
        return 'confirmed';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  const fetchAllBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    const unifiedBookings: UnifiedBooking[] = [];

    // Fetch traditional bookings (bus, event, stay, workspace, venue, experience, etc.)
    const { data: regularBookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (regularBookings) {
      regularBookings.forEach(b => {
        // Map booking_type to our unified type
        let bookingType: UnifiedBooking['type'] = 'bus';
        const rawType = (b.booking_type || b.vertical || '').toLowerCase();
        
        if (rawType.includes('event')) bookingType = 'event';
        else if (rawType.includes('stay') || rawType.includes('property') || rawType.includes('hotel')) bookingType = 'stay';
        else if (rawType.includes('workspace') || rawType.includes('cowork')) bookingType = 'workspace';
        else if (rawType.includes('venue')) bookingType = 'venue';
        else if (rawType.includes('experience') || rawType.includes('tour')) bookingType = 'experience';
        else if (rawType.includes('bus') || rawType.includes('travel')) bookingType = 'bus';

        unifiedBookings.push({
          id: b.id,
          reference: b.booking_reference,
          title: b.item_name,
          type: bookingType,
          status: b.status,
          date: b.travel_date || b.event_date,
          fromLocation: b.from_location || undefined,
          toLocation: b.to_location || undefined,
          price: b.total_price,
          createdAt: b.created_at || '',
        });
      });
    }

    // Fetch rides from active_rides
    const { data: rides } = await supabase
      .from("active_rides")
      .select(`
        *,
        ride_request:ride_requests(
          pickup_address,
          dropoff_address,
          system_estimated_price,
          created_at
        )
      `)
      .eq("passenger_id", user.id)
      .order("created_at", { ascending: false });

    if (rides) {
      rides.forEach(r => {
        const rideRequest = r.ride_request;
        unifiedBookings.push({
          id: r.id,
          reference: r.share_code || r.id.slice(0, 8).toUpperCase(),
          title: 'Ride',
          type: 'ride',
          status: mapRideStatus(r.status),
          date: r.pickup_time || r.driver_assigned_at,
          fromLocation: rideRequest?.pickup_address,
          toLocation: rideRequest?.dropoff_address,
          price: r.final_price || rideRequest?.system_estimated_price || 0,
          createdAt: r.created_at,
        });
      });
    }

    // Sort by created date
    unifiedBookings.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setBookings(unifiedBookings);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchAllBookings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleRefresh = async () => {
    await fetchAllBookings();
  };

  const activeBookings = bookings.filter(b => 
    ["confirmed", "pending"].includes(b.status)
  );
  
  const pastBookings = bookings.filter(b => 
    ["completed", "cancelled", "expired"].includes(b.status)
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed": 
        return { 
          icon: CheckCircle2, 
          color: "text-emerald-500", 
          bg: "bg-emerald-500/10",
          gradient: "from-emerald-500 to-green-600",
          label: "Confirmed"
        };
      case "pending": 
        return { 
          icon: Clock, 
          color: "text-amber-500", 
          bg: "bg-amber-500/10",
          gradient: "from-amber-500 to-orange-600",
          label: "Pending"
        };
      case "cancelled": 
        return { 
          icon: XCircle, 
          color: "text-destructive", 
          bg: "bg-destructive/10",
          gradient: "from-destructive to-rose-600",
          label: "Cancelled"
        };
      case "completed":
        return {
          icon: CheckCircle2,
          color: "text-muted-foreground",
          bg: "bg-muted",
          gradient: "from-slate-500 to-gray-600",
          label: "Completed"
        };
      default: 
        return { 
          icon: Ticket, 
          color: "text-muted-foreground", 
          bg: "bg-muted",
          gradient: "from-slate-500 to-gray-600",
          label: status
        };
    }
  };

  const getBookingConfig = (type: UnifiedBooking['type']) => {
    switch (type) {
      case "bus": 
        return { 
          icon: Bus, 
          gradient: "from-teal-500 to-emerald-600",
          link: (ref: string) => `/orders?ref=${ref}`
        };
      case "event": 
        return { 
          icon: Calendar, 
          gradient: "from-pink-500 to-rose-600",
          link: (ref: string) => `/orders?ref=${ref}`
        };
      case "ride": 
        return { 
          icon: Car, 
          gradient: "from-sky-500 to-blue-600",
          link: (ref: string, id: string) => `/ride-tracking/${id}`
        };
      case "stay":
        return {
          icon: HomeIcon,
          gradient: "from-orange-500 to-amber-600",
          link: (ref: string) => `/orders?ref=${ref}`
        };
      case "workspace":
        return {
          icon: Briefcase,
          gradient: "from-violet-500 to-purple-600",
          link: (ref: string) => `/orders?ref=${ref}`
        };
      case "venue":
        return {
          icon: Building2,
          gradient: "from-emerald-500 to-green-600",
          link: (ref: string) => `/orders?ref=${ref}`
        };
      case "experience":
        return {
          icon: Compass,
          gradient: "from-amber-500 to-yellow-600",
          link: (ref: string) => `/orders?ref=${ref}`
        };
      default: 
        return { 
          icon: Ticket, 
          gradient: "from-primary to-primary/80",
          link: (ref: string) => `/orders?ref=${ref}`
        };
    }
  };

  const BookingCard = ({ booking, index }: { booking: UnifiedBooking; index: number }) => {
    const statusConfig = getStatusConfig(booking.status);
    const bookingConfig = getBookingConfig(booking.type);
    const StatusIcon = statusConfig.icon;
    const BookingIcon = bookingConfig.icon;
    const linkUrl = bookingConfig.link(booking.reference, booking.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
      >
        <Link to={linkUrl}>
          <PremiumCard interactive className="p-4">
            <div className="flex items-start gap-4">
              {/* Service Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bookingConfig.gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                <BookingIcon className="h-6 w-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Status Pill */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bg} mb-2`}>
                  <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                  <span className={`text-xs font-semibold ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
                
                <h3 className="font-semibold text-foreground truncate">
                  {booking.type === 'ride' ? `${booking.fromLocation?.split(',')[0] || 'Pickup'} → ${booking.toLocation?.split(',')[0] || 'Dropoff'}` : booking.title}
                </h3>
                
                {booking.fromLocation && booking.toLocation && booking.type !== 'ride' && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">{booking.fromLocation}</span>
                    <span>→</span>
                    <span className="truncate">{booking.toLocation}</span>
                  </div>
                )}

                {booking.type === 'ride' && (
                  <div className="text-sm text-muted-foreground mt-1.5 truncate">
                    {booking.fromLocation}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {booking.date
                        ? format(new Date(booking.date), "EEE, MMM d")
                        : format(new Date(booking.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <span className="text-base font-bold text-primary">
                    {convertPrice(booking.price)}
                  </span>
                </div>
              </div>
              
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-center" />
            </div>
          </PremiumCard>
        </Link>
      </motion.div>
    );
  };

  if (!user) {
    return (
      <MobileAppLayout onRefresh={handleRefresh}>
        <PremiumEmptyState
          icon={Ticket}
          title="Track Your Orders"
          description="Sign in to view your bookings and manage your trips"
          iconGradient="from-primary/20 to-primary/5"
          action={
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/auth" state={{ returnTo: "/orders" }}>Sign In</Link>
            </Button>
          }
        />
      </MobileAppLayout>
    );
  }

  const tabs = [
    { value: "active", label: "Active", count: activeBookings.length },
    { value: "past", label: "History", count: pastBookings.length },
  ];

  return (
    <MobileAppLayout onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background pb-24">
        {/* Premium Header */}
        <div className="px-5 pt-4 safe-area-pt">
          <BackButton fallbackPath="/" />
        </div>
        <PremiumPageHeader
          title="Orders"
          subtitle={`${activeBookings.length} active • ${pastBookings.length} past`}
          gradient="from-primary/10 via-primary/5 to-transparent"
        />

        <div className="px-5 py-4">
          {/* Premium Tabs */}
          <PremiumTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="mb-6"
          />

          {/* Tab Content */}
          <PremiumTabContent value="active" activeValue={activeTab}>
            <div className="space-y-3">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-36 rounded-2xl" />
                ))
              ) : activeBookings.length > 0 ? (
                activeBookings.map((booking, index) => (
                  <BookingCard key={booking.id} booking={booking} index={index} />
                ))
              ) : (
                <PremiumEmptyState
                  icon={Ticket}
                  title="No active orders"
                  description="You don't have any upcoming trips or events"
                  action={
                    <Button asChild className="rounded-full px-6">
                      <Link to="/">Explore Services</Link>
                    </Button>
                  }
                />
              )}
            </div>
          </PremiumTabContent>

          <PremiumTabContent value="past" activeValue={activeTab}>
            <div className="space-y-3">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-36 rounded-2xl" />
                ))
              ) : pastBookings.length > 0 ? (
                pastBookings.map((booking, index) => (
                  <BookingCard key={booking.id} booking={booking} index={index} />
                ))
              ) : (
                <PremiumEmptyState
                  icon={Ticket}
                  title="No order history"
                  description="Your completed orders will appear here"
                />
              )}
            </div>
          </PremiumTabContent>
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default Activity;
