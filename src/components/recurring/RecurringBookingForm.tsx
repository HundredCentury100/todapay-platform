import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  RefreshCw, Calendar as CalendarIcon, Clock, 
  Loader2, Check 
} from "lucide-react";
import { format } from "date-fns";
import { createRecurringBooking } from "@/services/availabilityService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RecurringBookingFormProps {
  resourceType: 'workspace' | 'venue';
  resourceId: string;
  resourceName: string;
  pricePerHour: number;
  onSuccess?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function RecurringBookingForm({
  resourceType,
  resourceId,
  resourceName,
  pricePerHour,
  onSuccess
}: RecurringBookingFormProps) {
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const calculatePricePerOccurrence = () => {
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    const hours = end - start;
    return hours * pricePerHour;
  };

  const handleSubmit = async () => {
    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }

    if (recurrenceType === 'weekly' && selectedDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createRecurringBooking({
        resource_type: resourceType,
        resource_id: resourceId,
        recurrence_type: recurrenceType,
        recurrence_days: recurrenceType === 'weekly' ? selectedDays : undefined,
        start_time: startTime,
        end_time: endTime,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        price_per_occurrence: calculatePricePerOccurrence(),
        payment_method: 'wallet',
        auto_renew: !endDate
      });

      if (result) {
        toast.success("Recurring booking created successfully!");
        onSuccess?.();
      } else {
        toast.error("Failed to create recurring booking");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          Set Up Recurring Booking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resource Info */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-medium">{resourceName}</p>
          <p className="text-sm text-muted-foreground">R{pricePerHour}/hour</p>
        </div>

        {/* Recurrence Type */}
        <div className="space-y-3">
          <Label>Repeat</Label>
          <RadioGroup
            value={recurrenceType}
            onValueChange={(v) => setRecurrenceType(v as any)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily" className="font-normal">Daily</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly" className="font-normal">Weekly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="monthly" id="monthly" />
              <Label htmlFor="monthly" className="font-normal">Monthly</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Days of Week (for weekly) */}
        {recurrenceType === 'weekly' && (
          <div className="space-y-3">
            <Label>On these days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <Button
                  key={day.value}
                  type="button"
                  variant={selectedDays.includes(day.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(day.value)}
                  className="w-12"
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Date Range */}
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
                  {startDate ? format(startDate, 'PPP') : 'Pick a date'}
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
            <Label>End Date (optional)</Label>
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
                  {endDate ? format(endDate, 'PPP') : 'No end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date) => startDate ? date < startDate : false}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Price Summary */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Price per session</span>
            <span className="font-semibold">R{calculatePricePerOccurrence()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {recurrenceType === 'weekly' 
              ? `${selectedDays.length} sessions per week`
              : recurrenceType === 'daily'
              ? 'Every day'
              : 'Once per month'
            }
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Create Recurring Booking
        </Button>
      </CardContent>
    </Card>
  );
}
