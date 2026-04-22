import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Map routes to readable names
const routeLabels: Record<string, string> = {
  "": "Home",
  explore: "Explore",
  profile: "Profile",
  activity: "Activity",
  inbox: "Inbox",
  buses: "Buses",
  events: "Events",
  stays: "Stays",
  venues: "Venues",
  workspaces: "Workspaces",
  rides: "Rides",
  auth: "Sign In",
  "booking-confirmation": "Confirmation",
  checkout: "Checkout",
};

export const Breadcrumbs = ({ items, className, showHome = true }: BreadcrumbsProps) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from path if items not provided
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    let currentPath = "";
    
    return pathSegments.map((segment) => {
      currentPath += `/${segment}`;
      // Check if it's a UUID (likely a detail page)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
      
      return {
        label: isUuid ? "Details" : (routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")),
        path: currentPath,
      };
    });
  })();

  if (breadcrumbs.length === 0 && !showHome) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto", className)}
    >
      {showHome && (
        <>
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0 tap-target"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only md:not-sr-only">Home</span>
          </Link>
          {breadcrumbs.length > 0 && (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
          )}
        </>
      )}

      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={item.path || index} className="flex items-center gap-1 min-w-0">
            {isLast || !item.path ? (
              <span className="font-medium text-foreground truncate" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="hover:text-foreground transition-colors truncate tap-target"
              >
                {item.label}
              </Link>
            )}
            {!isLast && (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            )}
          </div>
        );
      })}
    </nav>
  );
};
