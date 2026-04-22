import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Gift, Copy, Share2, CreditCard, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MobileAppLayout from "@/components/MobileAppLayout";

const DESIGNS: Record<string, { label: string; gradient: string }> = {
  birthday: { label: "🎂 Birthday", gradient: "from-pink-500 to-rose-500" },
  holiday: { label: "🎄 Holiday", gradient: "from-emerald-500 to-green-600" },
  thankyou: { label: "🙏 Thank You", gradient: "from-amber-400 to-orange-500" },
  congrats: { label: "🎉 Congrats", gradient: "from-violet-500 to-purple-600" },
  travel: { label: "✈️ Travel", gradient: "from-sky-400 to-blue-600" },
  general: { label: "🎁 General", gradient: "from-primary to-primary/80" },
};

const GiftCardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { convertPrice } = useCurrency();

  const { data: card, isLoading } = useQuery({
    queryKey: ["gift-card", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("gift_cards").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["gift-card-transactions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_card_transactions")
        .select("*")
        .eq("gift_card_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const handleCopyCode = () => {
    if (card?.code) {
      navigator.clipboard.writeText(card.code);
      toast({ title: "Code copied!", description: card.code });
    }
  };

  const handleShare = async () => {
    if (!card) return;
    const text = `🎁 You've received a ${convertPrice(card.remaining_balance)} gift card!\nCode: ${card.code}\n${card.personal_message ? `"${card.personal_message}"` : ""}`;
    if (navigator.share) {
      await navigator.share({ title: "Gift Card", text });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Gift card details copied!" });
    }
  };

  const design = DESIGNS[card?.design_template || "general"] || DESIGNS.general;

  if (isLoading) {
    return (
      <MobileAppLayout>
        <div className="min-h-screen bg-background p-4 space-y-4">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </MobileAppLayout>
    );
  }

  if (!card) {
    return (
      <MobileAppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="rounded-2xl w-full max-w-sm">
            <CardContent className="p-6 text-center space-y-4">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="font-semibold">Gift card not found</p>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/gift-cards">Back to Gift Cards</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MobileAppLayout>
    );
  }

  const balancePercent = card.initial_amount > 0 ? (card.remaining_balance / card.initial_amount) * 100 : 0;

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 bg-background border-b safe-area-pt px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <Link to="/gift-cards" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center tap-target">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-lg">Gift Card Details</h1>
          </div>
        </motion.header>

        <main className="px-4 py-5 space-y-5">
          {/* Card Visual */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className={`rounded-3xl overflow-hidden border-0 shadow-2xl bg-gradient-to-br ${design.gradient}`}>
              <CardContent className="p-6 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-4xl">{design.label.split(" ")[0]}</p>
                  <Badge className="bg-white/20 text-white border-0 text-xs capitalize">{card.status}</Badge>
                </div>
                <div className="text-center py-4">
                  <p className="text-sm opacity-70">Balance</p>
                  <p className="text-4xl font-bold">{convertPrice(card.remaining_balance)}</p>
                  <p className="text-xs opacity-50 mt-1">of {convertPrice(card.initial_amount)} original</p>
                </div>
                {/* Balance Bar */}
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${balancePercent}%` }} />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={handleCopyCode} className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-xs font-mono">
                    {card.code}
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                {card.personal_message && (
                  <p className="text-center text-sm opacity-80 italic">"{card.personal_message}"</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleShare} variant="outline" className="flex-1 rounded-xl h-12">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button onClick={handleCopyCode} variant="outline" className="flex-1 rounded-xl h-12">
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
          </div>

          {/* Details */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Details</h3>
              <div className="space-y-2 text-sm">
                {card.sender_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-medium">{card.sender_name}</span>
                  </div>
                )}
                {card.recipient_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-medium">{card.recipient_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{card.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{new Date(card.created_at).toLocaleDateString()}</span>
                </div>
                {card.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="font-medium">{new Date(card.expires_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Transaction History</h3>
              {transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        tx.transaction_type === "purchase" ? "bg-primary/10" : "bg-amber-500/10"
                      }`}>
                        {tx.transaction_type === "purchase" ? (
                          <CreditCard className="h-4 w-4 text-primary" />
                        ) : (
                          <Gift className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{tx.transaction_type}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-semibold text-sm">
                        {tx.transaction_type === "redemption" ? "-" : "+"}{convertPrice(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default GiftCardDetail;
