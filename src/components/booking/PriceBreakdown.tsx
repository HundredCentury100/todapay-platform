import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Badge } from "@/components/ui/badge";

interface PriceItem {
  label: string;
  amount: number;
  description?: string;
}

interface PriceBreakdownProps {
  basePrice: number;
  taxes?: number;
  fees?: PriceItem[];
  addons?: PriceItem[];
  discounts?: PriceItem[];
  total: number;
  averagePrice?: number;
}

export const PriceBreakdown = ({
  basePrice,
  taxes = 0,
  fees = [],
  addons = [],
  discounts = [],
  total,
  averagePrice
}: PriceBreakdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { convertPrice } = useCurrency();

  const isPriceGood = averagePrice && total < averagePrice * 0.9;
  const isPriceHigh = averagePrice && total > averagePrice * 1.1;

  return (
    <Card className="p-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Price Details</h3>
          <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            {isOpen ? "Hide" : "Show"} breakdown
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
        </div>

        {averagePrice && (
          <div className="mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Average price: {convertPrice(averagePrice)}
            </span>
            {isPriceGood && (
              <Badge variant="default" className="bg-green-500">Great Deal!</Badge>
            )}
            {isPriceHigh && (
              <Badge variant="destructive">Above Average</Badge>
            )}
          </div>
        )}

        <CollapsibleContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Base Fare</span>
            <span className="font-medium">{convertPrice(basePrice)}</span>
          </div>

          {taxes > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxes & Charges</span>
              <span className="font-medium">{convertPrice(taxes)}</span>
            </div>
          )}

          {fees.map((fee, index) => (
            <div key={index} className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">{fee.label}</span>
                {fee.description && (
                  <Info className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <span className="font-medium">{convertPrice(fee.amount)}</span>
            </div>
          ))}

          {addons.map((addon, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{addon.label}</span>
              <span className="font-medium">{convertPrice(addon.amount)}</span>
            </div>
          ))}

          {discounts.map((discount, index) => (
            <div key={index} className="flex justify-between text-sm text-green-600">
              <span>{discount.label}</span>
              <span className="font-medium">-{convertPrice(discount.amount)}</span>
            </div>
          ))}

          <div className="border-t pt-2 mt-2" />
        </CollapsibleContent>

        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{convertPrice(total)}</span>
        </div>
      </Collapsible>
    </Card>
  );
};
