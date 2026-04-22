import { useState, useEffect } from "react";
import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, Clock, ArrowRight, Sparkles, Copy, Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getActivePromoCodes, claimPromoAsVoucher } from "@/services/voucherService";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const verticalIcons: Record<string, string> = {
  bus: "🚌", rides: "🚗", event: "🎫", stay: "🏨",
  car_rental: "🚙", transfer: "✈️", workspace: "💼", experience: "🎭", flight: "✈️",
};

const Promos = () => {
  const { user } = useAuth();
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    setIsLoading(true);
    const data = await getActivePromoCodes();
    setPromoCodes(data);
    setIsLoading(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code ${code} copied!`);
  };

  const handleClaim = async (promo: any) => {
    if (!user) {
      toast.error("Please sign in to claim promos");
      return;
    }
    setClaimingId(promo.id);
    const result = await claimPromoAsVoucher(promo.code);
    if (result.success) {
      setClaimedIds(prev => new Set(prev).add(promo.id));
      toast.success("Promo claimed! Check your vouchers.");
    } else {
      toast.error(result.error || "Failed to claim");
    }
    setClaimingId(null);
  };

  const gradients = [
    "from-blue-500 to-blue-600", "from-teal-500 to-teal-600",
    "from-pink-500 to-rose-600", "from-orange-500 to-orange-600",
    "from-purple-500 to-purple-600", "from-emerald-500 to-emerald-600",
  ];

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-background border-b safe-area-pt">
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath="/" />
            <div className="flex-1">
              <h1 className="font-bold text-lg">Promotions</h1>
              <p className="text-xs text-muted-foreground">Current deals and offers</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="rounded-xl">
              <Link to="/promo">
                <Tag className="w-4 h-4 mr-1" />
                Enter Code
              </Link>
            </Button>
          </div>
        </header>

        {/* Featured Banner */}
        <div className="px-4 py-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-5 rounded-2xl border-0 shadow-md bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold">Special Offers</h2>
                  <p className="text-sm opacity-80">{promoCodes.length} active promotions</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <main className="px-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : promoCodes.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl border-0 shadow-md">
              <p className="text-muted-foreground">No active promotions right now. Check back soon!</p>
            </Card>
          ) : (
            promoCodes.map((promo, index) => {
              const isClaimed = claimedIds.has(promo.id);
              return (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
                    <div className={`bg-gradient-to-r ${gradients[index % gradients.length]} p-4 text-white`}>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {promo.applicable_verticals?.length === 1
                            ? verticalIcons[promo.applicable_verticals[0]] || '🎁'
                            : '🎁'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold">
                            {promo.discount_type === 'percentage'
                              ? `${promo.discount_value}% Off`
                              : `$${promo.discount_value} Off`}
                          </h3>
                          <p className="text-sm text-white/80">{promo.description}</p>
                        </div>
                        {promo.first_time_only && (
                          <Badge className="bg-white/20 text-white border-0 text-xs">New Users</Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">{promo.code}</span>
                          <Button variant="ghost" size="sm" onClick={() => copyCode(promo.code)} className="h-7 px-2">
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        {promo.valid_until && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Until {format(new Date(promo.valid_until), 'MMM d')}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {promo.applicable_verticals?.length > 0 ? (
                          promo.applicable_verticals.map((v: string) => (
                            <Badge key={v} variant="outline" className="text-xs capitalize">{v}</Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs">All services</Badge>
                        )}
                        {promo.min_order_amount > 0 && (
                          <Badge variant="secondary" className="text-xs">Min. ${promo.min_order_amount}</Badge>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className="w-full rounded-xl"
                        disabled={isClaimed || claimingId === promo.id}
                        onClick={() => handleClaim(promo)}
                      >
                        {claimingId === promo.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : isClaimed ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Claimed
                          </>
                        ) : (
                          "Claim Voucher"
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default Promos;
