import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCurrency } from "@/contexts/CurrencyContext";
import { EventTicketTier } from "@/services/eventService";

interface TicketTierPillsProps {
  tiers: EventTicketTier[];
  selectedTier: EventTicketTier | null;
  onSelect: (tier: EventTicketTier) => void;
}

const TicketTierPills = ({ tiers, selectedTier, onSelect }: TicketTierPillsProps) => {
  const { convertPrice } = useCurrency();

  return (
    <ScrollArea className="w-full whitespace-nowrap pb-2">
      <div className="flex gap-2">
        {tiers.map((tier) => {
          const isSelected = selectedTier?.id === tier.id;
          const isSoldOut = tier.available_tickets === 0;
          
          return (
            <motion.button
              key={tier.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => !isSoldOut && onSelect(tier)}
              disabled={isSoldOut}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all
                ${isSelected 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : isSoldOut
                    ? "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-60"
                    : "bg-background hover:border-primary/50 border-border"
                }
              `}
            >
              <span className="font-medium text-sm whitespace-nowrap">{tier.name}</span>
              <span className={`text-sm ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {convertPrice(tier.price)}
              </span>
              {isSoldOut && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  Sold Out
                </Badge>
              )}
            </motion.button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default TicketTierPills;
