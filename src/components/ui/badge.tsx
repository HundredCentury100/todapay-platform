import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Clock, X, AlertCircle, Info, LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status variants with semantic colors
        success: "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        warning: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
        error: "border-transparent bg-red-500/15 text-red-700 dark:text-red-400",
        info: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400",
        // Booking status variants
        confirmed: "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        pending: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
        cancelled: "border-transparent bg-red-500/15 text-red-700 dark:text-red-400",
        completed: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400",
        expired: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// Map variants to icons for accessibility (not relying on color alone)
const variantIcons: Partial<Record<string, LucideIcon>> = {
  success: Check,
  confirmed: Check,
  completed: Check,
  warning: AlertCircle,
  pending: Clock,
  error: X,
  cancelled: X,
  info: Info,
  expired: Clock,
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  showIcon?: boolean;
}

function Badge({ className, variant, showIcon = false, children, ...props }: BadgeProps) {
  const IconComponent = variant ? variantIcons[variant] : null;
  
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showIcon && IconComponent && <IconComponent className="h-3 w-3" />}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
