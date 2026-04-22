import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StickyCTABarProps {
  children: ReactNode;
  className?: string;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}

export const StickyCTABar = ({
  children,
  className,
  showOnMobile = true,
  showOnDesktop = false,
}: StickyCTABarProps) => {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-background border-t",
        // Account for bottom nav (56px) + safe-area on mobile
        "pb-[calc(env(safe-area-inset-bottom,0px)+3.5rem)] md:pb-0",
        showOnMobile && !showOnDesktop && "md:hidden",
        !showOnMobile && showOnDesktop && "hidden md:block",
        showOnMobile && showOnDesktop && "block",
        className
      )}
    >
      <div className="px-4 py-3 max-w-lg mx-auto">
        {children}
      </div>
    </div>
  );
};

export default StickyCTABar;
