import { format, isToday, isYesterday } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Gift, CreditCard, Send } from "lucide-react";
import type { UserWalletTransaction } from "@/services/userWalletService";

interface TransactionListProps {
  transactions: UserWalletTransaction[];
  symbol?: string;
}

const iconMap: Record<string, { icon: typeof ArrowDownLeft; color: string; bg: string }> = {
  topup: { icon: ArrowDownLeft, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  credit: { icon: ArrowDownLeft, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  reward: { icon: Gift, color: "text-rose-400", bg: "bg-rose-500/15" },
  refund: { icon: RefreshCw, color: "text-blue-400", bg: "bg-blue-500/15" },
  payment: { icon: CreditCard, color: "text-orange-400", bg: "bg-orange-500/15" },
  debit: { icon: ArrowUpRight, color: "text-red-400", bg: "bg-red-500/15" },
  transfer: { icon: Send, color: "text-purple-400", bg: "bg-purple-500/15" },
};

const groupKey = (d: Date) => {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
};

export function TransactionList({ transactions, symbol = "$" }: TransactionListProps) {
  if (!transactions.length) {
    return (
      <div className="revolut-card rounded-3xl p-8 text-center">
        <p className="text-sm text-[hsl(var(--revolut-text-muted))]">No transactions yet</p>
      </div>
    );
  }

  // Group transactions by day
  const groups = new Map<string, UserWalletTransaction[]>();
  transactions.forEach((t) => {
    const key = groupKey(new Date(t.created_at));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  });

  const incoming = ["topup", "credit", "reward", "refund"];

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([day, txns]) => (
        <div key={day}>
          <p className="text-xs uppercase tracking-wider text-[hsl(var(--revolut-text-muted))] px-1 mb-2">
            {day}
          </p>
          <div className="revolut-card rounded-2xl overflow-hidden">
            {txns.map((t, idx) => {
              const cfg = iconMap[t.transaction_type] || iconMap.payment;
              const isIn = incoming.includes(t.transaction_type);
              const Icon = cfg.icon;
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 p-3.5 ${
                    idx !== txns.length - 1 ? "border-b border-[hsl(var(--revolut-border))]" : ""
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${cfg.bg}`}>
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--revolut-text))] truncate">
                      {t.description || t.transaction_type}
                    </p>
                    <p className="text-xs text-[hsl(var(--revolut-text-muted))]">
                      {format(new Date(t.created_at), "HH:mm")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        isIn ? "text-emerald-400" : "text-[hsl(var(--revolut-text))]"
                      }`}
                    >
                      {isIn ? "+" : "-"}
                      {symbol}
                      {Math.abs(t.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
