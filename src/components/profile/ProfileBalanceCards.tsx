import { Wallet, Gift, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/services/userWalletService";

interface ProfileBalanceCardsProps {
  balance: number;
  points: number;
  currency?: string;
  onTopUp?: () => void;
}

export function ProfileBalanceCards({
  balance,
  points,
  currency = "USD",
  onTopUp,
}: ProfileBalanceCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Balance Card */}
      <div 
        className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-4 text-primary-foreground cursor-pointer active:scale-[0.98] transition-transform shadow-lg relative overflow-hidden"
        onClick={onTopUp}
      >
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs font-medium opacity-80 mb-1">Balance</p>
          <p className="text-2xl font-bold mb-2">
            {formatCurrency(balance, currency)}
          </p>
          <div className="flex items-center gap-1 text-xs font-medium bg-white/20 rounded-full px-2.5 py-1 w-fit">
            <span>Top Up</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Points Card */}
      <Link 
        to="/rewards"
        className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-4 text-white active:scale-[0.98] transition-transform shadow-lg relative overflow-hidden"
      >
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Gift className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs font-medium opacity-80 mb-1">Rewards</p>
          <p className="text-2xl font-bold mb-2">
            {points.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-xs font-medium bg-white/20 rounded-full px-2.5 py-1 w-fit">
            <span>Points</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </Link>
    </div>
  );
}
