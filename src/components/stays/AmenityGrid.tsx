import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Wifi, Car, Dumbbell, UtensilsCrossed, Waves, Flame, Wind,
  Thermometer, Shirt, PlaneTakeoff, Briefcase, Dog, Snowflake,
  CookingPot, TreePine, Umbrella, Mountain, Zap, Check, Tv,
  Coffee, Bath, Lock, Laptop, Eye, Accessibility, DoorOpen
} from "lucide-react";

const AMENITY_ICON_MAP: Record<string, React.ComponentType<any>> = {
  wifi: Wifi, parking: Car, pool: Waves, gym: Dumbbell, spa: Flame,
  restaurant: UtensilsCrossed, bar: UtensilsCrossed, room_service: UtensilsCrossed,
  laundry: Shirt, airport_shuttle: PlaneTakeoff, business_center: Briefcase,
  pet_friendly: Dog, air_conditioning: Snowflake, heating: Thermometer,
  kitchen: CookingPot, balcony: TreePine, garden: TreePine,
  beach_access: Umbrella, ski_access: Mountain, ev_charging: Zap,
  tv: Tv, minibar: Coffee, safe: Lock, desk: Laptop, iron: Shirt,
  hairdryer: Wind, tea_coffee: Coffee, bathtub: Bath, shower: Bath,
  sea_view: Eye, city_view: Eye, garden_view: Eye, pool_view: Eye,
  wheelchair_accessible: Accessibility, connecting_rooms: DoorOpen,
  kitchenette: CookingPot,
};

const AMENITY_CATEGORIES: Record<string, string[]> = {
  "Essentials": ["wifi", "air_conditioning", "heating", "tv", "kitchen", "kitchenette"],
  "Features": ["pool", "gym", "spa", "restaurant", "bar", "garden", "balcony"],
  "Bathroom": ["bathtub", "shower", "hairdryer"],
  "Services": ["room_service", "laundry", "airport_shuttle", "business_center", "ev_charging"],
  "Views": ["sea_view", "city_view", "garden_view", "pool_view"],
  "Safety & Access": ["safe", "wheelchair_accessible", "connecting_rooms"],
  "Policies": ["pet_friendly"],
};

interface AmenityGridProps {
  amenities: string[];
  maxVisible?: number;
}

export const AmenityGrid = ({ amenities, maxVisible = 10 }: AmenityGridProps) => {
  const [showAll, setShowAll] = useState(false);
  const visible = amenities.slice(0, maxVisible);

  const getIcon = (amenity: string) => AMENITY_ICON_MAP[amenity] || Check;

  const categorized = Object.entries(AMENITY_CATEGORIES)
    .map(([category, keys]) => ({
      category,
      items: keys.filter(k => amenities.includes(k)),
    }))
    .filter(c => c.items.length > 0);

  // Uncategorized amenities
  const categorizedKeys = Object.values(AMENITY_CATEGORIES).flat();
  const uncategorized = amenities.filter(a => !categorizedKeys.includes(a));
  if (uncategorized.length > 0) {
    categorized.push({ category: "Other", items: uncategorized });
  }

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">What this place offers</h3>
        <div className="grid grid-cols-2 gap-3">
          {visible.map(amenity => {
            const Icon = getIcon(amenity);
            return (
              <div key={amenity} className="flex items-center gap-3 py-2">
                <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm capitalize">{amenity.replace(/_/g, ' ')}</span>
              </div>
            );
          })}
        </div>
        {amenities.length > maxVisible && (
          <Button variant="outline" className="rounded-xl" onClick={() => setShowAll(true)}>
            Show all {amenities.length} amenities
          </Button>
        )}
      </div>

      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>What this place offers</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {categorized.map(({ category, items }) => (
              <div key={category}>
                <h4 className="font-semibold text-base mb-3">{category}</h4>
                <div className="space-y-3">
                  {items.map(amenity => {
                    const Icon = getIcon(amenity);
                    return (
                      <div key={amenity} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="capitalize">{amenity.replace(/_/g, ' ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
