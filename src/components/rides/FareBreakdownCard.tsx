import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Info, Zap, Route, Clock, Percent, Gift, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FareEstimate, PRICING_CONFIG } from "@/types/ride";

interface FareBreakdownCardProps {
  fareEstimate: FareEstimate;
  promoDiscount?: number;
  promoCode?: string;
  className?: string;
}

export function FareBreakdownCard({
  fareEstimate,
  promoDiscount = 0,
  promoCode,
  className,
}: FareBreakdownCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasSurge = fareEstimate.surge_multiplier > 1;
  const finalTotal = fareEstimate.total_estimate - promoDiscount;

  const breakdownItems = [
    {
      label: 'Base fare',
      value: fareEstimate.base_fare,
      icon: <Route className="h-3.5 w-3.5" />,
    },
    {
      label: `Distance (${fareEstimate.distance_km.toFixed(1)} km)`,
      value: fareEstimate.distance_fare,
      icon: <Route className="h-3.5 w-3.5" />,
    },
    {
      label: `Time (~${fareEstimate.duration_mins} min)`,
      value: fareEstimate.time_fare,
      icon: <Clock className="h-3.5 w-3.5" />,
    },
  ];

  if (hasSurge) {
    breakdownItems.push({
      label: `Surge (${fareEstimate.surge_multiplier}x)`,
      value: fareEstimate.surge_amount,
      icon: <Zap className="h-3.5 w-3.5 text-yellow-500" />,
    });
  }

  return (
    <div className={cn(
      "rounded-2xl border border-border bg-card overflow-hidden",
      className
    )}>
      {/* Main Price Display */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">R</span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                R{finalTotal.toFixed(0)}
              </span>
              {promoDiscount > 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  R{fareEstimate.total_estimate.toFixed(0)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated fare • {fareEstimate.distance_km.toFixed(1)} km
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasSurge && (
            <Badge variant="destructive" className="gap-1">
              <Zap className="h-3 w-3" />
              {fareEstimate.surge_multiplier}x
            </Badge>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Breakdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Surge Warning */}
              {hasSurge && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-destructive">High demand in your area</p>
                    <p className="text-destructive/80">
                      Prices are {((fareEstimate.surge_multiplier - 1) * 100).toFixed(0)}% higher than usual
                    </p>
                  </div>
                </div>
              )}

              {/* Line Items */}
              <div className="space-y-2 py-2 border-t border-border">
                {breakdownItems.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <span className={cn(
                      "font-medium",
                      item.label.includes('Surge') ? "text-destructive" : "text-foreground"
                    )}>
                      R{item.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between py-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">
                  R{fareEstimate.total_estimate.toFixed(2)}
                </span>
              </div>

              {/* Promo Discount */}
              {promoDiscount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <Gift className="h-3.5 w-3.5" />
                    <span>Promo: {promoCode}</span>
                  </div>
                  <span className="font-medium text-green-600">
                    -R{promoDiscount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Final Total */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">
                  R{finalTotal.toFixed(2)}
                </span>
              </div>

              {/* Platform Fee Note */}
              <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <p>
                  Final fare may vary based on actual route and traffic conditions. 
                  Includes R{PRICING_CONFIG.booking_fee} booking fee.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FareBreakdownCard;
