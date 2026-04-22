import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Check, X, Clock } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { getAvailability, AvailabilitySlot } from "@/services/availabilityService";
import { cn } from "@/lib/utils";

interface AvailabilityCalendarProps {
  resourceType: 'workspace' | 'property' | 'venue' | 'vehicle';
  resourceId: string;
  onDateSelect?: (date: Date, slot?: AvailabilitySlot) => void;
  selectedDate?: Date;
  showTimeSlots?: boolean;
}

export function AvailabilityCalendar({
  resourceType,
  resourceId,
  onDateSelect,
  selectedDate,
  showTimeSlots = false
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailability();
  }, [resourceType, resourceId, currentMonth]);

  const loadAvailability = async () => {
    setLoading(true);
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    
    const data = await getAvailability(resourceType, resourceId, start, end);
    setSlots(data);
    setLoading(false);
  };

  const getDateStatus = (date: Date): 'available' | 'blocked' | 'booked' | 'unknown' => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slot = slots.find(s => s.slot_date === dateStr);
    
    if (!slot) return 'unknown'; // Default to available if no record
    if (slot.is_blocked) return 'blocked';
    if (slot.booking_id) return 'booked';
    if (!slot.is_available) return 'blocked';
    return 'available';
  };

  const getTimeSlotsForDate = (date: Date): AvailabilitySlot[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return slots
      .filter(s => s.slot_date === dateStr && s.start_time)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  };

  const modifiers = {
    available: (date: Date) => getDateStatus(date) === 'available' || getDateStatus(date) === 'unknown',
    blocked: (date: Date) => getDateStatus(date) === 'blocked',
    booked: (date: Date) => getDateStatus(date) === 'booked'
  };

  const modifiersStyles = {
    available: { backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' },
    blocked: { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', textDecoration: 'line-through' },
    booked: { backgroundColor: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))' }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Availability</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/10" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive/10" />
            <span className="text-muted-foreground">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted" />
            <span className="text-muted-foreground">Unavailable</span>
          </div>
        </div>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateSelect?.(date)}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          disabled={(date) => getDateStatus(date) === 'blocked' || getDateStatus(date) === 'booked'}
          className="rounded-md border p-3"
        />

        {/* Time slots for selected date */}
        {showTimeSlots && selectedDate && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm">
              Available times for {format(selectedDate, 'MMMM d, yyyy')}
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {getTimeSlotsForDate(selectedDate).length > 0 ? (
                getTimeSlotsForDate(selectedDate).map((slot) => (
                  <Button
                    key={slot.id}
                    variant={slot.is_available && !slot.is_blocked ? "outline" : "ghost"}
                    size="sm"
                    disabled={!slot.is_available || slot.is_blocked}
                    onClick={() => onDateSelect?.(selectedDate, slot)}
                    className={cn(
                      "text-xs",
                      !slot.is_available && "opacity-50"
                    )}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {slot.start_time?.slice(0, 5)}
                  </Button>
                ))
              ) : (
                <p className="col-span-full text-sm text-muted-foreground">
                  Contact for availability
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
