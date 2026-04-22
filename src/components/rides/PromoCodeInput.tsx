import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, ChevronDown, Check, X, Loader2, Gift, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { validatePromoCode, PromoValidationResult } from "@/services/promoCodeService";
import { toast } from "sonner";

interface PromoCodeInputProps {
  orderAmount: number;
  onPromoApplied: (result: PromoValidationResult) => void;
  onPromoRemoved: () => void;
  appliedPromo?: PromoValidationResult | null;
  className?: string;
}

export function PromoCodeInput({
  orderAmount,
  onPromoApplied,
  onPromoRemoved,
  appliedPromo,
  className,
}: PromoCodeInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) {
      setError("Please enter a promo code");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const result = await validatePromoCode(code.trim(), orderAmount, 'ride');
      
      if (result.valid) {
        onPromoApplied(result);
        setIsExpanded(false);
        toast.success(`Promo applied! You save $${result.discount?.toFixed(0)}`);
      } else {
        setError(result.error || "Invalid promo code");
      }
    } catch (err) {
      setError("Failed to validate promo code");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    setCode("");
    setError(null);
    onPromoRemoved();
  };

  if (appliedPromo) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-3 rounded-xl bg-green-500/10 border border-green-500/20",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Gift className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-700 dark:text-green-400">
                  {appliedPromo.description || 'Promo Applied'}
                </span>
                <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400">
                  <Sparkles className="h-3 w-3 mr-1" />
                  -${appliedPromo.discount?.toFixed(0)}
                </Badge>
              </div>
              <p className="text-xs text-green-600/80 dark:text-green-400/80">
                {appliedPromo.discount_type === 'percentage' 
                  ? `${appliedPromo.discount_value}% off` 
                  : `$${appliedPromo.discount_value} off`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-600 hover:text-red-500 hover:bg-red-500/10"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-accent/30 transition-all"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Tag className="h-4 w-4" />
          <span className="text-sm">Have a promo code?</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-3">
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="Enter code"
                  className="flex-1 uppercase font-mono"
                  disabled={isValidating}
                />
                <Button
                  onClick={handleValidate}
                  disabled={isValidating || !code.trim()}
                  className="min-w-[80px]"
                >
                  {isValidating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2 text-destructive text-sm"
                  >
                    <X className="h-4 w-4" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Suggested Promos */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Popular codes:</p>
                <div className="flex flex-wrap gap-2">
                  {['FIRST10', 'SAVE20', 'NEWUSER'].map((promoCode) => (
                    <Button
                      key={promoCode}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs font-mono"
                      onClick={() => setCode(promoCode)}
                    >
                      {promoCode}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PromoCodeInput;
