import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ServiceProgressBarProps {
  currentStep: number;
  steps?: string[];
  className?: string;
}

const DEFAULT_STEPS = ["Search", "Select", "Details", "Payment", "Done"];

export const ServiceProgressBar = ({
  currentStep,
  steps = DEFAULT_STEPS,
  className,
}: ServiceProgressBarProps) => {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isComplete = stepNum < currentStep;
        return (
          <div key={step} className="flex-1 flex flex-col items-center gap-1">
            <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
              {(isComplete || isActive) && (
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/70"
                  initial={{ width: "0%" }}
                  animate={{ width: isComplete ? "100%" : "60%" }}
                  transition={{ type: "spring", stiffness: 200, damping: 25, delay: i * 0.08 }}
                />
              )}
              {isActive && (
                <motion.div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ right: "38%" }}
                />
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {isComplete && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
                </motion.div>
              )}
              <span
                className={cn(
                  "text-[10px] leading-none",
                  isComplete || isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
