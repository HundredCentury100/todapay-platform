import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  RefreshCw,
  CreditCard,
  History,
  Copy,
  CheckCircle,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/services/userWalletService";
import type { UserWalletTransaction } from "@/services/userWalletService";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface TransactionHistoryProps {
  transactions: UserWalletTransaction[];
  isLoading?: boolean;
  maxHeight?: string;
  currency?: string;
}

const transactionConfig: Record<string, { icon: typeof ArrowDownLeft; color: string; bgColor: string; label: string }> = {
  topup: {
    icon: ArrowDownLeft,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Top Up',
  },
  credit: {
    icon: ArrowDownLeft,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Credit',
  },
  payment: {
    icon: CreditCard,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Payment',
  },
  debit: {
    icon: CreditCard,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Debit',
  },
  refund: {
    icon: RefreshCw,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Refund',
  },
  reward: {
    icon: Gift,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Reward',
  },
  transfer: {
    icon: ArrowUpRight,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Transfer',
  },
};

function TransactionDetailSheet({
  transaction,
  open,
  onOpenChange,
  currency,
}: {
  transaction: UserWalletTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
}) {
  if (!transaction) return null;

  const config = transactionConfig[transaction.transaction_type] || transactionConfig.payment;
  const Icon = config.icon;
  const isCredit = ['topup', 'credit', 'refund', 'reward'].includes(transaction.transaction_type);

  const copyRef = () => {
    if (transaction.payment_reference) {
      navigator.clipboard.writeText(transaction.payment_reference);
      toast.success('Reference copied');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
        <SheetHeader className="pb-2">
          <SheetTitle className="sr-only">Transaction Details</SheetTitle>
        </SheetHeader>
        <div className="space-y-5">
          {/* Icon + Amount hero */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-3 pt-2"
          >
            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${config.bgColor}`}>
              <Icon className={`h-8 w-8 ${config.color}`} />
            </div>
            <div className="text-center">
              <p className={`text-3xl font-bold ${isCredit ? 'text-green-600' : 'text-foreground'}`}>
                {isCredit ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount), currency)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{config.label}</p>
            </div>
          </motion.div>

          {/* Details */}
          <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
            {transaction.description && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Description</span>
                <span className="font-medium text-right max-w-[60%] truncate">{transaction.description}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{format(new Date(transaction.created_at), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">{format(new Date(transaction.created_at), 'HH:mm:ss')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="secondary" className="text-xs">{config.label}</Badge>
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance Before</span>
                <span className="font-medium">{formatCurrency(transaction.balance_before, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance After</span>
                <span className="font-semibold">{formatCurrency(transaction.balance_after, currency)}</span>
              </div>
            </div>
            {transaction.payment_reference && (
              <div className="border-t pt-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <button
                    onClick={copyRef}
                    className="flex items-center gap-1.5 font-mono text-xs bg-muted px-2 py-1 rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <span className="truncate max-w-[140px]">{transaction.payment_reference}</span>
                    <Copy className="h-3 w-3 shrink-0" />
                  </button>
                </div>
              </div>
            )}
            {transaction.booking_id && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Booking</span>
                <span className="font-mono text-xs">{transaction.booking_id.slice(0, 8)}...</span>
              </div>
            )}
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full h-12 rounded-xl">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function TransactionHistory({
  transactions,
  isLoading,
  maxHeight = '400px',
  currency = 'ZAR',
}: TransactionHistoryProps) {
  const [selectedTx, setSelectedTx] = useState<UserWalletTransaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleTxClick = (tx: UserWalletTransaction) => {
    setSelectedTx(tx);
    setDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No transactions yet</p>
        <p className="text-xs">Your transaction history will appear here</p>
      </div>
    );
  }

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, tx) => {
    const date = format(new Date(tx.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(tx);
    return groups;
  }, {} as Record<string, UserWalletTransaction[]>);

  return (
    <>
      <ScrollArea style={{ maxHeight }}>
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, txs]) => (
            <div key={date}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                {format(new Date(date), 'EEEE, MMMM d')}
              </p>
              <div className="space-y-1">
                {txs.map((tx) => {
                  const config = transactionConfig[tx.transaction_type] || transactionConfig.payment;
                  const Icon = config.icon;
                  const isCredit = ['topup', 'credit', 'refund', 'reward'].includes(tx.transaction_type);

                  return (
                    <button
                      key={tx.id}
                      onClick={() => handleTxClick(tx)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 active:bg-muted/70 transition-colors text-left"
                    >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${config.bgColor}`}
                      >
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tx.description || config.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'HH:mm')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-semibold ${
                            isCredit ? 'text-green-600' : 'text-foreground'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                          {formatCurrency(Math.abs(tx.amount), currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bal: {formatCurrency(tx.balance_after, currency)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <TransactionDetailSheet
        transaction={selectedTx}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        currency={currency}
      />
    </>
  );
}
