import { motion } from "framer-motion";
import { Users, Briefcase, Check, Zap } from "lucide-react";
import { VEHICLE_CATEGORIES, VehicleCategory, TransferServiceType } from "@/types/transfer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";

// Service type price multipliers
export const SERVICE_TYPE_MULTIPLIERS: Record<TransferServiceType, { multiplier: number; label: string }> = {
  airport_pickup: { multiplier: 1.25, label: "Airport pickup" },
  airport_dropoff: { multiplier: 1.2, label: "Airport dropoff" },
  point_to_point: { multiplier: 1.0, label: "City transfer" },
  hourly_hire: { multiplier: 0.85, label: "Per hour" },
  shuttle: { multiplier: 0.65, label: "Shared" },
  tour_transfer: { multiplier: 1.4, label: "Full day tour" },
  on_demand_taxi: { multiplier: 1.15, label: "On-demand" },
};

interface VehicleCategoryListProps {
  selectedCategory: VehicleCategory;
  onSelectCategory: (category: VehicleCategory) => void;
  basePrice?: number;
  passengers: number;
  luggage: number;
  serviceType?: TransferServiceType;
}

export const VehicleCategoryList = ({
  selectedCategory,
  onSelectCategory,
  basePrice = 25,
  passengers,
  luggage,
  serviceType = 'point_to_point',
}: VehicleCategoryListProps) => {
  const { convertPrice } = useCurrency();
  
  const availableCategories = VEHICLE_CATEGORIES.filter(
    (cat) => cat.passengers >= passengers && cat.luggage >= luggage
  );

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium px-1">Select Vehicle</p>

      <div className="space-y-2">
        {availableCategories.map((category, index) => {
          const isSelected = selectedCategory === category.id;
          const serviceMultiplier = SERVICE_TYPE_MULTIPLIERS[serviceType]?.multiplier || 1;
          const price = Math.round(basePrice * category.multiplier * serviceMultiplier);
          const eta = Math.floor(Math.random() * 4) + 2;

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => onSelectCategory(category.id)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-150 touch-target",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "bg-card border-border/50 hover:border-primary/40 hover:bg-accent/30"
              )}
            >
              {/* Selection Check */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-3 w-3 text-primary-foreground" />
                </motion.div>
              )}

              {/* Icon */}
              <div className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {category.icon}
              </div>

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "font-semibold text-sm",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {category.name}
                  </p>
                  {index === 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                      Popular
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {category.description}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Users className="h-3 w-3" />
                    {category.passengers}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Briefcase className="h-3 w-3" />
                    {category.luggage}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Zap className="h-3 w-3 text-amber-500" />
                    {eta}m
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="text-right shrink-0 pr-1">
                <p className={cn(
                  "font-bold text-base",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {convertPrice(price)}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected vehicle description */}
      {selectedCategory && (
        <motion.p
          key={selectedCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground text-center pt-1"
        >
          {VEHICLE_CATEGORIES.find(c => c.id === selectedCategory)?.description}
        </motion.p>
      )}
    </div>
  );
};
