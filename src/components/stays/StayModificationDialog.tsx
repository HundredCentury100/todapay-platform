import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Calendar, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StayModificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    booking_reference: string;
    check_in_date: string;
    check_out_date: string;
    property_name: string;
    room_name: string;
    total_price: number;
    room_id: string;
  };
  onModified: () => void;
}

export function StayModificationDialog({
  open,
  onOpenChange,
  booking,
  onModified
}: StayModificationDialogProps) {
  const [checkIn, setCheckIn] = useState<Date | undefined>(new Date(booking.check_in_date));
  const [checkOut, setCheckOut] = useState<Date | undefined>(new Date(booking.check_out_date));
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [priceDifference, setPriceDifference] = useState<number>(0);

  const originalNights = differenceInDays(new Date(booking.check_out_date), new Date(booking.check_in_date));
  const newNights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  const checkAvailability = async () => {
    if (!checkIn || !checkOut) return;
    
    setChecking(true);
    try {
      const { data: availability } = await supabase
        .from('room_availability')
        .select('*')
        .eq('room_id', booking.room_id)
        .gte('date', format(checkIn, 'yyyy-MM-dd'))
        .lt('date', format(checkOut, 'yyyy-MM-dd'));

      const { data: room } = await supabase
        .from('rooms')
        .select('base_price, quantity')
        .eq('id', booking.room_id)
        .single();

      if (!room) {
        setAvailable(false);
        return;
      }

      // Check if all dates are available
      const isAvailable = availability?.every(a => a.available_units > 0) ?? true;
      setAvailable(isAvailable);

      if (isAvailable) {
        // Calculate new price
        let totalPrice = 0;
        for (let i = 0; i < newNights; i++) {
          const date = new Date(checkIn);
          date.setDate(date.getDate() + i);
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayAvail = availability?.find(a => a.date === dateStr);
          totalPrice += dayAvail?.price_override || room.base_price;
        }
        setPriceDifference(totalPrice - booking.total_price);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailable(false);
    } finally {
      setChecking(false);
    }
  };

  const handleModify = async () => {
    if (!checkIn || !checkOut || !available) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('stay_bookings')
        .update({
          check_in_date: format(checkIn, 'yyyy-MM-dd'),
          check_out_date: format(checkOut, 'yyyy-MM-dd'),
        })
        .eq('booking_id', booking.id);

      if (error) throw error;

      // Update main booking total if price changed
      if (priceDifference !== 0) {
        await supabase
          .from('bookings')
          .update({
            total_price: booking.total_price + priceDifference,
          })
          .eq('id', booking.id);
      }

      toast.success('Booking modified successfully');
      onModified();
      onOpenChange(false);
    } catch (error) {
      console.error('Error modifying booking:', error);
      toast.error('Failed to modify booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modify Stay Dates</DialogTitle>
          <DialogDescription>
            Change your check-in and check-out dates for {booking.property_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">{booking.room_name}</p>
            <p className="text-muted-foreground">
              Current: {format(new Date(booking.check_in_date), 'MMM d')} - {format(new Date(booking.check_out_date), 'MMM d, yyyy')}
              ({originalNights} nights)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Check-in</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    {checkIn ? format(checkIn, 'MMM d, yyyy') : 'Select'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={checkIn}
                    onSelect={(date) => {
                      setCheckIn(date);
                      setAvailable(null);
                    }}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Check-out</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    {checkOut ? format(checkOut, 'MMM d, yyyy') : 'Select'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={checkOut}
                    onSelect={(date) => {
                      setCheckOut(date);
                      setAvailable(null);
                    }}
                    disabled={(date) => !checkIn || date <= checkIn}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {newNights > 0 && (
            <p className="text-sm text-muted-foreground">
              New dates: {newNights} night{newNights !== 1 ? 's' : ''}
            </p>
          )}

          {available === false && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                These dates are not available. Please select different dates.
              </AlertDescription>
            </Alert>
          )}

          {available === true && (
            <Alert className={cn(priceDifference > 0 ? 'border-yellow-500' : 'border-green-500')}>
              <AlertDescription>
                {priceDifference === 0 ? (
                  'These dates are available at the same price!'
                ) : priceDifference > 0 ? (
                   `Price difference: +$${priceDifference.toFixed(2)} additional charge`
                 ) : (
                   `Price difference: -$${Math.abs(priceDifference).toFixed(2)} refund due`
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {available === null ? (
            <Button onClick={checkAvailability} disabled={!checkIn || !checkOut || checking}>
              {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Availability
            </Button>
          ) : (
            <Button onClick={handleModify} disabled={!available || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
