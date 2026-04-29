import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarIcon, Users, Clock, ChevronDown, Minus, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { WorkspaceData } from "@/services/workspaceService";
import { WorkspaceEquipmentSelector } from "@/components/workspace/WorkspaceEquipmentSelector";
import { WorkspaceBookingType } from "@/types/workspace";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import WorkspaceCategoryForm from "@/components/booking/WorkspaceCategoryForm";
import BookingSpecialtyAddOns from "@/components/booking/BookingSpecialtyAddOns";
import { calculateServiceFee, calculatePlatformFee, PLATFORM_FEE_PERCENTAGE } from "@/utils/feeCalculator";
interface WorkspaceBookingFormProps {
  workspace: WorkspaceData;
}

const BOOKING_TYPES: { value: WorkspaceBookingType; label: string }[] = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export const WorkspaceBookingForm = ({ workspace }: WorkspaceBookingFormProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [date, setDate] = useState<Date>();
  const [bookingType, setBookingType] = useState<WorkspaceBookingType>("daily");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [attendees, setAttendees] = useState(1);
  const [showEquipment, setShowEquipment] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Array<{ id: string; name: string; quantity: number; price: number }>>([]);
  const [workspaceCategoryData, setWorkspaceCategoryData] = useState<Record<string, any>>({});
  const [specialtyAddOns, setSpecialtyAddOns] = useState<Record<string, any>>({});

  const getRate = () => {
    switch (bookingType) {
      case "hourly": return workspace.hourly_rate || 0;
      case "daily": return workspace.daily_rate || 0;
      case "weekly": return workspace.weekly_rate || 0;
      case "monthly": return workspace.monthly_rate || 0;
      default: return 0;
    }
  };

  const getHours = () => {
    if (bookingType === "hourly" && startTime && endTime) {
      const start = parseInt(startTime.split(":")[0]);
      const end = parseInt(endTime.split(":")[0]);
      return Math.max(1, end - start);
    }
    return 1;
  };

  const baseTotal = () => {
    const rate = getRate();
    return bookingType === "hourly" ? rate * getHours() : rate;
  };

  const equipmentTotal = selectedEquipment.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotal = baseTotal() + equipmentTotal;
  const serviceFee = calculateServiceFee(subtotal);
  const platformFee = calculatePlatformFee(subtotal);
  const grandTotal = subtotal + serviceFee;

  const handleBook = async () => {
    if (!date) { toast.error("Please select a date"); return; }
    if (!user) {
      toast.error("Please log in to book");
      navigate("/auth", { state: { returnTo: location.pathname } });
      return;
    }

    const startDatetime = new Date(date);
    startDatetime.setHours(parseInt(startTime.split(":")[0]));
    const endDatetime = new Date(date);
    if (bookingType === "hourly") endDatetime.setHours(parseInt(endTime.split(":")[0]));
    else if (bookingType === "daily") endDatetime.setHours(23, 59);
    else if (bookingType === "weekly") endDatetime.setDate(endDatetime.getDate() + 7);
    else endDatetime.setMonth(endDatetime.getMonth() + 1);

    // Navigate to unified checkout
    navigate("/booking/confirm", {
      state: {
        type: "workspace",
        vertical: "workspace",
        itemId: workspace.id,
        itemName: workspace.name,
        basePrice: subtotal,
        serviceFee,
        totalPrice: grandTotal,
        passengerName: user.email?.split("@")[0] || "Guest",
        passengerEmail: user.email || "",
        passengerPhone: "",
        eventDate: date ? format(date, "yyyy-MM-dd") : undefined,
        eventTime: startTime,
        eventVenue: workspace.address,
        platformFeeAmount: platformFee.feeAmount,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        workspaceCity: workspace.city,
        workspaceType: (workspace as any).workspace_type || "meeting_room",
        startDatetime: startDatetime.toISOString(),
        endDatetime: endDatetime.toISOString(),
        bookingType,
        numAttendees: attendees,
        equipment: selectedEquipment,
        catering: [],
        merchantProfileId: workspace.merchant_profile_id || null,
        operator: workspace.name,
      },
    });
  };

  const rate = getRate();

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Book This Space</span>
          {rate > 0 && (
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{convertPrice(rate)}</span>
              <span className="text-sm text-muted-foreground">
                /{bookingType === "hourly" ? "hr" : bookingType === "daily" ? "day" : bookingType === "weekly" ? "wk" : "mo"}
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Booking Type */}
        <div className="space-y-2">
          <Label>Booking Type</Label>
          <Select value={bookingType} onValueChange={(v) => setBookingType(v as WorkspaceBookingType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOOKING_TYPES.map(({ value, label }) => {
                const hasRate = 
                  (value === "hourly" && workspace.hourly_rate) ||
                  (value === "daily" && workspace.daily_rate) ||
                  (value === "weekly" && workspace.weekly_rate) ||
                  (value === "monthly" && workspace.monthly_rate);
                return (
                  <SelectItem key={value} value={value} disabled={!hasRate}>
                    {label}{!hasRate && " (Not available)"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Selection for Hourly */}
        {bookingType === "hourly" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Start</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />End</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.filter((t) => t.value > startTime).map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Attendees - Stepper */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />Attendees</Label>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <span className="text-sm">{attendees} attendee{attendees !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" disabled={attendees <= 1} onClick={() => setAttendees(a => a - 1)}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center font-medium">{attendees}</span>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" disabled={attendees >= workspace.capacity} onClick={() => setAttendees(a => a + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Max capacity: {workspace.capacity}</p>
        </div>

        {/* Equipment Add-ons */}
        <Collapsible open={showEquipment} onOpenChange={setShowEquipment}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-0 text-sm font-medium">
              Add Equipment
              <ChevronDown className={cn("h-4 w-4 transition-transform", showEquipment && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <WorkspaceEquipmentSelector
              selectedEquipment={selectedEquipment}
              onEquipmentChange={setSelectedEquipment}
              bookingHours={getHours()}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Price Breakdown */}
        <WorkspaceCategoryForm
          workspaceType={workspace.workspace_type}
          data={workspaceCategoryData}
          onChange={setWorkspaceCategoryData}
        />
        <BookingSpecialtyAddOns
          vertical="workspace"
          data={specialtyAddOns}
          onChange={setSpecialtyAddOns}
        />

        <div className="border-t pt-4 mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {convertPrice(getRate())} × {bookingType === "hourly" ? `${getHours()} hr${getHours() !== 1 ? 's' : ''}` : `1 ${bookingType.replace('ly', '')}`}
            </span>
            <span>{convertPrice(baseTotal())}</span>
          </div>
          {equipmentTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Equipment add-ons</span>
              <span>{convertPrice(equipmentTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service fee</span>
            <span>{convertPrice(serviceFee)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{PLATFORM_FEE_PERCENTAGE}% platform fee (merchant)</span>
            <span>-{convertPrice(platformFee.feeAmount)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">{convertPrice(grandTotal)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Platform fee is charged to the merchant, not added to your total.
          </p>
          <Button onClick={handleBook} className="w-full" size="lg" disabled={!date}>
            Proceed to Checkout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkspaceBookingForm;
