import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bus, CreditCard, Gift, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SCREENS = [
  {
    icon: Bus,
    color: "hsl(var(--primary))",
    title: "Book Anything",
    subtitle: "Buses, events, stays, venues, experiences — all in one app.",
  },
  {
    icon: CreditCard,
    color: "hsl(var(--stays))",
    title: "Pay Your Way",
    subtitle: "EcoCash, bank transfer, card — fast, secure checkout every time.",
  },
  {
    icon: Gift,
    color: "hsl(var(--events))",
    title: "Earn Rewards",
    subtitle: "Collect points on every booking and unlock exclusive deals.",
  },
] as const;

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [current, setCurrent] = useState(0);
  const screen = SCREENS[current];
  const isLast = current === SCREENS.length - 1;

  const advance = useCallback(() => {
    if (isLast) {
      onComplete();
    } else {
      setCurrent((c) => c + 1);
    }
  }, [isLast, onComplete]);

  const skip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Skip button */}
      <div className="flex justify-end p-4 safe-area-pt">
        <button
          onClick={skip}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors tap-target"
          aria-label="Skip onboarding"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            {/* Icon */}
            <motion.div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
              style={{ backgroundColor: `${screen.color}` }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <screen.icon className="h-12 w-12 text-white" />
            </motion.div>

            <h2 className="text-2xl font-bold text-foreground mb-3">
              {screen.title}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              {screen.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-10 safe-area-pb space-y-6">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {SCREENS.map((_, i) => (
            <motion.div
              key={i}
              className="h-2 rounded-full"
              animate={{
                width: i === current ? 24 : 8,
                backgroundColor: i === current
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted))",
              }}
              transition={{ duration: 0.25 }}
            />
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={advance}
          className="w-full h-14 rounded-2xl text-base font-semibold press-effect"
          size="lg"
        >
          {isLast ? "Get Started" : "Next"}
          {!isLast && <ChevronRight className="h-5 w-5 ml-1" />}
        </Button>
      </div>
    </div>
  );
};
