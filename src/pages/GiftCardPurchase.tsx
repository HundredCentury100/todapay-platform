import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Gift, Send, CreditCard, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MobileAppLayout from "@/components/MobileAppLayout";
import { TodaPayCheckout } from "@/components/checkout";

const PRESET_AMOUNTS = [5, 10, 25, 50, 100, 200];

const DESIGNS = [
  { id: "birthday", label: "🎂 Birthday", gradient: "from-pink-500 to-rose-500" },
  { id: "holiday", label: "🎄 Holiday", gradient: "from-emerald-500 to-green-600" },
  { id: "thankyou", label: "🙏 Thank You", gradient: "from-amber-400 to-orange-500" },
  { id: "congrats", label: "🎉 Congrats", gradient: "from-violet-500 to-purple-600" },
  { id: "travel", label: "✈️ Travel", gradient: "from-sky-400 to-blue-600" },
  { id: "general", label: "🎁 General", gradient: "from-primary to-primary/80" },
];

const GiftCardPurchase = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { convertPrice } = useCurrency();

  const [step, setStep] = useState<"design" | "details" | "payment" | "done">("design");
  const [selectedDesign, setSelectedDesign] = useState("general");
  const [amount, setAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [createdCardId, setCreatedCardId] = useState<string | null>(null);

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;
  const isValidAmount = !isNaN(finalAmount) && finalAmount >= 1 && finalAmount <= 10000;
  const design = DESIGNS.find(d => d.id === selectedDesign) || DESIGNS[5];

  const handleProceedToDetails = () => {
    if (!isValidAmount) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    setStep("details");
  };

  const handleProceedToPayment = () => {
    if (!recipientName.trim()) {
      toast({ title: "Enter recipient name", variant: "destructive" });
      return;
    }
    if (!recipientEmail.trim() && !recipientPhone.trim()) {
      toast({ title: "Enter recipient email or phone", variant: "destructive" });
      return;
    }
    setShowPayment(true);
    setStep("payment");
  };

  const handlePaymentComplete = async () => {
    setShowPayment(false);
    setLoading(true);
    try {
      const { data, error } = await supabase.from("gift_cards").insert({
        code: "", // trigger will generate
        initial_amount: finalAmount,
        remaining_balance: finalAmount,
        currency,
        card_type: "digital",
        design_template: selectedDesign,
        sender_name: senderName || user?.email || "Anonymous",
        sender_email: user?.email || null,
        recipient_name: recipientName,
        recipient_email: recipientEmail || null,
        recipient_phone: recipientPhone || null,
        personal_message: personalMessage || null,
        created_by_user_id: user?.id || null,
        status: "active",
        is_digital: true,
      }).select().single();

      if (error) throw error;
      setCreatedCardId(data.id);
      setStep("done");
      toast({ title: "Gift card created!", description: `${convertPrice(finalAmount)} gift card is ready to send.` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to create gift card", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <MobileAppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="rounded-2xl w-full max-w-sm">
            <CardContent className="p-6 text-center space-y-4">
              <Gift className="h-12 w-12 text-primary mx-auto" />
              <h2 className="font-bold text-lg">Sign in to purchase</h2>
              <Button asChild className="rounded-full w-full">
                <Link to="/auth" state={{ returnTo: "/gift-cards/purchase" }}>Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 bg-background border-b safe-area-pt px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (step === "details") setStep("design");
                else if (step === "payment") { setShowPayment(false); setStep("details"); }
                else navigate("/gift-cards");
              }}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center tap-target"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg">Buy Gift Card</h1>
              <p className="text-xs text-muted-foreground">
                {step === "design" ? "Choose design & amount" : step === "details" ? "Recipient details" : step === "payment" ? "Complete payment" : "All done!"}
              </p>
            </div>
          </div>
        </motion.header>

        <main className="px-4 py-5 space-y-5">
          {step === "design" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Preview Card */}
              <Card className={`rounded-3xl overflow-hidden border-0 shadow-xl bg-gradient-to-br ${design.gradient}`}>
                <CardContent className="p-6 text-white text-center space-y-2">
                  <p className="text-4xl">{design.label.split(" ")[0]}</p>
                  <p className="text-3xl font-bold">{convertPrice(finalAmount)}</p>
                  <p className="text-sm opacity-70">Gift Card</p>
                </CardContent>
              </Card>

              {/* Design Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Design</Label>
                <div className="grid grid-cols-3 gap-2">
                  {DESIGNS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDesign(d.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        selectedDesign === d.id ? "border-primary shadow-sm" : "border-border/40"
                      }`}
                    >
                      <p className="text-lg">{d.label.split(" ")[0]}</p>
                      <p className="text-[10px] text-muted-foreground">{d.label.split(" ").slice(1).join(" ")}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Amount</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      onClick={() => { setAmount(a); setCustomAmount(""); }}
                      className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                        amount === a && !customAmount ? "border-primary bg-primary/5" : "border-border/40"
                      }`}
                    >
                      ${a}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Or enter custom amount"
                  className="h-12 rounded-xl text-center"
                  min={1}
                  max={10000}
                />
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                    <SelectItem value="ZWG">🇿🇼 ZWG - Zimbabwe Gold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleProceedToDetails} disabled={!isValidAmount} className="w-full h-14 rounded-full text-lg font-semibold">
                Continue
              </Button>
            </motion.div>
          )}

          {step === "details" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Card className={`rounded-2xl overflow-hidden border-0 shadow-lg bg-gradient-to-br ${design.gradient}`}>
                <CardContent className="p-4 text-white flex items-center gap-3">
                  <div className="text-2xl">{design.label.split(" ")[0]}</div>
                  <div>
                    <p className="font-bold text-lg">{convertPrice(finalAmount)}</p>
                    <p className="text-xs opacity-70">Gift Card</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="From..." className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Recipient Name *</Label>
                  <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Who is this for?" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Recipient Email</Label>
                  <Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="email@example.com" type="email" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Recipient Phone</Label>
                  <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="+263..." type="tel" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Personal Message (optional)</Label>
                  <Textarea
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder="Add a personal touch..."
                    className="rounded-xl resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{personalMessage.length}/200</p>
                </div>
              </div>

              <Button onClick={handleProceedToPayment} disabled={!recipientName.trim() || (!recipientEmail.trim() && !recipientPhone.trim())} className="w-full h-14 rounded-full text-lg font-semibold">
                <Send className="h-5 w-5 mr-2" />
                Pay & Send {convertPrice(finalAmount)}
              </Button>
            </motion.div>
          )}

          {step === "payment" && showPayment && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <TodaPayCheckout
                amount={finalAmount}
                currency={currency}
                reason={`Gift Card for ${recipientName}`}
                onCancel={() => { setShowPayment(false); setStep("details"); }}
                onPaymentComplete={handlePaymentComplete}
              />
            </motion.div>
          )}

          {step === "done" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center pt-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Gift Card Sent! 🎉</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {convertPrice(finalAmount)} gift card has been created for {recipientName}
                </p>
              </div>
              <Card className={`rounded-2xl overflow-hidden border-0 shadow-lg bg-gradient-to-br ${design.gradient}`}>
                <CardContent className="p-5 text-white text-center space-y-1">
                  <p className="text-3xl">{design.label.split(" ")[0]}</p>
                  <p className="text-2xl font-bold">{convertPrice(finalAmount)}</p>
                  {personalMessage && <p className="text-xs opacity-80 italic">"{personalMessage}"</p>}
                </CardContent>
              </Card>
              <div className="space-y-2">
                {createdCardId && (
                  <Button onClick={() => navigate(`/gift-cards/card/${createdCardId}`)} className="w-full rounded-full">
                    View Gift Card
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate("/gift-cards")} className="w-full rounded-full">
                  Back to Gift Cards
                </Button>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default GiftCardPurchase;
