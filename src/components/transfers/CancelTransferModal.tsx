import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";

interface CancelTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transferId?: string;
  onCancelled: () => void;
}

const CANCELLATION_REASONS = [
  "Changed my plans",
  "Found alternative transport",
  "Driver taking too long",
  "Incorrect pickup/dropoff",
  "Price too high",
  "Other"
];

export const CancelTransferModal = ({
  open,
  onOpenChange,
  transferId,
  onCancelled
}: CancelTransferModalProps) => {
  const [reason, setReason] = useState(CANCELLATION_REASONS[0]);
  const [otherReason, setOtherReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!transferId) return;
    
    setCancelling(true);
    try {
      const finalReason = reason === "Other" ? otherReason : reason;
      
      const { error } = await supabase
        .from('transfer_requests')
        .update({
          status: 'cancelled',
          cancellation_reason: finalReason,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', transferId);

      if (error) throw error;
      
      toast.success("Transfer cancelled");
      onOpenChange(false);
      onCancelled();
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error("Failed to cancel transfer");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>Cancel Transfer?</ResponsiveModalTitle>
        <ResponsiveModalDescription>
          Please let us know why you're cancelling. Cancellation fees may apply.
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <div className="py-4 px-6">
        <RadioGroup value={reason} onValueChange={setReason}>
          {CANCELLATION_REASONS.map((r) => (
            <div key={r} className="flex items-center space-x-2">
              <RadioGroupItem value={r} id={r} />
              <Label htmlFor={r} className="cursor-pointer">{r}</Label>
            </div>
          ))}
        </RadioGroup>

        {reason === "Other" && (
          <Textarea
            className="mt-3"
            placeholder="Please specify..."
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
          />
        )}
      </div>

      <ResponsiveModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Keep Transfer
        </Button>
        <Button
          variant="destructive"
          onClick={handleCancel}
          disabled={cancelling || (reason === "Other" && !otherReason.trim())}
        >
          {cancelling ? "Cancelling..." : "Confirm Cancel"}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
};
