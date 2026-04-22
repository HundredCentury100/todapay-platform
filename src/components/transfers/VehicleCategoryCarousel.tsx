import { motion, AnimatePresence } from "framer-motion";
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

interface VehicleCategoryCarouselProps {
  selectedCategory: VehicleCategory;
  onSelectCategory: (category: VehicleCategory) => void;
  basePrice?: number;
  passengers: number;
  luggage: number;
  serviceType?: TransferServiceType;
}

export const VehicleCategoryCarousel = ({
  selectedCategory,
  onSelectCategory,
  basePrice = 25,
  passengers,
  luggage,
  serviceType = 'point_to_point',
}: VehicleCategoryCarouselProps) => {
  const { convertPrice } = useCurrency();
  // Filter categories based on passenger/luggage requirements
  const availableCategories = VEHICLE_CATEGORIES.filter(
    (cat) => cat.passengers >= passengers && cat.luggage >= luggage
  );

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium px-1">Select Vehicle</p>

      <div className="relative">
        {/* Fade edges for scroll indication */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-4 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-4 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide smooth-scroll">
          {availableCategories.map((category, index) => {
            const isSelected = selectedCategory === category.id;
            const serviceMultiplier = SERVICE_TYPE_MULTIPLIERS[serviceType]?.multiplier || 1;
            const price = Math.round(basePrice * category.multiplier * serviceMultiplier);
            const eta = Math.floor(Math.random() * 4) + 2;

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onSelectCategory(category.id)}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "relative flex flex-col min-w-[110px] min-h-[130px] p-3 rounded-xl border-2 transition-all duration-150 snap-start touch-target",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "bg-card border-border/50 hover:border-primary/40 hover:bg-accent/30"
                )}
              >
                {/* Selection Check */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Popular badge for first item */}
                {index === 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1.5 left-2 text-[9px] px-1.5 py-0 h-4"
                  >
                    Popular
                  </Badge>
                )}

                {/* Icon */}
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center mb-2 mx-auto text-xl",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {category.icon}
                </div>

                {/* Name */}
                <p className={cn(
                  "font-medium text-xs text-center",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {category.name}
                </p>

                {/* Capacity */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5">
                    <Users className="h-2.5 w-2.5" />
                    {category.passengers}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Briefcase className="h-2.5 w-2.5" />
                    {category.luggage}
                  </span>
                </div>

                {/* Price */}
                <p className={cn(
                  "font-bold text-sm text-center mt-1",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {convertPrice(price)}
                </p>

                {/* ETA */}
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mt-1">
                  <Zap className="h-2.5 w-2.5 text-amber-500" />
                  <span>{eta}m</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected vehicle description */}
      {selectedCategory && (
        <motion.p
          key={selectedCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground text-center"
        >
          {VEHICLE_CATEGORIES.find(c => c.id === selectedCategory)?.description}
        </motion.p>
      )}
    </div>
  );
};