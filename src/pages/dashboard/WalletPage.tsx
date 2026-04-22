import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserWallet } from "@/hooks/useUserWallet";
import { useProfile } from "@/hooks/useProfile";
import { RevolutHero } from "@/components/wallet/revolut/RevolutHero";
import { CurrencyPockets } from "@/components/wallet/revolut/CurrencyPockets";
import { ActionGrid } from "@/components/wallet/revolut/ActionGrid";
import { AnalyticsCard } from "@/components/wallet/revolut/AnalyticsCard";
import { QuickServicesStrip } from "@/components/wallet/revolut/QuickServicesStrip";
import { TransactionList } from "@/components/wallet/revolut/TransactionList";
import { FloatingActionMenu } from "@/components/wallet/revolut/FloatingActionMenu";
import { UnifiedTopUp } from "@/components/wallet/UnifiedTopUp";
import { useWalletPockets } from "@/hooks/useWalletPockets";

const WalletPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { wallet, transactions } = useUserWallet();
  const [showTopUp, setShowTopUp] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState("USD");

  const balance = wallet?.balance || 0;
  const pockets = useWalletPockets(balance);
  const activePocket = useMemo(
    () => pockets.find((p) => p.currency === activeCurrency) ?? pockets[0],
    [pockets, activeCurrency]
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--revolut-bg))]">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 space-y-5">
        <RevolutHero
          balance={activePocket?.balance ?? balance}
          currency={activeCurrency}
          symbol={activePocket?.symbol ?? "$"}
        />

        <ActionGrid onAdd={() => setShowTopUp(true)} />

        <CurrencyPockets pockets={pockets} activeCurrency={activeCurrency} onSelect={setActiveCurrency} />

        <AnalyticsCard symbol="$" />

        <QuickServicesStrip />

        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--revolut-text))] px-1 mb-3">Recent transactions</h3>
          <TransactionList transactions={transactions || []} symbol="$" />
        </div>
      </div>

      <FloatingActionMenu onTopUp={() => setShowTopUp(true)} />

      <UnifiedTopUp open={showTopUp} onOpenChange={setShowTopUp} currency={wallet?.currency} />
    </div>
  );
};

export default WalletPage;
