import { useState, useEffect, useMemo } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface StayPriceCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomName: string;
  basePrice: number;
}

interface PriceData {
  date: string;
  price: number;
  available: boolean;
}

export function StayPriceCalendar({
  open,
  onOpenChange,
  roomId,
  roomName,
  basePrice
}: StayPriceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && roomId) {
      loadPriceData();
    }
  }, [open, roomId, currentMonth]);

  const loadPriceData = async () => {
    setLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(addMonths(currentMonth, 1));

      const { data } = await supabase
        .from('room_availability')
        .select('date, price_override, available_units')
        .eq('room_id', roomId)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));

      const priceMap: Record<string, PriceData> = {};
      data?.forEach((item) => {
        priceMap[item.date] = {
          date: item.date,
          price: item.price_override || basePrice,
          available: item.available_units > 0
        };
      });
      setPriceData(priceMap);
    } catch (error) {
      console.error('Error loading price data:', error);
    } finally {
      setLoading(false);
    }
  };

  const { minPrice, maxPrice } = useMemo(() => {
    const prices = Object.values(priceData).map(p => p.price);
    if (prices.length === 0) return { minPrice: basePrice, maxPrice: basePrice };
    return {
      minPrice: Math.min(...prices, basePrice),
      maxPrice: Math.max(...prices, basePrice)
    };
  }, [priceData, basePrice]);

  const getPriceColor = (price: number) => {
    if (price === minPrice) return 'text-green-600 font-bold';
    if (price === maxPrice) return 'text-red-600';
    return 'text-foreground';
  };

  const renderMonth = (monthDate: Date) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start, end });
    const startDay = start.getDay();

    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-center">
          {format(monthDate, 'MMMM yyyy')}
        </h3>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="p-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const data = priceData[dateStr];
            const price = data?.price || basePrice;
            const available = data?.available !== false;
            const isPast = isBefore(day, new Date()) && !isToday(day);

            return (
              <div
                key={dateStr}
                className={cn(
                  'p-1 rounded text-center transition-colors',
                  isToday(day) && 'ring-2 ring-primary',
                  isPast && 'opacity-40',
                  !available && 'bg-muted line-through',
                  available && !isPast && 'hover:bg-accent cursor-pointer'
                )}
              >
                <div className="text-xs">{format(day, 'd')}</div>
                {!isPast && (
                  <div className={cn('text-[10px]', getPriceColor(price))}>
                    R{price}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Price Calendar - {roomName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-100 border border-green-600" />
                Lowest price
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-100 border border-red-600" />
                Highest price
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-muted" />
                Not available
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className={cn('grid grid-cols-2 gap-6', loading && 'opacity-50')}>
            {renderMonth(currentMonth)}
            {renderMonth(addMonths(currentMonth, 1))}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Base price: R{basePrice}/night
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
