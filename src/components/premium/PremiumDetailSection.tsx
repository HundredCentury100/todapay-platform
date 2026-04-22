import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumDetailSectionProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "gradient";
  delay?: number;
}

export const PremiumDetailSection = ({
  title,
  icon: Icon,
  children,
  className,
  variant = "default",
  delay = 0,
}: PremiumDetailSectionProps) => {
  const variants = {
    default: "bg-card",
    glass: "bg-card border-border/50",
    gradient: "bg-gradient-to-br from-card via-card to-primary/5 border-primary/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
    >
      <Card className={cn(variants[variant], "overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {Icon && (
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            )}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
};

interface PremiumInfoGridProps {
  items: Array<{
    icon: LucideIcon;
    label: string;
    value: string | number;
    color?: string;
  }>;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const PremiumInfoGrid = ({ items, columns = 2, className }: PremiumInfoGridProps) => {
  const colClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-3", colClasses[columns], className)}>
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
          >
            <div className={cn(
              "p-2 rounded-lg w-fit mb-2 transition-transform group-hover:scale-110",
              item.color || "bg-primary/10"
            )}>
              <Icon className={cn("h-4 w-4", item.color ? "text-current" : "text-primary")} />
            </div>
            <p className="text-lg font-bold">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

interface PremiumFeatureListProps {
  features: string[];
  icon?: LucideIcon;
  variant?: "check" | "bullet" | "numbered";
  className?: string;
}

export const PremiumFeatureList = ({
  features,
  icon: Icon,
  variant = "check",
  className,
}: PremiumFeatureListProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {features.map((feature, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="flex items-center gap-3 group"
        >
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            {variant === "numbered" ? (
              <span className="text-xs font-bold text-primary">{idx + 1}</span>
            ) : Icon ? (
              <Icon className="h-3 w-3 text-primary" />
            ) : (
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </div>
          <span className="text-sm">{feature}</span>
        </motion.div>
      ))}
    </div>
  );
};

interface PremiumPriceDisplayProps {
  price: string | number;
  label?: string;
  originalPrice?: string | number;
  discount?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const PremiumPriceDisplay = ({
  price,
  label,
  originalPrice,
  discount,
  size = "md",
  className,
}: PremiumPriceDisplayProps) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-baseline gap-2">
        <span className={cn("font-bold text-primary", sizeClasses[size])}>{price}</span>
        {label && <span className="text-sm text-muted-foreground">{label}</span>}
      </div>
      {(originalPrice || discount) && (
        <div className="flex items-center gap-2">
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>
          )}
          {discount && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
              {discount}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
