import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumStickyCTAProps {
  price: string | number;
  priceLabel?: string;
  originalPrice?: string | number;
  ctaText: string;
  subText?: string;
  onAction: () => void;
  disabled?: boolean;
  loading?: boolean;
  showChevron?: boolean;
  variant?: "default" | "gradient" | "glass";
  className?: string;
}

export const PremiumStickyCTA = ({
  price,
  priceLabel,
  originalPrice,
  ctaText,
  subText,
  onAction,
  disabled = false,
  loading = false,
  showChevron = true,
  variant = "gradient",
  className,
}: PremiumStickyCTAProps) => {
  const variants = {
    default: "bg-card border-t",
    gradient: "bg-gradient-to-r from-card via-card to-primary/5 border-t border-primary/10",
    glass: "bg-background border-t border-border",
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        delay: 0.3 
      }}
      className={cn(
        "fixed bottom-0 left-0 right-0 p-4 safe-area-pb z-50 md:hidden",
        variants[variant],
        className
      )}
    >
      {/* Animated gradient line */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <div className="flex items-center justify-between gap-4">
        {/* Price Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {subText && (
            <span className="text-xs text-muted-foreground block">{subText}</span>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{price}</span>
            {priceLabel && (
              <span className="text-sm text-muted-foreground">{priceLabel}</span>
            )}
          </div>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>
          )}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            size="lg"
            onClick={onAction}
            disabled={disabled || loading}
            className={cn(
              "rounded-xl px-6 min-w-[140px] font-semibold",
              "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
              "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
              "transition-all duration-300 active:scale-95"
            )}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                {ctaText}
                {showChevron && <ChevronUp className="h-4 w-4" />}
              </span>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Drawer trigger variant
interface PremiumCTADrawerTriggerProps {
  price: string | number;
  priceLabel?: string;
  ctaText: string;
  subText?: string;
  children: React.ReactNode;
}

export const PremiumCTADrawerTrigger = ({
  price,
  priceLabel,
  ctaText,
  subText,
  children,
}: PremiumCTADrawerTriggerProps) => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        delay: 0.3 
      }}
      className="fixed bottom-0 left-0 right-0 p-4 safe-area-pb z-50 md:hidden bg-gradient-to-r from-card via-card to-primary/5 border-t border-primary/10"
    >
      {/* Animated gradient line */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <div className="flex items-center justify-between gap-4">
        <div>
          {subText && (
            <span className="text-xs text-muted-foreground block">{subText}</span>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{price}</span>
            {priceLabel && (
              <span className="text-sm text-muted-foreground">{priceLabel}</span>
            )}
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  );
};
