import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Check, Wifi, BatteryCharging, Baby } from "lucide-react";
import { VEHICLE_CATEGORIES, VehicleCategory, TransferServiceType } from "@/types/transfer";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

interface VehicleComparisonSliderProps {
  basePrice?: number;
  serviceType?: TransferServiceType;
  selectedCategory: VehicleCategory;
  onSelect: (category: VehicleCategory) => void;
  passengers: number;
  luggage: number;
}

const SERVICE_MULTIPLIERS: Record<string, number> = {
  airport_pickup: 1.25, airport_dropoff: 1.2, point_to_point: 1.0,
  hourly_hire: 0.85, shuttle: 0.65, tour_transfer: 1.4, on_demand_taxi: 1.15,
};

const VEHICLE_IMAGES: Record<string, string> = {
  economy_sedan: '🚗', sedan: '🚙', suv: '🚐', van: '🚐',
  minibus: '🚌', luxury_sedan: '🚘', luxury_suv: '🚙', limousine: '🚎', coach: '🚌',
};

const VEHICLE_FEATURES: Record<string, string[]> = {
  economy_sedan: ['AC', 'USB'],
  sedan: ['AC', 'USB', 'Bottled Water'],
  suv: ['AC', 'USB', 'Spacious', 'Bottled Water'],
  van: ['AC', 'USB', 'Group Friendly', 'Luggage Space'],
  minibus: ['AC', 'USB', 'PA System', 'Group Seating'],
  luxury_sedan: ['AC', 'WiFi', 'Leather', 'Refreshments', 'Charger'],
  luxury_suv: ['AC', 'WiFi', 'Premium Audio', 'Refreshments', 'Charger'],
  limousine: ['AC', 'WiFi', 'Mini Bar', 'Privacy Screen', 'Charger'],
  coach: ['AC', 'WiFi', 'Restroom', 'Reclining Seats'],
};

export const VehicleComparisonSlider = ({
  basePrice = 25,
  serviceType = 'point_to_point',
  selectedCategory,
  onSelect,
  passengers,
  luggage,
}: VehicleComparisonSliderProps) => {
  const { convertPrice } = useCurrency();
  const svcMult = SERVICE_MULTIPLIERS[serviceType] || 1;
  
  const available = VEHICLE_CATEGORIES.filter(
    c => c.passengers >= passengers && c.luggage >= luggage
  );

  // Find cheapest and most popular
  const sorted = [...available].sort((a, b) => a.multiplier - b.multiplier);
  const cheapestId = sorted[0]?.id;
  const mostPopularId = available.length >= 2 ? available[1]?.id : available[0]?.id;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Compare Vehicles</p>
        <Badge variant="secondary" className="text-[10px] rounded-full">{available.length} options</Badge>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x snap-mandatory">
        {available.map((cat, idx) => {
          const price = Math.round(basePrice * cat.multiplier * svcMult);
          const isSelected = selectedCategory === cat.id;
          const isCheapest = cat.id === cheapestId;
          const isPopular = cat.id === mostPopularId;
          const features = VEHICLE_FEATURES[cat.id] || [];

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="snap-start"
            >
              <Card
                className={cn(
                  "w-[200px] shrink-0 rounded-2xl border-2 transition-all cursor-pointer active:scale-[0.98]",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "border-border/50 hover:border-primary/30"
                )}
                onClick={() => onSelect(cat.id)}
              >
                <CardContent className="p-3 space-y-2.5">
                  {/* Badges */}
                  <div className="flex gap-1 min-h-[20px]">
                    {isCheapest && (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[9px] h-4 px-1.5">
                        Best Value
                      </Badge>
                    )}
                    {isPopular && !isCheapest && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] h-4 px-1.5">
                        Most Popular
                      </Badge>
                    )}
                    {isSelected && (
                      <div className="ml-auto h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Vehicle visual */}
                  <div className="text-center">
                    <span className="text-4xl">{VEHICLE_IMAGES[cat.id]}</span>
                    <p className="font-bold text-sm mt-1">{cat.name}</p>
                    <p className="text-[10px] text-muted-foreground">{cat.description}</p>
                  </div>

                  {/* Capacity */}
                  <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {cat.passengers}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {cat.luggage}
                    </span>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1 justify-center">
                    {features.slice(0, 3).map(f => (
                      <span key={f} className="text-[9px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
                        {f}
                      </span>
                    ))}
                    {features.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">+{features.length - 3}</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-center pt-1 border-t">
                    <p className="text-lg font-bold text-primary">{convertPrice(price)}</p>
                    <p className="text-[10px] text-muted-foreground">estimated fare</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
