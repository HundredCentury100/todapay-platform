import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Ticket } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

interface QuickQuantitySelectorProps {
  quantity: number;
  onQuantityChange: (qty: number) => void;
  maxQuantity?: number;
  pricePerTicket: number;
  tierName: string;
  availableTickets: number;
}

const QuickQuantitySelector = ({
  quantity,
  onQuantityChange,
  maxQuantity = 10,
  pricePerTicket,
  tierName,
  availableTickets,
}: QuickQuantitySelectorProps) => {
  const { convertPrice } = useCurrency();
  const max = Math.min(maxQuantity, availableTickets);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">How many tickets?</h3>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{tierName}</p>
          <p className="text-lg font-bold text-primary">{convertPrice(pricePerTicket)}<span className="text-xs text-muted-foreground font-normal"> /ticket</span></p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full press-effect"
            onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
            disabled={quantity <= 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className={cn(
            "text-2xl font-bold w-8 text-center tabular-nums",
            quantity > 0 ? "text-primary" : "text-muted-foreground"
          )}>
            {quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full press-effect"
            onClick={() => onQuantityChange(Math.min(max, quantity + 1))}
            disabled={quantity >= max}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {quantity > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{quantity} × {convertPrice(pricePerTicket)}</span>
          <span className="text-lg font-bold">{convertPrice(quantity * pricePerTicket)}</span>
        </div>
      )}

      {availableTickets < 20 && (
        <Badge className="mt-3 bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs">
          Only {availableTickets} left
        </Badge>
      )}
    </Card>
  );
};

export default QuickQuantitySelector;
