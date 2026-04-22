import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  DollarSign,
  Settings,
  MapPin,
  CalendarClock,
  CheckCircle,
  School,
  TrendingUp,
  List,
  Star,
  BarChart3,
  PieChart,
  CreditCard,
  Receipt,
  Shield,
  Activity,
  MessageSquare,
  UserCog,
  Megaphone,
  Building2,
  FileText,
  CalendarDays,
  Hotel,
  Bed,
  Plane,
  Laptop,
  Car,
  CarTaxiFront,
  Compass,
  Truck,
  Wrench,
  Home,
  HelpCircle,
  User,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Wallet,
  Link2,
  Tag,
  Zap,
  Grid3X3,
  Radio,
  Trophy,
} from "lucide-react";
import { MerchantRole } from "@/types/merchant";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MerchantSidebarProps {
  role: MerchantRole;
}

interface NavLink {
  to: string;
  icon: React.ElementType;
  label: string;
}

interface NavSection {
  title: string;
  links: NavLink[];
  defaultOpen?: boolean;
}

const MerchantSidebar = ({ role }: MerchantSidebarProps) => {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    inventory: true,
    operations: true,
    finances: false,
    marketing: false,
    support: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const adminSections: NavSection[] = [
    {
      title: "Overview",
      links: [
        { to: "/merchant/admin", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/merchant/admin/analytics", icon: TrendingUp, label: "Platform Analytics" },
        { to: "/merchant/admin/system-health", icon: Activity, label: "System Health" },
      ],
    },
    {
      title: "User Management",
      links: [
        { to: "/merchant/admin/credentials", icon: UserCog, label: "Create Credentials" },
        { to: "/merchant/admin/users", icon: Users, label: "All Users" },
        { to: "/merchant/admin/merchant-verification", icon: Shield, label: "Merchant Verification" },
        { to: "/merchant/admin/driver-verification", icon: CarTaxiFront, label: "Driver Verification" },
        { to: "/merchant/admin/agent-verification", icon: UserCog, label: "Agent Verification" },
        { to: "/merchant/admin/kyc-management", icon: FileText, label: "KYC Management" },
        { to: "/merchant/admin/merchant-suspension", icon: Shield, label: "Suspensions" },
      ],
    },
    {
      title: "Performance",
      links: [
        { to: "/merchant/admin/merchant-analytics", icon: BarChart3, label: "Merchant Analytics" },
        { to: "/merchant/admin/merchant-performance", icon: TrendingUp, label: "Merchant Performance" },
        { to: "/merchant/admin/agent-performance", icon: UserCog, label: "Agent Performance" },
        { to: "/merchant/admin/ride-analytics", icon: Car, label: "Ride Analytics" },
      ],
    },
    {
      title: "Financial",
      links: [
        { to: "/merchant/admin/financial", icon: DollarSign, label: "Financial Overview" },
        { to: "/merchant/admin/transactions", icon: BarChart3, label: "Transactions" },
        { to: "/merchant/admin/merchant-billing", icon: Receipt, label: "Merchant Billing" },
        
        { to: "/merchant/admin/payouts", icon: Wallet, label: "Payout Management" },
        { to: "/merchant/admin/escrow", icon: Shield, label: "Escrow Management" },
        { to: "/merchant/admin/payment-proofs", icon: CreditCard, label: "Payment Proofs" },
        { to: "/merchant/admin/payment-verification", icon: CheckCircle, label: "Payment Verification" },
        { to: "/merchant/admin/billing-analytics", icon: PieChart, label: "Billing Analytics" },
        { to: "/merchant/admin/billing-control", icon: Settings, label: "Billing Control" },
        { to: "/merchant/admin/bill-reconciliation", icon: FileText, label: "Bill Reconciliation" },
        { to: "/merchant/admin/platform-reconciliation", icon: FileText, label: "Platform Reconciliation" },
        { to: "/merchant/admin/commission-config", icon: Settings, label: "Commission Config" },
        { to: "/merchant/admin/bill-activity", icon: FileText, label: "Bill Activity Log" },
        { to: "/merchant/admin/innbucks-tools", icon: Zap, label: "InnBucks Tools" },
        { to: "/merchant/admin/agent-float", icon: Wallet, label: "Agent Float" },
      ],
    },
    {
      title: "Services & Content",
      links: [
        { to: "/merchant/admin/service-management", icon: Wrench, label: "Service Management" },
        { to: "/merchant/admin/promos", icon: Tag, label: "Promos & Vouchers" },
        { to: "/merchant/admin/ad-management", icon: Megaphone, label: "Ad Management" },
        { to: "/merchant/admin/support", icon: MessageSquare, label: "Support Tickets" },
        { to: "/merchant/admin/activity-logs", icon: Activity, label: "Activity Logs" },
        { to: "/merchant/admin/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const busOperatorSections: NavSection[] = [
    {
      title: "Overview",
      links: [
        { to: "/merchant/bus-operator", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/merchant/bus-operator/analytics", icon: BarChart3, label: "Analytics" },
      ],
    },
    {
      title: "Inventory",
      links: [
        { to: "/merchant/bus-operator/schedules", icon: CalendarClock, label: "Schedules" },
        { to: "/merchant/bus-operator/routes", icon: MapPin, label: "Routes & Fleet" },
      ],
    },
    {
      title: "Operations",
      links: [
        { to: "/merchant/bus-operator/bookings", icon: Ticket, label: "Bookings" },
        { to: "/merchant/bus-operator/check-in", icon: CheckCircle, label: "Check-In" },
        { to: "/merchant/bus-operator/booking-actions", icon: Activity, label: "Booking Actions" },
        { to: "/merchant/bus-operator/customers", icon: Users, label: "Customers" },
        { to: "/merchant/bus-operator/reviews", icon: Star, label: "Reviews" },
      ],
    },
    {
      title: "Finances",
      links: [
        { to: "/merchant/bus-operator/revenue", icon: DollarSign, label: "Revenue" },
        { to: "/merchant/bus-operator/transactions", icon: Activity, label: "Transactions" },
        { to: "/merchant/bus-operator/payouts", icon: Wallet, label: "Payouts" },
        { to: "/merchant/bus-operator/billing", icon: Receipt, label: "Platform Fees" },
        { to: "/merchant/bus-operator/payment-portal", icon: CreditCard, label: "Payment Portal" },
        { to: "/merchant/bus-operator/payment-settings", icon: Settings, label: "Payment Settings" },
      ],
    },
    {
      title: "Marketing",
      links: [
        { to: "/merchant/bus-operator/advertising", icon: Megaphone, label: "Advertising" },
        { to: "/merchant/bus-operator/chatbot-settings", icon: MessageSquare, label: "Chatbot Settings" },
        { to: "/merchant/bus-operator/booking-links", icon: Link2, label: "Booking Links" },
      ],
    },
    {
      title: "Support & Settings",
      links: [
        { to: "/merchant/bus-operator/support", icon: HelpCircle, label: "Support" },
        { to: "/merchant/bus-operator/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const eventOrganizerSections: NavSection[] = [
    {
      title: "Overview",
      links: [
        { to: "/merchant/event-organizer", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/merchant/event-organizer/analytics", icon: BarChart3, label: "Analytics" },
      ],
    },
    {
      title: "Events",
      links: [
        { to: "/merchant/event-organizer/events", icon: Calendar, label: "Events" },
        { to: "/merchant/event-organizer/tickets", icon: Ticket, label: "Tickets" },
        { to: "/merchant/event-organizer/school-events", icon: School, label: "School Events" },
        { to: "/merchant/event-organizer/pricing", icon: DollarSign, label: "Pricing" },
        { to: "/merchant/event-organizer/seat-map", icon: Grid3X3, label: "Seat Map Editor" },
        { to: "/merchant/event-organizer/schedule", icon: CalendarClock, label: "Schedule Builder" },
      ],
    },
    {
      title: "Operations",
      links: [
        { to: "/merchant/event-organizer/attendees", icon: Users, label: "Attendees" },
        { to: "/merchant/event-organizer/check-in", icon: CheckCircle, label: "Check-In" },
        { to: "/merchant/event-organizer/live", icon: Radio, label: "Live Dashboard" },
        { to: "/merchant/event-organizer/staff", icon: Shield, label: "Staff & Volunteers" },
        { to: "/merchant/event-organizer/sponsors", icon: Trophy, label: "Sponsors" },
        { to: "/merchant/event-organizer/booking-actions", icon: Activity, label: "Booking Actions" },
        { to: "/merchant/event-organizer/messages", icon: MessageSquare, label: "Messages" },
        { to: "/merchant/event-organizer/waitlist", icon: List, label: "Waitlist" },
        { to: "/merchant/event-organizer/reviews", icon: Star, label: "Reviews" },
        { to: "/merchant/event-organizer/reports", icon: FileText, label: "Post-Event Reports" },
      ],
    },
    {
      title: "Finances",
      links: [
        { to: "/merchant/event-organizer/revenue", icon: DollarSign, label: "Revenue" },
        { to: "/merchant/event-organizer/transactions", icon: Activity, label: "Transactions" },
        { to: "/merchant/event-organizer/payouts", icon: Wallet, label: "Payouts" },
        { to: "/merchant/event-organizer/billing", icon: Receipt, label: "Platform Fees" },
        { to: "/merchant/event-organizer/payment-portal", icon: CreditCard, label: "Payment Portal" },
        { to: "/merchant/event-organizer/payment-settings", icon: Settings, label: "Payment Settings" },
      ],
    },
    {
      title: "Marketing",
      links: [
        { to: "/merchant/event-organizer/marketing", icon: TrendingUp, label: "Marketing" },
        { to: "/merchant/event-organizer/advertising", icon: Megaphone, label: "Advertising" },
        { to: "/merchant/event-organizer/booking-links", icon: Link2, label: "Booking Links" },
      ],
    },
    {
      title: "Support & Settings",
      links: [
        { to: "/merchant/event-organizer/support", icon: HelpCircle, label: "Support" },
        { to: "/merchant/event-organizer/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const venueOwnerSections: NavSection[] = [
    {
      title: "Overview",
      links: [
        { to: "/merchant/venue-owner", icon: LayoutDashboard, label: "Dashboard" },
      ],
    },
    {
      title: "Venues",
      links: [
        { to: "/merchant/venue-owner/venues", icon: Building2, label: "My Venues" },
        { to: "/merchant/venue-owner/availability", icon: CalendarDays, label: "Availability" },
        { to: "/merchant/venue-owner/pricing", icon: DollarSign, label: "Pricing" },
      ],
    },
    {
      title: "Operations",
      links: [
        { to: "/merchant/venue-owner/bookings", icon: Ticket, label: "Bookings" },
        { to: "/merchant/venue-owner/quotes", icon: FileText, label: "Quote Requests" },
        { to: "/merchant/venue-owner/messages", icon: MessageSquare, label: "Messages" },
        { to: "/merchant/venue-owner/reviews", icon: Star, label: "Reviews" },
      ],
    },
    {
      title: "Finances",
      links: [
        { to: "/merchant/venue-owner/revenue", icon: DollarSign, label: "Revenue" },
        { to: "/merchant/venue-owner/transactions", icon: Activity, label: "Transactions" },
        { to: "/merchant/venue-owner/payouts", icon: Wallet, label: "Payouts" },
        { to: "/merchant/venue-owner/billing", icon: Receipt, label: "Platform Fees" },
        { to: "/merchant/venue-owner/payment-portal", icon: CreditCard, label: "Payment Portal" },
        { to: "/merchant/venue-owner/payment-settings", icon: Settings, label: "Payment Settings" },
      ],
    },
    {
      title: "Marketing",
      links: [
        { to: "/merchant/venue-owner/advertising", icon: Megaphone, label: "Advertising" },
      ],
    },
    {
      title: "Support & Settings",
      links: [
        { to: "/merchant/venue-owner/support", icon: HelpCircle, label: "Support" },
        { to: "/merchant/venue-owner/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const propertyOwnerSections: NavSection[] = [
    {
      title: "Overview",
      links: [
        { to: "/merchant/property-owner", icon: LayoutDashboard, label: "Dashboard" },
      ],
    },
    {
      title: "Properties",
      links: [
        { to: "/merchant/property-owner/properties", icon: Hotel, label: "My Properties" },
        { to: "/merchant/property-owner/rooms", icon: Bed, label: "Room Inventory" },
        { to: "/merchant/property-owner/availability", icon: CalendarDays, label: "Availability" },
        { to: "/merchant/property-owner/pricing", icon: DollarSign, label: "Pricing" },
      ],
    },
    {
      title: "Operations",
      links: [
        { to: "/merchant/property-owner/bookings", icon: Ticket, label: "Bookings" },
        { to: "/merchant/property-owner/messages", icon: MessageSquare, label: "Messages" },
        { to: "/merchant/property-owner/reviews", icon: Star, label: "Reviews" },
      ],
    },
    {
      title: "Finances",
      links: [
        { to: "/merchant/property-owner/revenue", icon: DollarSign, label: "Revenue" },
        { to: "/merchant/property-owner/transactions", icon: Activity, label: "Transactions" },
        { to: "/merchant/property-owner/payouts", icon: Wallet, label: "Payouts" },
        { to: "/merchant/property-owner/billing", icon: Receipt, label: "Platform Fees" },
        { to: "/merchant/property-owner/payment-portal", icon: CreditCard, label: "Payment Portal" },
        { to: "/merchant/property-owner/payment-settings", icon: Settings, label: "Payment Settings" },
      ],
    },
    {
      title: "Marketing",
      links: [
        { to: "/merchant/property-owner/advertising", icon: Megaphone, label: "Advertising" },
        { to: "/merchant/property-owner/booking-links", icon: Link2, label: "Booking Links" },
      ],
    },
    {
      title: "Support & Settings",
      links: [
        { to: "/merchant/property-owner/support", icon: HelpCircle, label: "Support" },
        { to: "/merchant/property-owner/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const airlinePartnerSections: NavSection[] = [
    {
      title: "Overview",
      links: [
        { to: "/merchant/airline", icon: LayoutDashboard, label: "Dashboard" },
      ],
    },
    {
      title: "Flights",
      links: [
        { to: "/merchant/airline/flights", icon: Plane, label: "Flights" },
      ],
    },
    {
      title: "Operations",
      links: [
        { to: "/merchant/airline/bookings", icon: Ticket, label: "Bookings" },
      ],
    },
    {
      title: "Finances",
      links: [
        { to: "/merchant/airline/revenue", icon: DollarSign, label: "Revenue" },
        { to: "/merchant/airline/transactions", icon: Activity, label: "Transactions" },
        { to: "/merchant/airline/billing", icon: Receipt, label: "Platform Fees" },
        { to: "/merchant/airline/payment-settings", icon: Settings, label: "Payment Settings" },
      ],
    },
    {
      title: "Support & Settings",
      links: [
        { to: "/merchant/airline/support", icon: HelpCircle, label: "Support" },
        { to: "/merchant/airline/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const workspaceProviderSections: NavSection[] = [
    {
      title: "Overview",
      links: [
        { to: "/merchant/workspace", icon: LayoutDashboard, label: "Dashboard" },
      ],
    },
    {
      title: "Workspaces",
      links: [
        { to: "/merchant/workspace/spaces", icon: Laptop, label: "Workspaces" },
        { to: "/merchant/workspace/availability", icon: CalendarDays, label: "Availability" },
        { to: "/merchant/workspace/pricing", icon: DollarSign, label: "Pricing" },
      ],
    },
    {
      title: "Operations",
      links: [
        { to: "/merchant/workspace/bookings", icon: Ticket, label: "Bookings" },
        { to: "/merchant/workspace/check-in", icon: CheckCircle, label: "Check-In" },
        { to: "/merchant/workspace/messages", icon: MessageSquare, label: "Messages" },
        { to: "/merchant/workspace/reviews", icon: Star, label: "Reviews" },
      ],
    },
    {
      title: "Finances",
      links: [
        { to: "/merchant/workspace/revenue", icon: DollarSign, label: "Revenue" },
        { to: "/merchant/workspace/transactions", icon: Activity, label: "Transactions" },
        { to: "/merchant/workspace/payouts", icon: Wallet, label: "Payouts" },
        { to: "/merchant/workspace/billing", icon: Receipt, label: "Platform Fees" },
        { to: "/merchant/workspace/payment-portal", icon: CreditCard, label: "Payment Portal" },
        { to: "/merchant/workspace/payment-settings", icon: Settings, label: "Payment Settings" },
      ],
    },
    {
      title: "Support & Settings",
      links: [
        { to: "/merchant/workspace/support", icon: HelpCircle, label: "Support" },
        { to: "/merchant/workspace/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const carRentalSections: NavSection[] = [
    {
      title: "Overview",
      links: [
        { to: "/merchant/car-rental", icon: LayoutDashboard, label: "Dashboard" },
      ],
    },
    {
      title: "Vehicles",
      links: [
        { to: "/merchant/car-rental/vehicles", icon: Car, label: "Vehicles" },
        { to: "/merchant/car-rental/maintenance", icon: Wrench, label: "Maintenance" },
      ],
    },
    {
      title: "Operations",
      links: [
        { to: "/merchant/car-rental/bookings", icon: Ticket, label: "Rentals" },
      ],
    },
    {
      title: "Finances",
      links: [
        { to: "/merchant/car-rental/revenue", icon: DollarSign, label: "Revenue" },
        { to: "/merchant/car-rental/transactions", icon: Activity, label: "Transactions" },
        { to: "/merchant/car-rental/billing", icon: Receipt, label: "Platform Fees" },
        { to: "/merchant/car-rental/payment-settings", icon: Settings, label: "Payment Settings" },
      ],
    },
    {
      title: "Support & Settings",
      links: [
        { to: "/merchant/car-rental/support", icon: HelpCircle, label: "Support" },
        { to: "/merchant/car-rental/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const transferProviderSections: NavSection[] = [
    {
      title: "Overview",
      links: [
        { to: "/merchant/transfers", icon: LayoutDashboard, label: "Dashboard" },
      ],
    },
    {
      title: "Fleet & Services",
      links: [
        { to: "/merchant/transfers/vehicles", icon: Truck, label: "Fleet" },
        { to: "/merchant/transfers/routes", icon: MapPin, label: "Routes & Pricing" },
        { to: "/merchant/transfers/services", icon: CarTaxiFront, label: "Services" },
      ],
    },
    {
      title: "Operations",
      links: [
        { to: "/merchant/transfers/bookings", icon: Ticket, label: "Bookings" },
      ],
    },
    {
      title: "Finances",
      links: [
        { to: "/merchant/transfers/revenue", icon: DollarSign, label: "Revenue" },
        { to: "/merchant/transfers/transactions", icon: Activity, label: "Transactions" },
        { to: "/merchant/transfers/billing", icon: Receipt, label: "Platform Fees" },
        { to: "/merchant/transfers/payment-settings", icon: Settings, label: "Payment Settings" },
      ],
    },
    {
      title: "Support & Settings",
      links: [
        { to: "/merchant/transfers/support", icon: HelpCircle, label: "Support" },
        { to: "/merchant/transfers/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const experienceHostSections: NavSection[] = [
    {
      title: "Overview",
      links: [
        { to: "/merchant/experiences", icon: LayoutDashboard, label: "Dashboard" },
      ],
    },
    {
      title: "Experiences",
      links: [
        { to: "/merchant/experiences/list", icon: Compass, label: "My Experiences" },
        { to: "/merchant/experiences/pricing", icon: DollarSign, label: "Pricing" },
      ],
    },
    {
      title: "Operations",
      links: [
        { to: "/merchant/experiences/bookings", icon: Ticket, label: "Bookings" },
        { to: "/merchant/experiences/messages", icon: MessageSquare, label: "Messages" },
        { to: "/merchant/experiences/reviews", icon: Star, label: "Reviews" },
      ],
    },
    {
      title: "Finances",
      links: [
        { to: "/merchant/experiences/revenue", icon: DollarSign, label: "Revenue" },
        { to: "/merchant/experiences/transactions", icon: Activity, label: "Transactions" },
        { to: "/merchant/experiences/payouts", icon: Wallet, label: "Payouts" },
        { to: "/merchant/experiences/billing", icon: Receipt, label: "Platform Fees" },
        { to: "/merchant/experiences/payment-portal", icon: CreditCard, label: "Payment Portal" },
        { to: "/merchant/experiences/payment-settings", icon: Settings, label: "Payment Settings" },
      ],
    },
    {
      title: "Support & Settings",
      links: [
        { to: "/merchant/experiences/support", icon: HelpCircle, label: "Support" },
        { to: "/merchant/experiences/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const getSections = (): NavSection[] => {
    switch (role) {
      case 'admin':
        return adminSections;
      case 'bus_operator':
        return busOperatorSections;
      case 'event_organizer':
        return eventOrganizerSections;
      case 'venue_owner':
        return venueOwnerSections;
      case 'property_owner':
        return propertyOwnerSections;
      case 'airline_partner':
        return airlinePartnerSections;
      case 'workspace_provider':
        return workspaceProviderSections;
      case 'car_rental_company':
        return carRentalSections;
      case 'transfer_provider':
        return transferProviderSections;
      case 'experience_host':
        return experienceHostSections;
      default:
        return eventOrganizerSections;
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Admin Portal';
      case 'bus_operator':
        return 'Bus Operator';
      case 'event_organizer':
        return 'Event Organizer';
      case 'venue_owner':
        return 'Venue Owner';
      case 'property_owner':
        return 'Property Owner';
      case 'airline_partner':
        return 'Airline Partner';
      case 'workspace_provider':
        return 'Workspace Provider';
      case 'car_rental_company':
        return 'Car Rental';
      case 'transfer_provider':
        return 'Transfer Provider';
      case 'experience_host':
        return 'Experience Host';
      default:
        return 'Merchant';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'admin':
        return Shield;
      case 'bus_operator':
        return MapPin;
      case 'event_organizer':
        return Calendar;
      case 'venue_owner':
        return Building2;
      case 'property_owner':
        return Hotel;
      case 'airline_partner':
        return Plane;
      case 'workspace_provider':
        return Laptop;
      case 'car_rental_company':
        return Car;
      case 'transfer_provider':
        return CarTaxiFront;
      case 'experience_host':
        return Compass;
      default:
        return Briefcase;
    }
  };

  const sections = getSections();
  const RoleIcon = getRoleIcon();

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <RoleIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {getRoleLabel()}
            </h2>
            <p className="text-xs text-muted-foreground">
              Merchant Dashboard
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-1">
        {sections.map((section, index) => (
          <Collapsible
            key={section.title}
            open={openSections[section.title.toLowerCase()] ?? index < 3}
            onOpenChange={() => toggleSection(section.title.toLowerCase())}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
              <span>{section.title}</span>
              {openSections[section.title.toLowerCase()] ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-1">
              {section.links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>

      {/* Footer - Quick Access to Home */}
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

export default MerchantSidebar;
