import { Badge } from "@/components/ui/badge";
import { BusClassTier } from "@/types/booking";
import { cn } from "@/lib/utils";
import { Crown, Star, Armchair } from "lucide-react";

interface BusClassSelectorProps {
  selected: BusClassTier;
  onChange: (tier: BusClassTier) => void;
  compact?: boolean;
}

const tiers: { value: BusClassTier; label: string; icon: typeof Crown; description: string }[] = [
  { value: "standard", label: "Standard", icon: Armchair, description: "Basic comfort" },
  { value: "premium", label: "Premium", icon: Star, description: "Extra legroom" },
  { value: "vip", label: "VIP", icon: Crown, description: "Luxury travel" },
];

const BusClassSelector = ({ selected, onChange, compact }: BusClassSelectorProps) => {
  if (compact) {
    return (
      <div className="flex gap-2">
        {tiers.map((tier) => (
          <button
            key={tier.value}
            onClick={() => onChange(tier.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
              selected === tier.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            <tier.icon className="h-3 w-3" />
            {tier.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {tiers.map((tier) => (
        <button
          key={tier.value}
          onClick={() => onChange(tier.value)}
          className={cn(
            "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
            selected === tier.value
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/30"
          )}
        >
          <tier.icon className={cn("h-5 w-5", selected === tier.value ? "text-primary" : "text-muted-foreground")} />
          <span className="text-sm font-semibold">{tier.label}</span>
          <span className="text-[10px] text-muted-foreground">{tier.description}</span>
        </button>
      ))}
    </div>
  );
};

export default BusClassSelector;
