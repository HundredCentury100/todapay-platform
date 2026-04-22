import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface UnifiedTransaction {
  id: string;
  type: "wallet" | "bill";
  description: string;
  amount: number;
  isCredit: boolean;
  currency: string;
  created_at: string;
  status?: string;
}

interface PayActivityFeedProps {
  transactions: UnifiedTransaction[];
  isLoading: boolean;
  formatAmount: (amount: number, currency: string) => string;
  onTopUp: () => void;
}

export const PayActivityFeed = ({
  transactions, isLoading, formatAmount, onTopUp,
}: PayActivityFeedProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Recent Activity</h3>
        <Link to="/orders" className="text-xs text-primary font-medium">See All</Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28 mb-1.5" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-1">
          {transactions.slice(0, 8).map((tx, idx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22 + idx * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors"
            >
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                tx.type === "bill"
                  ? "bg-amber-500/10"
                  : tx.isCredit
                    ? "bg-emerald-500/10"
                    : "bg-destructive/10"
              )}>
                {tx.type === "bill" ? (
                  <Zap className="h-4.5 w-4.5 text-amber-500" />
                ) : tx.isCredit ? (
                  <ArrowDownLeft className="h-4.5 w-4.5 text-emerald-500" />
                ) : (
                  <ArrowUpRight className="h-4.5 w-4.5 text-destructive" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate capitalize">{tx.description}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(tx.created_at).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <span className={cn(
                "font-semibold text-sm tabular-nums shrink-0",
                tx.isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
              )}>
                {tx.isCredit ? "+" : "-"}{formatAmount(tx.amount, tx.currency)}
              </span>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          type="no-transactions"
          size="sm"
          actionLabel="Top Up Wallet"
          onAction={onTopUp}
        />
      )}
    </motion.div>
  );
};
