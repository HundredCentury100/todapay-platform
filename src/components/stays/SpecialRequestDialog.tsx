import { useState } from 'react';
import { Clock, Baby, Bed, Car, MoreHorizontal, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SpecialRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stayBookingId: string;
  propertyCheckInTime?: string;
  propertyCheckOutTime?: string;
  onSuccess?: () => void;
}

const REQUEST_TYPES = [
  { value: 'early_checkin', label: 'Early Check-in', icon: Clock, description: 'Arrive before standard check-in time' },
  { value: 'late_checkout', label: 'Late Check-out', icon: Clock, description: 'Depart after standard check-out time' },
  { value: 'extra_bed', label: 'Extra Bed', icon: Bed, description: 'Additional bed in room' },
  { value: 'crib', label: 'Baby Crib', icon: Baby, description: 'Crib for infant' },
  { value: 'airport_transfer', label: 'Airport Transfer', icon: Car, description: 'Transportation to/from airport' },
  { value: 'other', label: 'Other Request', icon: MoreHorizontal, description: 'Any other special request' },
];

export function SpecialRequestDialog({
  open,
  onOpenChange,
  stayBookingId,
  propertyCheckInTime = '14:00',
  propertyCheckOutTime = '10:00',
  onSuccess
}: SpecialRequestDialogProps) {
  const [requestType, setRequestType] = useState('early_checkin');
  const [requestedTime, setRequestedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedType = REQUEST_TYPES.find(t => t.value === requestType);
  const showTimeInput = requestType === 'early_checkin' || requestType === 'late_checkout';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('stay_special_requests')
        .insert({
          stay_booking_id: stayBookingId,
          request_type: requestType,
          requested_time: showTimeInput && requestedTime ? requestedTime : null,
          notes: notes || null,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Special request submitted successfully');
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setRequestType('early_checkin');
      setRequestedTime('');
      setNotes('');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Special Request</DialogTitle>
          <DialogDescription>
            Submit a special request for your stay. The property will review and respond.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Request Type</Label>
            <RadioGroup value={requestType} onValueChange={setRequestType}>
              <div className="grid gap-2">
                {REQUEST_TYPES.map((type) => (
                  <div
                    key={type.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      requestType === type.value ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                    onClick={() => setRequestType(type.value)}
                  >
                    <RadioGroupItem value={type.value} id={type.value} />
                    <type.icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Label htmlFor={type.value} className="cursor-pointer font-medium">
                        {type.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {showTimeInput && (
            <div>
              <Label htmlFor="time" className="mb-2 block">
                Requested Time
                <span className="text-xs text-muted-foreground ml-2">
                  (Standard: {requestType === 'early_checkin' ? propertyCheckInTime : propertyCheckOutTime})
                </span>
              </Label>
              <Input
                id="time"
                type="time"
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes" className="mb-2 block">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional details about your request..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">Note:</p>
            <p className="text-muted-foreground">
              Special requests are subject to availability and may incur additional charges. 
              The property will confirm within 24 hours.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
