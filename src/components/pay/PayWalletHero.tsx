import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send, Globe2, Receipt, Eye, EyeOff, TrendingUp } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  action: () => void;
  highlight?: boolean;
}

interface PayWalletHeroProps {
  balance: number;
  balanceHidden: boolean;
  setBalanceHidden: (v: boolean) => void;
  walletLoading: boolean;
  formatAmount: (amount: number) => string;
  displayCurrencyCode: string;
  onTopUp: () => void;
  onNavigate: (path: string) => void;
}

export const PayWalletHero = ({
  balance, balanceHidden, setBalanceHidden, walletLoading,
  formatAmount, displayCurrencyCode, onTopUp, onNavigate,
}: PayWalletHeroProps) => {
  const quickActions: QuickAction[] = [
    { icon: Plus, label: "Add", action: onTopUp, highlight: true },
    { icon: Send, label: "Send", action: () => onNavigate("/pay/send") },
    { icon: Globe2, label: "Receive", action: () => onNavigate("/pay/remittance") },
    { icon: Receipt, label: "History", action: () => onNavigate("/pay/bills/history") },
  ];

  return (
    <div className="revolut-hero px-5 pt-14 pb-8 safe-area-pt relative overflow-hidden">
      {/* Subtle accent glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[hsl(var(--revolut-accent))] opacity-10 blur-3xl pointer-events-none" />

      <div className="mb-2 relative">
        <BackButton className="text-[hsl(var(--revolut-text))] hover:bg-white/10" fallbackPath="/" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="revolut-pill px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--revolut-success))]" />
            Pay · {displayCurrencyCode}
          </div>
          <button
            onClick={() => setBalanceHidden(!balanceHidden)}
            className="revolut-action-btn h-9 w-9 rounded-full flex items-center justify-center tap-target"
            aria-label={balanceHidden ? "Show balance" : "Hide balance"}
          >
            {balanceHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <p className="text-[hsl(var(--revolut-text-muted))] text-xs uppercase tracking-wider mb-2">
          Available balance
        </p>

        {walletLoading ? (
          <Skeleton className="h-12 w-44 bg-white/10 rounded-lg" />
        ) : (
          <AnimatePresence mode="wait">
            <motion.p
              key={balanceHidden ? "hidden" : "visible"}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-5xl font-bold tracking-tight leading-none text-[hsl(var(--revolut-text))]"
            >
              {balanceHidden ? "••••" : formatAmount(balance)}
            </motion.p>
          </AnimatePresence>
        )}

        <div className="mt-3 flex items-center gap-2">
          <div className="revolut-pill px-2.5 py-1 text-xs font-medium flex items-center gap-1 text-[hsl(var(--revolut-success))]">
            <TrendingUp className="h-3 w-3" />
            Global
          </div>
          <span className="text-xs text-[hsl(var(--revolut-text-muted))]">
            Suvat Pay · multi-currency
          </span>
        </div>
      </motion.div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-4 gap-2 mt-7 relative">
        {quickActions.map((item, idx) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * idx }}
            onClick={item.action}
            className="flex flex-col items-center gap-2 tap-target"
          >
            <div
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center transition-all",
                item.highlight
                  ? "bg-[hsl(var(--revolut-accent))] text-white shadow-lg shadow-[hsl(var(--revolut-accent))]/30 hover:scale-105"
                  : "revolut-action-btn"
              )}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-[hsl(var(--revolut-text))]">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
