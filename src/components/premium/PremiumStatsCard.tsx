import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
  variant?: "default" | "gradient" | "glass";
  iconColor?: string;
  delay?: number;
  className?: string;
}

export const PremiumStatsCard = ({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  trend = "neutral",
  loading = false,
  variant = "default",
  iconColor,
  delay = 0,
  className,
}: PremiumStatsCardProps) => {
  const variants = {
    default: "bg-card hover:bg-card/80",
    gradient: "bg-gradient-to-br from-card via-card to-primary/5 border-primary/10",
    glass: "bg-card border-border/50",
  };

  const trendColors = {
    up: "text-green-600 bg-green-500/10",
    down: "text-red-600 bg-red-500/10",
    neutral: "text-muted-foreground bg-muted",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay, 
        duration: 0.4, 
        ease: "easeOut",
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5",
        variants[variant],
        className
      )}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <motion.p 
                  className="text-2xl sm:text-3xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: delay + 0.2 }}
                >
                  {value}
                </motion.p>
              )}
              {change !== undefined && !loading && (
                <motion.div 
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    trendColors[trend]
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + 0.3 }}
                >
                  <span>{change >= 0 ? "+" : ""}{change}%</span>
                  {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
                </motion.div>
              )}
            </div>
            <motion.div 
              className={cn(
                "p-3 rounded-xl",
                iconColor || "bg-primary/10"
              )}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Icon className={cn(
                "h-5 w-5 sm:h-6 sm:w-6",
                iconColor ? "text-current" : "text-primary"
              )} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface PremiumStatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const PremiumStatsGrid = ({ 
  children, 
  columns = 4, 
  className 
}: PremiumStatsGridProps) => {
  const colClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", colClasses[columns], className)}>
      {children}
    </div>
  );
};
