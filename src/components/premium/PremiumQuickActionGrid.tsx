import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  to: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  color?: string;
  gradient?: string;
}

interface PremiumQuickActionGridProps {
  title?: string;
  actions: QuickAction[];
  columns?: 3 | 4 | 5 | 6;
  variant?: "compact" | "detailed";
  className?: string;
}

export const PremiumQuickActionGrid = ({
  title,
  actions,
  columns = 5,
  variant = "compact",
  className,
}: PremiumQuickActionGridProps) => {
  const colClasses = {
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-3 sm:grid-cols-6",
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "" : "pt-6"}>
        {variant === "compact" ? (
          <motion.div 
            className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 sm:grid sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            variants={container}
            initial="hidden"
            animate="show"
          >
            {actions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <motion.div key={idx} variants={item}>
                  <Link to={action.to} className="flex-shrink-0">
                    <motion.div 
                      className={cn(
                        "relative min-w-[72px] h-auto py-3 px-2 flex flex-col items-center gap-1.5 rounded-xl border transition-all",
                        "hover:bg-muted hover:border-primary/20 hover:shadow-md",
                        action.gradient || "bg-background"
                      )}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        action.color || "bg-primary/10"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4 sm:h-5 sm:w-5",
                          action.color ? "text-current" : "text-primary"
                        )} />
                      </div>
                      <span className="text-[10px] sm:text-xs whitespace-nowrap font-medium">
                        {action.label}
                      </span>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.min(columns, 3)}, minmax(0, 1fr))` }}
            variants={container}
            initial="hidden"
            animate="show"
          >
            {actions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <motion.div key={idx} variants={item}>
                  <Link to={action.to}>
                    <motion.div 
                      className={cn(
                        "relative p-4 flex flex-col gap-2 rounded-xl border transition-all",
                        "hover:bg-muted hover:border-primary/20 hover:shadow-md",
                        action.gradient || "bg-background"
                      )}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn(
                        "p-2 rounded-lg w-fit",
                        action.color || "bg-primary/10"
                      )}>
                        <Icon className={cn(
                          "h-5 w-5",
                          action.color ? "text-current" : "text-primary"
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{action.label}</p>
                        {action.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {action.description}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
