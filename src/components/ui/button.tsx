import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] hover:brightness-105",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90 hover:shadow-md active:scale-[0.97]",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90 hover:shadow-md",
        outline: "border border-border bg-transparent hover:bg-secondary/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary/50",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground hover:opacity-90 hover:shadow-md active:scale-[0.97] font-semibold shadow-apple",
      },
      size: {
        default: "h-11 px-6 rounded-full text-sm",
        sm: "h-9 px-4 rounded-full text-sm",
        lg: "h-12 px-8 rounded-full text-base",
        xl: "h-14 px-10 rounded-full text-lg",
        icon: "h-10 w-10 rounded-full",
        mobile: "h-12 min-w-[48px] px-6 rounded-xl text-base", // 48px touch target
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
