import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, HandCoins, User, CheckCircle2, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = "form" | "confirm" | "sending" | "success";

const RequestMoney = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { convertPrice } = useCurrency();

  const [step, setStep] = useState<Step>("form");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientUserId, setRecipientUserId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [requestCode, setRequestCode] = useState<string | null>(null);

  const numAmount = Number(amount) || 0;

  const handleLookup = async () => {
    if (!accountNumber.trim()) {
      toast.error("Enter an account number");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("account_number", accountNumber.trim().toUpperCase())
      .maybeSingle();

    if (!profile) {
      toast.error("Account not found");
      return;
    }
    if (profile.id === user?.id) {
      toast.error("You cannot request money from yourself");
      return;
    }
    setRecipientName(profile.full_name || "Unknown User");
    setRecipientUserId(profile.id);
  };

  const handleSend = async () => {
    if (!user?.id) return;
    setStep("sending");
    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from("money_requests")
        .insert({
          requester_id: user.id,
          payer_account_number: accountNumber.trim().toUpperCase(),
          payer_user_id: recipientUserId,
          amount: numAmount,
          currency: "USD",
          description: description || null,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Notification to payer
      if (recipientUserId) {
        await supabase.from("user_notifications").insert({
          user_id: recipientUserId,
          title: "Money Request 💰",
          message: `${user.email || "Someone"} requested $${numAmount.toFixed(2)}${description ? ` for ${description}` : ""}`,
          type: "wallet",
          category: "payment",
          action_url: "/pay",
          metadata: { type: "money_request", request_id: data.id, amount: numAmount },
        } as any);
      }

      setRequestCode(data.id.slice(0, 8).toUpperCase());
      setStep("success");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send request");
      setStep("confirm");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => (step === "form" ? navigate(-1) : setStep("form"))}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Request Money</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className="border-0 bg-primary/5 rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <HandCoins className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Request from anyone</p>
                    <p className="text-xs text-muted-foreground">They'll get a notification to pay you</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>From (Account Number)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. ZW-U-00001"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setRecipientName(null);
                      setRecipientUserId(null);
                    }}
                    className="uppercase"
                  />
                  <Button variant="outline" onClick={handleLookup} disabled={!accountNumber.trim()}>
                    Verify
                  </Button>
                </div>
                {recipientName && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-lg px-3 py-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{recipientName}</span>
                    <CheckCircle2 className="h-4 w-4 ml-auto" />
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min={1} />
              </div>

              <div className="space-y-2">
                <Label>What's it for? (optional)</Label>
                <Input placeholder="Lunch, rent split, etc." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={100} />
              </div>

              <Button
                className="w-full h-12 rounded-xl"
                disabled={!recipientName || numAmount < 1}
                onClick={() => setStep("confirm")}
              >
                <HandCoins className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className="rounded-2xl border-2 border-primary/20">
                <CardContent className="p-6 space-y-4 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <HandCoins className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">Confirm Request</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">From</span><span className="font-medium">{recipientName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="text-lg font-bold text-primary">{convertPrice(numAmount)}</span></div>
                    {description && <div className="flex justify-between"><span className="text-muted-foreground">Note</span><span className="text-right max-w-[200px] truncate">{description}</span></div>}
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-2">
                <Button className="w-full h-12 rounded-xl" onClick={handleSend} disabled={isSending}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <HandCoins className="h-4 w-4 mr-2" />}
                  Send Request
                </Button>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => setStep("form")}>Back</Button>
              </div>
            </motion.div>
          )}

          {step === "sending" && (
            <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Sending request...</h3>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-primary">Request Sent!</h2>
              <p className="text-sm text-muted-foreground">
                {recipientName} has been notified to pay {convertPrice(numAmount)}
              </p>
              {requestCode && (
                <div className="bg-muted/50 rounded-xl p-3 inline-flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Ref:</span>
                  <span className="font-mono font-bold">{requestCode}</span>
                </div>
              )}
              <div className="space-y-2 pt-4">
                <Button className="w-full rounded-xl" onClick={() => navigate("/pay")}>Back to Wallet</Button>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => {
                  setStep("form"); setAccountNumber(""); setAmount(""); setDescription(""); setRecipientName(null); setRecipientUserId(null); setRequestCode(null);
                }}>
                  <Share2 className="h-4 w-4 mr-2" /> Request Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RequestMoney;
