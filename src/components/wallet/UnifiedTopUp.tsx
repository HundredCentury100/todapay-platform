import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  CreditCard, Wallet, CheckCircle, Loader2, 
  Smartphone, Building2, ArrowLeft, Sparkles
} from "lucide-react";
import { TOP_UP_AMOUNTS } from "@/services/userWalletService";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUserWallet } from "@/hooks/useUserWallet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface UnifiedTopUpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: string;
}

type PaymentMethod = 'card' | 'eft' | 'mobile_money';
type Step = 'amount' | 'payment' | 'processing' | 'success';

export function UnifiedTopUp({
  open,
  onOpenChange,
  currency = 'USD',
}: UnifiedTopUpProps) {
  const isMobile = useIsMobile();
  const { wallet, topUp, isTopping } = useUserWallet();
  const { user } = useAuth();
  const { currency: platformCurrency, convertPrice } = useCurrency();
  const currencySymbol = platformCurrency.symbol;
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [step, setStep] = useState<Step>('amount');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');

  const amount = selectedAmount || Number(customAmount) || 0;

  const handleSelectAmount = (value: number) => {
    setSelectedAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleProceedToPayment = () => {
    if (amount >= 5) {
      setStep('payment');
    } else {
      toast.error(`Minimum top-up amount is ${currencySymbol}5`);
    }
  };

  const handlePayment = async () => {
    if (!wallet?.id || !user?.id) {
      toast.error('Wallet not ready. Please try again.');
      return;
    }

    setStep('processing');
    
    try {
      const returnUrl = `${window.location.origin}/payment/callback`;
      const resultUrl = `${window.location.origin}/payment/callback`;

      const { data, error } = await supabase.functions.invoke('toda-pay', {
        body: {
          action: 'initiate',
          amount,
          currencyCode: 'USD',
          reason: `TodaPay - Wallet Top-Up (${convertPrice(amount)})`,
          resultUrl,
          returnUrl,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Payment initiation failed');
      }

      if (!data?.referenceNumber || !data?.redirectUrl) {
        throw new Error('No reference number or payment URL received from payment gateway');
      }

      // Store reference and URL for callback processing
      sessionStorage.setItem('toda_pay_ref', JSON.stringify({
        referenceNumber: data.referenceNumber,
        pollUrl: data.pollUrl,
        type: 'wallet_topup',
        walletId: wallet.id,
        userId: user.id,
        amount,
        paymentUrl: data.redirectUrl, // Store payment URL for button
      }));

      console.log('✅ Wallet top-up payment initiated');
      console.log('📌 Reference:', data.referenceNumber);
      console.log('🔗 Payment URL:', data.redirectUrl);

      // Navigate to callback page which will show payment button and start polling
      window.location.href = '/payment/callback';
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setStep('payment');
    }
  };

  const handleClose = () => {
    setStep('amount');
    setSelectedAmount(null);
    setCustomAmount('');
    setPaymentMethod('mobile_money');
    onOpenChange(false);
  };

  const handleBack = () => {
    if (step === 'payment') {
      setStep('amount');
    }
  };

  const content = (
    <AnimatePresence mode="wait">
      {step === 'amount' && (
        <motion.div
          key="amount"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex flex-col h-full"
        >
          <div className="flex-1 overflow-auto space-y-6 py-2">
            {/* Quick Amount Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Quick Select</Label>
              <div className="grid grid-cols-3 gap-2">
                {TOP_UP_AMOUNTS.slice(0, 6).map((value) => (
                  <Button
                    key={value}
                    variant={selectedAmount === value ? 'default' : 'outline'}
                    className={cn(
                      "h-14 text-base font-semibold relative transition-all",
                      selectedAmount === value && "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => handleSelectAmount(value)}
                  >
                    {convertPrice(value)}
                    {value >= 50 && (
                      <Badge 
                        className="absolute -top-2 -right-2 text-[9px] px-1.5 py-0.5 bg-amber-500 text-white border-0"
                      >
                        <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                        Bonus
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <Label htmlFor="customAmount" className="text-sm font-medium">
                Custom Amount
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  {currencySymbol}
                </span>
                <Input
                  id="customAmount"
                  type="number"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-8 h-14 text-lg font-semibold rounded-xl"
                  min={5}
                  step={5}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Min: {currencySymbol}5 • Max: {currencySymbol}1,000
              </p>
            </div>

            {/* Summary */}
            {amount > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/50 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-semibold">{convertPrice(amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fee</span>
                  <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-900/20">
                    Free
                  </Badge>
                </div>
                {amount >= 25 && (
                  <div className="flex items-center justify-between text-amber-600">
                    <span className="text-sm flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Bonus Points
                    </span>
                    <span className="font-medium">+{Math.round(amount * 2)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">You Pay</span>
                    <span className="text-xl font-bold text-primary">
                       {convertPrice(amount)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sticky CTA */}
          <div className="pt-4 border-t mt-auto">
            <Button
              className="w-full h-14 text-base font-semibold rounded-xl"
              disabled={amount < 5}
              onClick={handleProceedToPayment}
            >
              Continue
            </Button>
          </div>
        </motion.div>
      )}

      {step === 'payment' && (
        <motion.div
          key="payment"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="flex flex-col h-full"
        >
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-10 w-10 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <span className="block font-semibold">Payment Method</span>
              <span className="text-sm text-muted-foreground">Select how to pay</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto space-y-4 py-2">
            {/* Amount Display */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground text-center">
              <p className="text-sm opacity-80 mb-1">Top-up Amount</p>
              <p className="text-3xl font-bold">{convertPrice(amount)}</p>
            </div>

            {/* Payment Methods */}
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="space-y-3">
              <Label
                htmlFor="mobile_money"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all tap-target",
                  paymentMethod === 'mobile_money' ? 'border-primary bg-primary/5 shadow-sm' : 'border-muted hover:border-muted-foreground/30'
                )}
              >
                <RadioGroupItem value="mobile_money" id="mobile_money" className="sr-only" />
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center",
                  paymentMethod === 'mobile_money' ? 'bg-green-500' : 'bg-green-100 dark:bg-green-900/30'
                )}>
                  <Smartphone className={cn("h-6 w-6", paymentMethod === 'mobile_money' ? 'text-white' : 'text-green-600')} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Mobile Money</p>
                  <p className="text-sm text-muted-foreground">
                    TodaPay, O'mari • Instant
                  </p>
                </div>
                {paymentMethod === 'mobile_money' && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </Label>

              <Label
                htmlFor="card"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all tap-target",
                  paymentMethod === 'card' ? 'border-primary bg-primary/5 shadow-sm' : 'border-muted hover:border-muted-foreground/30'
                )}
              >
                <RadioGroupItem value="card" id="card" className="sr-only" />
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center",
                  paymentMethod === 'card' ? 'bg-blue-500' : 'bg-blue-100 dark:bg-blue-900/30'
                )}>
                  <CreditCard className={cn("h-6 w-6", paymentMethod === 'card' ? 'text-white' : 'text-blue-600')} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Card Payment</p>
                  <p className="text-sm text-muted-foreground">
                    Visa, Mastercard • Instant
                  </p>
                </div>
                {paymentMethod === 'card' && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </Label>

              <Label
                htmlFor="eft"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all tap-target",
                  paymentMethod === 'eft' ? 'border-primary bg-primary/5 shadow-sm' : 'border-muted hover:border-muted-foreground/30'
                )}
              >
                <RadioGroupItem value="eft" id="eft" className="sr-only" />
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center",
                  paymentMethod === 'eft' ? 'bg-slate-600' : 'bg-slate-100 dark:bg-slate-800'
                )}>
                  <Building2 className={cn("h-6 w-6", paymentMethod === 'eft' ? 'text-white' : 'text-slate-600 dark:text-slate-300')} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Bank Transfer</p>
                  <p className="text-sm text-muted-foreground">
                    Direct deposit • 1-24 hrs
                  </p>
                </div>
                {paymentMethod === 'eft' && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </Label>
            </RadioGroup>
          </div>

          {/* Sticky CTA */}
          <div className="pt-4 border-t mt-auto">
            <Button
              className="w-full h-14 text-base font-semibold rounded-xl"
              onClick={handlePayment}
            >
              Pay {convertPrice(amount)} with TodaPay
            </Button>
          </div>
        </motion.div>
      )}

      {step === 'processing' && (
        <motion.div
          key="processing"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-full py-12"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-16 w-16 text-primary" />
          </motion.div>
          <h3 className="text-xl font-semibold mt-6 mb-2">Connecting to TodaPay</h3>
          <p className="text-muted-foreground text-center">
            You'll be redirected to complete your payment...
          </p>
        </motion.div>
      )}

      {step === 'success' && (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-full py-8"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6"
          >
            <CheckCircle className="h-10 w-10 text-green-600" />
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h3 className="text-2xl font-bold mb-2">Top-up Successful!</h3>
            <p className="text-muted-foreground mb-2">
              {convertPrice(amount)} added to your wallet
            </p>
            {amount >= 25 && (
              <motion.p 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-amber-600 font-medium flex items-center justify-center gap-1"
              >
                <Sparkles className="h-4 w-4" />
                +{Math.round(amount * 2)} bonus points earned!
              </motion.p>
            )}
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full mt-8"
          >
            <Button onClick={handleClose} className="w-full h-14 text-base font-semibold rounded-xl">
              Done
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Mobile: Sheet (bottom drawer)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl px-4 pb-safe">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-left">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="block">Top Up Wallet</span>
                <span className="text-sm font-normal text-muted-foreground">Add funds for faster checkout</span>
              </div>
            </SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Top Up Wallet
          </DialogTitle>
          <DialogDescription>
            Add funds for faster checkout and earn bonus points
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UnifiedTopUp;
