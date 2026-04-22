import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "elevated" | "glass" | "gradient";
  interactive?: boolean;
  gradient?: string;
}

export function PremiumCard({
  children,
  className,
  onClick,
  href,
  variant = "default",
  interactive = false,
  gradient,
}: PremiumCardProps) {
  const baseClasses = "relative rounded-2xl overflow-hidden transition-all duration-300";
  
  const variantClasses = {
    default: "bg-card border border-border/50",
    elevated: "bg-card shadow-md border border-border/30",
    glass: "bg-card border border-border/50",
    gradient: gradient || "bg-gradient-to-br from-primary to-primary/80",
  };
  
  const interactiveClasses = interactive
    ? "hover:shadow-super-lg hover:border-primary/30 active:scale-[0.98] cursor-pointer"
    : "";

  const content = (
    <motion.div
      className={cn(baseClasses, variantClasses[variant], interactiveClasses, className)}
      onClick={onClick}
      whileTap={interactive ? { scale: 0.98 } : undefined}
    >
      {/* Subtle gradient overlay for depth */}
      {variant !== "gradient" && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-black/[0.02] pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}

interface PremiumListItemProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  value?: string | ReactNode;
  href?: string;
  onClick?: () => void;
  iconColor?: string;
  iconGradient?: string;
  badge?: string | number;
  danger?: boolean;
  showArrow?: boolean;
}

export function PremiumListItem({
  icon: Icon,
  title,
  description,
  value,
  href,
  onClick,
  iconColor = "text-primary",
  iconGradient,
  badge,
  danger = false,
  showArrow = true,
}: PremiumListItemProps) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl transition-all duration-200",
        "bg-card border border-border/50",
        "hover:bg-card/80 hover:shadow-md hover:border-primary/20",
        "active:scale-[0.98] cursor-pointer",
        danger && "hover:border-destructive/30"
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
          iconGradient
            ? `bg-gradient-to-br ${iconGradient}`
            : danger
            ? "bg-destructive/10"
            : "bg-primary/10"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            iconGradient ? "text-white" : danger ? "text-destructive" : iconColor
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium", danger && "text-destructive")}>{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
        )}
      </div>

      {/* Value/Badge */}
      {value && <div className="text-sm font-medium text-muted-foreground">{value}</div>}
      {badge !== undefined && (
        <span className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full">
          {badge}
        </span>
      )}

      {/* Arrow */}
      {showArrow && !danger && (
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      )}
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}
