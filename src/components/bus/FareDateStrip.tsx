import { useState, useMemo } from "react";
import { format, addDays, startOfToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Bus } from "@/types/booking";
import { cn } from "@/lib/utils";

interface FareDateStripProps {
  buses: Bus[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const FareDateStrip = ({ buses, selectedDate, onDateSelect }: FareDateStripProps) => {
  const { convertPrice } = useCurrency();

  const dates = useMemo(() => {
    const today = startOfToday();
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      let bestPrice = Infinity;
      buses.forEach((bus) => {
        const price = bus.priceByDate?.[dateStr] || bus.price;
        if (price < bestPrice) bestPrice = price;
      });
      return { date, dateStr, bestPrice: bestPrice === Infinity ? null : bestPrice };
    });
  }, [buses]);

  const cheapestDateStr = useMemo(() => {
    return dates.reduce((min, d) =>
      d.bestPrice && (!min.bestPrice || d.bestPrice < min.bestPrice) ? d : min
    , dates[0]).dateStr;
  }, [dates]);

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-1.5 px-4 py-2">
        {dates.map((d, i) => {
          const isSelected = format(selectedDate, "yyyy-MM-dd") === d.dateStr;
          const isCheapest = d.dateStr === cheapestDateStr;
          return (
            <button
              key={d.dateStr}
              onClick={() => onDateSelect(d.date)}
              className={cn(
                "flex flex-col items-center min-w-[72px] px-3 py-2 rounded-xl border transition-all text-center",
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border hover:border-primary/40 bg-background"
              )}
            >
              <span className="text-[10px] text-muted-foreground font-medium">
                {i === 0 ? "Today" : i === 1 ? "Tmrw" : format(d.date, "EEE")}
              </span>
              <span className="text-xs font-semibold">{format(d.date, "d MMM")}</span>
              {d.bestPrice && (
                <span className={cn(
                  "text-xs font-bold mt-0.5",
                  isCheapest ? "text-green-600" : "text-foreground"
                )}>
                  {convertPrice(d.bestPrice)}
                </span>
              )}
              {isCheapest && (
                <Badge className="mt-0.5 text-[8px] px-1 py-0 h-3 bg-green-500/20 text-green-600 border-green-500/30">
                  Best
                </Badge>
              )}
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default FareDateStrip;
