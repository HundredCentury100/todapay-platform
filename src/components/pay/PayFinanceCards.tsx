import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Gift, ChevronRight, Sparkles, Ticket, Tag, Globe2, HandCoins, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PayFinanceCardsProps {
  rewardsPoints: number;
}

export const PayFinanceCards = ({ rewardsPoints }: PayFinanceCardsProps) => {
  return (
    <>
      {/* Rewards & Points */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Link to="/rewards">
          <Card className="rounded-2xl border shadow-sm overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Reward Points</p>
                  <p className="text-lg font-bold">{rewardsPoints.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-primary font-medium">
                <Sparkles className="h-4 w-4" />
                <span>Redeem</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* International Transfer */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
        <Link to="/pay/remittance">
          <Card className="rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all press-effect">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-sky-500/10 flex items-center justify-center">
                  <Globe2 className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">International Transfer</p>
                  <p className="text-[10px] text-muted-foreground">Send & receive globally</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Request Money */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.115 }}>
        <Link to="/pay/request">
          <Card className="rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all press-effect">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <HandCoins className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Request Money</p>
                  <p className="text-[10px] text-muted-foreground">Ask anyone to pay you</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Pay with Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.118 }}>
        <Link to="/pay/card">
          <Card className="rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all press-effect">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Pay with Card</p>
                  <p className="text-[10px] text-muted-foreground">P2P via Visa/Mastercard</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Vouchers */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Link to="/vouchers">
          <Card className="rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all press-effect">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">My Vouchers</p>
                  <p className="text-[10px] text-muted-foreground">Discounts & offers</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Gift Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
        <Link to="/gift-cards">
          <Card className="rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all press-effect">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Gift Cards</p>
                  <p className="text-[10px] text-muted-foreground">Buy, send & redeem</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Promo Code */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <Link to="/promo">
          <Card className="rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all press-effect">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Promo Code</p>
                  <p className="text-[10px] text-muted-foreground">Enter a code to redeem</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </>
  );
};
