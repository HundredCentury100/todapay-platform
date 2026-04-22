import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useUserWallet } from "@/hooks/useUserWallet";
import { useCurrency } from "@/contexts/CurrencyContext";
import { UnifiedTopUp } from "@/components/wallet/UnifiedTopUp";
import MobileAppLayout from "@/components/MobileAppLayout";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSavedBillers } from "@/hooks/useSavedBillers";

import { PayWalletHero } from "@/components/pay/PayWalletHero";
import { PayRecentBillers } from "@/components/pay/PayRecentBillers";
import { PayBillersGrid } from "@/components/pay/PayBillersGrid";
import { PayFinanceCards } from "@/components/pay/PayFinanceCards";
import { PayPaymentMethods } from "@/components/pay/PayPaymentMethods";
import { PayActivityFeed } from "@/components/pay/PayActivityFeed";

import zetdcLogo from "@/assets/billers/zetdc.png";
import bccLogo from "@/assets/billers/bcc.png";
import econetLogo from "@/assets/billers/econet.png";
import netoneLogo from "@/assets/billers/netone.png";
import telecelLogo from "@/assets/billers/telecel.png";
import nyaradzoLogo from "@/assets/billers/nyaradzo.png";
import moonlightLogo from "@/assets/billers/moonlight.png";
import edgarsLogo from "@/assets/billers/edgars.png";
import jetLogo from "@/assets/billers/jet.png";

const billers = [
  // Zimbabwe
  { id: "zetdc", name: "ZETDC", description: "Electricity", logo: zetdcLogo, path: "/pay/bills/zesa", country: "ZW" as const },
  { id: "bcc", name: "BCC", description: "Council", logo: bccLogo, path: "/pay/bills/bcc", country: "ZW" as const },
  { id: "econet", name: "Econet", description: "Airtime", logo: econetLogo, path: "/pay/bills/econet", country: "ZW" as const },
  { id: "netone", name: "Netone", description: "Airtime", logo: netoneLogo, path: "/pay/bills/netone", country: "ZW" as const },
  { id: "telecel", name: "Telecel", description: "Airtime", logo: telecelLogo, path: "/pay/bills/telecel", country: "ZW" as const },
  { id: "nyaradzo", name: "Nyaradzo", description: "Funeral", logo: nyaradzoLogo, path: "/pay/bills/nyaradzo", country: "ZW" as const },
  { id: "moonlight", name: "Moonlight", description: "Funeral", logo: moonlightLogo, path: "/pay/bills/moonlight", country: "ZW" as const },
  { id: "edgars", name: "Edgars", description: "Retail", logo: edgarsLogo, path: "/pay/bills/edgars", country: "ZW" as const },
  { id: "jet", name: "Jet", description: "Retail", logo: jetLogo, path: "/pay/bills/jet", country: "ZW" as const },
  // South Africa
  { id: "dstv", name: "DStv", description: "TV", logo: "🛰️", path: "/pay/bills/dstv", country: "ZA" as const },
  { id: "sa-electricity", name: "SA Power", description: "Electricity", logo: "⚡", path: "/pay/bills/sa-electricity", country: "ZA" as const },
  { id: "cellc", name: "Cell C", description: "Airtime", logo: "📱", path: "/pay/bills/cellc", country: "ZA" as const },
  { id: "telkom", name: "Telkom", description: "Airtime", logo: "📞", path: "/pay/bills/telkom", country: "ZA" as const },
];

const billerLogoMap: Record<string, string> = {
  zetdc: zetdcLogo, bcc: bccLogo, econet: econetLogo, netone: netoneLogo,
  telecel: telecelLogo, nyaradzo: nyaradzoLogo, moonlight: moonlightLogo,
  edgars: edgarsLogo, jet: jetLogo,
};
const billerPathMap: Record<string, string> = Object.fromEntries(billers.map(b => [b.id, b.path]));

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

const PayPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currency: platformCurrency, convertPrice } = useCurrency();
  const [showTopUp, setShowTopUp] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [showBillers, setShowBillers] = useState(false);
  const queryClient = useQueryClient();
  const { getTopBillers, removeBiller } = useSavedBillers();
  const topBillers = getTopBillers(4);

  const {
    wallet, transactions, isLoading: walletLoading,
    isLoadingTransactions, rewardsPoints,
  } = useUserWallet();

  const balance = wallet?.balance || 0;
  const walletCurrency = wallet?.currency || 'USD';
  const displayCurrencyCode = platformCurrency.code;
  const displayCurrencySymbol = platformCurrency.symbol;

  const formatAmount = useCallback((amount: number, fromCurrency: string = walletCurrency) => {
    if (fromCurrency === displayCurrencyCode) {
      return `${displayCurrencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return convertPrice(amount, fromCurrency);
  }, [walletCurrency, displayCurrencyCode, displayCurrencySymbol, convertPrice]);

  const { data: billPayments = [], isLoading: billsLoading } = useQuery({
    queryKey: ['recent-bill-payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("bill_payments")
        .select("id, biller_name, biller_type, amount, currency, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) { console.error(error); return []; }
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  const unifiedTransactions: UnifiedTransaction[] = [
    ...transactions.map((tx) => ({
      id: tx.id,
      type: "wallet" as const,
      description: tx.description || tx.transaction_type.replace('_', ' '),
      amount: Math.abs(tx.amount),
      isCredit: ['topup', 'credit', 'reward', 'refund'].includes(tx.transaction_type),
      currency: walletCurrency,
      created_at: tx.created_at,
    })),
    ...billPayments.map((bp: any) => ({
      id: bp.id,
      type: "bill" as const,
      description: `${bp.biller_name} · ${bp.biller_type}`,
      amount: bp.amount,
      isCredit: false,
      currency: bp.currency || "USD",
      created_at: bp.created_at,
      status: bp.status,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user-wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['user-wallet-transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['recent-bill-payments'] }),
    ]);
  }, [queryClient]);

  const isGuest = !user;

  if (isGuest) {
    return (
      <MobileAppLayout>
        <div className="min-h-screen bg-background pb-24">
          <div className="bg-primary text-primary-foreground px-5 pt-14 pb-6 safe-area-pt">
            <div className="mb-2">
              <BackButton className="text-primary-foreground hover:bg-white/10" fallbackPath="/" />
            </div>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-bold">Pay Bills</h1>
              <p className="text-sm opacity-70 mt-1">Electricity, airtime, council & more</p>
            </motion.div>
          </div>

          <div className="px-4 pt-5 space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {billers.map((biller, idx) => (
                <motion.div key={biller.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}>
                  <Link to={biller.path} className="flex flex-col items-center gap-2 p-3 rounded-2xl border bg-card hover:shadow-md transition-all press-effect">
                    <img src={biller.logo} alt={biller.name} className="w-10 h-10 rounded-xl object-contain" />
                    <div className="text-center">
                      <p className="text-xs font-semibold">{biller.name}</p>
                      <p className="text-[10px] text-muted-foreground">{biller.description}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="rounded-2xl border shadow-sm">
                <CardContent className="p-4 text-center">
                  <Wallet className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-sm">Want a wallet & rewards?</p>
                  <p className="text-[11px] text-muted-foreground mb-3">Sign in to track payments, earn points & save billers</p>
                  <Button asChild size="sm" className="rounded-full px-6">
                    <Link to="/auth" state={{ returnTo: "/pay" }}>Sign In</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background pb-24">
        <PayWalletHero
          balance={balance}
          balanceHidden={balanceHidden}
          setBalanceHidden={setBalanceHidden}
          walletLoading={walletLoading}
          formatAmount={(amount) => formatAmount(amount)}
          displayCurrencyCode={displayCurrencyCode}
          onTopUp={() => setShowTopUp(true)}
          onNavigate={navigate}
        />

        <div className="px-4 pt-5 space-y-5">
          <PayRecentBillers
            topBillers={topBillers}
            billerLogoMap={billerLogoMap}
            billerPathMap={billerPathMap}
            removeBiller={removeBiller}
          />

          <PayBillersGrid
            billers={billers}
            showBillers={showBillers}
            setShowBillers={setShowBillers}
          />

          <PayFinanceCards rewardsPoints={rewardsPoints} />

          <PayPaymentMethods />

          <PayActivityFeed
            transactions={unifiedTransactions}
            isLoading={isLoadingTransactions || billsLoading}
            formatAmount={formatAmount}
            onTopUp={() => setShowTopUp(true)}
          />
        </div>
      </div>

      <UnifiedTopUp open={showTopUp} onOpenChange={setShowTopUp} currency={walletCurrency} />
    </MobileAppLayout>
  );
};

export default PayPage;
