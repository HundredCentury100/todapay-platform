import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, parseISO, addMonths } from "date-fns";
import { getVenueAvailability, VenueAvailabilityResult } from "@/services/venueService";
import { Loader2 } from "lucide-react";

interface VenueBookingSimple {
  id: string;
  start_datetime: string;
  end_datetime: string;
  event_name: string | null;
  event_type: string;
}

interface BlockedDateSimple {
  id: string;
  start_datetime: string;
  end_datetime: string;
  reason: string;
  is_recurring: boolean;
  recurrence_day_of_week: number | null;
}

interface VenueAvailabilityCalendarProps {
  venueId: string;
  onDateSelect: (date: Date | undefined) => void;
  selectedDate?: Date;
}

const VenueAvailabilityCalendar = ({
  venueId,
  onDateSelect,
  selectedDate,
}: VenueAvailabilityCalendarProps) => {
  const [bookings, setBookings] = useState<VenueBookingSimple[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDateSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const startDate = format(currentMonth, 'yyyy-MM-01');
        const endDate = format(addMonths(currentMonth, 2), 'yyyy-MM-dd');
        const result = await getVenueAvailability(venueId, startDate, endDate);
        setBookings(result.bookings as VenueBookingSimple[]);
        setBlockedDates(result.blockedDates as BlockedDateSimple[]);
      } catch (error) {
        console.error("Error fetching availability:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [venueId, currentMonth]);

  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      const bookingDate = parseISO(booking.start_datetime);
      return isSameDay(bookingDate, date);
    });
  };

  const isDateBooked = (date: Date) => {
    return getBookingsForDate(date).length > 0;
  };

  const isDateBlocked = (date: Date) => {
    return blockedDates.some((block) => {
      const start = parseISO(block.start_datetime);
      const end = parseISO(block.end_datetime);

      // For recurring blocks, check day of week
      if (block.is_recurring && block.recurrence_day_of_week !== null) {
        if (date.getDay() === block.recurrence_day_of_week && date >= start) {
          return true;
        }
      }

      // For regular blocks, check if within range
      return date >= start && date <= end;
    });
  };

  const isDateUnavailable = (date: Date) => {
    return isDateBooked(date) || isDateBlocked(date);
  };

  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : [];
  const selectedDateIsBlocked = selectedDate ? isDateBlocked(selectedDate) : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Availability Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateSelect}
              onMonthChange={setCurrentMonth}
              disabled={(date) => date < new Date() || isDateUnavailable(date)}
              modifiers={{
                booked: (date) => isDateBooked(date),
                blocked: (date) => isDateBlocked(date),
              }}
              modifiersStyles={{
                booked: {
                  backgroundColor: "hsl(var(--destructive) / 0.2)",
                  color: "hsl(var(--destructive))",
                },
                blocked: {
                  backgroundColor: "hsl(var(--muted))",
                  color: "hsl(var(--muted-foreground))",
                  textDecoration: "line-through",
                },
              }}
              className="rounded-md border"
            />

            <div className="flex items-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/20" />
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive/20" />
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted" />
                <span>Unavailable</span>
              </div>
            </div>

            {selectedDate && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h4>
                {selectedDateBookings.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-2 bg-muted rounded-md text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {booking.event_name || booking.event_type}
                          </span>
                          <Badge variant="secondary">Booked</Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {format(parseISO(booking.start_datetime), 'HH:mm')} - 
                          {format(parseISO(booking.end_datetime), 'HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : selectedDateIsBlocked ? (
                  <p className="text-sm text-muted-foreground">Not available for booking</p>
                ) : (
                  <p className="text-sm text-green-600">Available for booking</p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VenueAvailabilityCalendar;
