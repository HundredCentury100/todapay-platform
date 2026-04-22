import { Button } from "@/components/ui/button";
import { Minus, Plus, Users } from "lucide-react";

interface VenueGuestCounterProps {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  min?: number;
}

const VenueGuestCounter = ({ value, onChange, max = 1000, min = 1 }: VenueGuestCounterProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-1.5">
        <Users className="h-4 w-4 text-muted-foreground" /> Expected Guests
      </label>
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card">
        <Button
          variant="outline"
          size="icon"
          type="button"
          className="h-9 w-9 rounded-full shrink-0 press-effect"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 10))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <span className="text-2xl font-bold">{value}</span>
          <p className="text-xs text-muted-foreground">guests</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          type="button"
          className="h-9 w-9 rounded-full shrink-0 press-effect"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 10))}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Tap to adjust by 10. Max: {max}</p>
    </div>
  );
};

export default VenueGuestCounter;
