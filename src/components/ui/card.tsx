import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Card Design System - Standardized variants
 * 
 * Static (default): Standard content card with subtle border
 * Interactive: Hover effects for clickable cards (search results, listings)
 * Elevated: Prominent cards with shadow (featured content, CTAs)
 * Glass: Frosted glass effect for overlays
 * Feature: Larger border-radius for hero sections
 * Compact: Smaller padding for list items
 */
const cardVariants = cva(
  "bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        // Static: Standard content display
        default: "rounded-2xl border border-border/50",
        // Interactive: For clickable items (hover lift + shadow)
        interactive: "rounded-2xl border border-border/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-[0.99]",
        // Elevated: Prominent cards with shadow (no border needed)
        elevated: "rounded-2xl shadow-lg border-0",
        // Glass: Solid card (no blur)
        glass: "rounded-2xl bg-card border border-border/50",
        // Feature: Hero/featured sections
        feature: "rounded-2xl bg-secondary/30 border-0",
        // Outline: Transparent with visible border
        outline: "rounded-2xl border border-border bg-transparent",
        // Ghost: Fully transparent
        ghost: "rounded-2xl bg-transparent border-0",
        // Compact: For list items and tight spaces
        compact: "rounded-xl border border-border/40",
      },
      size: {
        default: "",
        sm: "[&_.card-header]:p-4 [&_.card-content]:p-4 [&_.card-footer]:p-4",
        lg: "[&_.card-header]:p-8 [&_.card-content]:p-8 [&_.card-footer]:p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("card-header flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-tight tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("card-content p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("card-footer flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
