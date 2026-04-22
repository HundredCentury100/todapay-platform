import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
  ArrowLeft,
  KeyRound,
  CircleDot,
  Phone,
} from "lucide-react";

interface OmariCheckoutProps {
  amount: number;
  reference: string;
  currency?: string;
  description?: string;
  onSuccess: (transactionData: any) => void;
  onCancel: () => void;
}

type Stage = "phone" | "otp" | "processing" | "success" | "error";

export function OmariCheckout({
  amount,
  reference,
  currency = "USD",
  description,
  onSuccess,
  onCancel,
}: OmariCheckoutProps) {
  const { convertPrice } = useCurrency();
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpReference, setOtpReference] = useState<string | null>(null);
  const [txReference] = useState(() => crypto.randomUUID());
  const [errorMessage, setErrorMessage] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");

  // Format phone for display
  const formatPhoneDisplay = (raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`;
  };

  // Step 1: POST /auth — send phone + amount, get OTP reference
  const initiateAuth = async () => {
    const cleaned = phone.replace(/\s+/g, "");
    if (!cleaned || cleaned.length < 9) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setFormattedPhone(cleaned);
    try {
      const { data, error } = await supabase.functions.invoke("omari-payment", {
        body: {
          action: "auth",
          msisdn: cleaned,
          amount,
          currency,
          reference: txReference,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setOtpReference(data.otpReference);
        setStage("otp");
        toast.info("Enter the OTP sent to your phone");
      } else {
        const msg = data?.message || "Authentication failed. Please try again.";
        setErrorMessage(msg);
        setStage("error");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initiate payment");
      setStage("error");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: POST /request — submit OTP to complete payment
  const submitOtp = async () => {
    if (otp.length < 4) {
      toast.error("Please enter the full OTP");
      return;
    }

    setLoading(true);
    setStage("processing");
    try {
      const { data, error } = await supabase.functions.invoke("omari-payment", {
        body: {
          action: "request",
          msisdn: formattedPhone,
          reference: txReference,
          otp,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setStage("success");
        toast.success("Payment successful!");
        onSuccess({
          transactionId: txReference,
          paymentReference: data.paymentReference,
          debitReference: data.debitReference,
          status: "completed",
          provider: "omari",
          amount,
          currency,
        });
      } else {
        const msg = data?.message || "Payment failed. Please try again.";
        setErrorMessage(msg);
        setStage("error");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Payment request failed");
      setStage("error");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStage("phone");
    setOtp("");
    setErrorMessage("");
    setOtpReference(null);
  };

  const stageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

  return (
    <div className="space-y-5">
      {/* Header with amount */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
          <Shield className="h-3.5 w-3.5" />
          Secured by O'mari · Old Mutual
        </div>
        <p className="text-3xl font-bold tracking-tight">{convertPrice(amount)}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2">
        {["phone", "otp", "processing"].map((s, i) => {
          const isActive = ["phone", "otp", "processing", "success"].indexOf(stage) >= i;
          const isCurrent = (stage === "phone" && i === 0) || (stage === "otp" && i === 1) || ((stage === "processing" || stage === "success") && i === 2);
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isCurrent ? "w-6 bg-emerald-500" : isActive ? "bg-emerald-500" : "bg-muted-foreground/20"
              }`} />
              {i < 2 && <div className={`w-6 h-0.5 ${isActive ? "bg-emerald-500" : "bg-muted-foreground/20"}`} />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Phone Input Stage */}
        {stage === "phone" && (
          <motion.div key="phone" {...stageVariants} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="omari-phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                O'mari Phone Number
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">+263</span>
                <Input
                  id="omari-phone"
                  placeholder="77 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
                  type="tel"
                  className="pl-14 h-12 text-base"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your O'mari registered mobile number
              </p>
            </div>

            <Button
              onClick={initiateAuth}
              disabled={loading || !phone || phone.replace(/\s/g, "").length < 9}
              className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Smartphone className="h-5 w-5 mr-2" />
                  Continue with O'mari
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* OTP Stage */}
        {stage === "otp" && (
          <motion.div key="otp" {...stageVariants} className="space-y-5">
            {/* OTP Reference display */}
            {otpReference && (
              <div className="bg-muted/50 rounded-xl p-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground">OTP Reference</p>
                <p className="text-lg font-mono font-bold tracking-wider">{otpReference}</p>
                <p className="text-xs text-muted-foreground">Show this to verify your OTP</p>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2 justify-center">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                Enter OTP from your phone
              </Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button
              onClick={submitOtp}
              disabled={loading || otp.length < 4}
              className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Confirm Payment"
              )}
            </Button>

            <button
              onClick={() => { setStage("phone"); setOtp(""); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Change phone number
            </button>
          </motion.div>
        )}

        {/* Processing Stage */}
        {stage === "processing" && (
          <motion.div key="processing" {...stageVariants} className="text-center space-y-4 py-8">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              <Smartphone className="absolute inset-0 m-auto h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-lg">Processing Payment</p>
              <p className="text-sm text-muted-foreground mt-1">
                Confirming with O'mari...
              </p>
            </div>
          </motion.div>
        )}

        {/* Success Stage */}
        {stage === "success" && (
          <motion.div key="success" {...stageVariants} className="text-center space-y-4 py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
            </motion.div>
            <div>
              <p className="font-bold text-xl">Payment Successful!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {convertPrice(amount)} paid via O'mari
              </p>
            </div>
          </motion.div>
        )}

        {/* Error Stage */}
        {stage === "error" && (
          <motion.div key="error" {...stageVariants} className="text-center space-y-5 py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <XCircle className="h-14 w-14 text-destructive mx-auto" />
            </motion.div>
            <div>
              <p className="font-semibold text-lg">Payment Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} className="flex-1 h-11">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={resetFlow}
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel for phone/otp stages */}
      {(stage === "phone" || stage === "otp") && (
        <button
          onClick={onCancel}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Choose another payment method
        </button>
      )}
    </div>
  );
}
