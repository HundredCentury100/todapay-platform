import * as React from "react";
import { cn } from "@/lib/utils";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * Visually hides content while keeping it accessible to screen readers
 * 
 * @example
 * <button>
 *   <SearchIcon />
 *   <VisuallyHidden>Search</VisuallyHidden>
 * </button>
 */
const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
          "[clip:rect(0,0,0,0)]",
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
VisuallyHidden.displayName = "VisuallyHidden";

interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Target element ID to skip to */
  targetId: string;
  children?: React.ReactNode;
}

/**
 * Skip link for keyboard navigation
 * Becomes visible on focus to allow keyboard users to skip to main content
 * 
 * @example
 * <SkipLink targetId="main-content">Skip to main content</SkipLink>
 * <nav>...</nav>
 * <main id="main-content">...</main>
 */
const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ className, targetId, children = "Skip to main content", ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={`#${targetId}`}
        className={cn(
          "sr-only focus:not-sr-only",
          "focus:fixed focus:top-4 focus:left-4 focus:z-[9999]",
          "focus:px-4 focus:py-2 focus:rounded-lg",
          "focus:bg-primary focus:text-primary-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }
);
SkipLink.displayName = "SkipLink";

interface LiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Politeness level for announcements */
  politeness?: "polite" | "assertive" | "off";
  /** Whether to announce entire region or just changes */
  atomic?: boolean;
  /** Content to announce */
  children: React.ReactNode;
}

/**
 * ARIA live region for announcing dynamic content changes
 * 
 * @example
 * <LiveRegion politeness="polite">
 *   {isLoading ? "Loading..." : `Found ${results.length} results`}
 * </LiveRegion>
 */
const LiveRegion = React.forwardRef<HTMLDivElement, LiveRegionProps>(
  ({ className, politeness = "polite", atomic = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live={politeness}
        aria-atomic={atomic}
        className={cn(
          "sr-only",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
LiveRegion.displayName = "LiveRegion";

export { VisuallyHidden, SkipLink, LiveRegion };
