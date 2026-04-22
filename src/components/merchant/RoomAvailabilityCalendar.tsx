import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";
import { Room } from "@/types/stay";

interface RoomAvailabilityCalendarProps {
  propertyId: string;
  rooms: Room[];
}

interface AvailabilityRecord {
  id: string;
  room_id: string;
  date: string;
  available_units: number;
  price_override?: number;
  min_stay: number;
}

export const RoomAvailabilityCalendar = ({ propertyId, rooms }: RoomAvailabilityCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(rooms[0] || null);
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [priceOverride, setPriceOverride] = useState("");
  const [availableUnits, setAvailableUnits] = useState("");

  useEffect(() => {
    if (selectedRoom) {
      fetchAvailability();
    }
  }, [selectedRoom, currentMonth]);

  const fetchAvailability = async () => {
    if (!selectedRoom) return;
    setLoading(true);

    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from('room_availability')
        .select('*')
        .eq('room_id', selectedRoom.id)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityForDate = (date: Date): AvailabilityRecord | undefined => {
    return availability.find(a => isSameDay(parseISO(a.date), date));
  };

  const getDayStatus = (date: Date) => {
    if (!selectedRoom) return 'default';
    const record = getAvailabilityForDate(date);
    if (!record) return 'available'; // No record means full availability
    if (record.available_units === 0) return 'booked';
    if (record.available_units < selectedRoom.quantity) return 'partial';
    return 'available';
  };

  const handleSaveAvailability = async () => {
    if (!selectedRoom || selectedDates.length === 0) return;

    try {
      const records = selectedDates.map(date => ({
        room_id: selectedRoom.id,
        date: format(date, 'yyyy-MM-dd'),
        available_units: availableUnits ? parseInt(availableUnits) : selectedRoom.quantity,
        price_override: priceOverride ? parseFloat(priceOverride) : null,
        min_stay: 1
      }));

      // Upsert each record
      for (const record of records) {
        const { error } = await supabase
          .from('room_availability')
          .upsert(record, { onConflict: 'room_id,date' });

        if (error) throw error;
      }

      toast.success(`Updated availability for ${selectedDates.length} date(s)`);
      setEditDialogOpen(false);
      setSelectedDates([]);
      setPriceOverride("");
      setAvailableUnits("");
      fetchAvailability();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Add padding days for the calendar grid
  const firstDayOfMonth = startOfMonth(currentMonth);
  const paddingDays = firstDayOfMonth.getDay();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Room Availability</CardTitle>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={selectedDates.length === 0}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Selected ({selectedDates.length})
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Availability</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Updating {selectedDates.length} date(s) for {selectedRoom?.name}
              </p>
              <div className="space-y-2">
                <Label>Available Units</Label>
                <Input
                  type="number"
                  value={availableUnits}
                  onChange={(e) => setAvailableUnits(e.target.value)}
                  placeholder={`Max: ${selectedRoom?.quantity || 0}`}
                  min={0}
                  max={selectedRoom?.quantity}
                />
              </div>
              <div className="space-y-2">
                <Label>Price Override (optional)</Label>
                <Input
                  type="number"
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                  placeholder={`Base: $${selectedRoom?.base_price || 0}`}
                />
              </div>
              <Button onClick={handleSaveAvailability} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Room selector */}
        <div className="flex flex-wrap gap-2">
          {rooms.map(room => (
            <Button
              key={room.id}
              variant={selectedRoom?.id === room.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedRoom(room);
                setSelectedDates([]);
              }}
            >
              {room.name}
            </Button>
          ))}
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500" />
            <span>Fully Booked</span>
          </div>
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {/* Padding days */}
            {Array.from({ length: paddingDays }).map((_, i) => (
              <div key={`pad-${i}`} className="h-16" />
            ))}

            {/* Actual days */}
            {days.map(day => {
              const status = getDayStatus(day);
              const record = getAvailabilityForDate(day);
              const isSelected = selectedDates.some(d => isSameDay(d, day));
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedDates(selectedDates.filter(d => !isSameDay(d, day)));
                    } else {
                      setSelectedDates([...selectedDates, day]);
                    }
                  }}
                  className={`
                    h-16 p-1 rounded-md border text-left transition-colors
                    ${isSelected ? 'ring-2 ring-primary' : ''}
                    ${status === 'available' ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' : ''}
                    ${status === 'partial' ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20' : ''}
                    ${status === 'booked' ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20' : ''}
                  `}
                >
                  <span className="text-sm font-medium">{format(day, 'd')}</span>
                  {record && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {record.available_units}/{selectedRoom?.quantity}
                      {record.price_override && (
                        <span className="block text-primary">${record.price_override}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
