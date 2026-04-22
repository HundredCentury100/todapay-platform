import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon } from "lucide-react";
import { format, setHours, setMinutes, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface WorkspaceBlockDateDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingBlock?: {
    id: string;
    start_datetime: string;
    end_datetime: string;
    reason: string | null;
    is_recurring: boolean;
    recurrence_day_of_week: number | null;
  } | null;
}

const BLOCK_REASONS = [
  "Maintenance",
  "Private Event",
  "Holiday",
  "Renovation",
  "Staff Training",
  "Other"
];

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

export const WorkspaceBlockDateDialog = ({
  workspaceId,
  open,
  onOpenChange,
  onSuccess,
  editingBlock
}: WorkspaceBlockDateDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [startDate, setStartDate] = useState<Date | undefined>(
    editingBlock ? parseISO(editingBlock.start_datetime) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    editingBlock ? parseISO(editingBlock.end_datetime) : new Date()
  );
  const [startTime, setStartTime] = useState(
    editingBlock ? format(parseISO(editingBlock.start_datetime), 'HH:mm') : "09:00"
  );
  const [endTime, setEndTime] = useState(
    editingBlock ? format(parseISO(editingBlock.end_datetime), 'HH:mm') : "17:00"
  );
  const [isAllDay, setIsAllDay] = useState(true);
  const [reason, setReason] = useState(editingBlock?.reason || "Maintenance");
  const [isRecurring, setIsRecurring] = useState(editingBlock?.is_recurring || false);
  const [recurringDay, setRecurringDay] = useState(
    editingBlock?.recurrence_day_of_week?.toString() || "0"
  );

  const handleSubmit = async () => {
    if (!startDate || (!isRecurring && !endDate)) {
      toast({
        title: "Missing dates",
        description: "Please select start and end dates",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let startDatetime: Date;
      let endDatetime: Date;

      if (isAllDay) {
        startDatetime = setMinutes(setHours(startDate, 0), 0);
        endDatetime = setMinutes(setHours(endDate || startDate, 23), 59);
      } else {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        startDatetime = setMinutes(setHours(startDate, startH), startM);
        endDatetime = setMinutes(setHours(endDate || startDate, endH), endM);
      }

      const blockData = {
        workspace_id: workspaceId,
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        reason,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? "weekly" : null,
        recurrence_day_of_week: isRecurring ? parseInt(recurringDay) : null,
      };

      let error;
      if (editingBlock) {
        const result = await supabase
          .from('workspace_blocked_dates')
          .update(blockData)
          .eq('id', editingBlock.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('workspace_blocked_dates')
          .insert(blockData);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: editingBlock ? "Block updated" : "Block created",
        description: isRecurring 
          ? `Recurring block on ${DAYS_OF_WEEK.find(d => d.value === recurringDay)?.label}s`
          : `Blocked from ${format(startDatetime, 'MMM d')} to ${format(endDatetime, 'MMM d')}`
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving block:", error);
      toast({
        title: "Error",
        description: "Failed to save block. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingBlock) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('workspace_blocked_dates')
        .delete()
        .eq('id', editingBlock.id);

      if (error) throw error;

      toast({ title: "Block deleted" });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete block",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingBlock ? "Edit Block" : "Block Dates"}</DialogTitle>
          <DialogDescription>
            Block time slots to prevent bookings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recurring Toggle */}
          <div className="flex items-center justify-between">
            <Label>Recurring weekly block</Label>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>

          {isRecurring ? (
            /* Recurring Day Selection */
            <div className="space-y-2">
              <Label>Block every</Label>
              <Select value={recurringDay} onValueChange={setRecurringDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map(day => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            /* Date Range Selection */
            <div className="grid grid-cols-2 gap-4">
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
                      {startDate ? format(startDate, "MMM d, yyyy") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

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
                      {endDate ? format(endDate, "MMM d, yyyy") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
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
            </div>
          )}

          {/* All Day Toggle */}
          <div className="flex items-center justify-between">
            <Label>All day</Label>
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

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_REASONS.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          {editingBlock && (
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (editingBlock ? "Update" : "Create Block")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
