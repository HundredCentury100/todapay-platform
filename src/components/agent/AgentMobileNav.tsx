import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, UserPlus, Receipt, Users } from "lucide-react";

export const AgentMobileNav = () => {
  const location = useLocation();

  const navigation = [
    { name: "Home", href: "/merchant/agent", icon: LayoutDashboard },
    { name: "Book", href: "/", icon: UserPlus },
    { name: "Bookings", href: "/merchant/agent/bookings", icon: Receipt },
    { name: "Clients", href: "/merchant/agent/clients", icon: Users },
    
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 rounded-lg min-w-[56px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-all duration-200", isActive && "scale-110")} strokeWidth={isActive ? 2.4 : 2} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
