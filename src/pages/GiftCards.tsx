import { useState } from "react";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Gift, Plus, CreditCard, Send, Search, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import MobileAppLayout from "@/components/MobileAppLayout";

const GIFT_CARD_DESIGNS = [
  { id: "birthday", label: "🎂 Birthday", gradient: "from-pink-500 to-rose-500" },
  { id: "holiday", label: "🎄 Holiday", gradient: "from-emerald-500 to-green-600" },
  { id: "thankyou", label: "🙏 Thank You", gradient: "from-amber-400 to-orange-500" },
  { id: "congrats", label: "🎉 Congrats", gradient: "from-violet-500 to-purple-600" },
  { id: "travel", label: "✈️ Travel", gradient: "from-sky-400 to-blue-600" },
  { id: "general", label: "🎁 General", gradient: "from-primary to-primary/80" },
];

const GiftCards = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const { play } = useNotificationSound();
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const { data: myCards = [], isLoading } = useQuery({
    queryKey: ["my-gift-cards", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("gift_cards")
        .select("*")
        .or(`created_by_user_id.eq.${user.id},redeemed_by_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const purchasedCards = myCards.filter((c: any) => c.created_by_user_id === user?.id);
  const receivedCards = myCards.filter((c: any) => c.redeemed_by_user_id === user?.id || (c.recipient_email && c.created_by_user_id !== user?.id));

  const handleRedeem = async () => {
    if (!redeemCode.trim() || !user?.id) return;
    setRedeeming(true);
    try {
      const { data, error } = await supabase.rpc("redeem_gift_card_to_wallet" as any, {
        p_code: redeemCode.trim().toUpperCase(),
        p_user_id: user.id,
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        play("gift_card");
        try {
          await supabase.functions.invoke("send-wallet-notification", {
            body: {
              userId: user.id,
              transactionType: "gift_card_redemption",
              amount: result.amount_added,
              description: `Gift card ${redeemCode.trim().toUpperCase()} redeemed`,
              walletTransactionId: result.transaction_id,
            },
          });
        } catch (notifErr) {
          console.warn("Notification failed:", notifErr);
        }
        navigate(`/gift-cards/card/${result.gift_card_id}`, {
          state: { walletCredited: true, amountAdded: result.amount_added },
        });
      } else {
        alert(result?.error || "Could not redeem gift card");
      }
    } catch (err: any) {
      alert(err.message || "Failed to redeem");
    }
    setRedeeming(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">Active</Badge>;
      case "redeemed": return <Badge variant="secondary" className="text-[10px]">Fully Used</Badge>;
      case "expired": return <Badge variant="destructive" className="text-[10px]">Expired</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getDesign = (template: string | null) => {
    return GIFT_CARD_DESIGNS.find(d => d.id === template) || GIFT_CARD_DESIGNS[5];
  };

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 bg-background border-b safe-area-pt px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/pay" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center tap-target">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-bold text-lg">Gift Cards</h1>
                <p className="text-xs text-muted-foreground">Send & manage gift cards</p>
              </div>
            </div>
            <Button size="sm" className="rounded-full gap-1.5" onClick={() => navigate("/gift-cards/purchase")}>
              <Plus className="h-4 w-4" />
              Buy
            </Button>
          </div>
        </motion.header>

        <main className="px-4 py-5 space-y-5">
          {/* Redeem Code */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-2xl border-dashed border-2 border-primary/20 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">Redeem a Gift Card</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g. GC-XXXX-XXXX-XXXX)"
                    className="h-11 rounded-xl font-mono text-sm"
                  />
                  <Button onClick={handleRedeem} disabled={!redeemCode.trim() || redeeming || !user} className="rounded-xl px-5">
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Purchase CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <button onClick={() => navigate("/gift-cards/purchase")} className="w-full">
              <Card className="rounded-2xl overflow-hidden shadow-lg border-0">
                <div className="bg-gradient-to-r from-primary via-primary to-primary/80 p-5 text-primary-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center">
                        <Gift className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-base">Send a Gift Card</p>
                        <p className="text-xs opacity-70">Perfect for any occasion</p>
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 opacity-60" />
                  </div>
                </div>
              </Card>
            </button>
          </motion.div>

          {/* My Cards */}
          {user ? (
            <Tabs defaultValue="purchased" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10 rounded-xl">
                <TabsTrigger value="purchased" className="text-xs rounded-lg">Purchased ({purchasedCards.length})</TabsTrigger>
                <TabsTrigger value="received" className="text-xs rounded-lg">Received ({receivedCards.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="purchased" className="mt-4 space-y-3">
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
                ) : purchasedCards.length > 0 ? (
                  purchasedCards.map((card: any) => {
                    const design = getDesign(card.design_template);
                    return (
                      <Link key={card.id} to={`/gift-cards/card/${card.id}`}>
                        <Card className="rounded-2xl overflow-hidden hover:shadow-md transition-all press-effect">
                          <div className={`bg-gradient-to-r ${design.gradient} p-3 flex items-center gap-3`}>
                             <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                              <CreditCard className="h-5 w-5" />
                            </div>
                            <div className="flex-1 text-white">
                              <p className="font-bold text-sm">{convertPrice(card.initial_amount)}</p>
                              <p className="text-[10px] opacity-80">
                                {card.recipient_name ? `To: ${card.recipient_name}` : "Gift Card"}
                              </p>
                            </div>
                            {getStatusBadge(card.status)}
                          </div>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-mono text-muted-foreground">{card.code}</p>
                              <p className="text-[10px] text-muted-foreground">Balance: {convertPrice(card.remaining_balance)}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })
                ) : (
                  <EmptyState
                    type="no-transactions"
                    size="sm"
                    actionLabel="Buy Gift Card"
                    onAction={() => navigate("/gift-cards/purchase")}
                  />
                )}
              </TabsContent>

              <TabsContent value="received" className="mt-4 space-y-3">
                {receivedCards.length > 0 ? (
                  receivedCards.map((card: any) => {
                    const design = getDesign(card.design_template);
                    return (
                      <Link key={card.id} to={`/gift-cards/card/${card.id}`}>
                        <Card className="rounded-2xl overflow-hidden hover:shadow-md transition-all press-effect">
                          <div className={`bg-gradient-to-r ${design.gradient} p-3 flex items-center gap-3`}>
                            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                              <Gift className="h-5 w-5" />
                            </div>
                            <div className="flex-1 text-white">
                              <p className="font-bold text-sm">{convertPrice(card.remaining_balance)} remaining</p>
                              <p className="text-[10px] opacity-80">From: {card.sender_name || "Someone special"}</p>
                            </div>
                            {getStatusBadge(card.status)}
                          </div>
                          {card.personal_message && (
                            <CardContent className="p-3">
                              <p className="text-xs text-muted-foreground italic">"{card.personal_message}"</p>
                            </CardContent>
                          )}
                        </Card>
                      </Link>
                    );
                  })
                ) : (
                  <EmptyState type="no-transactions" size="sm" />
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="rounded-2xl">
              <CardContent className="p-5 text-center space-y-3">
                <Gift className="h-10 w-10 text-primary mx-auto" />
                <p className="font-semibold">Sign in to manage gift cards</p>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/auth" state={{ returnTo: "/gift-cards" }}>Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default GiftCards;
