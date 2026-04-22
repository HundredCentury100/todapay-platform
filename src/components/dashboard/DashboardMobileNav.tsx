import { Link, useLocation } from "react-router-dom";
import { 
  Home, Ticket, Wallet, User, Settings,
  CarTaxiFront, DollarSign, Navigation, LayoutDashboard,
  Shield, Users, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { DashboardMode } from "@/hooks/useDashboardMode";

interface DashboardMobileNavProps {
  mode: DashboardMode;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string | number;
}

const consumerNav: NavItem[] = [
  { icon: Home, label: "Home", path: "/account" },
  { icon: Ticket, label: "Bookings", path: "/account/bookings" },
  { icon: Wallet, label: "Wallet", path: "/pay" },
  { icon: User, label: "Profile", path: "/profile" },
];

const driverNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", path: "/driver" },
  { icon: Navigation, label: "Transfers", path: "/driver/requests" },
  { icon: CarTaxiFront, label: "Active", path: "/driver/active" },
  { icon: DollarSign, label: "Earnings", path: "/driver/earnings" },
];

const adminNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", path: "/merchant/admin" },
  { icon: Users, label: "Users", path: "/merchant/admin/users" },
  { icon: Shield, label: "Verify", path: "/merchant/admin/merchant-verification" },
  { icon: BarChart3, label: "Analytics", path: "/merchant/admin/analytics" },
];

export const DashboardMobileNav = ({ mode }: DashboardMobileNavProps) => {
  const location = useLocation();
  
  const getNavItems = (): NavItem[] => {
    switch (mode) {
      case "driver":
        return driverNav;
      case "admin":
        return adminNav;
      case "consumer":
      default:
        return consumerNav;
    }
  };
  
  const navItems = getNavItems();

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-card border-t border-border" />
      
      <div className="relative flex items-center justify-around h-16 px-2 safe-area-pb">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            location.pathname.startsWith(item.path + "/");

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={triggerHaptic}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 transition-colors tap-target touch-manipulation relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <motion.div
                  initial={false}
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <item.icon 
                    className="h-5 w-5 mb-0.5" 
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                </motion.div>
                
                {item.badge && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              
              <span className={cn(
                "text-[10px] transition-all",
                isActive ? "font-bold" : "font-medium"
              )}>
                {item.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="dashboardActiveTab"
                  className="absolute -top-0.5 w-5 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default DashboardMobileNav;
