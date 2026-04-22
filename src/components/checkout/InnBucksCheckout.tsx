import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
  ArrowLeft,
  Copy,
  RefreshCw,
  Smartphone,
  Clock,
  Zap,
} from "lucide-react";
import innbucksLogo from "@/assets/innbucks-logo.png";
import { cn } from "@/lib/utils";

interface InnBucksCheckoutProps {
  amount: number;
  reference: string;
  currency?: string;
  description?: string;
  onSuccess: (transactionData: any) => void;
  onCancel: () => void;
}

type Stage = "generating" | "code" | "processing" | "success" | "error";

// InnBucks brand: #00A651 green
const INNBUCKS_GREEN = {
  bg: "bg-[#00A651]",
  bgHover: "hover:bg-[#008C44]",
  bgLight: "bg-[#00A651]/10",
  bgLighter: "bg-[#00A651]/5",
  text: "text-[#00A651]",
  border: "border-[#00A651]/20",
  borderSolid: "border-[#00A651]",
  ring: "ring-[#00A651]/30",
  shadow: "shadow-[#00A651]/20",
};

export function InnBucksCheckout({
  amount,
  reference,
  currency = "USD",
  description,
  onSuccess,
  onCancel,
}: InnBucksCheckoutProps) {
  const { convertPrice } = useCurrency();
  const [stage, setStage] = useState<Stage>("generating");
  const [loading, setLoading] = useState(false);
  const [innbucksCode, setInnbucksCode] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [codeReference, setCodeReference] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [timeToLive, setTimeToLive] = useState<number | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const amountValue = Math.round(amount * 100) / 100; // Keep as base currency, no cents conversion

  const generateCode = useCallback(async () => {
    setStage("generating");
    setLoading(true);

    try {
       console.log('[InnBucks] Generating code for amount:', amountValue, currency, reference);
       const { data, error } = await supabase.functions.invoke("innbucks-payment", {
         body: {
           action: "generate",
           amount: amountValue,
           currency,
           reference,
           narration: description || `Payment - ${reference}`,
         },
       });

       console.log('[InnBucks] Response:', { data, error });
       if (error) {
         console.error('[InnBucks] Invoke error:', error);
         throw new Error(error.message || 'Edge function invocation failed');
       }

      if (data?.success) {
        setInnbucksCode(data.code);
        setQrCodeBase64(data.qrCode);
        setCodeReference(data.stan || reference);
        if (data.timeToLive) {
          const seconds = parseInt(data.timeToLive.replace("sec", ""), 10);
          setTimeToLive(seconds);
        }
        setStage("code");
        setLoading(false);
        return;
      }

      setErrorMessage(data?.message || "Failed to generate payment code");
      setStage("error");
      setLoading(false);
     } catch (err: any) {
       console.error('[InnBucks] Generate error:', err);
       setErrorMessage(err?.message || "Failed to generate InnBucks code");
       setStage("error");
       setLoading(false);
     }
   }, [amountValue, currency, reference, description]);

  useEffect(() => {
    generateCode();
  }, [generateCode]);

  const checkStatus = useCallback(async () => {
    if (!innbucksCode) return;
    try {
      const { data, error } = await supabase.functions.invoke("innbucks-payment", {
        body: {
          action: "query",
          code: innbucksCode,
          reference: codeReference,
        },
      });

      if (error) throw error;

      if (data?.status === "Claimed" || data?.status === "Paid") {
        setStage("success");
        toast.success("Payment confirmed!");
        onSuccess({
          transactionId: codeReference,
          paymentReference: data.authNumber,
          code: innbucksCode,
          status: "completed",
          provider: "innbucks",
          amount,
          currency,
        });
        return true;
      } else if (data?.status === "Expired" || data?.status === "Timed Out") {
        setErrorMessage("Payment code has expired. Please generate a new one.");
        setStage("error");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [innbucksCode, codeReference, amount, currency, onSuccess]);

  useEffect(() => {
    if (stage !== "code") return;
    const interval = setInterval(async () => {
      setPollCount((p) => p + 1);
      const done = await checkStatus();
      if (done) clearInterval(interval);
    }, 5000);
    return () => clearInterval(interval);
  }, [stage, checkStatus]);

  useEffect(() => {
    if (stage !== "code" || timeToLive === null) return;
    const timer = setInterval(() => {
      setTimeToLive((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setErrorMessage("Payment code has expired.");
          setStage("error");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, timeToLive !== null]);

  const copyCode = () => {
    navigator.clipboard.writeText(innbucksCode);
    setCodeCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const openDeepLink = () => {
    const stagingLink = `zw.co.innbucksnova.test://purchase?paymentToken=${innbucksCode}`;
    const productionLink = `com.innbucks.customer://purchase?paymentToken=${innbucksCode}`;
    window.location.href = stagingLink;
    setTimeout(() => {
      window.location.href = productionLink;
    }, 1500);
  };

  const resetFlow = () => {
    setStage("generating");
    setInnbucksCode("");
    setQrCodeBase64("");
    setErrorMessage("");
    setPollCount(0);
    setTimeToLive(null);
    generateCode();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const stageVariants = {
    initial: { opacity: 0, y: 16, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -16, scale: 0.98 },
  };

  const timerProgress = timeToLive !== null ? timeToLive / 900 : 1; // assume 15min max
  const isUrgent = timeToLive !== null && timeToLive < 60;

  return (
    <div className="space-y-4">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2.5 mx-auto">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", INNBUCKS_GREEN.bgLight)}>
            <img src={innbucksLogo} alt="InnBucks" className="w-6 h-6 object-contain" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">InnBucks</p>
            <p className="text-2xs text-muted-foreground">MicroBank</p>
          </div>
        </div>
        <div>
          <p className="text-3xl font-bold tracking-tight text-foreground">{convertPrice(amount)}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-1.5 px-8">
        {[
          { label: "Generate", icon: Zap },
          { label: "Pay", icon: Smartphone },
          { label: "Done", icon: CheckCircle },
        ].map((step, i) => {
          const stageIndex = stage === "generating" ? 0 : stage === "code" ? 1 : stage === "success" ? 2 : 1;
          const isActive = stageIndex >= i;
          const isCurrent = stageIndex === i;
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center gap-1.5 flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    isCurrent
                      ? `${INNBUCKS_GREEN.bg} text-white shadow-lg ${INNBUCKS_GREEN.shadow}`
                      : isActive
                      ? `${INNBUCKS_GREEN.bgLight} ${INNBUCKS_GREEN.text}`
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className={cn(
                  "text-2xs font-medium",
                  isCurrent ? INNBUCKS_GREEN.text : isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
              {i < 2 && (
                <div className={cn(
                  "h-0.5 flex-1 rounded-full -mt-4 mx-1 transition-all duration-500",
                  stageIndex > i ? INNBUCKS_GREEN.bg : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Generating */}
        {stage === "generating" && (
          <motion.div key="generating" {...stageVariants} className="text-center space-y-4 py-10">
            <div className="relative mx-auto w-20 h-20">
              <div className={cn("absolute inset-0 rounded-full border-[3px] border-[#00A651]/15")} />
              <div className="absolute inset-0 rounded-full border-[3px] border-[#00A651] border-t-transparent animate-spin" />
              <div className={cn("absolute inset-2 rounded-full flex items-center justify-center", INNBUCKS_GREEN.bgLighter)}>
                <img src={innbucksLogo} alt="" className="w-8 h-8 object-contain" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-lg text-foreground">Generating Payment Code</p>
              <p className="text-sm text-muted-foreground mt-1">Connecting to InnBucks...</p>
            </div>
          </motion.div>
        )}

        {/* Code Display */}
        {stage === "code" && (
          <motion.div key="code" {...stageVariants} className="space-y-4">
            {/* QR Code Card */}
            {qrCodeBase64 && (
              <div className="flex justify-center">
                <div className={cn(
                  "bg-white rounded-2xl p-3 shadow-lg border-2 relative overflow-hidden",
                  INNBUCKS_GREEN.border
                )}>
                  {/* Green corner accent */}
                  <div className="absolute top-0 left-0 w-8 h-8 bg-[#00A651] rounded-br-2xl opacity-10" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#00A651] rounded-tl-2xl opacity-10" />
                  <img
                    src={qrCodeBase64.startsWith("data:") ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`}
                    alt="InnBucks QR Code"
                    className="w-44 h-44 md:w-52 md:h-52"
                  />
                </div>
              </div>
            )}

            {/* Payment Code */}
            <div className={cn(
              "rounded-2xl p-4 text-center space-y-2 border",
              INNBUCKS_GREEN.bgLighter, INNBUCKS_GREEN.border
            )}>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Payment Code</p>
              <div className="flex items-center justify-center gap-3">
                <p className={cn("text-3xl font-mono font-black tracking-[0.25em]", INNBUCKS_GREEN.text)}>
                  {innbucksCode}
                </p>
                <button
                  onClick={copyCode}
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200",
                    codeCopied
                      ? `${INNBUCKS_GREEN.bg} text-white`
                      : `${INNBUCKS_GREEN.bgLight} ${INNBUCKS_GREEN.text} hover:${INNBUCKS_GREEN.bg} hover:text-white`
                  )}
                >
                  {codeCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Scan QR or enter code in your InnBucks app
              </p>
            </div>

            {/* Timer */}
            {timeToLive !== null && timeToLive > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  <Clock className={cn("h-3.5 w-3.5", isUrgent ? "text-destructive" : INNBUCKS_GREEN.text)} />
                  <p className="text-sm text-muted-foreground">
                    Expires in{" "}
                    <span className={cn(
                      "font-mono font-bold",
                      isUrgent ? "text-destructive" : INNBUCKS_GREEN.text
                    )}>
                      {formatTime(timeToLive)}
                    </span>
                  </p>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden mx-8">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      isUrgent ? "bg-destructive" : INNBUCKS_GREEN.bg
                    )}
                    animate={{ width: `${timerProgress * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            )}

            {/* Open App Button */}
            <Button
              onClick={openDeepLink}
              className={cn(
                "w-full h-12 text-base font-semibold rounded-xl text-white shadow-lg",
                INNBUCKS_GREEN.bg, INNBUCKS_GREEN.bgHover, INNBUCKS_GREEN.shadow
              )}
              size="lg"
            >
              <img src={innbucksLogo} alt="" className="w-5 h-5 object-contain mr-2" />
              Open InnBucks App
            </Button>

            {/* Check Status */}
            <Button
              onClick={async () => {
                setStage("processing");
                const done = await checkStatus();
                if (!done) {
                  toast.info("Payment not yet confirmed. Complete payment in the InnBucks app.");
                  setStage("code");
                }
              }}
              variant="outline"
              className={cn("w-full h-11 rounded-xl", INNBUCKS_GREEN.border)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              I've Paid — Check Status
            </Button>

            {pollCount > 0 && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00A651] animate-pulse" />
                <p className="text-xs text-muted-foreground">
                  Auto-checking... ({pollCount})
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Processing */}
        {stage === "processing" && (
          <motion.div key="processing" {...stageVariants} className="text-center space-y-4 py-10">
            <Loader2 className={cn("h-12 w-12 animate-spin mx-auto", INNBUCKS_GREEN.text)} />
            <p className="font-medium text-foreground">Verifying payment...</p>
          </motion.div>
        )}

        {/* Success */}
        {stage === "success" && (
          <motion.div key="success" {...stageVariants} className="text-center space-y-4 py-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg",
                INNBUCKS_GREEN.bg, INNBUCKS_GREEN.shadow
              )}
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>
            <div>
              <p className="font-bold text-xl text-foreground">Payment Successful!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {convertPrice(amount)} paid via InnBucks
              </p>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {stage === "error" && (
          <motion.div key="error" {...stageVariants} className="text-center space-y-5 py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto"
            >
              <XCircle className="h-8 w-8 text-destructive" />
            </motion.div>
            <div>
              <p className="font-semibold text-lg text-foreground">Payment Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} className="flex-1 h-11 rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={resetFlow}
                className={cn("flex-1 h-11 rounded-xl text-white", INNBUCKS_GREEN.bg, INNBUCKS_GREEN.bgHover)}
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel link */}
      {(stage === "code" || stage === "generating") && (
        <button
          onClick={onCancel}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Choose another payment method
        </button>
      )}

      {/* Security badge */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <Shield className={cn("h-3 w-3", INNBUCKS_GREEN.text)} />
        <span className="text-2xs text-muted-foreground">Secured by InnBucks MicroBank</span>
      </div>
    </div>
  );
}
