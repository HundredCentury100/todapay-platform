import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Wallet } from "lucide-react";
import { FloatAccount } from "@/services/agentFloatService";

interface AgentFloatBalanceCardProps {
  floatAccount: FloatAccount | null;
  isLoading?: boolean;
}

export const AgentFloatBalanceCard = ({ floatAccount, isLoading }: AgentFloatBalanceCardProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-16 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!floatAccount) return null;

  const currencies = [
    {
      label: "USD Float",
      balance: floatAccount.balance_usd,
      threshold: floatAccount.low_balance_threshold_usd,
      symbol: "$",
    },
    {
      label: "ZWG Float",
      balance: floatAccount.balance_zwg,
      threshold: floatAccount.low_balance_threshold_zwg,
      symbol: "ZWG ",
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2">
      {currencies.map((c) => {
        const isLow = c.balance > 0 && c.balance < c.threshold;
        const isZero = c.balance <= 0;

        return (
          <Card
            key={c.label}
            className={
              isZero
                ? "border-destructive/50 bg-destructive/5"
                : isLow
                ? "border-yellow-500/50 bg-yellow-500/5"
                : ""
            }
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">{c.label}</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold truncate">
                {c.symbol}{c.balance.toFixed(2)}
              </div>
              {isZero && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  <span className="text-[10px] sm:text-xs text-destructive font-medium">No balance</span>
                </div>
              )}
              {isLow && !isZero && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  <span className="text-[10px] sm:text-xs text-yellow-600 font-medium">Low balance</span>
                </div>
              )}
              {!isLow && !isZero && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">Available float</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
