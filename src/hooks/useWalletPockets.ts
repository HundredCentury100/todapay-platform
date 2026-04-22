import { useMemo } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Pocket } from "@/components/wallet/revolut/CurrencyPockets";

const POCKET_DEFINITIONS: Array<Omit<Pocket, "balance">> = [
  { currency: "USD", symbol: "$", flag: "🇺🇸" },
  { currency: "ZAR", symbol: "R", flag: "🇿🇦" },
  { currency: "GBP", symbol: "£", flag: "🇬🇧" },
  { currency: "EUR", symbol: "€", flag: "🇪🇺" },
  { currency: "KES", symbol: "KSh", flag: "🇰🇪" },
  { currency: "NGN", symbol: "₦", flag: "🇳🇬" },
  { currency: "ZWG", symbol: "ZiG", flag: "🇿🇼" },
];

// Synthetic allocation weights — what % of the master USD balance is "held" in each pocket.
// Real multi-currency wallets would store separate ledger balances; these are FX-converted views.
const ALLOCATION_WEIGHTS: Record<string, number> = {
  USD: 0.55,
  ZAR: 0.15,
  GBP: 0.10,
  EUR: 0.08,
  KES: 0.05,
  NGN: 0.04,
  ZWG: 0.03,
};

/**
 * Derives multi-currency wallet pockets from the master USD wallet balance,
 * using live FX rates from CurrencyContext. Allocation weights are illustrative
 * until per-pocket ledger storage is wired through `wallet_pockets`.
 */
export function useWalletPockets(masterUsdBalance: number): Pocket[] {
  const { convertValue } = useCurrency();

  return useMemo(() => {
    return POCKET_DEFINITIONS.map((p) => {
      const weight = ALLOCATION_WEIGHTS[p.currency] ?? 0;
      const usdSlice = masterUsdBalance * weight;
      const balance = p.currency === "USD" ? usdSlice : convertValue(usdSlice, "USD");
      return { ...p, balance };
    });
  }, [masterUsdBalance, convertValue]);
}
