import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: any;
  busId: string;
  onSuccess: () => void;
}

export function ScheduleDialog({ open, onOpenChange, schedule, busId, onSuccess }: ScheduleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from_location: schedule?.from_location || "",
    to_location: schedule?.to_location || "",
    departure_time: schedule?.departure_time || "",
    arrival_time: schedule?.arrival_time || "",
    duration: schedule?.duration || "",
    available_date: schedule?.available_date || "",
    base_price: schedule?.base_price || "",
    pickup_address: schedule?.pickup_address || "",
    dropoff_address: schedule?.dropoff_address || "",
    stops: schedule?.stops?.join(", ") || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const stopsArray = formData.stops.split(",").map(s => s.trim()).filter(Boolean);
      
      const scheduleData = {
        bus_id: busId,
        from_location: formData.from_location,
        to_location: formData.to_location,
        departure_time: formData.departure_time,
        arrival_time: formData.arrival_time,
        duration: formData.duration,
        available_date: formData.available_date,
        base_price: parseFloat(formData.base_price),
        pickup_address: formData.pickup_address,
        dropoff_address: formData.dropoff_address,
        stops: stopsArray,
      };

      if (schedule?.id) {
        const { error } = await supabase
          .from("bus_schedules")
          .update(scheduleData)
          .eq("id", schedule.id);

        if (error) throw error;
        toast.success("Schedule updated successfully");
      } else {
        const { error } = await supabase
          .from("bus_schedules")
          .insert([scheduleData]);

        if (error) throw error;
        toast.success("Schedule created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving schedule:", error);
      toast.error(error.message || "Failed to save schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{schedule ? "Edit Schedule" : "Create Schedule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from_location">From Location</Label>
              <Input
                id="from_location"
                value={formData.from_location}
                onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="to_location">To Location</Label>
              <Input
                id="to_location"
                value={formData.to_location}
                onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="departure_time">Departure Time</Label>
              <Input
                id="departure_time"
                type="time"
                value={formData.departure_time}
                onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="arrival_time">Arrival Time</Label>
              <Input
                id="arrival_time"
                type="time"
                value={formData.arrival_time}
                onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g., 6h"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="available_date">Available Date</Label>
              <Input
                id="available_date"
                type="date"
                value={formData.available_date}
                onChange={(e) => setFormData({ ...formData, available_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="base_price">Base Price (ZAR)</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="pickup_address">Pickup Address</Label>
            <Input
              id="pickup_address"
              value={formData.pickup_address}
              onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="dropoff_address">Dropoff Address</Label>
            <Input
              id="dropoff_address"
              value={formData.dropoff_address}
              onChange={(e) => setFormData({ ...formData, dropoff_address: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="stops">Stops (comma-separated)</Label>
            <Input
              id="stops"
              placeholder="e.g., Pretoria, Polokwane"
              value={formData.stops}
              onChange={(e) => setFormData({ ...formData, stops: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}