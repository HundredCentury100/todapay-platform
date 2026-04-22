import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Download, Globe2, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RemittanceForm, CORRIDORS } from "@/components/remittance/RemittanceForm";
import { RemittanceReceipt } from "@/components/remittance/RemittanceReceipt";

type Step = "direction" | "form" | "review" | "processing" | "receipt" | "inward";

const Remittance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("direction");
  const [direction, setDirection] = useState<"inward" | "outward">("outward");
  const [corridorCode, setCorridorCode] = useState("ZA");
  const [recipientName, setRecipientName] = useState("");
  const [recipientMethod, setRecipientMethod] = useState<"bank" | "mobile_wallet" | "cash_pickup">("bank");
  const [recipientDetails, setRecipientDetails] = useState("");
  const [amount, setAmount] = useState("");
  const [referenceCode, setReferenceCode] = useState("");

  const corridor = CORRIDORS.find((c) => c.code === corridorCode)!;
  const numAmount = Number(amount) || 0;
  const fee = (numAmount * corridor.feePercentage) / 100;
  const total = numAmount + fee;
  const receiveAmount = numAmount * corridor.fxRate;

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (direction === "outward" && (!recipientName.trim() || !recipientDetails.trim())) {
      toast.error("Fill all recipient details");
      return;
    }
    if (numAmount < 5) return toast.error("Minimum send amount is $5");

    setStep("processing");
    try {
      const { data: refData } = await supabase.rpc("generate_remittance_reference");
      const ref = (refData as string) || `RMT-${Date.now()}`;

      const { error } = await supabase.from("remittance_orders").insert({
        user_id: user.id,
        direction,
        recipient_name: recipientName || user.email || "Self",
        recipient_country: corridor.country,
        recipient_method: recipientMethod,
        recipient_details: { details: recipientDetails },
        send_amount: numAmount,
        send_currency: "USD",
        receive_amount: receiveAmount,
        receive_currency: corridor.currency,
        fx_rate: corridor.fxRate,
        fee_amount: fee,
        total_amount: total,
        reference_code: ref,
        expected_delivery_at: new Date(Date.now() + corridor.deliveryHours * 3600 * 1000).toISOString(),
        status: "processing",
      });
      if (error) throw error;
      setReferenceCode(ref);
      setStep("receipt");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create transfer");
      setStep("review");
    }
  };

  const inwardCode = user?.id ? `FT-${user.id.slice(0, 8).toUpperCase()}` : "";

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => (step === "direction" ? navigate(-1) : setStep("direction"))}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">International Transfer</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          {step === "direction" && (
            <motion.div key="dir" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="text-center py-4">
                <Globe2 className="h-12 w-12 text-primary mx-auto mb-3" />
                <h2 className="text-xl font-bold">Send & Receive Globally</h2>
                <p className="text-sm text-muted-foreground mt-1">Low fees, fast delivery to 8+ countries</p>
              </div>

              <Card className="rounded-2xl border-2 hover:border-primary cursor-pointer transition-all press-effect" onClick={() => { setDirection("outward"); setStep("form"); }}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><Send className="h-6 w-6 text-primary" /></div>
                  <div className="flex-1">
                    <p className="font-semibold">Send Money Abroad</p>
                    <p className="text-xs text-muted-foreground">To bank, mobile wallet or cash pickup</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 hover:border-primary cursor-pointer transition-all press-effect" onClick={() => { setDirection("inward"); setStep("inward"); }}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Download className="h-6 w-6 text-emerald-600" /></div>
                  <div className="flex-1">
                    <p className="font-semibold">Receive from Abroad</p>
                    <p className="text-xs text-muted-foreground">Get your unique receive code</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-4 gap-2 pt-4">
                {CORRIDORS.map((c) => (
                  <div key={c.code} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
                    <span className="text-2xl">{c.flag}</span>
                    <span className="text-[10px] text-muted-foreground">{c.currency}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <RemittanceForm
                direction={direction}
                corridorCode={corridorCode}
                setCorridorCode={setCorridorCode}
                recipientName={recipientName}
                setRecipientName={setRecipientName}
                recipientMethod={recipientMethod}
                setRecipientMethod={setRecipientMethod}
                recipientDetails={recipientDetails}
                setRecipientDetails={setRecipientDetails}
                amount={amount}
                setAmount={setAmount}
              />
              <Button className="w-full h-12 rounded-xl" disabled={numAmount < 5 || !recipientName.trim() || !recipientDetails.trim()} onClick={() => setStep("review")}>
                Review Transfer
              </Button>
            </motion.div>
          )}

          {step === "review" && (
            <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className="rounded-2xl border-2 border-primary/20">
                <CardContent className="p-6 space-y-3 text-sm">
                  <h3 className="font-bold text-base mb-2">Review Transfer</h3>
                  <div className="flex justify-between"><span className="text-muted-foreground">Recipient</span><span className="font-medium">{recipientName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span>{corridor.flag} {corridor.country}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="capitalize">{recipientMethod.replace("_", " ")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Details</span><span className="text-right truncate max-w-[180px]">{recipientDetails}</span></div>
                  <div className="border-t pt-3 flex justify-between"><span className="text-muted-foreground">Send</span><span>${numAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span>${fee.toFixed(2)}</span></div>
                  <div className="border-t pt-3 flex justify-between font-bold"><span>You pay</span><span className="text-primary">${total.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold"><span>They receive</span><span className="text-primary">{receiveAmount.toFixed(2)} {corridor.currency}</span></div>
                </CardContent>
              </Card>
              <Button className="w-full h-12 rounded-xl" onClick={handleSubmit}>Confirm & Pay</Button>
              <Button variant="outline" className="w-full rounded-xl" onClick={() => setStep("form")}>Back</Button>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Initiating transfer...</h3>
            </motion.div>
          )}

          {step === "receipt" && (
            <motion.div key="receipt" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <RemittanceReceipt
                referenceCode={referenceCode}
                recipientName={recipientName}
                recipientCountry={corridor.country}
                sendAmount={numAmount}
                receiveAmount={receiveAmount}
                receiveCurrency={corridor.currency}
                fxRate={corridor.fxRate}
                fee={fee}
                deliveryHours={corridor.deliveryHours}
                onDone={() => navigate("/pay")}
              />
            </motion.div>
          )}

          {step === "inward" && (
            <motion.div key="inward" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className="rounded-2xl border-2 border-primary/20 text-center">
                <CardContent className="p-6 space-y-3">
                  <Download className="h-10 w-10 text-primary mx-auto" />
                  <h3 className="font-bold">Your Receive Code</h3>
                  <p className="text-xs text-muted-foreground">Share this code with the sender. Funds will land in your wallet.</p>
                  <div className="bg-primary/5 rounded-xl p-4">
                    <p className="font-mono text-2xl font-bold text-primary tracking-wider">{inwardCode}</p>
                  </div>
                  <Button variant="outline" className="rounded-xl" onClick={() => { navigator.clipboard.writeText(inwardCode); toast.success("Code copied"); }}>
                    <Copy className="h-4 w-4 mr-2" /> Copy Code
                  </Button>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4 text-sm space-y-2">
                  <p className="font-semibold">How it works</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Share your receive code with the sender</li>
                    <li>They send via partner channels (bank/mobile wallet)</li>
                    <li>You receive USD straight into your wallet</li>
                  </ol>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Remittance;
