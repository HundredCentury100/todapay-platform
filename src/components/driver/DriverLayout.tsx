import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { 
  LayoutDashboard, Navigation, CarTaxiFront, Wallet, 
  History, Settings, CreditCard, Menu, LogOut,
  User, ChevronLeft, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/driver" },
  { icon: Navigation, label: "Transfers", path: "/driver/requests" },
  { icon: CarTaxiFront, label: "Active Transfer", path: "/driver/active" },
  { icon: Wallet, label: "Earnings", path: "/driver/earnings" },
  { icon: History, label: "History", path: "/driver/history" },
  
  { icon: User, label: "Profile", path: "/driver/profile" },
  { icon: Settings, label: "Settings", path: "/driver/settings" },
];

const mobileNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", path: "/driver" },
  { icon: Navigation, label: "Transfers", path: "/driver/requests" },
  { icon: CarTaxiFront, label: "Active", path: "/driver/active" },
  { icon: Wallet, label: "Earnings", path: "/driver/earnings" },
  { icon: User, label: "Profile", path: "/driver/profile" },
];

const DriverLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const NavLink = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const isActive = location.pathname === item.path || 
      (item.path !== "/driver" && location.pathname.startsWith(item.path));
    
    return (
      <Link
        to={item.path}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/driver" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <CarTaxiFront className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Driver Hub</h1>
            <p className="text-xs text-muted-foreground">Manage your trips</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.path} item={item} onClick={onItemClick} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <Link
          to="/"
          onClick={onItemClick}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Home className="h-5 w-5" />
          <span className="font-medium">Back to Platform</span>
        </Link>
        <button
          onClick={() => {
            signOut();
            onItemClick?.();
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex lg:flex-col lg:border-r lg:border-border lg:bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border safe-area-pt">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 -ml-2">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <CarTaxiFront className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Driver Hub</span>
            </div>
          </div>
          
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent onItemClick={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/driver" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-3 min-w-[56px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DriverLayout;
