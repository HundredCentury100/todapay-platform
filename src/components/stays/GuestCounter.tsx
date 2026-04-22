import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface GuestCounterProps {
  adults: number;
  children: number;
  infants: number;
  onAdultsChange: (v: number) => void;
  onChildrenChange: (v: number) => void;
  onInfantsChange: (v: number) => void;
  maxGuests?: number;
}

const CounterRow = ({
  label,
  description,
  value,
  onChange,
  min = 0,
  max = 16,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) => (
  <div className="flex items-center justify-between py-4 border-b border-border/50 last:border-0">
    <div>
      <p className="font-medium text-sm">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-6 text-center font-medium text-sm">{value}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export const GuestCounter = ({
  adults,
  children,
  infants,
  onAdultsChange,
  onChildrenChange,
  onInfantsChange,
  maxGuests = 16,
}: GuestCounterProps) => {
  const totalGuests = adults + children;

  return (
    <div className="space-y-0">
      <CounterRow
        label="Adults"
        description="Ages 13 or above"
        value={adults}
        onChange={onAdultsChange}
        min={1}
        max={maxGuests - children}
      />
      <CounterRow
        label="Children"
        description="Ages 2–12"
        value={children}
        onChange={onChildrenChange}
        max={maxGuests - adults}
      />
      <CounterRow
        label="Infants"
        description="Under 2"
        value={infants}
        onChange={onInfantsChange}
        max={5}
      />
      <p className="text-xs text-muted-foreground pt-2">
        {totalGuests} guest{totalGuests !== 1 ? 's' : ''}{infants > 0 ? `, ${infants} infant${infants !== 1 ? 's' : ''}` : ''}
      </p>
    </div>
  );
};
