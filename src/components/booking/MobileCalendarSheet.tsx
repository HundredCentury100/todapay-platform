import { useState } from "react";
import { format, addMonths, subMonths, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface MobileCalendarSheetProps {
  mode: 'single' | 'range';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Single mode
  selectedDate?: Date;
  onSelect?: (date: Date | undefined) => void;
  // Range mode
  dateRange?: DateRange;
  onRangeSelect?: (range: DateRange | undefined) => void;
  // Common
  minDate?: Date;
  maxDate?: Date;
  title?: string;
  confirmLabel?: string;
}

export function MobileCalendarSheet({
  mode,
  open,
  onOpenChange,
  selectedDate,
  onSelect,
  dateRange,
  onRangeSelect,
  minDate = new Date(),
  maxDate,
  title = mode === 'range' ? 'Select Dates' : 'Select Date',
  confirmLabel = 'Apply',
}: MobileCalendarSheetProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || dateRange?.from || new Date());
  
  // Local state to track selection before confirming
  const [localDate, setLocalDate] = useState<Date | undefined>(selectedDate);
  const [localRange, setLocalRange] = useState<DateRange | undefined>(dateRange);

  const handleConfirm = () => {
    if (mode === 'single' && onSelect) {
      onSelect(localDate);
    } else if (mode === 'range' && onRangeSelect) {
      onRangeSelect(localRange);
    }
    onOpenChange(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setLocalDate(date);
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    setLocalRange(range);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const getNights = () => {
    if (localRange?.from && localRange?.to) {
      return Math.ceil((localRange.to.getTime() - localRange.from.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const canConfirm = mode === 'single' ? !!localDate : !!(localRange?.from && localRange?.to);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {title}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('prev')}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('next')}
              className="h-10 w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {mode === 'single' ? (
            <Calendar
              mode="single"
              selected={localDate}
              onSelect={handleDateSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              disabled={(date) => {
                if (date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              className="w-full pointer-events-auto"
              classNames={{
                months: "flex flex-col",
                month: "space-y-4 w-full",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-full font-normal text-sm",
                row: "flex w-full mt-2",
                cell: "relative p-0 text-center text-sm w-full h-12 focus-within:relative focus-within:z-20",
                day: cn(
                  "h-12 w-full p-0 font-normal",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground",
                  "aria-selected:opacity-100"
                ),
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-lg",
                day_today: "bg-accent text-accent-foreground rounded-lg",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
              }}
            />
          ) : (
            <Calendar
              mode="range"
              selected={localRange}
              onSelect={handleRangeSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              numberOfMonths={1}
              disabled={(date) => {
                if (date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              className="w-full pointer-events-auto"
              classNames={{
                months: "flex flex-col",
                month: "space-y-4 w-full",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-full font-normal text-sm",
                row: "flex w-full mt-2",
                cell: "relative p-0 text-center text-sm w-full h-12 focus-within:relative focus-within:z-20",
                day: cn(
                  "h-12 w-full p-0 font-normal",
                  "hover:bg-accent hover:text-accent-foreground",
                  "aria-selected:opacity-100"
                ),
                day_range_start: "bg-primary text-primary-foreground rounded-l-lg",
                day_range_end: "bg-primary text-primary-foreground rounded-r-lg",
                day_range_middle: "bg-primary/20 text-foreground",
                day_selected: "bg-primary text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
              }}
            />
          )}
        </div>

        <DrawerFooter className="border-t pt-4">
          {/* Selection Summary */}
          {mode === 'range' && localRange?.from && (
            <div className="text-center mb-3">
              <p className="text-sm text-muted-foreground">
                {localRange.to ? (
                  <>
                    {format(localRange.from, 'MMM d')} - {format(localRange.to, 'MMM d, yyyy')}
                    <span className="ml-2 font-medium text-primary">({getNights()} nights)</span>
                  </>
                ) : (
                  <>Select check-out date</>
                )}
              </p>
            </div>
          )}
          
          {mode === 'single' && localDate && (
            <div className="text-center mb-3">
              <p className="text-sm text-muted-foreground">
                {format(localDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => {
                setLocalDate(undefined);
                setLocalRange(undefined);
              }}
            >
              Clear
            </Button>
            <Button
              className="flex-1 h-12"
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Convenience trigger button component
interface CalendarTriggerProps {
  label: string;
  value?: Date | DateRange;
  mode: 'single' | 'range';
  onClick: () => void;
  className?: string;
}

export function MobileCalendarTrigger({
  label,
  value,
  mode,
  onClick,
  className,
}: CalendarTriggerProps) {
  const formatValue = () => {
    if (!value) return 'Select';
    
    if (mode === 'single' && value instanceof Date) {
      return format(value, 'MMM d, yyyy');
    }
    
    if (mode === 'range' && 'from' in value) {
      if (value.from && value.to) {
        return `${format(value.from, 'MMM d')} - ${format(value.to, 'MMM d')}`;
      }
      if (value.from) {
        return format(value.from, 'MMM d');
      }
    }
    
    return 'Select';
  };

  return (
    <Button
      variant="outline"
      className={cn(
        "justify-start h-12 text-left font-normal min-h-[48px]",
        !value && "text-muted-foreground",
        className
      )}
      onClick={onClick}
    >
      <CalendarIcon className="h-4 w-4 mr-2 text-primary shrink-0" />
      <div className="flex flex-col items-start">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-sm font-medium">{formatValue()}</span>
      </div>
    </Button>
  );
}
