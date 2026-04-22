import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SidebarGroup } from "./SidebarGroup";
import { SidebarLink } from "./SidebarLink";
import { DashboardMode } from "@/hooks/useDashboardMode";
import { MerchantRole } from "@/types/merchant";
import {
  Home,
  Ticket,
  Car,
  Wallet,
  Heart,
  Gift,
  Settings,
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  CalendarClock,
  CheckCircle,
  Star,
  BarChart3,
  CreditCard,
  Receipt,
  Shield,
  Activity,
  MessageSquare,
  Megaphone,
  Building2,
  Hotel,
  Bed,
  Plane,
  Laptop,
  CarTaxiFront,
  Compass,
  Wrench,
  TrendingUp,
  UserCog,
  PieChart,
  Cog,
  FileText,
  CalendarDays,
  Power,
  Clock,
  Navigation,
  Briefcase,
  Lock,
  Banknote,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardSidebarProps {
  mode: DashboardMode;
  isCollapsed: boolean;
  merchantRole?: MerchantRole | null;
}

export const DashboardSidebar = ({
  mode,
  isCollapsed,
  merchantRole,
}: DashboardSidebarProps) => {
  const location = useLocation();

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "h-screen sticky top-0 border-r bg-card flex flex-col transition-all duration-200",
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className={cn("h-14 border-b flex items-center px-4", isCollapsed && "justify-center px-2")}>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-foreground">Travela</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {mode === "consumer" && <ConsumerNavigation isCollapsed={isCollapsed} />}
          {mode === "driver" && <DriverNavigation isCollapsed={isCollapsed} />}
          {mode === "merchant" && merchantRole && (
            <MerchantNavigation isCollapsed={isCollapsed} role={merchantRole} />
          )}
          {mode === "admin" && <AdminNavigation isCollapsed={isCollapsed} />}
        </nav>

        {/* Footer */}
        <div className="border-t p-2">
          <SidebarLink to="/account/settings" icon={Settings} label="Settings" isCollapsed={isCollapsed} />
        </div>
      </aside>
    </TooltipProvider>
  );
};

// Consumer Navigation
const ConsumerNavigation = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <>
    <SidebarLink to="/account" icon={Home} label="Home" isCollapsed={isCollapsed} />
    
    <SidebarGroup label="Bookings" defaultOpen isCollapsed={isCollapsed}>
      <SidebarLink to="/account/bookings" icon={Ticket} label="My Bookings" isCollapsed={isCollapsed} />
      <SidebarLink to="/rides" icon={Car} label="Rides" isCollapsed={isCollapsed} />
    </SidebarGroup>

    <SidebarGroup label="Wallet" defaultOpen isCollapsed={isCollapsed}>
      <SidebarLink to="/pay" icon={Wallet} label="Balance" isCollapsed={isCollapsed} />
      <SidebarLink to="/pay" icon={Receipt} label="Transactions" isCollapsed={isCollapsed} />
    </SidebarGroup>

    <SidebarGroup label="Saved" isCollapsed={isCollapsed}>
      <SidebarLink to="/saved" icon={Heart} label="Favorites" isCollapsed={isCollapsed} />
      <SidebarLink to="/rewards" icon={Gift} label="Rewards" isCollapsed={isCollapsed} badge="120 pts" />
    </SidebarGroup>
  </>
);

// Driver Navigation
const DriverNavigation = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <>
    <SidebarLink to="/driver" icon={LayoutDashboard} label="Dashboard" isCollapsed={isCollapsed} />
    
    <SidebarGroup label="Rides" defaultOpen isCollapsed={isCollapsed}>
      <SidebarLink to="/driver/requests" icon={Navigation} label="Requests" isCollapsed={isCollapsed} badge="3" />
      <SidebarLink to="/driver/active" icon={Car} label="Active Ride" isCollapsed={isCollapsed} />
      <SidebarLink to="/driver/history" icon={Clock} label="Ride History" isCollapsed={isCollapsed} />
    </SidebarGroup>

    <SidebarGroup label="Earnings" defaultOpen isCollapsed={isCollapsed}>
      <SidebarLink to="/driver/earnings" icon={DollarSign} label="Earnings" isCollapsed={isCollapsed} />
    </SidebarGroup>

    <SidebarGroup label="Profile" isCollapsed={isCollapsed}>
      <SidebarLink to="/driver/vehicle" icon={Car} label="Vehicle" isCollapsed={isCollapsed} />
      <SidebarLink to="/driver/documents" icon={FileText} label="Documents" isCollapsed={isCollapsed} />
      <SidebarLink to="/driver/performance" icon={BarChart3} label="Performance" isCollapsed={isCollapsed} />
    </SidebarGroup>
  </>
);

// Merchant Navigation - Grouped by section
const MerchantNavigation = ({ isCollapsed, role }: { isCollapsed: boolean; role: MerchantRole }) => {
  const basePath = getMerchantBasePath(role);
  const config = getMerchantConfig(role);

  return (
    <>
      <SidebarLink to={basePath} icon={LayoutDashboard} label="Dashboard" isCollapsed={isCollapsed} />

      <SidebarGroup label="Inventory" defaultOpen isCollapsed={isCollapsed}>
        {config.inventory.map((item) => (
          <SidebarLink key={item.path} to={`${basePath}${item.path}`} icon={item.icon} label={item.label} isCollapsed={isCollapsed} />
        ))}
      </SidebarGroup>

      <SidebarGroup label="Operations" defaultOpen isCollapsed={isCollapsed}>
        <SidebarLink to={`${basePath}/bookings`} icon={Ticket} label="Bookings" isCollapsed={isCollapsed} />
        {config.hasCheckIn && (
          <SidebarLink to={`${basePath}/check-in`} icon={CheckCircle} label="Check-In" isCollapsed={isCollapsed} />
        )}
        <SidebarLink to={`${basePath}/customers`} icon={Users} label="Customers" isCollapsed={isCollapsed} />
      </SidebarGroup>

      <SidebarGroup label="Finances" isCollapsed={isCollapsed}>
        <SidebarLink to={`${basePath}/revenue`} icon={DollarSign} label="Revenue" isCollapsed={isCollapsed} />
        <SidebarLink to={`${basePath}/transactions`} icon={Activity} label="Transactions" isCollapsed={isCollapsed} />
        <SidebarLink to={`${basePath}/billing`} icon={Receipt} label="Platform Fees" isCollapsed={isCollapsed} />
        <SidebarLink to={`${basePath}/payment-settings`} icon={CreditCard} label="Payment Settings" isCollapsed={isCollapsed} />
      </SidebarGroup>

      <SidebarGroup label="Marketing" isCollapsed={isCollapsed}>
        <SidebarLink to={`${basePath}/analytics`} icon={BarChart3} label="Analytics" isCollapsed={isCollapsed} />
        <SidebarLink to={`${basePath}/reviews`} icon={Star} label="Reviews" isCollapsed={isCollapsed} />
        <SidebarLink to={`${basePath}/advertising`} icon={Megaphone} label="Advertising" isCollapsed={isCollapsed} />
      </SidebarGroup>

      <SidebarGroup label="Support" isCollapsed={isCollapsed}>
        <SidebarLink to={`${basePath}/support`} icon={MessageSquare} label="Support" isCollapsed={isCollapsed} />
      </SidebarGroup>
    </>
  );
};

// Admin Navigation - Grouped
const AdminNavigation = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <>
    <SidebarLink to="/merchant/admin" icon={LayoutDashboard} label="Dashboard" isCollapsed={isCollapsed} />

    <SidebarGroup label="Users & Merchants" defaultOpen isCollapsed={isCollapsed}>
      <SidebarLink to="/merchant/admin/users" icon={Users} label="Users" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/merchant-verification" icon={Shield} label="Merchant Verification" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/agent-verification" icon={Shield} label="Agent Verification" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/driver-verification" icon={Car} label="Driver Verification" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/merchant-suspension" icon={Shield} label="Suspensions" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/service-management" icon={Briefcase} label="Service Management" isCollapsed={isCollapsed} />
    </SidebarGroup>

    <SidebarGroup label="Financials" isCollapsed={isCollapsed}>
      <SidebarLink to="/merchant/admin/financial" icon={DollarSign} label="Overview" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/transactions" icon={BarChart3} label="Transactions" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/merchant-billing" icon={Receipt} label="Merchant Billing" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/payment-verification" icon={CreditCard} label="Payment Verification" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/billing-analytics" icon={PieChart} label="Billing Analytics" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/payouts" icon={Banknote} label="Payouts" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/escrow" icon={Lock} label="Escrow Holds" isCollapsed={isCollapsed} />
    </SidebarGroup>

    <SidebarGroup label="Operations" isCollapsed={isCollapsed}>
      <SidebarLink to="/merchant/admin/promos" icon={Gift} label="Promos & Vouchers" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/support" icon={MessageSquare} label="Support Tickets" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/activity-logs" icon={Activity} label="Activity Logs" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/system-health" icon={Activity} label="System Health" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/ad-management" icon={Megaphone} label="Ad Management" isCollapsed={isCollapsed} />
    </SidebarGroup>

    <SidebarGroup label="Analytics" isCollapsed={isCollapsed}>
      <SidebarLink to="/merchant/admin/analytics" icon={TrendingUp} label="Platform Analytics" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/merchant-analytics" icon={BarChart3} label="Merchant Analytics" isCollapsed={isCollapsed} />
      <SidebarLink to="/merchant/admin/merchant-performance" icon={UserCog} label="Performance" isCollapsed={isCollapsed} />
    </SidebarGroup>
  </>
);

// Helper functions
function getMerchantBasePath(role: MerchantRole): string {
  const paths: Record<string, string> = {
    bus_operator: "/merchant/bus-operator",
    event_organizer: "/merchant/event-organizer",
    venue_owner: "/merchant/venue-owner",
    property_owner: "/merchant/property-owner",
    airline_partner: "/merchant/airline",
    workspace_provider: "/merchant/workspace",
    car_rental_company: "/merchant/car-rental",
    transfer_provider: "/merchant/transfers",
    experience_host: "/merchant/experiences",
  };
  return paths[role] || "/merchant";
}

interface MerchantConfig {
  inventory: { path: string; icon: any; label: string }[];
  hasCheckIn: boolean;
}

function getMerchantConfig(role: MerchantRole): MerchantConfig {
  const configs: Record<string, MerchantConfig> = {
    bus_operator: {
      inventory: [
        { path: "/routes", icon: MapPin, label: "Routes & Fleet" },
        { path: "/schedules", icon: CalendarClock, label: "Schedules" },
      ],
      hasCheckIn: true,
    },
    event_organizer: {
      inventory: [
        { path: "/events", icon: Calendar, label: "Events" },
        { path: "/tickets", icon: Ticket, label: "Tickets" },
      ],
      hasCheckIn: true,
    },
    venue_owner: {
      inventory: [
        { path: "/venues", icon: Building2, label: "Venues" },
        { path: "/availability", icon: CalendarDays, label: "Availability" },
      ],
      hasCheckIn: false,
    },
    property_owner: {
      inventory: [
        { path: "/properties", icon: Hotel, label: "Properties" },
        { path: "/rooms", icon: Bed, label: "Rooms" },
      ],
      hasCheckIn: true,
    },
    airline_partner: {
      inventory: [
        { path: "/flights", icon: Plane, label: "Flights" },
      ],
      hasCheckIn: true,
    },
    workspace_provider: {
      inventory: [
        { path: "/spaces", icon: Laptop, label: "Workspaces" },
      ],
      hasCheckIn: false,
    },
    car_rental_company: {
      inventory: [
        { path: "/vehicles", icon: Car, label: "Vehicles" },
        { path: "/maintenance", icon: Wrench, label: "Maintenance" },
      ],
      hasCheckIn: false,
    },
    transfer_provider: {
      inventory: [
        { path: "/services", icon: CarTaxiFront, label: "Services" },
      ],
      hasCheckIn: false,
    },
    experience_host: {
      inventory: [
        { path: "/list", icon: Compass, label: "Experiences" },
      ],
      hasCheckIn: true,
    },
  };
  return configs[role] || { inventory: [], hasCheckIn: false };
}
