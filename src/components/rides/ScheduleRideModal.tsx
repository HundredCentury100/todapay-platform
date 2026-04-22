import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Clock, MapPin, Navigation, Loader2 } from "lucide-react";
import { format, addHours, setHours, setMinutes } from "date-fns";
import { createScheduledRide } from "@/services/scheduledRidesService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ScheduleRideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduled?: () => void;
}

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return format(setMinutes(setHours(new Date(), hour), minute), 'HH:mm');
});

export const ScheduleRideModal = ({ open, onOpenChange, onScheduled }: ScheduleRideModalProps) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("09:00");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!date || !pickupAddress || !dropoffAddress) {
      toast.error("Please fill in all required fields");
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const scheduledTime = setMinutes(setHours(date, hours), minutes);

    if (scheduledTime <= new Date()) {
      toast.error("Please select a future date and time");
      return;
    }

    setIsSubmitting(true);

    try {
      await createScheduledRide({
        pickup_address: pickupAddress,
        pickup_lat: -26.2041, // Default coords - in real app use geocoding
        pickup_lng: 28.0473,
        dropoff_address: dropoffAddress,
        dropoff_lat: -26.1076,
        dropoff_lng: 28.0567,
        scheduled_time: scheduledTime.toISOString(),
        notes: notes || undefined,
      });

      toast.success("Ride scheduled successfully!");
      onOpenChange(false);
      onScheduled?.();
      
      // Reset form
      setDate(undefined);
      setTime("09:00");
      setPickupAddress("");
      setDropoffAddress("");
      setNotes("");
    } catch (error) {
      console.error("Error scheduling ride:", error);
      toast.error("Failed to schedule ride");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule a Ride</DialogTitle>
          <DialogDescription>
            Book a ride in advance for a specific date and time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-3">
            <div>
              <Label>Pickup Location</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-green-500" />
                <Input
                  placeholder="Enter pickup address"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Dropoff Location</Label>
              <div className="relative mt-1">
                <Navigation className="absolute left-3 top-3 h-4 w-4 text-red-500" />
                <Input
                  placeholder="Enter destination"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              "Schedule Ride"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleRideModal;
