import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Ban } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { WorkspaceData, getWorkspaceAvailability } from "@/services/workspaceService";
import { supabase } from "@/integrations/supabase/client";

interface WorkspaceAvailabilityCalendarProps {
  workspace: WorkspaceData;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BlockedDate {
  id: string;
  start_datetime: string;
  end_datetime: string;
  is_recurring: boolean;
  recurrence_day_of_week: number | null;
}

export const WorkspaceAvailabilityCalendar = ({
  workspace,
  selectedDate,
  onDateSelect,
}: WorkspaceAvailabilityCalendarProps) => {
  const [date, setDate] = useState<Date | undefined>(selectedDate);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBlockedDates();
  }, [workspace.id]);

  useEffect(() => {
    if (date) {
      fetchAvailability(date);
    }
  }, [date, workspace.id, blockedDates]);

  const loadBlockedDates = async () => {
    const { data } = await supabase
      .from('workspace_blocked_dates')
      .select('id, start_datetime, end_datetime, is_recurring, recurrence_day_of_week')
      .eq('workspace_id', workspace.id);
    
    setBlockedDates(data || []);
  };

  const isDateBlocked = (checkDate: Date): boolean => {
    return blockedDates.some(block => {
      if (block.is_recurring && block.recurrence_day_of_week !== null) {
        return checkDate.getDay() === block.recurrence_day_of_week;
      }
      return isSameDay(parseISO(block.start_datetime), checkDate);
    });
  };

  const fetchAvailability = async (selectedDate: Date) => {
    setIsLoading(true);
    try {
      // Check if date is blocked
      if (isDateBlocked(selectedDate)) {
        setTimeSlots([]);
        return;
      }

      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const availability = await getWorkspaceAvailability(workspace.id, dateStr);

      // Generate time slots based on operating hours
      const dayName = format(selectedDate, "EEEE").toLowerCase() as keyof typeof workspace.operating_hours;
      const dayHours = workspace.operating_hours?.[dayName];

      if (!dayHours) {
        setTimeSlots([]);
        return;
      }

      const openHour = parseInt(dayHours.open.split(":")[0]);
      const closeHour = parseInt(dayHours.close.split(":")[0]);

      const slots: TimeSlot[] = [];
      for (let hour = openHour; hour < closeHour; hour++) {
        const time = `${hour.toString().padStart(2, "0")}:00`;
        const isBooked = availability.some(
          (a: any) => a.start_time <= time && a.end_time > time && !a.is_available
        );
        slots.push({ time, available: !isBooked });
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error("Error fetching availability:", error);
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate && onDateSelect) {
      onDateSelect(newDate);
    }
  };

  // Get day closed status
  const isDayClosed = (checkDate: Date) => {
    const dayName = format(checkDate, "EEEE").toLowerCase() as keyof typeof workspace.operating_hours;
    return !workspace.operating_hours?.[dayName];
  };

  // Get blocked date modifiers for calendar
  const getBlockedDateModifiers = () => {
    const blocked: Date[] = [];
    const recurring: Date[] = [];

    blockedDates.forEach(block => {
      if (block.is_recurring && block.recurrence_day_of_week !== null) {
        // Mark next 90 days of recurring blocks
        const today = new Date();
        for (let i = 0; i < 90; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + i);
          if (checkDate.getDay() === block.recurrence_day_of_week) {
            recurring.push(new Date(checkDate));
          }
        }
      } else {
        blocked.push(parseISO(block.start_datetime));
      }
    });

    return { blocked, recurring };
  };

  const modifiers = getBlockedDateModifiers();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={(d) => d < new Date() || isDayClosed(d)}
          className="rounded-md border"
          modifiers={{
            blocked: modifiers.blocked,
            recurring: modifiers.recurring
          }}
          modifiersStyles={{
            blocked: {
              backgroundColor: 'hsl(var(--destructive) / 0.1)',
              color: 'hsl(var(--destructive))',
              textDecoration: 'line-through'
            },
            recurring: {
              backgroundColor: 'hsl(var(--destructive) / 0.1)',
              color: 'hsl(var(--destructive))',
              textDecoration: 'line-through'
            }
          }}
        />

        {date && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{format(date, "EEEE, MMMM d")}</h4>
              <div className="flex gap-2">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Available
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <XCircle className="h-3 w-3 text-red-500" />
                  Booked
                </Badge>
              </div>
            </div>

            {isDateBlocked(date) ? (
              <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
                <Ban className="h-5 w-5" />
                <span>This date is blocked and unavailable for booking</span>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : timeSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(({ time, available }) => (
                  <Badge
                    key={time}
                    variant={available ? "outline" : "secondary"}
                    className={`justify-center py-2 ${
                      available
                        ? "border-green-500/50 text-green-600 hover:bg-green-50"
                        : "bg-muted text-muted-foreground line-through"
                    }`}
                  >
                    {time}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Closed on this day
              </p>
            )}

            {/* Operating Hours */}
            <div className="pt-3 border-t">
              <h4 className="text-sm font-medium mb-2">Operating Hours</h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(workspace.operating_hours || {}).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-muted-foreground">
                    <span className="capitalize">{day}</span>
                    <span>
                      {hours ? `${hours.open} - ${hours.close}` : "Closed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkspaceAvailabilityCalendar;
