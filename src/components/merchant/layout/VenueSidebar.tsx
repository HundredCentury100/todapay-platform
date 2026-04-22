import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  CalendarCheck, 
  MessageSquareQuote, 
  Calendar, 
  DollarSign, 
  Settings,
  Star,
  CreditCard,
  Activity,
  Receipt,
  Megaphone,
  HelpCircle,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const venueLinks = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/merchant/venue-owner" },
  { label: "My Venues", icon: Building2, path: "/merchant/venue-owner/venues" },
  { label: "Bookings", icon: CalendarCheck, path: "/merchant/venue-owner/bookings" },
  { label: "Quote Requests", icon: MessageSquareQuote, path: "/merchant/venue-owner/quotes" },
  { label: "Availability", icon: Calendar, path: "/merchant/venue-owner/availability" },
  { label: "Revenue", icon: DollarSign, path: "/merchant/venue-owner/revenue" },
  { label: "Reviews", icon: Star, path: "/merchant/venue-owner/reviews" },
  { label: "Transactions", icon: Activity, path: "/merchant/venue-owner/transactions" },
  { label: "Platform Fees", icon: Receipt, path: "/merchant/venue-owner/billing" },
  { label: "Payment Portal", icon: CreditCard, path: "/merchant/venue-owner/payment-portal" },
  { label: "Advertising", icon: Megaphone, path: "/merchant/venue-owner/advertising" },
  { label: "Support", icon: HelpCircle, path: "/merchant/venue-owner/support" },
  { label: "Settings", icon: Settings, path: "/merchant/venue-owner/settings" },
];

const VenueSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border hidden lg:flex flex-col">
      <div className="p-4 border-b border-border">
        <Link to="/merchant/venue-owner" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-semibold text-lg">Venue Portal</span>
            <p className="text-xs text-muted-foreground">Manage your venues</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {venueLinks.map((link) => {
          const isActive = location.pathname === link.path || 
            (link.path !== "/merchant/venue-owner" && location.pathname.startsWith(link.path));

          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <link.icon className="h-4 w-4 flex-shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Back to Platform</span>
        </Link>
      </div>
    </aside>
  );
};

export default VenueSidebar;
