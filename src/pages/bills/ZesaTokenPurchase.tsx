import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Loader2, CheckCircle, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MobileAppLayout from "@/components/MobileAppLayout";
import { TodaPayCheckout, OmariCheckout, InnBucksCheckout } from "@/components/checkout";
import { UniversalBillReceipt } from "@/components/bills/UniversalBillReceipt";
import { createNotification } from "@/services/userNotificationService";
import { sendBillPaymentNotification, sendBillPaymentPendingNotification } from "@/services/notificationService";
import { recordBillerUsage } from "@/hooks/useSavedBillers";
import { cn } from "@/lib/utils";
import omariLogo from "@/assets/omari-logo.png";
import innbucksLogo from "@/assets/innbucks-logo.png";

const ZETDC_LOGO = "https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/ZETDC_logo.png/200px-ZETDC_logo.png";

const normalizeFunctionPayload = (data: unknown) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  if (data && typeof data === "object") {
    return data as Record<string, any>;
  }

  return null;
};

const isRecoverableVerificationError = (message?: string) => {
  if (!message) return false;
  return /api error|timeout|network|failed to fetch|invalid response|502|503|504|401|500/i.test(message);
};

const ZesaTokenPurchase = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState<'input' | 'confirm' | 'payment' | 'receipt' | 'pending'>('input');
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<'USD' | 'ZWG'>("USD");
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showSuvatPay, setShowSuvatPay] = useState(false);
  const [showOmari, setShowOmari] = useState(false);
  const [showInnBucks, setShowInnBucks] = useState(false);
  const [pendingRef, setPendingRef] = useState<{ vendorReference?: string; transactionReference?: string } | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"suvat_pay" | "omari" | "innbucks">("suvat_pay");

  const meterValid = /^\d{11}$/.test(meterNumber);
  const amountNum = parseFloat(amount);
  const amountValid = !isNaN(amountNum) && amountNum >= 0.5 && amountNum <= 50000;

  const handleLookup = async () => {
    if (!meterValid) {
      toast({ title: "Invalid Meter", description: "Meter number must be exactly 11 digits", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("esolutions-bill-pay", {
        body: { action: "customer-info", merchantId: "zetdc", accountNumber: meterNumber, currency },
      });

      const parsed = normalizeFunctionPayload(data);

      if (error || !parsed) {
        toast({
          title: "Verification Unavailable",
          description: "Could not verify meter right now. You can still continue.",
        });
        setCustomerInfo({
          meterNumber,
          customerName: "ZESA Customer",
          address: "Zimbabwe",
          meterCurrency: currency,
        });
        setStep('confirm');
        setLoading(false);
        return;
      }

      if (!parsed.success && !parsed.skipValidation) {
        if (isRecoverableVerificationError(parsed.error)) {
          toast({
            title: "Verification Unavailable",
            description: "Gateway temporarily unavailable. You can still continue.",
          });
          setCustomerInfo({
            meterNumber,
            customerName: "ZESA Customer",
            address: "Zimbabwe",
            meterCurrency: currency,
          });
          setStep('confirm');
          setLoading(false);
          return;
        }

        toast({ title: "Verification Failed", description: parsed.error || "Could not verify meter", variant: "destructive" });
        setLoading(false);
        return;
      }

      setCustomerInfo({
        meterNumber,
        customerName: parsed.customerName || parsed.raw?.customerData || "ZESA Customer",
        address: parsed.customerAddress || "Zimbabwe",
        balance: parsed.balance,
        meterCurrency: currency,
      });
      setStep('confirm');
    } catch (err: any) {
      console.error("eSolutions ZESA lookup error:", err);
      toast({
        title: "Verification Unavailable",
        description: "Could not connect to gateway. You can still continue.",
      });
      setCustomerInfo({
        meterNumber,
        customerName: "ZESA Customer",
        address: "Zimbabwe",
        meterCurrency: currency,
      });
      setStep('confirm');
    }

    setLoading(false);
  };

  const handleProceedToPayment = async () => {
    if (!amountValid) {
      toast({ title: "Invalid Amount", description: `Enter between 0.50 and 50,000 ${currency}`, variant: "destructive" });
      return;
    }

    if (paymentMethod === "omari") {
      setShowOmari(true);
      setStep('payment');
      return;
    }

    if (paymentMethod === "innbucks") {
      setShowInnBucks(true);
      setStep('payment');
      return;
    }

    setShowSuvatPay(true);
    setStep('payment');
  };




  const handlePaymentComplete = async (paymentData: any) => {
    setShowSuvatPay(false);
    setLoading(true);

    const dateTime = new Date().toLocaleString();
    let txRef = paymentData?.transactionRef || `ZES-${Date.now()}`;
    let esolutionsResult: any = null;

    try {
      const { data, error } = await supabase.functions.invoke("esolutions-bill-pay", {
        body: { action: "pay", merchantId: "zetdc", accountNumber: meterNumber, amount: amountNum, currency },
      });

      if (error) throw new Error(error.message);
      esolutionsResult = data;

      if (data.pending) {
        setPendingRef({ vendorReference: data.vendorReference, transactionReference: data.transactionReference });
        await supabase.from("bill_payments").insert({
          user_id: user?.id || null, biller_type: "zetdc", biller_name: "ZETDC",
          account_number: meterNumber, amount: amountNum, currency,
          status: "pending_fulfillment", transaction_reference: txRef,
          payment_method: paymentMethod === "suvat_pay" ? "suvat_pay" : paymentMethod, metadata: { esolutions: data },
        });
        setStep('pending');
        setLoading(false);
        toast({ title: "Processing", description: "Your token is being generated. You can retry shortly." });
        return;
      }

      if (!data.success) {
        console.error("eSolutions fulfillment failed:", data.error);
        toast({ title: "Payment Received", description: "Your payment was collected but token delivery is pending. Our team will resolve this shortly.", variant: "destructive" });
      } else {
        txRef = data.transactionReference || txRef;
      }
    } catch (err: any) {
      console.error("eSolutions payment error:", err);
      toast({ title: "Payment Received", description: "Your payment was collected but token delivery is pending. Please contact support.", variant: "destructive" });
    }

    // Record in database (works for guests and logged-in users)
    const usedPaymentMethod = paymentData?.paymentMethod || "suvat_pay";
    await supabase.from("bill_payments").insert({
      user_id: user?.id || null, biller_type: "zetdc", biller_name: "ZETDC",
      account_number: meterNumber, amount: amountNum, currency,
      status: esolutionsResult?.success ? "completed" : "pending_fulfillment",
      transaction_reference: txRef, payment_method: usedPaymentMethod,
      metadata: esolutionsResult ? { esolutions: esolutionsResult } : null,
      tokens: esolutionsResult?.tokens ? { tokens: esolutionsResult.tokens, kwh: esolutionsResult.kwh } : null,
    });

    if (user) {
      await createNotification(
        user.id,
        esolutionsResult?.success ? "success" : "warning",
        `ZESA Token ${esolutionsResult?.success ? "Purchased" : "Processing"}`,
        `${currency} ${amountNum.toFixed(2)} - Meter: ${meterNumber}. ${esolutionsResult?.tokens ? `Token: ${esolutionsResult.tokens[0]}. ` : ""}Ref: ${txRef}`
      );

      if (esolutionsResult?.success) {
        sendBillPaymentNotification(user.id, user.email || '', 'ZETDC', meterNumber, amountNum, currency, txRef, esolutionsResult?.tokens, esolutionsResult?.kwh).catch(console.error);
      } else {
        sendBillPaymentPendingNotification(user.id, user.email || '', 'ZETDC', meterNumber, amountNum, currency).catch(console.error);
      }
    }

    if (esolutionsResult?.success) {
      recordBillerUsage({ billerId: "zetdc", billerName: "ZETDC", accountNumber: meterNumber });
    }

    setReceiptData({
      reference: txRef, billerName: "ZETDC", billerType: "Electricity Tokens",
      accountNumber: meterNumber, amount: amountNum, currency,
      paymentMethod: "suvat_pay", dateTime, logoUrl: ZETDC_LOGO,
      tokens: esolutionsResult?.tokens, kwh: esolutionsResult?.kwh,
      energyCharge: esolutionsResult?.energyCharge, debt: esolutionsResult?.debt,
      reaLevy: esolutionsResult?.reaLevy, vat: esolutionsResult?.vat,
    });

    setStep('receipt');
    setLoading(false);
    if (esolutionsResult?.success) {
      toast({ title: "Token Purchased!", description: "Your ZESA token is ready" });
    }
  };

  const handleRetry = async () => {
    if (!pendingRef) return;
    setRetrying(true);

    try {
      const { data, error } = await supabase.functions.invoke("esolutions-bill-pay", {
        body: {
          action: "resend", merchantId: "zetdc", accountNumber: meterNumber,
          amount: amountNum, currency,
          originalReference: pendingRef.vendorReference || pendingRef.transactionReference,
        },
      });

      if (error) throw new Error(error.message);

      if (data.pending) {
        toast({ title: "Still Processing", description: "Please wait a moment and try again.", variant: "destructive" });
        setRetrying(false);
        return;
      }

      if (data.success) {
        const dateTime = new Date().toLocaleString();
        const txRef = data.transactionReference || `ZES-${Date.now()}`;

        // Parse tokens from resend response
        let tokens: string[] = [];
        if (data.token && data.token !== "Accepted") {
          tokens = data.token.split("#").map((r: string) => r.split("|")[0]?.trim()).filter(Boolean);
        }

        setReceiptData({
          reference: txRef, billerName: "ZETDC", billerType: "Electricity Tokens",
          accountNumber: meterNumber, amount: amountNum, currency,
          paymentMethod: "suvat_pay", dateTime, logoUrl: ZETDC_LOGO,
          tokens: tokens.length > 0 ? tokens : undefined,
        });
        setStep('receipt');
        toast({ title: "Token Received!", description: "Your ZESA token is ready" });
      } else {
        toast({ title: "Retry Failed", description: data.narrative || "Please try again or contact support.", variant: "destructive" });
      }
    } catch (err: any) {
      console.error("Retry error:", err);
      toast({ title: "Retry Error", description: "Could not reach payment gateway.", variant: "destructive" });
    }

    setRetrying(false);
  };

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 bg-background border-b safe-area-pt px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <Link to="/pay/bills" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center tap-target">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <h1 className="font-bold text-lg">ZESA Electricity</h1>
                <p className="text-xs text-muted-foreground">ZETDC Token Purchase</p>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="px-4 py-5 space-y-5">
          {/* Step 1: Meter Input */}
          {step === 'input' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className="rounded-3xl border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">Buy Electricity</h2>
                      <p className="text-sm text-muted-foreground">Enter your meter number</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Meter Number</Label>
                    <Input
                      value={meterNumber}
                      onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="Enter 11-digit meter number"
                      className="h-14 text-lg font-mono rounded-2xl text-center tracking-widest"
                      inputMode="numeric"
                      maxLength={11}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      {meterNumber.length}/11 digits {meterValid && <CheckCircle className="inline w-3 h-3 text-green-500 ml-1" />}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Currency</Label>
                    <Select value={currency} onValueChange={(v) => setCurrency(v as 'USD' | 'ZWG')}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                        <SelectItem value="ZWG">🇿🇼 ZWG - Zimbabwe Gold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleLookup}
                    disabled={!meterValid || loading}
                    className="w-full h-14 rounded-full text-lg font-semibold"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {loading ? "Verifying..." : "Continue"}
                  </Button>
                </CardContent>
              </Card>

              <Alert className="rounded-2xl">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Ensure the meter number is correct. Tokens purchased for wrong meters cannot be reversed.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Step 2: Confirm & Amount */}
          {step === 'confirm' && customerInfo && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className="rounded-3xl border-0 shadow-lg">
                <CardContent className="p-4 space-y-4">
                  <div className="text-center py-2">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="font-bold text-lg">Meter Verified</h3>
                  </div>

                  <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Meter No.</span>
                      <span className="font-mono font-semibold">{customerInfo.meterNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customer</span>
                      <span className="font-medium">{customerInfo.customerName}</span>
                    </div>
                    {customerInfo.balance && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Balance</span>
                        <span className="font-semibold">{customerInfo.balance}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Currency</span>
                      <span className="font-medium">{currency}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Amount ({currency})</Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Min 0.50 ${currency}`}
                      className="h-14 text-2xl font-bold rounded-2xl text-center"
                      inputMode="decimal"
                      min="0.50"
                      max="50000"
                    />
                  </div>

                  {/* Payment Method Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Payment Method</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setPaymentMethod("suvat_pay")} className={cn("flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all min-h-[56px]", paymentMethod === "suvat_pay" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/40")}>
                        <span className="text-[10px] font-semibold">Suvat Pay</span>
                        <Badge variant="secondary" className="text-[7px] px-1 py-0">Top</Badge>
                      </button>
                      <button onClick={() => setPaymentMethod("omari")} className={cn("flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all min-h-[56px]", paymentMethod === "omari" ? "border-emerald-500 bg-emerald-500/5" : "border-border/50 hover:border-emerald-500/40")}>
                        <img src={omariLogo} alt="O'mari" className="h-5 w-5 object-contain" />
                        <span className="text-[10px] font-semibold">O'mari</span>
                      </button>
                      <button onClick={() => setPaymentMethod("innbucks")} className={cn("flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all min-h-[56px]", paymentMethod === "innbucks" ? "border-orange-500 bg-orange-500/5" : "border-border/50 hover:border-orange-500/40")}>
                        <img src={innbucksLogo} alt="InnBucks" className="h-5 w-5 object-contain" />
                        <span className="text-[10px] font-semibold">InnBucks</span>
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleProceedToPayment}
                    disabled={!amountValid || loading}
                    className="w-full h-14 rounded-full text-lg font-semibold"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Pay {amountValid ? `${currency} ${amountNum.toFixed(2)}` : ''}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => { setStep('input'); setCustomerInfo(null); }}
                    className="w-full rounded-full"
                  >
                    Change Meter
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Payment - Suvat Pay */}
          {step === 'payment' && showSuvatPay && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <TodaPayCheckout
                amount={amountNum}
                currency={currency}
                reason={`ZESA Token - Meter ${meterNumber}`}
                onCancel={() => { setShowSuvatPay(false); setStep('confirm'); }}
                onPaymentComplete={handlePaymentComplete}
              />
            </motion.div>
          )}

          {/* Step 3: Payment - O'mari */}
          {step === 'payment' && showOmari && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <OmariCheckout
                amount={amountNum}
                reference={`zetdc-${meterNumber}-${Date.now()}`}
                currency={currency}
                description={`ZESA Token - Meter ${meterNumber}`}
                onCancel={() => { setShowOmari(false); setStep('confirm'); }}
                onSuccess={(data) => {
                  setShowOmari(false);
                  handlePaymentComplete({ ...data, transactionRef: data.paymentReference || data.transactionId, paymentMethod: "omari" });
                }}
              />
            </motion.div>
          )}

          {/* Step 3: Payment - InnBucks */}
          {step === 'payment' && showInnBucks && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <InnBucksCheckout
                amount={amountNum}
                reference={`zetdc-${meterNumber}-${Date.now()}`}
                currency={currency}
                description={`ZESA Token - Meter ${meterNumber}`}
                onCancel={() => { setShowInnBucks(false); setStep('confirm'); }}
                onSuccess={(data) => {
                  setShowInnBucks(false);
                  handlePaymentComplete({ ...data, transactionRef: data.paymentReference || data.transactionId, paymentMethod: "innbucks" });
                }}
              />
            </motion.div>
          )}

          {/* Step: Pending / Retry */}
          {step === 'pending' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className="rounded-3xl border-0 shadow-lg">
                <CardContent className="p-6 space-y-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                    <RefreshCw className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Transaction Processing</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your payment was received but the token is still being generated. Tap retry to check again.
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-2xl p-4 space-y-2 text-sm text-left">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Meter</span>
                      <span className="font-mono font-semibold">{meterNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold">{currency} {amountNum.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleRetry}
                    disabled={retrying}
                    className="w-full h-14 rounded-full text-lg font-semibold"
                  >
                    {retrying ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                    {retrying ? "Checking..." : "Retry"}
                  </Button>

                  <Button variant="ghost" onClick={() => navigate('/pay/bills')} className="w-full rounded-full">
                    Go Back
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Receipt */}
          {step === 'receipt' && receiptData && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <UniversalBillReceipt data={receiptData} onDone={() => navigate('/pay/bills')} />
            </motion.div>
          )}
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default ZesaTokenPurchase;
