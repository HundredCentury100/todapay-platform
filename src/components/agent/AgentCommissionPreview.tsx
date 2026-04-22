import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  calculateVerticalCommission,
  mapBookingTypeToVertical,
  getTierConfig,
  getEffectiveTier,
  VERTICAL_BASE_RATES,
  PAYOUT_DAY,
  type AgentTier,
  type AgentType,
  type BookingVertical,
} from "@/config/agentCommissionConfig";

interface AgentCommissionPreviewProps {
  bookingAmount: number;
  commissionRate: number;
  bookingType?: string;
  agentTier?: AgentTier;
  agentType?: AgentType;
}

export const AgentCommissionPreview = ({
  bookingAmount,
  commissionRate,
  bookingType,
  agentTier = 'standard',
  agentType = 'internal',
}: AgentCommissionPreviewProps) => {
  const { convertPrice } = useCurrency();

  // Use vertical-aware calculation if bookingType is provided
  const vertical = bookingType ? mapBookingTypeToVertical(bookingType) : null;
  
  let commission: number;
  let baseRate: number;
  let multiplier: number;
  let effectiveRate: number;
  let isFlat = false;

  if (vertical) {
    const result = calculateVerticalCommission(bookingAmount, vertical, agentTier, agentType);
    commission = result.commissionAmount;
    baseRate = result.baseRate;
    multiplier = result.multiplier;
    effectiveRate = result.effectiveRate;
    isFlat = VERTICAL_BASE_RATES[vertical].type === 'flat';
  } else {
    // Fallback to legacy flat rate
    commission = bookingAmount * (commissionRate / 100);
    baseRate = commissionRate;
    multiplier = 1;
    effectiveRate = commissionRate;
  }

  const effectiveTier = getEffectiveTier(agentTier, agentType);
  const tierConfig = getTierConfig(effectiveTier);

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Your Commission</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {convertPrice(commission)}
            </p>
            {vertical && (
              <p className="text-xs text-muted-foreground mt-1">
                {isFlat
                  ? `Flat $${baseRate}`
                  : `${baseRate}% base`
                }
                {multiplier > 1 && ` × ${multiplier}x (${effectiveTier})`}
                {!isFlat && ` = ${effectiveRate.toFixed(1)}%`}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Booking Amount</p>
            <p className="text-lg font-semibold">{convertPrice(bookingAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Payout: {PAYOUT_DAY}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
