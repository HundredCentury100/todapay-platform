import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wallet, Banknote, CreditCard, CheckCircle, Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserWallet } from "@/hooks/useUserWallet";
import { toast } from "sonner";
import { SuvatPayCheckout } from "@/components/checkout";

interface RidePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  amount: number;
  onPaymentComplete: (method: string) => void;
}

export const RidePaymentModal = ({
  open,
  onOpenChange,
  rideId,
  amount,
  onPaymentComplete,
}: RidePaymentModalProps) => {
  const { wallet, balance } = useUserWallet();
  const [paymentMethod, setPaymentMethod] = useState<string>("suvat_pay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuvatPay, setShowSuvatPay] = useState(false);

  const hasEnoughBalance = balance >= amount;

  const handlePayment = async () => {
    if (paymentMethod === "suvat_pay") {
      setShowSuvatPay(true);
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === "wallet") {
        if (!hasEnoughBalance) {
          toast.error("Insufficient wallet balance");
          setIsProcessing(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase.rpc('pay_ride_with_wallet', {
          p_ride_id: rideId,
          p_user_id: user.id,
        });

        if (error) throw error;

        const result = data as { success: boolean; error?: string };
        if (!result.success) {
          throw new Error(result.error || "Payment failed");
        }

        toast.success("Payment successful!");
      } else {
        // For cash, just update the payment method
        await supabase
          .from('active_rides')
          .update({ payment_method: paymentMethod })
          .eq('id', rideId);

        toast.success(`Payment method set to ${paymentMethod}`);
      }

      onPaymentComplete(paymentMethod);
      onOpenChange(false);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuvatPayComplete = async (data: any) => {
    try {
      await supabase
        .from('active_rides')
        .update({ 
          payment_method: 'suvat_pay', 
          payment_status: 'paid',
          payment_completed_at: new Date().toISOString(),
        })
        .eq('id', rideId);
      
      toast.success("Payment successful!");
      onPaymentComplete("suvat_pay");
      onOpenChange(false);
    } catch (error) {
      console.error("Suvat Pay completion error:", error);
      toast.error("Payment recording failed.");
    }
  };

  if (showSuvatPay) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay with Suvat Pay</DialogTitle>
            <DialogDescription>Complete your ride payment securely</DialogDescription>
          </DialogHeader>
          <SuvatPayCheckout
            amount={amount}
            reason={`Ride payment`}
            onCancel={() => setShowSuvatPay(false)}
            onPaymentComplete={handleSuvatPayComplete}
            compact
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            Choose how you'd like to pay for your ride
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount */}
          <div className="text-center py-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Trip fare</p>
            <p className="text-3xl font-bold text-primary">${amount}</p>
          </div>

          {/* Payment Methods */}
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            {/* Suvat Pay - Default */}
            <Label
              htmlFor="suvat_pay"
              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                paymentMethod === 'suvat_pay' ? 'border-primary bg-primary/5' : 'border-muted'
              }`}
            >
              <RadioGroupItem value="suvat_pay" id="suvat_pay" />
              <Shield className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Suvat Pay</p>
                <p className="text-sm text-muted-foreground">Card, Mobile Money, Bank</p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Recommended
              </Badge>
            </Label>

            {/* Wallet */}
            <Label
              htmlFor="wallet"
              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : 'border-muted'
              }`}
            >
              <RadioGroupItem value="wallet" id="wallet" />
              <Wallet className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Wallet</p>
                <p className="text-sm text-muted-foreground">Balance: ${balance.toFixed(2)}</p>
              </div>
              {hasEnoughBalance ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              ) : (
                <Badge variant="destructive">Insufficient</Badge>
              )}
            </Label>

            {/* Cash */}
            <Label
              htmlFor="cash"
              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-muted'
              }`}
            >
              <RadioGroupItem value="cash" id="cash" />
              <Banknote className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">Cash</p>
                <p className="text-sm text-muted-foreground">Pay driver directly</p>
              </div>
            </Label>
          </RadioGroup>

          {/* Pay Button */}
          <Button 
            onClick={handlePayment} 
            className="w-full" 
            size="lg"
            disabled={isProcessing || (paymentMethod === 'wallet' && !hasEnoughBalance)}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
             ) : paymentMethod === 'suvat_pay' ? (
               `Pay $${amount} with Suvat Pay`
             ) : paymentMethod === 'wallet' ? (
               `Pay $${amount} from Wallet`
            ) : (
              `Confirm ${paymentMethod} payment`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RidePaymentModal;
