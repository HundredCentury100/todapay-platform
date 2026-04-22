import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Currency = {
  code: string;
  symbol: string;
  rate: number;
  isLive?: boolean;
};

export const currencies: Currency[] = [
  { code: "USD", symbol: "$", rate: 1 },
  { code: "ZWG", symbol: "ZiG", rate: 13.5 },
];

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (price: number, fromCurrency?: string) => string;
  convertValue: (price: number, fromCurrency?: string) => number;
  isLive: boolean;
  lastUpdated: Date | null;
  refreshRates: () => Promise<void>;
  isRefreshing: boolean;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('preferred_currency');
    if (saved) {
      const parsed = JSON.parse(saved);
      return currencies.find(c => c.code === parsed.code) || currencies.find(c => c.code === 'USD')!;
    }
    return currencies.find(c => c.code === 'USD')!;
  });
  
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('preferred_currency', JSON.stringify({ code: newCurrency.code }));
  };

  const refreshRates = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('exchange-rates', {
        body: { base: 'USD' }
      });

      if (!error && data?.success && data?.rates) {
        const newRates: Record<string, number> = {};
        Object.entries(data.rates).forEach(([code, info]: [string, unknown]) => {
          const rateInfo = info as { rate: number };
          newRates[code] = rateInfo.rate;
        });
        setRates(newRates);
        setIsLive(!data.cached || data.source === 'api');
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to refresh rates:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshRates();
    // Refresh rates every hour
    const interval = setInterval(refreshRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshRates]);

  const getRate = (currencyCode: string): number => {
    if (rates[currencyCode]) return rates[currencyCode];
    const fallback = currencies.find(c => c.code === currencyCode);
    return fallback?.rate || 1;
  };

  const convertValue = (price: number, fromCurrency: string = 'USD'): number => {
    const fromRate = getRate(fromCurrency);
    const toRate = getRate(currency.code);
    return (price / fromRate) * toRate;
  };

  const convertPrice = (price: number, fromCurrency: string = 'USD'): string => {
    const converted = convertValue(price, fromCurrency);
    return `${currency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      convertPrice, 
      convertValue,
      isLive, 
      lastUpdated, 
      refreshRates,
      isRefreshing 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};
