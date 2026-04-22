import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CreditCard, User, CheckCircle2, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { SuvatPayCheckout } from "@/components/checkout";
import { toast } from "sonner";

type Step = "form" | "confirm" | "payment" | "success";

const CardPayment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { convertPrice } = useCurrency();

  const [step, setStep] = useState<Step>("form");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientUserId, setRecipientUserId] = useState<string | null>(null);

  const numAmount = Number(amount) || 0;

  const handleLookup = async () => {
    if (!accountNumber.trim()) return toast.error("Enter an account number");
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("account_number", accountNumber.trim().toUpperCase())
      .maybeSingle();
    if (!profile) return toast.error("Account not found");
    setRecipientName(profile.full_name || "Unknown User");
    setRecipientUserId(profile.id);
  };

  const handlePaymentSuccess = async (reference: string) => {
    try {
      // Credit recipient wallet
      if (recipientUserId) {
        const { data: walletId } = await supabase.rpc("get_or_create_user_wallet", { p_user_id: recipientUserId });
        if (walletId) {
          await supabase.rpc("topup_user_wallet", {
            p_wallet_id: walletId,
            p_amount: numAmount,
            p_payment_reference: reference,
            p_description: `Card payment from ${user?.email || "user"}${description ? ` — ${description}` : ""}`,
          });
        }
      }
      setStep("success");
    } catch (err: any) {
      console.error("Credit recipient failed", err);
      toast.error("Payment received but recipient credit failed. Contact support.");
      setStep("success");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => (step === "form" ? navigate(-1) : setStep("form"))}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Pay with Card</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className="border-0 bg-primary/5 rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Pay anyone with Visa or Mastercard</p>
                    <p className="text-xs text-muted-foreground">Funds land instantly in their wallet</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Recipient Account Number</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. ZW-U-00001"
                    value={accountNumber}
                    onChange={(e) => { setAccountNumber(e.target.value); setRecipientName(null); setRecipientUserId(null); }}
                    className="uppercase"
                  />
                  <Button variant="outline" onClick={handleLookup} disabled={!accountNumber.trim()}>Verify</Button>
                </div>
                {recipientName && (
                  <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-lg px-3 py-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{recipientName}</span>
                    <CheckCircle2 className="h-4 w-4 ml-auto" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min={1} />
              </div>

              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Input placeholder="What's it for?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={100} />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Shield className="h-4 w-4 text-primary" />
                <span>Secure 3D Secure card processing via Suvat Pay</span>
              </div>

              <Button className="w-full h-12 rounded-xl" disabled={!recipientName || numAmount < 1} onClick={() => setStep("confirm")}>
                <CreditCard className="h-4 w-4 mr-2" /> Continue
              </Button>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className="rounded-2xl border-2 border-primary/20">
                <CardContent className="p-6 space-y-4 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <CreditCard className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">Confirm Payment</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">To</span><span className="font-medium">{recipientName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="text-lg font-bold text-primary">{convertPrice(numAmount)}</span></div>
                  </div>
                </CardContent>
              </Card>
              <Button className="w-full h-12 rounded-xl" onClick={() => setStep("payment")}>
                Pay {convertPrice(numAmount)} with Card
              </Button>
              <Button variant="outline" className="w-full rounded-xl" onClick={() => setStep("form")}>Back</Button>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SuvatPayCheckout
                amount={numAmount}
                currency="USD"
                reason={`P2P card payment to ${recipientName}`}
                onPaymentComplete={(data) => handlePaymentSuccess(data?.referenceNumber || data?.reference || `P2P-${Date.now()}`)}
                onCancel={() => setStep("confirm")}
              />
            </motion.div>
          )}

          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-primary">Payment Sent!</h2>
              <p className="text-sm text-muted-foreground">{convertPrice(numAmount)} sent to {recipientName}</p>
              <Button className="w-full rounded-xl" onClick={() => navigate("/pay")}>Done</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CardPayment;
