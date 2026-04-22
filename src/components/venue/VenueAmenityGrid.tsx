import { useState } from "react";
import { motion } from "framer-motion";
import { Wifi, Car, Snowflake, Theater, Music, Lightbulb, Mic, Monitor, ShieldCheck, Cigarette, Zap, Sun, Moon, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VenueAmenityGridProps {
  amenities: string[];
  maxVisible?: number;
}

const AMENITY_CATEGORIES: Record<string, { label: string; amenities: string[] }> = {
  tech: { label: "Technology", amenities: ["wifi", "projector", "screen", "sound_system", "microphone", "lighting"] },
  comfort: { label: "Comfort", amenities: ["air_conditioning", "heating", "natural_light", "blackout_capability"] },
  facilities: { label: "Facilities", amenities: ["parking", "valet_parking", "kitchen", "bar", "coat_check", "greenroom", "bridal_suite"] },
  entertainment: { label: "Entertainment", amenities: ["stage", "dance_floor", "podium", "outdoor_area"] },
  safety: { label: "Safety & Access", amenities: ["wheelchair_accessible", "security", "generator_backup", "smoking_area"] },
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />, parking: <Car className="h-4 w-4" />, valet_parking: <Car className="h-4 w-4" />,
  air_conditioning: <Snowflake className="h-4 w-4" />, heating: <Sun className="h-4 w-4" />,
  stage: <Theater className="h-4 w-4" />, dance_floor: <Music className="h-4 w-4" />,
  sound_system: <Music className="h-4 w-4" />, lighting: <Lightbulb className="h-4 w-4" />,
  projector: <Monitor className="h-4 w-4" />, screen: <Monitor className="h-4 w-4" />,
  microphone: <Mic className="h-4 w-4" />, security: <ShieldCheck className="h-4 w-4" />,
  smoking_area: <Cigarette className="h-4 w-4" />, generator_backup: <Zap className="h-4 w-4" />,
  natural_light: <Sun className="h-4 w-4" />, blackout_capability: <Moon className="h-4 w-4" />,
  wheelchair_accessible: <ShieldCheck className="h-4 w-4" />,
};

const VenueAmenityGrid = ({ amenities, maxVisible = 8 }: VenueAmenityGridProps) => {
  const [showAll, setShowAll] = useState(false);
  const visibleAmenities = amenities.slice(0, maxVisible);
  const remaining = amenities.length - maxVisible;

  const categorizedAmenities = Object.entries(AMENITY_CATEGORIES)
    .map(([key, cat]) => ({
      key,
      label: cat.label,
      items: cat.amenities.filter(a => amenities.includes(a)),
    }))
    .filter(c => c.items.length > 0);

  const formatName = (a: string) => a.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {visibleAmenities.map((amenity, idx) => (
          <motion.div
            key={amenity}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl"
          >
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              {AMENITY_ICONS[amenity] || <Check className="h-4 w-4" />}
            </div>
            <span className="text-sm">{formatName(amenity)}</span>
          </motion.div>
        ))}
      </div>
      {remaining > 0 && (
        <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => setShowAll(true)}>
          Show all {amenities.length} amenities <ChevronRight className="h-4 w-4" />
        </Button>
      )}
      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>All Amenities</DialogTitle></DialogHeader>
          <div className="space-y-6">
            {categorizedAmenities.map(cat => (
              <div key={cat.key}>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">{cat.label}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {cat.items.map(a => (
                    <div key={a} className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
                      <div className="p-1 rounded bg-primary/10 text-primary">{AMENITY_ICONS[a] || <Check className="h-4 w-4" />}</div>
                      <span className="text-sm">{formatName(a)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VenueAmenityGrid;
