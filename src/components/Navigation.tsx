import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Moon, Sun, Ticket, DollarSign, Calendar, LogIn, User, Menu, LogOut, 
  Bell, Shield, MapPin, Bus, MessageCircle, FileText, ShieldCheck, Info, 
  Building2, Sparkles, Car, Briefcase, Heart, Tag, HelpCircle, Compass,
  CarTaxiFront, Palmtree, Users, Clock
} from "lucide-react";
import { AISearchDialog } from "./AISearchDialog";
import { CurrencySelector } from "./currency/CurrencySelector";
import { useTheme } from "next-themes";
import { useCurrency, currencies } from "@/contexts/CurrencyContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import NotificationCenter from "./NotificationCenter";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { user, signOut } = useAuth();
  const { isAdmin, isMerchant, isAgent, isDriver, merchantRole } = useUserRoles();
  const [aiSearchOpen, setAiSearchOpen] = useState(false);

  const getMerchantPortalPath = () => {
    const paths: Record<string, string> = {
      bus_operator: "/merchant/bus-operator",
      event_organizer: "/merchant/event-organizer",
      venue_owner: "/merchant/venue-owner",
      property_owner: "/merchant/property-owner",
      workspace_provider: "/merchant/workspace",
      car_rental_company: "/merchant/car-rental",
      transfer_provider: "/merchant/transfers",
      experience_host: "/merchant/experiences",
      travel_agent: "/agent",
      booking_agent: "/agent",
    };
    return merchantRole ? paths[merchantRole] || "/merchant" : "/merchant";
  };

  const getMerchantLabel = () => {
    const labels: Record<string, string> = {
      bus_operator: "bus operator portal",
      event_organizer: "event organizer portal",
      venue_owner: "venue owner portal",
      property_owner: "property portal",
      workspace_provider: "workspace portal",
      car_rental_company: "car rental portal",
      transfer_provider: "transfers portal",
      experience_host: "experiences portal",
      travel_agent: "agent portal",
      booking_agent: "agent portal",
    };
    return merchantRole ? labels[merchantRole] || "merchant portal" : "merchant portal";
  };

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container-wide">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
            <img src="/logoTodaPay.png" alt="TodaPay" className="h-5 w-5" />
            <span className="text-base font-semibold tracking-tight">TodaPay</span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Currency - Desktop */}
            <div className="hidden sm:block">
              <CurrencySelector />
            </div>
            
            {/* Notifications */}
            <NotificationCenter />

            {/* Menu Sheet - Always next to notifications */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Open menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] overflow-y-auto">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-6 mt-8 pb-6">
                  {/* User Info */}
                  {user && (
                    <>
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/50">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.email}</p>
                          <p className="text-xs text-muted-foreground">Signed in</p>
                        </div>
                      </div>
                      <Separator className="bg-border/50" />
                    </>
                  )}

                  {/* Browse Services */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">Services</h3>
                    
                    <NavItem to="/ride-booking" icon={<CarTaxiFront className="h-4 w-4" />} label="Rides & Taxis" />
                    <NavItem to="/buses" icon={<Bus className="h-4 w-4" />} label="Bus Tickets" />
                    <NavItem to="/events" icon={<Calendar className="h-4 w-4" />} label="Events" />
                    <NavItem to="/stays" icon={<Building2 className="h-4 w-4" />} label="Stays" />
                    <NavItem to="/venues" icon={<MapPin className="h-4 w-4" />} label="Venues" />
                    <NavItem to="/workspaces" icon={<Briefcase className="h-4 w-4" />} label="Workspaces" />
                    <NavItem to="/experiences" icon={<Palmtree className="h-4 w-4" />} label="Experiences" />
                    <NavItem to="/agents" icon={<Users className="h-4 w-4" />} label="Travel Agents" />
                  </div>

                  <Separator className="bg-border/50" />

                  {/* Account & Quick Actions */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
                      {user ? "My Account" : "Account"}
                    </h3>

                    {user ? (
                      <>
                        <NavItem to="/profile" icon={<User className="h-4 w-4" />} label="Profile" />
                        <NavItem to="/orders" icon={<Ticket className="h-4 w-4" />} label="My Orders" />
                        <NavItem to="/rides" icon={<Car className="h-4 w-4" />} label="My Rides" />
                        <NavItem to="/saved" icon={<Heart className="h-4 w-4" />} label="Saved Places" />
                        <NavItem to="/payment-methods" icon={<DollarSign className="h-4 w-4" />} label="Payment Methods" />
                        <NavItem to="/referral" icon={<Tag className="h-4 w-4" />} label="Invite Friends" />
                        <NavItem to="/retrieve-booking" icon={<Clock className="h-4 w-4" />} label="Retrieve Booking" />
                      </>
                    ) : (
                      <>
                        <NavItem to="/auth" icon={<LogIn className="h-4 w-4" />} label="Sign In / Sign Up" />
                        <NavItem to="/retrieve-booking" icon={<Clock className="h-4 w-4" />} label="Retrieve Booking" />
                      </>
                    )}
                  </div>

                  {/* Dashboards - Only for users with roles */}
                  {user && (isDriver || isMerchant || isAdmin) && (
                    <>
                      <Separator className="bg-border/50" />
                      <div className="space-y-1">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">Dashboards</h3>
                        
                        {isDriver && (
                          <NavItem to="/driver" icon={<Car className="h-4 w-4" />} label="Driver Dashboard" />
                        )}
                        {isMerchant && (
                          <NavItem to={getMerchantPortalPath()} icon={<Briefcase className="h-4 w-4" />} label={getMerchantLabel()} />
                        )}
                        {isAdmin && (
                          <NavItem to="/merchant/admin" icon={<Shield className="h-4 w-4" />} label="Admin Panel" />
                        )}
                      </div>
                    </>
                  )}

                  {/* Become a Partner - Only for users without roles */}
                  {user && !isDriver && !isMerchant && (
                    <>
                      <Separator className="bg-border/50" />
                      <div className="space-y-1">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">Partner With Us</h3>
                        <NavItem to="/driver/register" icon={<Car className="h-4 w-4" />} label="Become a Driver" />
                        <NavItem 
                          to="/auth" 
                          icon={<Briefcase className="h-4 w-4" />} 
                          label="Start a Business" 
                          state={{ mode: "signup", userType: "merchant" }}
                        />
                      </div>
                    </>
                  )}

                  <Separator className="bg-border/50" />

                  {/* Support */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">Support</h3>
                    
                    <NavItem to="/help" icon={<HelpCircle className="h-4 w-4" />} label="Help Center" />
                    <button
                      onClick={() => window.open('https://wa.me/263789583003', '_blank')}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors text-left"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp Support
                    </button>
                    <NavItem to="/about" icon={<Info className="h-4 w-4" />} label="About Us" />
                  </div>

                  <Separator className="bg-border/50" />

                  {/* Settings */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3">Settings</h3>
                    
                    {user && <NavItem to="/notifications" icon={<Bell className="h-4 w-4" />} label="Notifications" />}
                    
                    {/* Currency */}
                    <div className="px-3 space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        Currency
                      </label>
                      <Select
                        value={currency.code}
                        onValueChange={(code) => {
                          const selected = currencies.find(c => c.code === code);
                          if (selected) setCurrency(selected);
                        }}
                      >
                        <SelectTrigger className="w-full rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((curr) => (
                            <SelectItem key={curr.code} value={curr.code}>
                              {curr.code} ({curr.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Theme Toggle */}
                    <div className="px-3 flex items-center justify-between">
                      <label className="text-sm font-medium flex items-center gap-2">
                        {theme === "dark" ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                        Theme
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-full h-8 px-4"
                      >
                        {theme === "dark" ? "Light" : "Dark"}
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  {/* Legal */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">Legal</h3>
                    <NavItem to="/privacy" icon={<ShieldCheck className="h-4 w-4" />} label="Privacy Policy" />
                    <NavItem to="/terms" icon={<FileText className="h-4 w-4" />} label="Terms of Service" />
                  </div>

                  {/* Sign Out */}
                  {user && (
                    <>
                      <Separator className="bg-border/50" />
                      <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            
            {/* AI Search */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAiSearchOpen(true)}
              className="h-9 w-9 rounded-full"
              aria-label="AI Search"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <AISearchDialog open={aiSearchOpen} onOpenChange={setAiSearchOpen} />

            {/* Theme Toggle - Desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden sm:flex h-9 w-9 rounded-full"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  state?: Record<string, unknown>;
}

const NavItem = ({ to, icon, label, state }: NavItemProps) => (
  <Link
    to={to}
    state={state}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors"
  >
    {icon}
    {label}
  </Link>
);

export default Navigation;
