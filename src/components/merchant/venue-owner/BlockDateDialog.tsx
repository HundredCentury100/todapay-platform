import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface BlockedDate {
  id: string;
  venue_id: string;
  start_datetime: string;
  end_datetime: string;
  reason: string;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_day_of_week: number | null;
  created_at: string;
}

interface BlockDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId: string;
  blockedDate?: BlockedDate | null;
  onSuccess?: () => void;
}

const BLOCK_REASONS = [
  "Maintenance",
  "Private Event",
  "Holiday",
  "Renovation",
  "Staff Training",
  "Closed",
  "Other",
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const BlockDateDialog = ({
  open,
  onOpenChange,
  venueId,
  blockedDate,
  onSuccess,
}: BlockDateDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("Unavailable");
  const [customReason, setCustomReason] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [isAllDay, setIsAllDay] = useState(true);

  const isEditing = !!blockedDate;

  useEffect(() => {
    if (blockedDate) {
      const start = new Date(blockedDate.start_datetime);
      const end = new Date(blockedDate.end_datetime);
      setStartDate(start);
      setEndDate(end);
      setStartTime(format(start, "HH:mm"));
      setEndTime(format(end, "HH:mm"));
      setReason(BLOCK_REASONS.includes(blockedDate.reason) ? blockedDate.reason : "Other");
      setCustomReason(BLOCK_REASONS.includes(blockedDate.reason) ? "" : blockedDate.reason);
      setIsRecurring(blockedDate.is_recurring || false);
      setRecurrencePattern(blockedDate.recurrence_pattern || "weekly");
      setDayOfWeek(blockedDate.recurrence_day_of_week ?? 1);
      
      // Check if it's an all-day block
      const isAllDayBlock = 
        format(start, "HH:mm") === "00:00" && 
        format(end, "HH:mm") === "23:59";
      setIsAllDay(isAllDayBlock);
    } else {
      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setStartTime("09:00");
      setEndTime("17:00");
      setReason("Unavailable");
      setCustomReason("");
      setIsRecurring(false);
      setRecurrencePattern("weekly");
      setDayOfWeek(1);
      setIsAllDay(true);
    }
  }, [blockedDate, open]);

  const handleSubmit = async () => {
    if (!startDate) {
      toast({
        title: "Start date required",
        description: "Please select a start date",
        variant: "destructive",
      });
      return;
    }

    if (!isRecurring && !endDate) {
      toast({
        title: "End date required",
        description: "Please select an end date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const finalReason = reason === "Other" ? customReason || "Other" : reason;
      
      let startDateTime: Date;
      let endDateTime: Date;

      if (isAllDay) {
        startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        
        endDateTime = new Date(endDate || startDate);
        endDateTime.setHours(23, 59, 59, 999);
      } else {
        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);
        
        startDateTime = new Date(startDate);
        startDateTime.setHours(startHour, startMin, 0, 0);
        
        endDateTime = new Date(endDate || startDate);
        endDateTime.setHours(endHour, endMin, 0, 0);
      }

      if (endDateTime <= startDateTime) {
        toast({
          title: "Invalid time range",
          description: "End time must be after start time",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const blockData = {
        venue_id: venueId,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        reason: finalReason,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
        recurrence_day_of_week: isRecurring && recurrencePattern === "weekly" ? dayOfWeek : null,
      };

      if (isEditing && blockedDate) {
        const { error } = await supabase
          .from("venue_blocked_dates")
          .update(blockData)
          .eq("id", blockedDate.id);

        if (error) throw error;

        toast({
          title: "Block updated",
          description: "The blocked date has been updated.",
        });
      } else {
        const { error } = await supabase
          .from("venue_blocked_dates")
          .insert(blockData);

        if (error) throw error;

        toast({
          title: "Date blocked",
          description: "The date has been marked as unavailable.",
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving blocked date:", error);
      toast({
        title: "Error",
        description: "Failed to save blocked date. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!blockedDate) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("venue_blocked_dates")
        .delete()
        .eq("id", blockedDate.id);

      if (error) throw error;

      toast({
        title: "Block removed",
        description: "The blocked date has been removed.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error deleting blocked date:", error);
      toast({
        title: "Error",
        description: "Failed to remove blocked date.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Blocked Date" : "Block Dates"}</DialogTitle>
          <DialogDescription>
            Mark dates as unavailable for bookings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recurring Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Recurring Block</Label>
              <p className="text-sm text-muted-foreground">
                Block the same time every week
              </p>
            </div>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>

          {isRecurring ? (
            <>
              {/* Day of Week for Recurring */}
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={dayOfWeek.toString()}
                  onValueChange={(v) => setDayOfWeek(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date (when recurring starts) */}
              <div className="space-y-2">
                <Label>Starts From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          ) : (
            <>
              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate ? date < startDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          {/* All Day Toggle */}
          <div className="flex items-center justify-between">
            <Label>All Day</Label>
            <Switch checked={isAllDay} onCheckedChange={setIsAllDay} />
          </div>

          {/* Time Selection */}
          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === "Other" && (
            <div className="space-y-2">
              <Label>Custom Reason</Label>
              <Input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter reason..."
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {isEditing && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1"
              >
                Remove Block
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={isEditing ? "" : "flex-1"}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? "Saving..." : isEditing ? "Update" : "Block Dates"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlockDateDialog;
