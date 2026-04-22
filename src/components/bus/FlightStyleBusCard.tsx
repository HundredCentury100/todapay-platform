import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bus as BusType, BusClassTier } from "@/types/booking";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/dateFormatters";
import {
  Bus, Star, Clock, Briefcase, Shield, ChevronRight,
  Wifi, Wind, Zap, Coffee, TrendingUp, Users, Armchair, Crown
} from "lucide-react";
import { motion } from "framer-motion";

interface FlightStyleBusCardProps {
  bus: BusType;
  index: number;
  badges: ('best-value' | 'fastest' | 'cheapest')[];
  selectedClass: BusClassTier;
  onClick: () => void;
}

const amenityIcons: Record<string, any> = {
  WiFi: Wifi, "Air Conditioning": Wind, AC: Wind,
  "Power Outlets": Zap, USB: Zap, "USB Charging": Zap,
  Refreshments: Coffee,
};

const badgeConfig = {
  'best-value': { label: "Best Value", className: "bg-primary/10 text-primary border-primary/20" },
  'fastest': { label: "Fastest", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  'cheapest': { label: "Cheapest", className: "bg-green-500/10 text-green-600 border-green-500/20" },
};

const FlightStyleBusCard = ({ bus, index, badges, selectedClass, onClick }: FlightStyleBusCardProps) => {
  const { convertPrice } = useCurrency();

  const classData = bus.busClass?.find(c => c.tier === selectedClass) || bus.busClass?.[0];
  const displayPrice = classData?.price || bus.price;
  const baggage = classData?.baggage || bus.baggageAllowance;
  const stopsCount = bus.stops?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        className="overflow-hidden rounded-2xl border border-border/50 bg-card hover:shadow-lg transition-all cursor-pointer"
        onClick={onClick}
      >
        <div className="p-4 space-y-3">
          {/* Row 1: Operator + Badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bus className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm">{bus.operator}</h3>
                  {bus.onTimePercentage && bus.onTimePercentage >= 90 && (
                    <Shield className="h-3.5 w-3.5 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{bus.rating || "4.5"}</span>
                  <span className="mx-0.5">·</span>
                  <span>{bus.reviewCount || 0} reviews</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              {badges.map(b => (
                <Badge key={b} variant="outline" className={cn("text-[10px] px-1.5 py-0", badgeConfig[b].className)}>
                  {badgeConfig[b].label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Row 2: Flight-style time/route */}
          <div className="flex items-center gap-3 py-1">
            <div className="text-left">
              <p className="text-xl font-bold leading-tight">{formatTime(bus.departureTime)}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[80px]">{bus.from}</p>
            </div>

            <div className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-muted-foreground">{bus.duration}</span>
              <div className="flex items-center w-full">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <div className="flex-1 h-[1px] bg-border relative mx-1">
                  {stopsCount > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {Array.from({ length: Math.min(stopsCount, 3) }).map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-muted-foreground mx-1" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-1.5 h-1.5 rounded-full border border-primary bg-background" />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {stopsCount === 0 ? "Direct" : `${stopsCount} stop${stopsCount > 1 ? "s" : ""}`}
              </span>
            </div>

            <div className="text-right">
              <p className="text-xl font-bold leading-tight">{formatTime(bus.arrivalTime)}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[80px]">{bus.to}</p>
            </div>
          </div>

          {/* Row 3: Baggage + Amenities + Seats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
            <div className="flex items-center gap-3">
              {baggage && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {baggage.bags} bag × {baggage.weightPerBag}kg
                </span>
              )}
              <div className="flex items-center gap-1.5">
                {(classData?.amenities || bus.amenities).slice(0, 3).map((a) => {
                  const Icon = amenityIcons[a] || Zap;
                  return <Icon key={a} className="h-3 w-3" title={a} />;
                })}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {bus.weeklyBookings && bus.weeklyBookings > 100 && (
                <span className="flex items-center gap-0.5 text-[10px] text-primary">
                  <TrendingUp className="h-3 w-3" />
                  {bus.weeklyBookings}/wk
                </span>
              )}
              <Badge variant={bus.availableSeats < 10 ? "destructive" : "secondary"} className="text-[10px] px-1.5">
                {bus.availableSeats} left
              </Badge>
            </div>
          </div>

          {/* Row 4: Fare tiers */}
          {bus.busClass && bus.busClass.length > 0 && (
            <div className="flex gap-1.5 border-t pt-2">
              {bus.busClass.map((cls) => (
                <div
                  key={cls.tier}
                  className={cn(
                    "flex-1 text-center py-1.5 px-2 rounded-lg border text-xs transition-all",
                    selectedClass === cls.tier
                      ? "border-primary bg-primary/5 font-semibold"
                      : "border-border"
                  )}
                >
                  <span className="capitalize text-[10px] text-muted-foreground block">{cls.tier}</span>
                  <span className="font-bold text-sm">{convertPrice(cls.price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default FlightStyleBusCard;
