import { useState } from 'react';
import { Check, Banknote, Smartphone, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface RidePaymentConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  expectedAmount: number;
  currency?: string;
  onConfirmed?: () => void;
}

type PaymentMethod = 'cash' | 'toda_pay' | 'omari';

const PAYMENT_METHODS = [
  { id: 'cash' as PaymentMethod, label: 'Cash', icon: Banknote },
  { id: 'toda_pay' as PaymentMethod, label: 'TodaPay', icon: Smartphone },
  { id: 'omari' as PaymentMethod, label: "O'mari", icon: Smartphone },
];

export function RidePaymentConfirmation({
  open,
  onOpenChange,
  rideId,
  expectedAmount,
  currency = 'ZAR',
  onConfirmed,
}: RidePaymentConfirmationProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountCollected, setAmountCollected] = useState(expectedAmount.toString());
  const [includedTip, setIncludedTip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    const amount = parseFloat(amountCollected);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount < expectedAmount * 0.9) {
      toast.error('Amount collected is significantly less than expected');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('active_rides')
        .update({
          payment_collected_by_driver: true,
          payment_collected_amount: amount,
          payment_collected_method: paymentMethod,
          payment_status: 'paid',
          payment_completed_at: new Date().toISOString(),
          tip_amount: includedTip && amount > expectedAmount ? amount - expectedAmount : 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId);

      if (error) throw error;

      toast.success('Payment confirmed successfully');
      onConfirmed?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tipAmount = parseFloat(amountCollected) - expectedAmount;
  const showTipOption = tipAmount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            Confirm Payment Received
          </DialogTitle>
          <DialogDescription>
            Confirm the payment you collected from the passenger.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Expected Amount Display */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Trip Fare</p>
            <p className="text-3xl font-bold">
              {currency} {expectedAmount.toFixed(2)}
            </p>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              className="grid grid-cols-3 gap-2"
            >
              {PAYMENT_METHODS.map((method) => (
                <Label
                  key={method.id}
                  htmlFor={method.id}
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                  <method.icon className={`h-5 w-5 ${paymentMethod === method.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-xs font-medium">{method.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Amount Collected */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount Collected ({currency})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amountCollected}
              onChange={(e) => setAmountCollected(e.target.value)}
              placeholder={expectedAmount.toString()}
            />
            {showTipOption && (
              <p className="text-sm text-primary">
                +{currency} {tipAmount.toFixed(2)} above fare
              </p>
            )}
          </div>

          {/* Tip Toggle */}
          {showTipOption && (
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div>
                <p className="text-sm font-medium">Include as tip?</p>
                <p className="text-xs text-muted-foreground">
                  {currency} {tipAmount.toFixed(2)} extra collected
                </p>
              </div>
              <Switch
                checked={includedTip}
                onCheckedChange={setIncludedTip}
              />
            </div>
          )}

          {/* Confirmation Warning */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              By confirming, you acknowledge that you have collected payment from the passenger. 
              This will mark the ride as complete.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
