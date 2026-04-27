import { ReactNode, useRef, useEffect } from "react";
import AppBottomNav from "./AppBottomNav";
import DesktopTopNav from "./DesktopTopNav";
import { cn } from "@/lib/utils";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { ScrollToTopButton } from "./ui/scroll-to-top-button";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface MobileAppLayoutProps {
  children: ReactNode;
  className?: string;
  hideNav?: boolean;
  hideAttribution?: boolean;
  onRefresh?: () => Promise<void>;
  /** Page title for screen readers */
  pageTitle?: string;
}

const MobileAppLayout = ({ 
  children, 
  className, 
  hideNav = false, 
  hideAttribution = false,
  onRefresh,
  pageTitle,
}: MobileAppLayoutProps) => {
  const prefersReducedMotion = useReducedMotion();
  const { containerRef, pullDistance, isRefreshing, isPulling } = usePullToRefresh({
    onRefresh: onRefresh || (async () => {}),
    threshold: 80,
    maxPull: 120,
  });

  // Scroll to top when the page mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Announce page title to screen readers
  useEffect(() => {
    if (pageTitle) {
      document.title = `${pageTitle} | TodaPay`;
    }
  }, [pageTitle]);

  const showPullIndicator = onRefresh && (isPulling || isRefreshing);
  const pullProgress = Math.min(pullDistance / 80, 1);

  return (
    <div 
      ref={onRefresh ? containerRef : undefined}
      className="min-h-screen bg-background overscroll-contain md:overscroll-auto"
    >
      {/* Desktop top navigation */}
      {!hideNav && <DesktopTopNav />}
      {/* Screen reader announcement for refresh */}
      {isRefreshing && (
        <div className="sr-only" role="status" aria-live="polite">
          Refreshing content…
        </div>
      )}

      {/* Pull to refresh indicator */}
      {showPullIndicator && !prefersReducedMotion && (
        <motion.div 
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pt-4 safe-area-pt"
          style={{ 
            transform: `translateY(${Math.min(pullDistance, 80)}px)`,
            opacity: pullProgress
          }}
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : pullProgress * 180 }}
            transition={{ duration: isRefreshing ? 1 : 0, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
            className="w-10 h-10 rounded-full bg-card border shadow-lg flex items-center justify-center"
          >
            <RefreshCw className={cn(
              "h-5 w-5 text-primary",
              isRefreshing && "animate-spin"
            )} aria-hidden="true" />
          </motion.div>
        </motion.div>
      )}

      {/* Main content with bottom padding for nav + safe-area */}
      <main 
        id="main-content"
        className={cn(
          "pb-24 md:pb-0 safe-area-px md:mx-auto",
          // Use wider container for pages that need grid layouts
          "md:max-w-3xl lg:max-w-5xl xl:max-w-6xl",
          className
        )}
        role="main"
        aria-label={pageTitle || "Page content"}
      >
        {children}
      </main>
      
      {/* Bottom Navigation - only on mobile */}
      {!hideNav && <AppBottomNav />}
      
      {/* Scroll to top button */}
      <ScrollToTopButton />
      
      {/* Invisible Toda Technologies attribution link - mobile only */}
      {!hideAttribution && (
        <a
          href="https://todatech.co.zw"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-[68px] left-1/2 -translate-x-1/2 z-[1] text-[10px] text-muted-foreground/40 font-medium pointer-events-auto md:hidden"
          aria-label="from Toda Technologies"
        >
          from Toda Technologies
        </a>
      )}
    </div>
  );
};

export default MobileAppLayout;
