import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Wallet, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useUnreadCount } from "@/hooks/useUnreadCount";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  requiresAuth?: boolean;
}

const AppBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const unreadCount = useUnreadCount();

  const navItems: NavItem[] = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: Wallet, label: "Pay", path: "/pay" },
    { icon: MessageSquare, label: "Inbox", path: "/inbox", requiresAuth: true },
    { icon: User, label: "Profile", path: "/profile", requiresAuth: true },
  ];

  const hiddenRoutes = ['/merchant', '/admin', '/driver', '/welcome', '/auth'];
  if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border pb-safe"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          if (item.requiresAuth && !user) {
            return (
              <Link
                key={item.path}
                to="/auth"
                state={{ returnTo: item.path }}
                onClick={triggerHaptic}
                aria-label={`${item.label} (sign in required)`}
                className="flex flex-col items-center justify-center flex-1 py-2 tap-target touch-manipulation text-muted-foreground"
              >
                <item.icon className="h-5 w-5 mb-0.5" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          }

          const isActive = location.pathname === item.path || 
            (item.path === "/" && location.pathname === "/") ||
            (item.path === "/explore" && location.pathname.startsWith("/explore"));

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={triggerHaptic}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 transition-colors tap-target touch-manipulation",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <motion.div
                initial={false}
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative"
              >
                <item.icon 
                  className="h-5 w-5 mb-0.5" 
                  strokeWidth={isActive ? 2.5 : 1.5}
                  aria-hidden="true"
                />
                {item.path === "/inbox" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </motion.div>
              <span className={cn(
                "text-[10px] transition-all",
                isActive ? "font-bold" : "font-medium"
              )} aria-hidden="true">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default AppBottomNav;
