import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90 active:scale-95",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95",
        ghost: "hover:bg-secondary/50 active:scale-95",
        outline: "border border-border bg-transparent hover:bg-secondary/50 active:scale-95",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90 active:scale-95",
      },
      size: {
        sm: "h-8 w-8 [&_svg]:h-4 [&_svg]:w-4",
        default: "h-10 w-10 [&_svg]:h-5 [&_svg]:w-5",
        lg: "h-12 w-12 [&_svg]:h-6 [&_svg]:w-6",
        xl: "h-14 w-14 [&_svg]:h-7 [&_svg]:w-7",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "default",
    },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** 
   * Required aria-label for accessibility
   * Describes the button's action for screen readers
   */
  "aria-label": string;
  /** Optional tooltip text (falls back to aria-label) */
  tooltip?: string;
}

/**
 * Accessible icon-only button with required aria-label
 * 
 * @example
 * <IconButton 
 *   aria-label="Close dialog" 
 *   onClick={handleClose}
 * >
 *   <X />
 * </IconButton>
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, tooltip, "aria-label": ariaLabel, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(iconButtonVariants({ variant, size, className }))}
        aria-label={ariaLabel}
        title={tooltip || ariaLabel}
        {...props}
      />
    );
  }
);
IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };
