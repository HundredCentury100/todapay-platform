import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileDateSelectorProps {
  mode: "single" | "range";
  // Single date mode
  selectedDate?: Date;
  onDateSelect?: (date: Date | undefined) => void;
  // Range mode
  checkIn?: Date;
  checkOut?: Date;
  onCheckInChange?: (date: Date | undefined) => void;
  onCheckOutChange?: (date: Date | undefined) => void;
  // Common props
  label?: string;
  minDate?: Date;
  className?: string;
}

export function MobileDateSelector({
  mode,
  selectedDate,
  onDateSelect,
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  label = "Select Date",
  minDate = new Date(),
  className,
}: MobileDateSelectorProps) {
  const isMobile = useIsMobile();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [singleOpen, setSingleOpen] = useState(false);
  
  // Local state for drawer confirmations
  const [localDate, setLocalDate] = useState<Date | undefined>(selectedDate);
  const [localCheckIn, setLocalCheckIn] = useState<Date | undefined>(checkIn);
  const [localCheckOut, setLocalCheckOut] = useState<Date | undefined>(checkOut);

  const handleSingleConfirm = () => {
    onDateSelect?.(localDate);
    setSingleOpen(false);
  };

  const handleCheckInConfirm = () => {
    onCheckInChange?.(localCheckIn);
    setCheckInOpen(false);
    if (!checkOut && localCheckIn) {
      setTimeout(() => setCheckOutOpen(true), 100);
    }
  };

  const handleCheckOutConfirm = () => {
    onCheckOutChange?.(localCheckOut);
    setCheckOutOpen(false);
  };

  // Single date mode
  if (mode === "single") {
    // Mobile: Use Drawer
    if (isMobile) {
      return (
        <Card className={cn("md:hidden", className)}>
          <CardContent className="p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {label}
              </label>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between h-12 text-left font-normal min-h-[48px]",
                  !selectedDate && "text-muted-foreground"
                )}
                onClick={() => {
                  setLocalDate(selectedDate);
                  setSingleOpen(true);
                }}
              >
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  {selectedDate
                    ? format(selectedDate, "EEE, MMM d, yyyy")
                    : "Tap to select date"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
              
              <Drawer open={singleOpen} onOpenChange={setSingleOpen}>
                <DrawerContent className="max-h-[90vh]">
                  <DrawerHeader className="border-b">
                    <DrawerTitle>{label}</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 overflow-y-auto">
                    <Calendar
                      mode="single"
                      selected={localDate}
                      onSelect={setLocalDate}
                      disabled={(date) => date < minDate}
                      className="w-full pointer-events-auto"
                      classNames={{
                        months: "flex flex-col",
                        month: "space-y-4 w-full",
                        table: "w-full border-collapse",
                        head_row: "flex w-full",
                        head_cell: "text-muted-foreground rounded-md w-full font-normal text-sm",
                        row: "flex w-full mt-2",
                        cell: "relative p-0 text-center text-sm w-full h-12",
                        day: "h-12 w-full p-0 font-normal hover:bg-accent",
                        day_selected: "bg-primary text-primary-foreground rounded-lg",
                        day_today: "bg-accent text-accent-foreground rounded-lg",
                        day_disabled: "text-muted-foreground opacity-50",
                      }}
                    />
                  </div>
                  <DrawerFooter className="border-t">
                    {localDate && (
                      <p className="text-sm text-center text-muted-foreground mb-2">
                        {format(localDate, "EEEE, MMMM d, yyyy")}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 h-12" onClick={() => setSingleOpen(false)}>
                        Cancel
                      </Button>
                      <Button className="flex-1 h-12" onClick={handleSingleConfirm} disabled={!localDate}>
                        Apply
                      </Button>
                    </div>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Desktop: Use Popover
    return (
      <Card className={cn("hidden md:block", className)}>
        <CardContent className="p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {label}
            </label>
            <Popover open={singleOpen} onOpenChange={setSingleOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between h-12 text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    {selectedDate
                      ? format(selectedDate, "EEE, MMM d, yyyy")
                      : "Select date"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    onDateSelect?.(date);
                    setSingleOpen(false);
                  }}
                  disabled={(date) => date < minDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Range mode for stays - Mobile with Drawer
  if (isMobile) {
    return (
      <Card className={cn("md:hidden", className)}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              {label}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Check-in */}
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Check-in</span>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start h-12 text-left font-normal min-h-[48px]",
                    !checkIn && "text-muted-foreground"
                  )}
                  onClick={() => {
                    setLocalCheckIn(checkIn);
                    setCheckInOpen(true);
                  }}
                >
                  <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                  {checkIn ? format(checkIn, "MMM d") : "Select"}
                </Button>
                
                <Drawer open={checkInOpen} onOpenChange={setCheckInOpen}>
                  <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader className="border-b">
                      <DrawerTitle>Check-in Date</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 overflow-y-auto">
                      <Calendar
                        mode="single"
                        selected={localCheckIn}
                        onSelect={setLocalCheckIn}
                        disabled={(date) => date < minDate}
                        className="w-full pointer-events-auto"
                        classNames={{
                          months: "flex flex-col",
                          month: "space-y-4 w-full",
                          table: "w-full border-collapse",
                          head_row: "flex w-full",
                          head_cell: "text-muted-foreground rounded-md w-full font-normal text-sm",
                          row: "flex w-full mt-2",
                          cell: "relative p-0 text-center text-sm w-full h-12",
                          day: "h-12 w-full p-0 font-normal hover:bg-accent",
                          day_selected: "bg-primary text-primary-foreground rounded-lg",
                          day_today: "bg-accent text-accent-foreground rounded-lg",
                          day_disabled: "text-muted-foreground opacity-50",
                        }}
                      />
                    </div>
                    <DrawerFooter className="border-t">
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 h-12" onClick={() => setCheckInOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="flex-1 h-12" onClick={handleCheckInConfirm} disabled={!localCheckIn}>
                          Apply
                        </Button>
                      </div>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>

              {/* Check-out */}
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Check-out</span>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start h-12 text-left font-normal min-h-[48px]",
                    !checkOut && "text-muted-foreground"
                  )}
                  onClick={() => {
                    setLocalCheckOut(checkOut);
                    setCheckOutOpen(true);
                  }}
                >
                  <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                  {checkOut ? format(checkOut, "MMM d") : "Select"}
                </Button>
                
                <Drawer open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                  <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader className="border-b">
                      <DrawerTitle>Check-out Date</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 overflow-y-auto">
                      <Calendar
                        mode="single"
                        selected={localCheckOut}
                        onSelect={setLocalCheckOut}
                        disabled={(date) =>
                          date < minDate || (checkIn ? date <= checkIn : false)
                        }
                        className="w-full pointer-events-auto"
                        classNames={{
                          months: "flex flex-col",
                          month: "space-y-4 w-full",
                          table: "w-full border-collapse",
                          head_row: "flex w-full",
                          head_cell: "text-muted-foreground rounded-md w-full font-normal text-sm",
                          row: "flex w-full mt-2",
                          cell: "relative p-0 text-center text-sm w-full h-12",
                          day: "h-12 w-full p-0 font-normal hover:bg-accent",
                          day_selected: "bg-primary text-primary-foreground rounded-lg",
                          day_today: "bg-accent text-accent-foreground rounded-lg",
                          day_disabled: "text-muted-foreground opacity-50",
                        }}
                      />
                    </div>
                    <DrawerFooter className="border-t">
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 h-12" onClick={() => setCheckOutOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="flex-1 h-12" onClick={handleCheckOutConfirm} disabled={!localCheckOut}>
                          Apply
                        </Button>
                      </div>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
            
            {checkIn && checkOut && (
              <p className="text-sm text-center text-primary font-medium">
                {Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))} night(s)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop Range mode with Popover
  return (
    <Card className={cn("hidden md:block", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            {label}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Check-in */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Check-in</span>
              <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start h-11 text-left font-normal",
                      !checkIn && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                    {checkIn ? format(checkIn, "MMM d") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={(date) => {
                      onCheckInChange?.(date);
                      setCheckInOpen(false);
                      if (!checkOut && date) {
                        setTimeout(() => setCheckOutOpen(true), 100);
                      }
                    }}
                    disabled={(date) => date < minDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Check-out */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Check-out</span>
              <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start h-11 text-left font-normal",
                      !checkOut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                    {checkOut ? format(checkOut, "MMM d") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={(date) => {
                      onCheckOutChange?.(date);
                      setCheckOutOpen(false);
                    }}
                    disabled={(date) =>
                      date < minDate || (checkIn ? date <= checkIn : false)
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {checkIn && checkOut && (
            <p className="text-sm text-center text-primary font-medium">
              {Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))} night(s)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
