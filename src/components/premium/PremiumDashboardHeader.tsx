import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumDashboardHeaderProps {
  title: string;
  subtitle?: string;
  greeting?: boolean;
  userName?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PremiumDashboardHeader = ({
  title,
  subtitle,
  greeting = false,
  userName,
  actions,
  className,
}: PremiumDashboardHeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const fullTitle = greeting && userName 
    ? `${getGreeting()}, ${userName}!` 
    : title;

  // Typewriter effect
  const [displayedTitle, setDisplayedTitle] = useState(greeting ? "" : fullTitle);

  useEffect(() => {
    if (!greeting) {
      setDisplayedTitle(fullTitle);
      return;
    }
    setDisplayedTitle("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedTitle(fullTitle.slice(0, i));
      if (i >= fullTitle.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [fullTitle, greeting]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"
          animate={{ 
            x: [0, 20, -10, 0],
            y: [0, -15, 10, 0],
            scale: [1, 1.2, 0.9, 1],
            opacity: [0.3, 0.5, 0.3, 0.3]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/5 rounded-full blur-3xl"
          animate={{ 
            x: [0, -15, 20, 0],
            y: [0, 10, -10, 0],
            scale: [1, 1.3, 1, 1],
            opacity: [0.2, 0.4, 0.2, 0.2]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {displayedTitle}
            {greeting && displayedTitle.length < fullTitle.length && (
              <motion.span
                className="inline-block w-0.5 h-5 bg-primary ml-0.5 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </h1>
          {subtitle && (
            <motion.p 
              className="text-sm text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {subtitle}
            </motion.p>
          )}
        </motion.div>

        {actions && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            {actions}
          </motion.div>
        )}
      </div>
    </div>
  );
};
