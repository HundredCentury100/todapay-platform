import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet, Plus, ArrowRight, QrCode, Sparkles, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserWallet } from "@/hooks/useUserWallet";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useState, useEffect } from "react";
import { BounceTap } from "@/components/ui/micro-interactions";

export const WalletWidget = () => {
  const { user } = useAuth();
  const { wallet, isLoading } = useUserWallet();
  const { convertPrice } = useCurrency();
  const [hidden, setHidden] = useState(false);

  if (!user) {
    return (
      <div className="px-5">
        <Link to="/auth" className="block">
          <motion.div 
            className="relative overflow-hidden rounded-2xl bg-primary"
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Shimmer sweep */}
            <div className="absolute inset-0 shimmer-sweep" />
            <div className="relative z-10 p-4 text-primary-foreground flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-foreground/15 rounded-full flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">FulTicket Wallet</p>
                <p className="text-primary-foreground/70 text-xs">Sign in to get started</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </motion.div>
        </Link>
      </div>
    );
  }

  const balance = wallet?.balance || 0;

  return (
    <div className="px-5">
      <motion.div 
        className="relative overflow-hidden rounded-2xl bg-primary"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Animated shimmer sweep */}
        <div className="absolute inset-0 shimmer-sweep" />
        
        {/* Floating particles */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary-foreground/20"
            style={{ left: `${20 + i * 30}%`, top: `${30 + i * 15}%` }}
            animate={{
              y: [0, -12, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut",
            }}
          />
        ))}

        <div className="relative z-10 p-4 text-primary-foreground">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-shrink">
              <div className="w-10 h-10 flex-shrink-0 bg-primary-foreground/15 rounded-full flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-primary-foreground/70 text-xs font-medium">Balance</p>
                  <button 
                    onClick={() => setHidden(!hidden)} 
                    className="p-0.5 rounded-full hover:bg-primary-foreground/10 transition-colors"
                    aria-label={hidden ? "Show balance" : "Hide balance"}
                  >
                    {hidden ? <EyeOff className="h-3 w-3 opacity-60" /> : <Eye className="h-3 w-3 opacity-60" />}
                  </button>
                </div>
                <p className="text-xl font-bold tracking-tight truncate">
                  {isLoading ? "..." : hidden ? "••••••" : convertPrice(balance)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <BounceTap>
                <Link to="/pay">
                  <Button 
                    size="sm" 
                    className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border border-primary-foreground/20 rounded-full h-8 sm:h-9 gap-1 sm:gap-1.5 text-[11px] sm:text-xs px-2.5 sm:px-3"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden min-[340px]:inline">Top Up</span>
                    <span className="min-[340px]:hidden">+</span>
                  </Button>
                </Link>
              </BounceTap>
              <BounceTap>
                <Link to="/pay" aria-label="QR Pay">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary-foreground/15 rounded-full flex items-center justify-center border border-primary-foreground/10">
                    <QrCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </Link>
              </BounceTap>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
