import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, Bus, Calendar, Building2, Briefcase, Car, Plane, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumBookingCardProps {
  booking: {
    id: string;
    item_name: string;
    booking_type: string;
    from_location?: string;
    to_location?: string;
    event_venue?: string;
    travel_date?: string;
    event_date?: string;
    status: string;
    total_price?: number;
    booking_reference?: string;
  };
  formatPrice?: (price: number) => string;
  delay?: number;
  className?: string;
}

const bookingTypeIcons: Record<string, LucideIcon> = {
  bus: Bus,
  event: Calendar,
  stay: Building2,
  workspace: Briefcase,
  car_rental: Car,
  flight: Plane,
  experience: MapPin,
};

const bookingTypeColors: Record<string, string> = {
  bus: "bg-blue-500/10 text-blue-600",
  event: "bg-purple-500/10 text-purple-600",
  stay: "bg-amber-500/10 text-amber-600",
  workspace: "bg-green-500/10 text-green-600",
  car_rental: "bg-cyan-500/10 text-cyan-600",
  flight: "bg-sky-500/10 text-sky-600",
  experience: "bg-pink-500/10 text-pink-600",
};

const statusColors: Record<string, string> = {
  confirmed: "bg-green-500/10 text-green-600 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  completed: "bg-muted text-muted-foreground",
};

export const PremiumBookingCard = ({
  booking,
  formatPrice,
  delay = 0,
  className,
}: PremiumBookingCardProps) => {
  const Icon = bookingTypeIcons[booking.booking_type] || Calendar;
  const iconColor = bookingTypeColors[booking.booking_type] || "bg-primary/10 text-primary";
  const travelDate = booking.travel_date || booking.event_date;

  const getLocationText = () => {
    if (booking.from_location && booking.to_location) {
      return `${booking.from_location} → ${booking.to_location}`;
    }
    return booking.event_venue || booking.booking_type;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Link to={`/orders?ref=${booking.booking_reference}`}>
        <Card className={cn(
          "p-4 hover:bg-muted/50 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group",
          className
        )}>
          <div className="flex items-center gap-4">
            {/* Icon */}
            <motion.div 
              className={cn("p-3 rounded-xl shrink-0", iconColor)}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {booking.item_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {getLocationText()}
              </p>
            </div>

            {/* Right side */}
            <div className="text-right shrink-0">
              <p className="text-xs font-medium mb-1">
                {travelDate ? new Date(travelDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }) : "-"}
              </p>
              <Badge 
                variant="outline" 
                className={cn("text-[10px] capitalize", statusColors[booking.status])}
              >
                {booking.status}
              </Badge>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

interface PremiumBookingListProps {
  bookings: Array<PremiumBookingCardProps["booking"]>;
  formatPrice?: (price: number) => string;
  emptyState?: React.ReactNode;
  className?: string;
}

export const PremiumBookingList = ({
  bookings,
  formatPrice,
  emptyState,
  className,
}: PremiumBookingListProps) => {
  if (bookings.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {bookings.map((booking, idx) => (
        <PremiumBookingCard
          key={booking.id}
          booking={booking}
          formatPrice={formatPrice}
          delay={idx * 0.05}
        />
      ))}
    </div>
  );
};
