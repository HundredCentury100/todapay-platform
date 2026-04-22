import { motion } from "framer-motion";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface RevolutHeroProps {
  balance: number;
  currency: string;
  symbol?: string;
  trendPercent?: number;
  trendLabel?: string;
}

export function RevolutHero({
  balance,
  currency,
  symbol = "$",
  trendPercent = 12.4,
  trendLabel = "this month",
}: RevolutHeroProps) {
  const [hidden, setHidden] = useState(false);

  return (
    <div className="revolut-hero rounded-3xl px-6 pt-8 pb-6 relative overflow-hidden">
      {/* subtle glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[hsl(var(--revolut-accent))] opacity-10 blur-3xl" />

      <div className="flex items-center justify-between mb-6 relative">
        <div className="revolut-pill px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[hsl(var(--revolut-success))]" />
          Personal · {currency}
        </div>
        <button
          onClick={() => setHidden((v) => !v)}
          className="revolut-action-btn h-9 w-9 rounded-full flex items-center justify-center"
          aria-label={hidden ? "Show balance" : "Hide balance"}
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <motion.div
        key={`${balance}-${hidden}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <p className="text-[hsl(var(--revolut-text-muted))] text-xs uppercase tracking-wider mb-2">
          Total balance
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold tracking-tight">
            {hidden ? "••••" : `${symbol}${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="revolut-pill px-2.5 py-1 text-xs font-medium flex items-center gap-1 text-[hsl(var(--revolut-success))]">
            <TrendingUp className="h-3 w-3" />
            +{trendPercent}%
          </div>
          <span className="text-xs text-[hsl(var(--revolut-text-muted))]">{trendLabel}</span>
        </div>
      </motion.div>
    </div>
  );
}
