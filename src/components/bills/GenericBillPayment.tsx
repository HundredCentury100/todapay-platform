import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Loader2, CheckCircle, Info, LucideIcon, RefreshCw, Wallet, Smartphone } from "lucide-react";
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
import { recordBillerUsage } from "@/hooks/useSavedBillers";
import { sendBillPaymentNotification, sendBillPaymentPendingNotification } from "@/services/notificationService";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import omariLogo from "@/assets/omari-logo.png";
import innbucksLogo from "@/assets/innbucks-logo.png";

interface MerchantConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  logoUrl?: string;
  accountLabel: string;
  accountPlaceholder: string;
  accountValidation: (value: string) => boolean;
  accountMaxLength: number;
  accountInputMode?: "numeric" | "text" | "tel";
  minAmount: number;
  maxAmount: number;
  currencies: { code: string; label: string }[];
  defaultCurrency: "USD" | "ZWG";
  infoText: string;
  supportsCustomerInfo?: boolean;
  serviceFee?: number;
}

interface GenericBillPaymentProps {
  config: MerchantConfig;
}

const isRecoverableVerificationError = (message?: string) => {
  if (!message) return false;
  return /api error|timeout|network|failed to fetch|invalid response|502|503|504|401|500/i.test(message);
};

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

export const GenericBillPayment = ({ config }: GenericBillPaymentProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState<"input" | "confirm" | "payment" | "receipt" | "pending">("input");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "ZWG">(config.defaultCurrency);
  const [loading, setLoading] = useState(false);
  const [showTodaPay, setShowTodaPay] = useState(false);
  const [showOmari, setShowOmari] = useState(false);
  const [showInnBucks, setShowInnBucks] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [customerInfo, setCustomerInfo] = useState<{ name?: string; address?: string; balance?: string; monthlyPremium?: string } | null>(null);
  const [pendingRef, setPendingRef] = useState<{ vendorReference?: string; transactionReference?: string } | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"toda_pay" | "wallet" | "omari" | "innbucks">("toda_pay");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  // Fetch wallet balance when user is logged in
  useEffect(() => {
    if (!user) return;
    const fetchWallet = async () => {
      const { data } = await supabase
        .from("user_wallets")
        .select("id, balance")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setWalletBalance(data.balance);
        setWalletId(data.id);
      }
    };
    fetchWallet();
  }, [user]);

  const serviceFee = config.serviceFee || 0;
  const accountValid = config.accountValidation(accountNumber);
  const amountNum = parseFloat(amount);
  const amountValid = !isNaN(amountNum) && amountNum >= config.minAmount && amountNum <= config.maxAmount;
  const totalAmount = amountValid ? amountNum + serviceFee : 0;

  const handleLookup = async () => {
    if (!accountValid) {
      toast({ title: "Invalid Account", description: `Please enter a valid ${config.accountLabel.toLowerCase()}`, variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      // Call eSolutions for customer info if supported
      if (config.supportsCustomerInfo) {
        const { data, error } = await supabase.functions.invoke("esolutions-bill-pay", {
          body: {
            action: "customer-info",
            merchantId: config.id,
            accountNumber,
            currency,
          },
        });

        const parsed = normalizeFunctionPayload(data);

        if (error || !parsed) {
          console.error("eSolutions lookup network error:", error || data);
          // Allow proceeding without verification on network/API errors
          toast({
            title: "Verification Unavailable",
            description: "Could not verify account right now. You can still proceed with payment.",
          });
          setCustomerInfo(null);
          setStep("confirm");
          setLoading(false);
          return;
        }

        if (!parsed.success && !parsed.skipValidation) {
          if (isRecoverableVerificationError(parsed.error)) {
            toast({
              title: "Verification Unavailable",
              description: "Payment gateway temporarily unavailable. You can still proceed.",
            });
            setCustomerInfo(null);
            setStep("confirm");
            setLoading(false);
            return;
          }

          toast({
            title: "Verification Failed",
            description: parsed.error || "Could not verify account. Please check the account number.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (parsed.success && !parsed.skipValidation) {
          setCustomerInfo({
            name: parsed.customerName || parsed.raw?.customerData || parsed.raw?.customer,
            address: parsed.customerAddress || parsed.raw?.customerAddress,
            balance: parsed.balance || parsed.raw?.customerBalance || parsed.raw?.arrears,
            monthlyPremium: parsed.monthlyPremium,
          });
        }
      }

      setStep("confirm");
    } catch (err: any) {
      console.error("eSolutions lookup error:", err);
      // Allow proceeding on any unexpected error
      toast({
        title: "Verification Unavailable",
        description: "Could not connect to payment gateway. You can still proceed with payment.",
      });
      setCustomerInfo(null);
      setStep("confirm");
    }

    setLoading(false);
  };

  const handleProceedToPayment = async () => {
    if (!amountValid) {
      toast({ title: "Invalid Amount", description: `Enter between ${config.minAmount} and ${config.maxAmount.toLocaleString()} ${currency}`, variant: "destructive" });
      return;
    }

    if (paymentMethod === "wallet") {
      await handleWalletPayment();
      return;
    }

    if (paymentMethod === "omari") {
      setShowOmari(true);
      setStep("payment");
      return;
    }

    if (paymentMethod === "innbucks") {
      setShowInnBucks(true);
      setStep("payment");
      return;
    }

    setShowTodaPay(true);
    setStep("payment");
  };

  const handleWalletPayment = async () => {
    if (!user || !walletId) {
      toast({ title: "Login Required", description: "Please sign in to use wallet payment.", variant: "destructive" });
      return;
    }
    if (walletBalance === null || walletBalance < totalAmount) {
      toast({ title: "Insufficient Balance", description: `Your wallet balance is too low. Top up your wallet first.`, variant: "destructive" });
      return;
    }

    setWalletLoading(true);
    const dateTime = new Date().toLocaleString();
    let txRef = `WALLET-${config.id.toUpperCase()}-${Date.now()}`;

    try {
      // Deduct from wallet
      const { data: txn, error: walletError } = await supabase.rpc("deduct_user_wallet", {
        p_wallet_id: walletId,
        p_amount: totalAmount,
        p_description: `${config.name} bill payment - ${accountNumber}`,
      });

      if (walletError) throw walletError;

      // Update local balance
      setWalletBalance((prev) => (prev !== null ? prev - totalAmount : null));

      // Fulfill via eSolutions
      let esolutionsResult: any = null;
      try {
        const { data, error } = await supabase.functions.invoke("esolutions-bill-pay", {
          body: { action: "pay", merchantId: config.id, accountNumber, amount: amountNum, currency },
        });
        if (!error) esolutionsResult = data;
      } catch (err) {
        console.error("eSolutions fulfillment error:", err);
      }

      // Record in database
      await supabase.from("bill_payments").insert({
        user_id: user.id, biller_type: config.id, biller_name: config.name,
        account_number: accountNumber, amount: amountNum, currency,
        status: esolutionsResult?.success ? "completed" : "pending_fulfillment",
        transaction_reference: txRef, payment_method: "wallet",
        metadata: esolutionsResult ? { esolutions: esolutionsResult } : null,
        tokens: esolutionsResult?.tokens || null,
      });

      await createNotification(
        user.id,
        esolutionsResult?.success ? "success" : "warning",
        `${config.name} Payment ${esolutionsResult?.success ? "Confirmed" : "Processing"}`,
        `${currency} ${amountNum.toFixed(2)} paid via wallet to ${config.name} (${accountNumber}). Ref: ${txRef}`
      );

      if (esolutionsResult?.success) {
        sendBillPaymentNotification(
          user.id, user.email || '', config.name, accountNumber,
          amountNum, currency, txRef, esolutionsResult?.tokens, esolutionsResult?.kwh
        ).catch(console.error);
        recordBillerUsage({ billerId: config.id, billerName: config.name, accountNumber });
      }

      setReceiptData({
        reference: txRef, billerName: config.name, billerType: config.description,
        accountNumber, amount: amountNum, currency, paymentMethod: "wallet",
        dateTime, logoUrl: config.logoUrl,
        tokens: esolutionsResult?.tokens, kwh: esolutionsResult?.kwh,
        energyCharge: esolutionsResult?.energyCharge, debt: esolutionsResult?.debt,
        reaLevy: esolutionsResult?.reaLevy, vat: esolutionsResult?.vat,
      });
      setStep("receipt");
      toast({ title: "Payment Successful!", description: `Paid via wallet` });
    } catch (err: any) {
      console.error("Wallet payment error:", err);
      toast({ title: "Payment Failed", description: err.message || "Could not process wallet payment.", variant: "destructive" });
    }

    setWalletLoading(false);
  };

  const handlePaymentComplete = async (paymentData: any) => {
    setShowTodaPay(false);
    setLoading(true);

    const dateTime = new Date().toLocaleString();
    let txRef = paymentData?.transactionRef || `${config.id.toUpperCase()}-${Date.now()}`;
    let esolutionsResult: any = null;

    try {
      // After TodaPay collects money, fulfill the bill via eSolutions
      const { data, error } = await supabase.functions.invoke("esolutions-bill-pay", {
        body: {
          action: "pay",
          merchantId: config.id,
          accountNumber,
          amount: amountNum,
          currency,
        },
      });

      if (error) throw new Error(error.message);

      esolutionsResult = data;

      if (data.pending) {
        // Transaction still processing — show retry UI
        setPendingRef({ vendorReference: data.vendorReference, transactionReference: data.transactionReference });
        await supabase.from("bill_payments").insert({
          user_id: user?.id || null, biller_type: config.id, biller_name: config.name,
          account_number: accountNumber, amount: amountNum, currency,
          status: "pending_fulfillment", transaction_reference: txRef,
          payment_method: "toda_pay", metadata: { esolutions: data },
        });
        setStep("pending");
        setLoading(false);
        toast({ title: "Processing", description: "Your transaction is being processed. You can retry shortly." });
        return;
      }

      if (!data.success) {
        console.error("eSolutions fulfillment failed:", data.error);
        toast({
          title: "Payment Received",
          description: "Your payment was collected but service delivery is pending. Our team will resolve this shortly.",
          variant: "destructive",
        });
      } else {
        txRef = data.transactionReference || txRef;
      }
    } catch (err: any) {
      console.error("eSolutions payment error:", err);
      toast({
        title: "Payment Received",
        description: "Your payment was collected but service delivery is pending. Please contact support.",
        variant: "destructive",
      });
    }

    // Record in database (works for both guests and logged-in users)
    await supabase.from("bill_payments").insert({
      user_id: user?.id || null,
      biller_type: config.id,
      biller_name: config.name,
      account_number: accountNumber,
      amount: amountNum,
      currency,
      status: esolutionsResult?.success ? "completed" : "pending_fulfillment",
      transaction_reference: txRef,
      payment_method: "toda_pay",
      metadata: esolutionsResult ? { esolutions: esolutionsResult } : null,
      tokens: esolutionsResult?.tokens ? esolutionsResult.tokens : null,
    });

    if (user) {
      await createNotification(
        user.id,
        esolutionsResult?.success ? "success" : "warning",
        `${config.name} Payment ${esolutionsResult?.success ? "Confirmed" : "Processing"}`,
        `${currency} ${amountNum.toFixed(2)} paid to ${config.name} (${accountNumber}). Ref: ${txRef}`
      );

      // Send email notification
      if (esolutionsResult?.success) {
        sendBillPaymentNotification(
          user.id, user.email || '', config.name, accountNumber,
          amountNum, currency, txRef, esolutionsResult?.tokens, esolutionsResult?.kwh
        ).catch(console.error);
      } else {
        sendBillPaymentPendingNotification(
          user.id, user.email || '', config.name, accountNumber, amountNum, currency
        ).catch(console.error);
      }
    }

    setReceiptData({
      reference: txRef,
      billerName: config.name,
      billerType: config.description,
      accountNumber,
      amount: amountNum,
      currency,
      paymentMethod: "toda_pay",
      dateTime,
      logoUrl: config.logoUrl,
      tokens: esolutionsResult?.tokens,
      kwh: esolutionsResult?.kwh,
      energyCharge: esolutionsResult?.energyCharge,
      debt: esolutionsResult?.debt,
      reaLevy: esolutionsResult?.reaLevy,
      vat: esolutionsResult?.vat,
    });

    setStep("receipt");
    setLoading(false);

    if (esolutionsResult?.success) {
      toast({ title: "Payment Successful!", description: `${config.name} payment completed` });
      recordBillerUsage({ billerId: config.id, billerName: config.name, accountNumber });
    }
  };

  const handleRetry = async () => {
    if (!pendingRef) return;
    setRetrying(true);

    try {
      const { data, error } = await supabase.functions.invoke("esolutions-bill-pay", {
        body: {
          action: "resend", merchantId: config.id, accountNumber,
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
        const txRef = data.transactionReference || `${config.id.toUpperCase()}-${Date.now()}`;

        setReceiptData({
          reference: txRef, billerName: config.name, billerType: config.description,
          accountNumber, amount: amountNum, currency,
          paymentMethod: "toda_pay", dateTime, logoUrl: config.logoUrl,
          tokens: data.tokens, kwh: data.kwh,
          energyCharge: data.energyCharge, debt: data.debt,
          reaLevy: data.reaLevy, vat: data.vat,
        });
        setStep("receipt");
        toast({ title: "Payment Successful!", description: `${config.name} payment completed` });
        recordBillerUsage({ billerId: config.id, billerName: config.name, accountNumber });

        // Send email + SMS notification on retry success
        if (user) {
          sendBillPaymentNotification(
            user.id, user.email || '', config.name, accountNumber,
            amountNum, currency, txRef, data.tokens, data.kwh
          ).catch(console.error);
        }
      } else {
        toast({ title: "Retry Failed", description: data.narrative || "Please try again or contact support.", variant: "destructive" });
      }
    } catch (err: any) {
      console.error("Retry error:", err);
      toast({ title: "Retry Error", description: "Could not reach payment gateway.", variant: "destructive" });
    }

    setRetrying(false);
  };

  const IconComponent = config.icon;

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
              {config.logoUrl ? (
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <img src={config.logoUrl} alt={config.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center`}>
                  <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg">{config.name}</h1>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="px-4 py-5 space-y-5">
          {step === "input" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className="rounded-3xl border-0 shadow-lg overflow-hidden">
                <div className={`bg-gradient-to-r ${config.iconBg} p-4`}>
                  <div className="flex items-center gap-3">
                    {config.logoUrl ? (
                      <div className="w-12 h-12 rounded-2xl bg-background/80 flex items-center justify-center p-1.5">
                        <img src={config.logoUrl} alt={config.name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-2xl ${config.iconBg} flex items-center justify-center`}>
                        <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
                      </div>
                    )}
                    <div>
                      <h2 className="font-bold text-lg">Pay {config.name}</h2>
                      <p className="text-sm text-muted-foreground">Enter your {config.accountLabel.toLowerCase()}</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{config.accountLabel}</Label>
                    <Input
                      value={accountNumber}
                      onChange={(e) => {
                        const val = config.accountInputMode === "numeric"
                          ? e.target.value.replace(/\D/g, "").slice(0, config.accountMaxLength)
                          : e.target.value.slice(0, config.accountMaxLength);
                        setAccountNumber(val);
                      }}
                      placeholder={config.accountPlaceholder}
                      className="h-14 text-lg font-mono rounded-2xl text-center tracking-widest"
                      inputMode={config.accountInputMode || "text"}
                      maxLength={config.accountMaxLength}
                    />
                    {accountValid && (
                      <p className="text-xs text-muted-foreground text-center">
                        <CheckCircle className="inline w-3 h-3 text-green-500 mr-1" />
                        Valid {config.accountLabel.toLowerCase()}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Currency</Label>
                    <Select value={currency} onValueChange={(v) => setCurrency(v as "USD" | "ZWG")}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.currencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleLookup}
                    disabled={!accountValid || loading}
                    className="w-full h-14 rounded-full text-lg font-semibold"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {loading ? "Verifying..." : "Continue"}
                  </Button>
                </CardContent>
              </Card>

              <Alert className="rounded-2xl">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">{config.infoText}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className="rounded-3xl border-0 shadow-lg">
                <CardContent className="p-4 space-y-4">
                  <div className="text-center py-2">
                    <div className={`w-16 h-16 rounded-full ${customerInfo ? 'bg-green-500/10' : 'bg-amber-500/10'} flex items-center justify-center mx-auto mb-3`}>
                      {customerInfo ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                      )}
                    </div>
                    <h3 className="font-bold text-lg">{customerInfo ? 'Account Verified' : 'Proceed to Payment'}</h3>
                    {!customerInfo && (
                      <p className="text-xs text-muted-foreground mt-1">Account verification unavailable. Please double-check details.</p>
                    )}
                  </div>

                  <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{config.accountLabel}</span>
                      <span className="font-mono font-semibold">{accountNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Merchant</span>
                      <span className="font-medium">{config.name}</span>
                    </div>
                    {customerInfo?.name && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium">{customerInfo.name}</span>
                      </div>
                    )}
                    {customerInfo?.address && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Address</span>
                        <span className="font-medium text-right max-w-[60%]">{customerInfo.address}</span>
                      </div>
                    )}
                    {customerInfo?.balance && (
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
                      placeholder={`Min ${config.minAmount} ${currency}`}
                      className="h-14 text-2xl font-bold rounded-2xl text-center"
                      inputMode="decimal"
                      min={config.minAmount}
                      max={config.maxAmount}
                    />
                  </div>

                  {serviceFee > 0 && amountValid && (
                    <div className="bg-muted/50 rounded-2xl p-3 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bill Amount</span>
                        <span className="font-medium">{currency} {amountNum.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service Fee</span>
                        <span className="font-medium">{currency} {serviceFee.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-1.5 flex justify-between text-sm font-bold">
                        <span>Total</span>
                        <span>{currency} {totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Payment Method Selection — available for all users */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Payment Method</Label>
                    <div className={cn("grid gap-2", user ? "grid-cols-2" : "grid-cols-3")}>
                      <button
                        onClick={() => setPaymentMethod("toda_pay")}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all min-h-[56px]",
                          paymentMethod === "toda_pay"
                            ? "border-primary bg-primary/5"
                            : "border-border/50 hover:border-primary/40"
                        )}
                      >
                        <span className="text-[10px] font-semibold">TodaPay</span>
                        <Badge variant="secondary" className="text-[7px] px-1 py-0">Top</Badge>
                      </button>
                      <button
                        onClick={() => setPaymentMethod("omari")}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all min-h-[56px]",
                          paymentMethod === "omari"
                            ? "border-emerald-500 bg-emerald-500/5"
                            : "border-border/50 hover:border-emerald-500/40"
                        )}
                      >
                        <img src={omariLogo} alt="O'mari" className="h-5 w-5 object-contain" />
                        <span className="text-[10px] font-semibold">O'mari</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod("innbucks")}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all min-h-[56px]",
                          paymentMethod === "innbucks"
                            ? "border-orange-500 bg-orange-500/5"
                            : "border-border/50 hover:border-orange-500/40"
                        )}
                      >
                        <img src={innbucksLogo} alt="InnBucks" className="h-5 w-5 object-contain" />
                        <span className="text-[10px] font-semibold">InnBucks</span>
                      </button>
                      {user && (
                        <button
                          onClick={() => setPaymentMethod("wallet")}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all min-h-[56px]",
                            paymentMethod === "wallet"
                              ? "border-primary bg-primary/5"
                              : "border-border/50 hover:border-primary/40"
                          )}
                        >
                          <Wallet className="h-4 w-4" />
                          <span className="text-[10px] font-semibold">Wallet</span>
                          <span className="text-[8px] text-muted-foreground">
                            {walletBalance !== null ? `${walletBalance.toFixed(0)}` : "—"}
                          </span>
                        </button>
                      )}
                    </div>
                    {paymentMethod === "wallet" && walletBalance !== null && totalAmount > walletBalance && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Insufficient wallet balance
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleProceedToPayment}
                    disabled={!amountValid || walletLoading || (paymentMethod === "wallet" && (walletBalance === null || walletBalance < totalAmount))}
                    className="w-full h-14 rounded-full text-lg font-semibold"
                  >
                    {walletLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {paymentMethod === "wallet" ? "Pay with Wallet" : "Pay"} {amountValid ? `${currency} ${totalAmount.toFixed(2)}` : ""}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => { setStep("input"); setCustomerInfo(null); }}
                    className="w-full rounded-full"
                  >
                    Change Account
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "payment" && showTodaPay && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <TodaPayCheckout
                amount={totalAmount}
                currency={currency}
                reason={`${config.name} - ${accountNumber}${serviceFee > 0 ? ` (incl. $${serviceFee} service fee)` : ''}`}
                onCancel={() => { setShowTodaPay(false); setStep("confirm"); }}
                onPaymentComplete={handlePaymentComplete}
              />
            </motion.div>
          )}

          {step === "payment" && showOmari && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <OmariCheckout
                amount={totalAmount}
                reference={`${config.id}-${accountNumber}-${Date.now()}`}
                currency={currency}
                description={`${config.name} - ${accountNumber}`}
                onCancel={() => { setShowOmari(false); setStep("confirm"); }}
                onSuccess={(data) => {
                  setShowOmari(false);
                  handlePaymentComplete({
                    ...data,
                    transactionRef: data.paymentReference || data.transactionId,
                    paymentMethod: "omari",
                  });
                }}
              />
            </motion.div>
          )}

          {step === "payment" && showInnBucks && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <InnBucksCheckout
                amount={totalAmount}
                reference={`${config.id}-${accountNumber}-${Date.now()}`}
                currency={currency}
                description={`${config.name} - ${accountNumber}`}
                onCancel={() => { setShowInnBucks(false); setStep("confirm"); }}
                onSuccess={(data) => {
                  setShowInnBucks(false);
                  handlePaymentComplete({
                    ...data,
                    transactionRef: data.paymentReference || data.transactionId,
                    paymentMethod: "innbucks",
                  });
                }}
              />
            </motion.div>
          )}

          {step === "pending" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className="rounded-3xl border-0 shadow-lg">
                <CardContent className="p-6 space-y-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                    <RefreshCw className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Transaction Processing</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your payment was received but the service is still being fulfilled. Tap retry to check again.
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-2xl p-4 space-y-2 text-sm text-left">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{config.accountLabel}</span>
                      <span className="font-mono font-semibold">{accountNumber}</span>
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
                  <Button variant="ghost" onClick={() => navigate("/pay/bills")} className="w-full rounded-full">
                    Go Back
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "receipt" && receiptData && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <UniversalBillReceipt data={receiptData} onDone={() => navigate("/pay/bills")} />
            </motion.div>
          )}
        </main>
      </div>
    </MobileAppLayout>
  );
};
