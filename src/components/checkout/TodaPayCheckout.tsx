import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CreditCard, Shield, Lock, Loader2, CheckCircle2,
  ArrowRight, Smartphone, Globe, Zap, AlertCircle
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Capacitor } from "@capacitor/core";

interface TodaPayCheckoutProps {
  amount: number;
  currency?: string;
  reason?: string;
  bookingId?: string;
  merchantProfileId?: string;
  merchantReference?: string;
  customer?: { email?: string; phoneNumber?: string; phone?: string; name?: string };
  preparePayment?: () => Promise<{
    bookingId?: string;
    merchantProfileId?: string | null;
    merchantReference?: string;
    customer?: { email?: string; phoneNumber?: string; phone?: string; name?: string };
  }>;
  onPaymentComplete?: (data: any) => void;
  onCancel?: () => void;
  compact?: boolean;
}

type PaymentChannel = 'card' | 'mobile_money' | 'bank';

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'ZWG', label: 'Zimbabwe Gold', symbol: 'ZiG' },
  { code: 'ZAR', label: 'South African Rand', symbol: 'R' },
  { code: 'BWP', label: 'Botswana Pula', symbol: 'P' },
  { code: 'ZMW', label: 'Zambian Kwacha', symbol: 'ZK' },
  { code: 'MZN', label: 'Mozambican Metical', symbol: 'MT' },
];

export function TodaPayCheckout({
  amount,
  currency = 'USD',
  reason,
  bookingId,
  merchantProfileId,
  merchantReference,
  customer,
  preparePayment,
  onPaymentComplete,
  onCancel,
  compact = false,
}: TodaPayCheckoutProps) {
  const { convertPrice } = useCurrency();
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>('card');
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channels: { id: PaymentChannel; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'card', label: 'Card', icon: <CreditCard className="h-5 w-5" />, desc: 'Visa, Mastercard' },
    { id: 'mobile_money', label: 'Mobile', icon: <Smartphone className="h-5 w-5" />, desc: 'EcoCash, M-Pesa' },
    { id: 'bank', label: 'Bank', icon: <Globe className="h-5 w-5" />, desc: 'Direct Transfer' },
  ];

  const handlePay = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const prepared = preparePayment ? await preparePayment() : {};
      const finalBookingId = prepared.bookingId || bookingId;
      const finalMerchantProfileId = prepared.merchantProfileId || merchantProfileId;
      const finalMerchantReference = prepared.merchantReference || merchantReference || finalBookingId;
      const finalCustomer = prepared.customer || customer;

      // Use proper deep link for mobile apps, web URL for browser
      const isNative = Capacitor.isNativePlatform();
      const returnUrl = isNative
        ? `todapay://payment/callback`
        : `${window.location.origin}/payment/callback`;
      const resultUrl = `${window.location.origin}/payment/result`;

      const { data, error: fnError } = await supabase.functions.invoke('suvat-pay', {
        body: {
          action: 'initiate',
          amount,
          currencyCode: selectedCurrency,
          reason: reason || 'TodaPay - Payment',
          returnUrl,
          resultUrl,
          bookingId: finalBookingId,
          merchantProfileId: finalMerchantProfileId,
          merchantReference: finalMerchantReference,
          customer: finalCustomer,
          paymentChannel: selectedChannel,
        },
      });

      if (fnError) throw fnError;

      if (data?.redirectUrl) {
        // Store payment reference for callback
        sessionStorage.setItem('suvat_pay_ref', JSON.stringify({
          referenceNumber: data.referenceNumber,
          bookingId: finalBookingId,
          merchantProfileId: finalMerchantProfileId,
          amount,
        }));
        
        // Redirect to payment page
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      toast.error('Payment initiation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl bg-card">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-primary-foreground">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BrandLogo size="xs" variant="white" />
              <div>
                <h3 className="font-bold text-sm tracking-wide">TODAPAY</h3>
                <p className="text-[10px] opacity-70">Secure Payment Gateway</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">
              <Lock className="h-3 w-3" />
              <span className="text-[10px] font-medium">SSL Secured</span>
            </div>
          </div>

          <div className="text-center py-2">
            <p className="text-xs opacity-70 mb-1">Amount to pay</p>
            <div className="text-4xl font-bold tracking-tight">
              {convertPrice(amount)}
            </div>
            {reason && (
              <p className="text-xs opacity-60 mt-1 truncate">{reason}</p>
            )}
          </div>
        </div>

        <CardContent className="p-5 space-y-5">
          {/* Currency Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pay in
            </label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="h-11 rounded-xl border-border/50 bg-muted/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{c.symbol}</span>
                      <span>{c.label}</span>
                      <span className="text-muted-foreground text-xs">({c.code})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Channels */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Payment method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200",
                    selectedChannel === ch.id
                      ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                      : "border-border/40 hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    selectedChannel === ch.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {ch.icon}
                  </div>
                  <span className="text-xs font-semibold">{ch.label}</span>
                  <span className="text-[9px] text-muted-foreground leading-tight text-center">{ch.desc}</span>
                  {selectedChannel === ch.id && (
                    <motion.div
                      layoutId="channel-check"
                      className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                    >
                      <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pay Button */}
          <Button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full h-13 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            size="lg"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting to TodaPay...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Pay {convertPrice(amount)}
                <ArrowRight className="h-4 w-4 ml-1" />
              </span>
            )}
          </Button>

          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              className="w-full text-muted-foreground"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          )}

          {/* Trust Badges */}
          <Separator />
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              <span>Instant Processing</span>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/60">
            Powered by <span className="font-semibold text-muted-foreground/80">TodaPay</span> · Toda Technologies
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
