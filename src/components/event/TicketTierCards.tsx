import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Star, Flame } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import type { EventTicketTier } from "@/services/eventService";

interface TicketTierCardsProps {
  tiers: EventTicketTier[];
  selectedTier: EventTicketTier | null;
  onSelect: (tier: EventTicketTier) => void;
}

const tierFeatures: Record<string, string[]> = {
  "General Admission": ["Standing area access", "General facilities"],
  "VIP": ["Priority entry", "VIP lounge access", "Complimentary drink", "Premium viewing area"],
  "VVIP": ["Skip-the-line entry", "Private lounge", "Open bar", "Meet & Greet", "Front row access"],
  "Early Bird": ["Discounted rate", "Standard access", "Limited availability"],
  "Student": ["Valid student ID required", "Standard access"],
  "Group": ["5+ tickets discount", "Group seating area"],
};

const getFeatures = (tierName: string): string[] => {
  const key = Object.keys(tierFeatures).find(k => tierName.toLowerCase().includes(k.toLowerCase()));
  return key ? tierFeatures[key] : ["Event access", "Standard amenities"];
};

const TicketTierCards = ({ tiers, selectedTier, onSelect }: TicketTierCardsProps) => {
  const { convertPrice } = useCurrency();

  const cheapestPrice = Math.min(...tiers.map(t => t.price));
  const isPopular = (tier: EventTicketTier) => {
    const soldPercentage = ((tier.total_tickets - tier.available_tickets) / tier.total_tickets) * 100;
    return soldPercentage > 60;
  };

  return (
    <div className="space-y-3">
      {tiers.map((tier) => {
        const isSelected = selectedTier?.id === tier.id;
        const soldPercentage = Math.round(((tier.total_tickets - tier.available_tickets) / tier.total_tickets) * 100);
        const features = getFeatures(tier.name);
        const isBestValue = tier.price === cheapestPrice && tiers.length > 1;
        const popular = isPopular(tier);

        return (
          <Card
            key={tier.id}
            className={cn(
              "p-4 cursor-pointer transition-all press-effect relative overflow-hidden",
              isSelected
                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                : "border-border/50 hover:border-primary/30"
            )}
            onClick={() => tier.available_tickets > 0 && onSelect(tier)}
          >
            {/* Badges row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {isBestValue && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">
                  <Star className="h-3 w-3 mr-0.5" /> Best Value
                </Badge>
              )}
              {popular && (
                <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px]">
                  <Flame className="h-3 w-3 mr-0.5" /> Popular
                </Badge>
              )}
              {tier.available_tickets === 0 && (
                <Badge variant="destructive" className="text-[10px]">Sold Out</Badge>
              )}
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{tier.name}</h4>
                <ul className="mt-2 space-y-1">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xl font-bold text-primary">{convertPrice(tier.price)}</p>
                <p className="text-[10px] text-muted-foreground">per ticket</p>
              </div>
            </div>

            {/* Availability bar */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{tier.available_tickets} remaining</span>
                <span>{soldPercentage}% sold</span>
              </div>
              <Progress value={soldPercentage} className="h-1.5" />
            </div>

            {isSelected && (
              <div className="absolute top-3 right-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default TicketTierCards;
