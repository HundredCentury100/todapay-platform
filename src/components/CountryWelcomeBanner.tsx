import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrency, currencies } from "@/contexts/CurrencyContext";
import { countryToCurrency, getCountryServices, countryFlag, countryNames } from "@/lib/countryServices";
import { toast } from "sonner";

interface CountryWelcomeBannerProps {
  countryChanged: { from: string | null; to: string } | null;
  onDismiss: () => void;
}

export const CountryWelcomeBanner = ({ countryChanged, onDismiss }: CountryWelcomeBannerProps) => {
  const { currency, setCurrency } = useCurrency();
  const [showCurrencyPrompt, setShowCurrencyPrompt] = useState(false);

  if (!countryChanged) return null;

  const { to: newCountryCode } = countryChanged;
  const countryName = countryNames[newCountryCode] || newCountryCode;
  const flag = countryFlag(newCountryCode);
  const services = getCountryServices(newCountryCode);
  const suggestedCurrencyCode = countryToCurrency[newCountryCode];
  const suggestedCurrency = suggestedCurrencyCode
    ? currencies.find((c) => c.code === suggestedCurrencyCode)
    : null;
  const shouldSuggestCurrency = suggestedCurrency && suggestedCurrency.code !== currency.code;

  const handleSwitchCurrency = () => {
    if (suggestedCurrency) {
      setCurrency(suggestedCurrency);
      toast.success(`Currency switched to ${suggestedCurrency.code} (${suggestedCurrency.symbol})`);
    }
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="px-4 pt-3"
      >
        <Card className="rounded-2xl border shadow-md overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{flag}</span>
                <div>
                  <h3 className="font-bold text-sm">Welcome to {countryName}!</h3>
                  <p className="text-[10px] text-muted-foreground">We've updated available services for you</p>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Available services */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {services.map((service) => (
                <span
                  key={service}
                  className="text-[10px] font-medium px-2 py-1 rounded-full bg-primary/10 text-primary"
                >
                  {service}
                </span>
              ))}
            </div>

            {/* Currency suggestion */}
            {shouldSuggestCurrency && (
              <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Switch to <strong className="text-foreground">{suggestedCurrency.code} ({suggestedCurrency.symbol})</strong>?
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs rounded-lg px-3"
                  onClick={handleSwitchCurrency}
                >
                  Switch
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
