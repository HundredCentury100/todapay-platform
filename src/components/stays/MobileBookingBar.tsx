import { Button } from "@/components/ui/button";
import { StickyCTABar } from "@/components/ui/sticky-cta-bar";
import { Star, Calendar, Users } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format } from "date-fns";

interface MobileBookingBarProps {
  minPrice?: number;
  nights: number;
  reviewScore?: number;
  reviewCount?: number;
  onReserve: () => void;
  disabled?: boolean;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  onOpenConfig?: () => void;
}

export const MobileBookingBar = ({
  minPrice,
  nights,
  reviewScore,
  reviewCount,
  onReserve,
  disabled = false,
  checkIn,
  checkOut,
  guests,
  onOpenConfig,
}: MobileBookingBarProps) => {
  const { convertPrice } = useCurrency();

  if (!minPrice) return null;

  const hasDates = checkIn && checkOut;

  return (
    <StickyCTABar showOnMobile showOnDesktop={false}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0" onClick={onOpenConfig} role={onOpenConfig ? "button" : undefined}>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold">{convertPrice(minPrice)}</span>
            <span className="text-sm text-muted-foreground">/ night</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {hasDates ? (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(checkIn), 'MMM d')} – {format(new Date(checkOut), 'MMM d')}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-primary font-medium">
                <Calendar className="h-3 w-3" />
                Select dates
              </span>
            )}
            {guests && guests > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Users className="h-3 w-3" />
                  {guests}
                </span>
              </>
            )}
            {reviewScore && reviewScore > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {reviewScore.toFixed(1)}
                  {reviewCount ? ` (${reviewCount})` : ''}
                </span>
              </>
            )}
          </div>
        </div>
        <Button onClick={onReserve} disabled={disabled} size="lg" className="rounded-xl px-6 shrink-0">
          {hasDates ? 'View Rooms' : 'Reserve'}
        </Button>
      </div>
    </StickyCTABar>
  );
};
