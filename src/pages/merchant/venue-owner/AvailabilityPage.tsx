import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { CalendarOff, Plus } from "lucide-react";
import BlockDateDialog, { BlockedDate } from "@/components/merchant/venue-owner/BlockDateDialog";

interface Venue {
  id: string;
  name: string;
}

interface BookedDate {
  id: string;
  date: Date;
  event_type: string;
  event_name?: string;
  start_datetime: string;
  end_datetime: string;
}

const AvailabilityPage = () => {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>("");
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockedDate | null>(null);

  useEffect(() => {
    const fetchVenues = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('merchant_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) return;

        const { data } = await supabase
          .from('venues')
          .select('id, name')
          .eq('merchant_profile_id', profile.id);

        setVenues(data || []);
        if (data && data.length > 0) {
          setSelectedVenue(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching venues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedVenue) return;

      try {
        // Fetch bookings
        const { data: bookingsData } = await supabase
          .from('venue_bookings')
          .select('id, start_datetime, end_datetime, event_type, event_name')
          .eq('venue_id', selectedVenue);

        const dates = (bookingsData || []).map(b => ({
          id: b.id,
          date: new Date(b.start_datetime),
          event_type: b.event_type,
          event_name: b.event_name,
          start_datetime: b.start_datetime,
          end_datetime: b.end_datetime,
        }));
        setBookedDates(dates);

        // Fetch blocked dates
        const { data: blockedData } = await supabase
          .from('venue_blocked_dates')
          .select('*')
          .eq('venue_id', selectedVenue)
          .order('start_datetime', { ascending: true });

        setBlockedDates(blockedData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [selectedVenue]);

  const isDateBooked = (date: Date) => {
    return bookedDates.some(b => isSameDay(b.date, date));
  };

  const isDateBlocked = (date: Date) => {
    return blockedDates.some(b => {
      const start = parseISO(b.start_datetime);
      const end = parseISO(b.end_datetime);
      
      // For recurring blocks, check day of week
      if (b.is_recurring && b.recurrence_day_of_week !== null) {
        if (date.getDay() === b.recurrence_day_of_week && date >= start) {
          return true;
        }
      }
      
      // For regular blocks, check if date is within range
      return isWithinInterval(date, { start, end }) || isSameDay(date, start) || isSameDay(date, end);
    });
  };

  const getBookingForDate = (date: Date) => {
    return bookedDates.find(b => isSameDay(b.date, date));
  };

  const getBlockForDate = (date: Date) => {
    return blockedDates.find(b => {
      const start = parseISO(b.start_datetime);
      const end = parseISO(b.end_datetime);
      
      if (b.is_recurring && b.recurrence_day_of_week !== null) {
        return date.getDay() === b.recurrence_day_of_week && date >= start;
      }
      
      return isWithinInterval(date, { start, end }) || isSameDay(date, start) || isSameDay(date, end);
    });
  };

  const handleDateClick = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleOpenBlockDialog = (block?: BlockedDate) => {
    setEditingBlock(block || null);
    setBlockDialogOpen(true);
  };

  const handleBlockSuccess = async () => {
    // Refresh blocked dates
    if (!selectedVenue) return;
    
    const { data } = await supabase
      .from('venue_blocked_dates')
      .select('*')
      .eq('venue_id', selectedVenue)
      .order('start_datetime', { ascending: true });

    setBlockedDates(data || []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedDateBooked = selectedDate && isDateBooked(selectedDate);
  const selectedDateBlocked = selectedDate && isDateBlocked(selectedDate);
  const selectedBooking = selectedDate && getBookingForDate(selectedDate);
  const selectedBlock = selectedDate && getBlockForDate(selectedDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Availability Calendar</h1>
          <p className="text-muted-foreground">View and manage venue availability</p>
        </div>
        {selectedVenue && (
          <Button onClick={() => handleOpenBlockDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Block Dates
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Select Venue</CardTitle>
            <Select value={selectedVenue} onValueChange={setSelectedVenue}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a venue" />
              </SelectTrigger>
              <SelectContent>
                {venues.map(venue => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {venues.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No venues to display</p>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateClick}
                  className="rounded-md border"
                  modifiers={{
                    booked: (date) => isDateBooked(date),
                    blocked: (date) => isDateBlocked(date),
                  }}
                  modifiersStyles={{
                    booked: { 
                      backgroundColor: 'hsl(var(--primary) / 0.2)',
                      fontWeight: 'bold'
                    },
                    blocked: {
                      backgroundColor: 'hsl(var(--destructive) / 0.15)',
                      textDecoration: 'line-through',
                    }
                  }}
                />
              </div>
              <div className="flex-1 space-y-6">
                {/* Legend */}
                <div>
                  <h3 className="font-semibold mb-4">Legend</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-primary/20"></div>
                      <span className="text-sm">Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-destructive/15 line-through"></div>
                      <span className="text-sm">Blocked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border border-border"></div>
                      <span className="text-sm">Available</span>
                    </div>
                  </div>
                </div>

                {/* Selected Date Info */}
                {selectedDate && (
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <h4 className="font-medium">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </h4>
                    
                    {selectedDateBooked ? (
                      <div>
                        <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Booked</Badge>
                        <div className="mt-2 text-sm space-y-1">
                          {selectedBooking?.event_name && (
                            <p><span className="text-muted-foreground">Event:</span> {selectedBooking.event_name}</p>
                          )}
                          <p className="capitalize">
                            <span className="text-muted-foreground">Type:</span> {selectedBooking?.event_type?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    ) : selectedDateBlocked ? (
                      <div className="space-y-2">
                        <Badge variant="destructive">Blocked</Badge>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Reason:</span> {selectedBlock?.reason}
                        </p>
                        {selectedBlock?.is_recurring && (
                          <p className="text-sm text-muted-foreground">
                            Recurring every {DAYS_OF_WEEK[selectedBlock.recurrence_day_of_week || 0]}
                          </p>
                        )}
                        {selectedBlock && !selectedBlock.is_recurring && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenBlockDialog(selectedBlock)}
                          >
                            Edit Block
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Badge variant="outline">Available</Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenBlockDialog()}
                        >
                          <CalendarOff className="h-4 w-4 mr-2" />
                          Block This Date
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Blocked Dates List */}
                {blockedDates.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Blocked Dates</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {blockedDates.map(block => (
                        <button
                          key={block.id}
                          onClick={() => handleOpenBlockDialog(block)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{block.reason}</span>
                            {block.is_recurring && (
                              <Badge variant="secondary" className="text-xs">Recurring</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {block.is_recurring ? (
                              `Every ${DAYS_OF_WEEK[block.recurrence_day_of_week || 0]}`
                            ) : (
                              <>
                                {format(parseISO(block.start_datetime), 'MMM d, yyyy')}
                                {!isSameDay(parseISO(block.start_datetime), parseISO(block.end_datetime)) && (
                                  <> - {format(parseISO(block.end_datetime), 'MMM d, yyyy')}</>
                                )}
                              </>
                            )}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block Date Dialog */}
      <BlockDateDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        venueId={selectedVenue}
        blockedDate={editingBlock}
        onSuccess={handleBlockSuccess}
      />
    </div>
  );
};

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default AvailabilityPage;
