import { motion } from "framer-motion";
import { Wallet, Gift, ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";

interface PremiumBalanceCardsProps {
  balance: number;
  points: number;
  currency?: string;
  onTopUp?: () => void;
}

export function PremiumBalanceCards({
  balance,
  points,
  currency = "USD",
  onTopUp,
}: PremiumBalanceCardsProps) {
  const { convertPrice } = useCurrency();
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl cursor-pointer active:scale-[0.98] transition-transform"
        onClick={onTopUp}
      >
        {/* Premium gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary-dark" />
        
        {/* Animated mesh */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)",
          }}
        />
        
        {/* Decorative orb */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        
        <div className="relative z-10 p-4 text-primary-foreground">
          <div className="flex items-center gap-2 mb-3">
             <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          
          <p className="text-xs font-medium text-white/70 mb-1">Balance</p>
          <p className="text-2xl font-bold tracking-tight mb-3">
            {convertPrice(balance)}
          </p>
          
          <div className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 rounded-full px-3 py-1.5 w-fit border border-white/10">
            <TrendingUp className="h-3 w-3" />
            <span>Top Up</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </motion.div>

      {/* Points Card */}
      <Link to="/rewards">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative overflow-hidden rounded-3xl active:scale-[0.98] transition-transform h-full"
        >
          {/* Premium gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500" />
          
          {/* Animated mesh */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: "radial-gradient(circle at 70% 80%, rgba(255,255,255,0.25) 0%, transparent 50%)",
            }}
          />
          
          {/* Decorative orb */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          
          <div className="relative z-10 p-4 text-white h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
                <Gift className="h-5 w-5" />
              </div>
            </div>
            
            <p className="text-xs font-medium text-white/70 mb-1">Rewards</p>
            <p className="text-2xl font-bold tracking-tight mb-3">
              {points.toLocaleString()}
            </p>
            
            <div className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 rounded-full px-3 py-1.5 w-fit border border-white/10 mt-auto">
              <Sparkles className="h-3 w-3" />
              <span>Points</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
