import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  gradient?: string;
  children?: ReactNode;
  className?: string;
}

export function PremiumPageHeader({
  title,
  subtitle,
  icon,
  action,
  gradient = "from-primary/15 via-primary/5 to-transparent",
  children,
  className,
}: PremiumPageHeaderProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Gradient background */}
      <div className={cn("absolute inset-0 bg-gradient-to-b", gradient)} />
      
      {/* Animated orbs for depth */}
      <motion.div
        className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <div className="relative z-10 px-5 pt-6 pb-5 safe-area-pt">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {icon && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
                className="mb-3"
              >
                {icon}
              </motion.div>
            )}
            
            <motion.h1 
              className="text-2xl font-bold text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {title}
            </motion.h1>
            
            {subtitle && (
              <motion.p 
                className="text-sm text-muted-foreground mt-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          
          {action && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-shrink-0"
            >
              {action}
            </motion.div>
          )}
        </div>
        
        {subtitle && (
          <motion.p 
            className="text-sm text-muted-foreground mt-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {subtitle}
          </motion.p>
        )}
        
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4"
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}
