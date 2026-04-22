import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CancelRideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideRequestId?: string;
  activeRideId?: string;
  cancelledBy: 'passenger' | 'driver';
  onCancelled?: () => void;
  minutesSinceMatch?: number;
}

const PASSENGER_REASONS = [
  { id: 'driver_delay', label: 'Driver taking too long' },
  { id: 'changed_plans', label: 'Changed my plans' },
  { id: 'booked_mistake', label: 'Booked by mistake' },
  { id: 'driver_asked', label: 'Driver asked me to cancel' },
  { id: 'found_alternative', label: 'Found alternative transport' },
  { id: 'other', label: 'Other reason' },
];

const DRIVER_REASONS = [
  { id: 'passenger_unresponsive', label: 'Passenger not responding' },
  { id: 'unsafe_location', label: 'Passenger location unsafe' },
  { id: 'vehicle_issue', label: 'Vehicle issue' },
  { id: 'personal_emergency', label: 'Personal emergency' },
  { id: 'wrong_destination', label: 'Wrong destination entered' },
  { id: 'other', label: 'Other reason' },
];

export function CancelRideModal({
  open,
  onOpenChange,
  rideRequestId,
  activeRideId,
  cancelledBy,
  onCancelled,
  minutesSinceMatch,
}: CancelRideModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = cancelledBy === 'passenger' ? PASSENGER_REASONS : DRIVER_REASONS;
  const showPenaltyWarning = cancelledBy === 'passenger' && minutesSinceMatch && minutesSinceMatch > 2;

  const handleCancel = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }

    const finalReason = selectedReason === 'other' ? otherReason : 
      reasons.find(r => r.id === selectedReason)?.label || selectedReason;

    if (selectedReason === 'other' && !otherReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-ride-cancellation', {
        body: {
          rideRequestId,
          activeRideId,
          cancelledBy,
          reason: finalReason,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || 'Ride cancelled');
        onCancelled?.();
        onOpenChange(false);
      } else {
        throw new Error(data?.error || 'Failed to cancel ride');
      }
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel ride');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setOtherReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Ride
          </DialogTitle>
          <DialogDescription>
            {cancelledBy === 'passenger'
              ? 'Are you sure you want to cancel this ride?'
              : 'Please provide a reason for cancelling this ride.'}
          </DialogDescription>
        </DialogHeader>

        {showPenaltyWarning && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Cancellation Fee May Apply
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your driver has already been assigned and is on their way. Cancelling now may result in a $25 fee.
            </p>
          </div>
        )}

        {cancelledBy === 'driver' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ This Affects Your Rating
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cancellations increase your cancellation rate. Too many cancellations may result in temporary suspension.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {reasons.map((reason) => (
              <div key={reason.id} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.id} id={reason.id} />
                <Label htmlFor={reason.id} className="cursor-pointer">
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === 'other' && (
            <Textarea
              placeholder="Please describe your reason..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              className="min-h-[80px]"
            />
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Keep Ride
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            className="flex-1"
            disabled={isSubmitting || !selectedReason}
          >
            {isSubmitting ? 'Cancelling...' : 'Cancel Ride'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
