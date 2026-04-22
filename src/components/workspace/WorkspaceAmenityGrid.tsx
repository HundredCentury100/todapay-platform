import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Wifi, Car, Monitor, Coffee, Headphones, Printer, Phone, Lock,
  Zap, ShowerHead, Bike, Shield, Sun, Volume2, Check, Mic
} from "lucide-react";

const WORKSPACE_ICON_MAP: Record<string, React.ComponentType<any>> = {
  wifi: Wifi, parking: Car, monitor: Monitor, coffee: Coffee, tea: Coffee,
  headphones: Headphones, printer: Printer, scanner: Printer,
  phone_booth: Phone, locker: Lock, power_outlets: Zap, shower: ShowerHead,
  bike_storage: Bike, security: Shield, natural_light: Sun,
  quiet_zone: Volume2, webcam: Monitor, video_conferencing: Monitor,
  standing_desk: Monitor, ergonomic_chair: Monitor, snacks: Coffee,
  kitchen: Coffee, whiteboard: Monitor, projector: Monitor,
  reception: Shield, mail_handling: Shield, "24_7_access": Lock,
  microphone: Mic,
};

const WORKSPACE_AMENITY_CATEGORIES: Record<string, string[]> = {
  "Connectivity": ["wifi", "power_outlets", "monitor", "webcam", "video_conferencing"],
  "Productivity": ["standing_desk", "ergonomic_chair", "whiteboard", "projector", "printer", "scanner"],
  "Comfort": ["coffee", "tea", "snacks", "kitchen", "phone_booth", "quiet_zone", "natural_light"],
  "Facilities": ["parking", "shower", "bike_storage", "locker", "reception", "mail_handling", "24_7_access", "security"],
};

interface WorkspaceAmenityGridProps {
  amenities: string[];
  maxVisible?: number;
}

export const WorkspaceAmenityGrid = ({ amenities, maxVisible = 10 }: WorkspaceAmenityGridProps) => {
  const [showAll, setShowAll] = useState(false);
  const visible = amenities.slice(0, maxVisible);

  const getIcon = (amenity: string) => WORKSPACE_ICON_MAP[amenity] || Check;

  const categorized = Object.entries(WORKSPACE_AMENITY_CATEGORIES)
    .map(([category, keys]) => ({
      category,
      items: keys.filter(k => amenities.includes(k)),
    }))
    .filter(c => c.items.length > 0);

  const categorizedKeys = Object.values(WORKSPACE_AMENITY_CATEGORIES).flat();
  const uncategorized = amenities.filter(a => !categorizedKeys.includes(a));
  if (uncategorized.length > 0) {
    categorized.push({ category: "Other", items: uncategorized });
  }

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">What this space offers</h3>
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
            <DialogTitle>What this space offers</DialogTitle>
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
