import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import {
  LayoutDashboard,
  UserPlus,
  Receipt,
  Users,
  BarChart3,
  Settings,
  FileSpreadsheet,
  UsersRound,
  User,
  Home,
  Ticket,
  Zap,
  History,
  FileText,
  CreditCard,
  Building2,
  ClipboardList,
  Briefcase,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  internalOnly?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
  internalOnly?: boolean;
}

const allSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/merchant/agent", icon: LayoutDashboard },
    ],
  },
  {
    label: "Bookings",
    items: [
      { name: "Book for Client", href: "/", icon: UserPlus },
      { name: "My Bookings", href: "/merchant/agent/bookings", icon: Receipt },
      { name: "Bulk Booking", href: "/merchant/agent/bulk-booking", icon: FileSpreadsheet, internalOnly: true },
    ],
  },
  {
    label: "Client Management",
    internalOnly: true,
    items: [
      { name: "Clients", href: "/merchant/agent/clients", icon: Users },
      { name: "Sub-Agents", href: "/merchant/agent/sub-agents", icon: UsersRound },
    ],
  },
  {
    label: "Merchant Services",
    internalOnly: true,
    items: [
      { name: "Manage Services", href: "/merchant/agent/services", icon: Briefcase },
      { name: "Register Merchant", href: "/merchant/agent/register-merchant", icon: Building2 },
      { name: "Manage Merchants", href: "/merchant/agent/manage-merchants", icon: ClipboardList },
    ],
  },
  {
    label: "Payments & Bills",
    items: [
      { name: "Pay Bills", href: "/merchant/agent/bill-pay", icon: Zap },
      { name: "Bill History", href: "/merchant/agent/bill-history", icon: History },
      { name: "Reconciliation", href: "/merchant/agent/bill-reconciliation", icon: FileText, internalOnly: true },
      { name: "Payments", href: "/merchant/agent/payments", icon: CreditCard, internalOnly: true },
      { name: "InnBucks Tools", href: "/merchant/agent/innbucks-tools", icon: Zap },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Analytics", href: "/merchant/agent/analytics", icon: BarChart3, internalOnly: true },
      { name: "Profile", href: "/merchant/agent/profile", icon: User },
      { name: "Settings", href: "/merchant/agent/settings", icon: Settings },
    ],
  },
];

export const AgentSidebar = () => {
  const location = useLocation();
  const { merchantProfile } = useMerchantAuth();
  const isExternal = merchantProfile?.role === 'booking_agent';

  const sections = isExternal
    ? allSections
        .filter(s => !s.internalOnly)
        .map(s => ({ ...s, items: s.items.filter(i => !i.internalOnly) }))
    : allSections;

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <Link to="/merchant/agent" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Ticket className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-semibold text-lg">Agent Portal</span>
            <p className="text-xs text-muted-foreground">Manage bookings</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        {sections.map((section, sIdx) => (
          <div key={section.label} className={cn(sIdx > 0 && "mt-4")}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
