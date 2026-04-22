import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, DollarSign } from "lucide-react";
import { createPayoutRequest, getApprovedCommissionsTotal, getPayoutRequestsThisMonth } from "@/services/agentPayoutService";
import { toast } from "sonner";

interface PayoutRequestDialogProps {
  open: boolean;
  onClose: () => void;
  agentProfileId: string;
  onSuccess: () => void;
}

export function PayoutRequestDialog({ open, onClose, agentProfileId, onSuccess }: PayoutRequestDialogProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [requestsThisMonth, setRequestsThisMonth] = useState<number | null>(null);

  const handleOpen = async () => {
    if (open) {
      try {
        const [balance, requests] = await Promise.all([
          getApprovedCommissionsTotal(agentProfileId),
          getPayoutRequestsThisMonth(agentProfileId)
        ]);
        setAvailableBalance(balance);
        setRequestsThisMonth(requests);
      } catch (error) {
        console.error("Error fetching payout data:", error);
        toast.error("Failed to load payout information");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    
    if (amountNum < 50) {
      toast.error("Minimum payout amount is $50");
      return;
    }

    if (availableBalance !== null && amountNum > availableBalance) {
      toast.error("Amount exceeds available balance");
      return;
    }

    if (requestsThisMonth !== null && requestsThisMonth >= 2) {
      toast.error("Maximum 2 payout requests per month allowed");
      return;
    }

    setIsSubmitting(true);

    try {
      await createPayoutRequest(agentProfileId, amountNum, paymentMethod);
      toast.success("Payout request submitted successfully");
      onSuccess();
      onClose();
      setAmount("");
      setPaymentMethod("");
    } catch (error: any) {
      console.error("Error creating payout request:", error);
      toast.error(error.message || "Failed to submit payout request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
      else handleOpen();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Submit a request to withdraw your approved commissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div>Available Balance: <strong>$ {availableBalance?.toFixed(2) || '0.00'}</strong></div>
                <div className="text-sm text-muted-foreground">
                  Requests this month: {requestsThisMonth} / 2
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {requestsThisMonth !== null && requestsThisMonth >= 2 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have reached the maximum of 2 payout requests per month
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Minimum $50)</Label>
            <Input
              id="amount"
              type="number"
              min="50"
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={requestsThisMonth !== null && requestsThisMonth >= 2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="wallet">Digital Wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Payouts are processed every Wednesday after approval. 
              Make sure your payment details are up to date in Settings.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || (requestsThisMonth !== null && requestsThisMonth >= 2)}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
