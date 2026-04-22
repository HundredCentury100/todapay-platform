import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationCenter } from "@/components/agent/NotificationCenter";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  UserPlus,
  Receipt,
  Users,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  Ticket,
  UsersRound,
  FileSpreadsheet,
  Home,
  CreditCard,
  User,
  Banknote,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  internalOnly?: boolean;
}

const allNavigation: NavItem[] = [
  { name: "Dashboard", href: "/merchant/agent", icon: LayoutDashboard },
  { name: "Pay Bills", href: "/merchant/agent/bill-pay", icon: Ticket },
  { name: "Bill History", href: "/merchant/agent/bill-history", icon: Receipt },
  { name: "Reconciliation", href: "/merchant/agent/bill-reconciliation", icon: FileSpreadsheet, internalOnly: true },
  { name: "Book for Client", href: "/", icon: UserPlus },
  { name: "My Bookings", href: "/merchant/agent/bookings", icon: Receipt },
  { name: "Payments", href: "/merchant/agent/payments", icon: Banknote, internalOnly: true },
  { name: "InnBucks Tools", href: "/merchant/agent/innbucks-tools", icon: Zap },
  { name: "Clients", href: "/merchant/agent/clients", icon: Users, internalOnly: true },
  { name: "Bulk Booking", href: "/merchant/agent/bulk-booking", icon: FileSpreadsheet, internalOnly: true },
  { name: "Sub-Agents", href: "/merchant/agent/sub-agents", icon: UsersRound, internalOnly: true },
  { name: "Analytics", href: "/merchant/agent/analytics", icon: BarChart3, internalOnly: true },
  { name: "Profile", href: "/merchant/agent/profile", icon: User },
  { name: "Settings", href: "/merchant/agent/settings", icon: Settings },
];

const internalMobileNav = [
  { name: "Home", href: "/merchant/agent", icon: LayoutDashboard },
  { name: "Bills", href: "/merchant/agent/bill-pay", icon: Ticket },
  { name: "Book", href: "/", icon: UserPlus },
  { name: "Bookings", href: "/merchant/agent/bookings", icon: Receipt },
  { name: "Clients", href: "/merchant/agent/clients", icon: Users },
];

const externalMobileNav = [
  { name: "Home", href: "/merchant/agent", icon: LayoutDashboard },
  { name: "Bills", href: "/merchant/agent/bill-pay", icon: Ticket },
  { name: "Book", href: "/", icon: UserPlus },
  { name: "Bookings", href: "/merchant/agent/bookings", icon: Receipt },
  { name: "InnBucks", href: "/merchant/agent/innbucks-tools", icon: Zap },
];

export default function AgentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { merchantProfile } = useMerchantAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isExternal = merchantProfile?.role === 'booking_agent';
  const navigation = isExternal 
    ? allNavigation.filter(item => !item.internalOnly) 
    : allNavigation;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const NavLink = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;

    return (
      <Link
        to={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{item.name}</span>
      </Link>
    );
  };

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Link to="/merchant/agent" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Ticket className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-semibold">Agent Portal</span>
            <p className="text-xs text-muted-foreground">Manage bookings</p>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {merchantProfile?.business_name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{merchantProfile?.business_name || "Agent"}</p>
            <p className="text-xs text-muted-foreground capitalize">{merchantProfile?.agent_tier || "Standard"} Tier</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink key={item.name} item={item} onClick={onItemClick} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <Link
          to="/"
          onClick={onItemClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Back to Platform</span>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="hidden md:flex w-64 border-r border-border flex-col bg-card">
          <SidebarContent />
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background md:hidden">
          <div className="flex items-center justify-between h-14 px-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SidebarContent onItemClick={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link to="/merchant/agent" className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <span className="font-semibold">Agent Portal</span>
            </Link>

            <NotificationCenter agentProfileId={merchantProfile?.id || ""} />
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex sticky top-0 z-40 border-b border-border bg-background">
          <div className="flex items-center justify-between h-14 px-6 w-full">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Welcome back,</span>
              <span className="font-medium">{merchantProfile?.business_name || "Agent"}</span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter agentProfileId={merchantProfile?.id || ""} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
            <div className="flex items-center justify-around h-16 px-2">
              {(isExternal ? externalMobileNav : internalMobileNav).map((item) => {
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
                    <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                    <span className="text-xs font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
