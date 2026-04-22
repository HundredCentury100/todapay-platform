import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

interface Tier {
  id: string;
  name: string;
  price: number;
  features?: string[];
  available_tickets: number;
  total_tickets: number;
}

interface EventPriceComparisonProps {
  tiers: Tier[];
  selectedTierId?: string;
  onSelectTier?: (tier: Tier) => void;
}

export const EventPriceComparison = ({ tiers, selectedTierId, onSelectTier }: EventPriceComparisonProps) => {
  const { convertPrice } = useCurrency();

  if (!tiers || tiers.length < 2) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Compare Ticket Tiers</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tiers.map((tier) => {
          const isSelected = tier.id === selectedTierId;
          const isSoldOut = tier.available_tickets === 0;
          const percentSold = Math.round(((tier.total_tickets - tier.available_tickets) / tier.total_tickets) * 100);

          return (
            <Card
              key={tier.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:shadow-md relative overflow-hidden",
                isSelected && "ring-2 ring-primary bg-primary/5",
                isSoldOut && "opacity-60 cursor-not-allowed"
              )}
              onClick={() => !isSoldOut && onSelectTier?.(tier)}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-0.5 text-xs rounded-bl-lg font-medium">
                  Selected
                </div>
              )}
              <h4 className="font-bold text-base mb-1">{tier.name}</h4>
              <p className="text-2xl font-bold text-primary mb-3">{convertPrice(tier.price)}</p>

              {isSoldOut ? (
                <Badge variant="destructive" className="mb-3">Sold Out</Badge>
              ) : percentSold >= 80 ? (
                <Badge className="bg-orange-500 text-white mb-3">Few Left</Badge>
              ) : null}

              {tier.features && tier.features.length > 0 && (
                <ul className="space-y-1.5">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
