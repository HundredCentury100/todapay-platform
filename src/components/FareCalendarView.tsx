import { useState, useMemo } from "react";
import { format, addDays, startOfToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Calendar, TrendingDown, Sparkles } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { predictPrices, getBestBookingDay } from "@/services/pricePredictionService";
import { OperatorTier } from "@/utils/pricingCalculator";

interface FareCalendarViewProps {
  basePrice: number;
  operatorTier?: OperatorTier;
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

const FareCalendarView = ({
  basePrice,
  operatorTier = 'standard',
  onDateSelect,
  selectedDate,
}: FareCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(startOfToday());
  const { convertPrice } = useCurrency();

  // Get predictions for 60 days
  const predictions = useMemo(() => {
    const preds = predictPrices(basePrice, operatorTier, startOfToday(), 60);
    return preds.reduce((acc, pred) => {
      acc[pred.date] = pred;
      return acc;
    }, {} as Record<string, typeof preds[0]>);
  }, [basePrice, operatorTier]);

  const bestDay = useMemo(() => {
    const allPreds = Object.values(predictions);
    return getBestBookingDay(allPreds);
  }, [predictions]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0-6)
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getPriceColor = (price: number) => {
    const lowestPrice = bestDay?.predictedPrice || basePrice;
    const ratio = price / lowestPrice;
    
    if (ratio <= 1.05) return 'bg-green-500/20 text-green-700 dark:text-green-400';
    if (ratio <= 1.15) return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-500/20 text-red-700 dark:text-red-400';
  };

  const today = startOfToday();

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Fare Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/20" />
          <span>Best prices</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500/20" />
          <span>Average</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/20" />
          <span>High prices</span>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>Best deal</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Empty cells for days before month start */}
        {emptyDays.map((_, idx) => (
          <div key={`empty-${idx}`} className="p-2" />
        ))}

        {/* Day cells */}
        {daysInMonth.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const prediction = predictions[dateStr];
          const isPast = day < today;
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isBestDay = bestDay && dateStr === bestDay.date;

          if (isPast || !prediction) {
            return (
              <div
                key={dateStr}
                className="p-2 text-center text-muted-foreground/50 text-sm"
              >
                {format(day, 'd')}
              </div>
            );
          }

          return (
            <TooltipProvider key={dateStr}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onDateSelect?.(day)}
                    className={`
                      p-1.5 rounded-lg text-center transition-all relative
                      ${getPriceColor(prediction.predictedPrice)}
                      ${isSelected ? 'ring-2 ring-primary' : ''}
                      ${isToday ? 'border-2 border-primary' : ''}
                      hover:scale-105 hover:shadow-md
                    `}
                  >
                    {isBestDay && (
                      <Sparkles className="w-3 h-3 text-primary absolute -top-1 -right-1" />
                    )}
                    <p className="text-xs font-medium">{format(day, 'd')}</p>
                    <p className="text-[10px] font-bold">
                      {convertPrice(prediction.predictedPrice).replace(/[^0-9.,]/g, '')}
                    </p>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">{format(day, 'EEEE, MMM d')}</p>
                    <p className="text-lg font-bold">{convertPrice(prediction.predictedPrice)}</p>
                    {prediction.factors.slice(0, 2).map((factor, i) => (
                      <p key={i} className="text-xs text-muted-foreground">• {factor}</p>
                    ))}
                    {isBestDay && (
                      <Badge className="bg-primary text-primary-foreground">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Best Deal!
                      </Badge>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Best Day Summary */}
      {bestDay && (
        <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Cheapest day this period</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(bestDay.date), 'EEEE, MMMM d')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-primary">{convertPrice(bestDay.predictedPrice)}</p>
            <p className="text-xs text-muted-foreground">
              Save {Math.abs(bestDay.percentChange)}%
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FareCalendarView;
