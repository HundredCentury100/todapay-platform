import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPreferences } from "@/hooks/useUserPreferences";
import { Shield, Ticket, Sparkles, Clock, UserPlus, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountBenefitsCardProps {
  variant?: "inline" | "modal" | "compact";
  onDismiss?: () => void;
  className?: string;
  passengerEmail?: string;
  bookingReference?: string;
}

export const AccountBenefitsCard = ({
  variant = "inline",
  onDismiss,
  className,
  passengerEmail,
  bookingReference,
}: AccountBenefitsCardProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const preferences = getUserPreferences();

  // Check if user has dismissed this before (stored in localStorage)
  useEffect(() => {
    const dismissedUntil = localStorage.getItem("account_benefits_dismissed");
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    // Dismiss for 24 hours
    localStorage.setItem("account_benefits_dismissed", String(Date.now() + 24 * 60 * 60 * 1000));
    setDismissed(true);
    onDismiss?.();
  };

  // Don't show if user is logged in or dismissed
  if (user || dismissed) return null;

  const benefits = [
    { icon: Shield, text: "Access tickets offline anytime" },
    { icon: Ticket, text: "Track all bookings in one place" },
    { icon: Sparkles, text: "Earn rewards on every trip" },
    { icon: Clock, text: "Faster checkout next time" },
  ];

  const returnTo = bookingReference 
    ? `/retrieve-booking?ref=${bookingReference}`
    : location.pathname;

  const authState = {
    returnTo,
    prefillEmail: passengerEmail,
    mode: "signup",
  };

  if (variant === "compact") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn("relative", className)}
        >
          <Card className="rounded-2xl overflow-hidden border-primary/20 p-4">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-secondary transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Create an account</p>
                <p className="text-xs text-muted-foreground">Save your booking & earn rewards</p>
              </div>
            </div>

            <Link to="/auth" state={authState}>
              <Button size="sm" className="w-full rounded-full gap-1">
                Sign Up Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={className}
      >
        <Card className="rounded-2xl overflow-hidden border-primary/20">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base">Create Your Account</p>
                <p className="text-xs text-muted-foreground">Unlock these benefits:</p>
              </div>
              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-full hover:bg-background/80 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <benefit.icon className="w-4 h-4 text-primary shrink-0" />
                  <span>{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            <Link to="/auth" state={authState}>
              <Button className="rounded-full w-full h-11 gap-2">
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <p className="text-xs text-center text-muted-foreground">
              {passengerEmail 
                ? `We'll use ${passengerEmail} for your account`
                : "Takes less than 30 seconds"
              }
            </p>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

// Inline prompt to show during checkout flow (before payment)
export const InlineAccountPrompt = ({ className }: { className?: string }) => {
  const { user } = useAuth();
  
  if (user) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10",
        className
      )}
    >
      <Sparkles className="w-5 h-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Sign in to earn rewards</p>
        <p className="text-xs text-muted-foreground">Get 5% back on your first booking</p>
      </div>
      <Link to="/auth" state={{ returnTo: window.location.pathname, mode: "signin" }}>
        <Button size="sm" variant="outline" className="rounded-full h-8 px-3">
          Sign In
        </Button>
      </Link>
    </motion.div>
  );
};
