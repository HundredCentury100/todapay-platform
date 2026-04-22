import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Package, Search, Calendar, Bell, MapPin, FileText,
  ShoppingCart, Users, LucideIcon, Bus, Car, Home,
  Building2, Briefcase, Compass, Wallet, CreditCard,
  Ticket, ArrowRight, Plus, Heart, Inbox
} from "lucide-react";

type EmptyStateType = 
  | "no-results" | "no-bookings" | "no-notifications" | "no-events" 
  | "no-data" | "no-location" | "empty-cart" | "no-users"
  | "no-buses" | "no-rides" | "no-stays" | "no-venues"
  | "no-workspaces" | "no-experiences" | "no-transactions"
  | "no-payment-methods" | "no-active-orders" | "no-past-orders"
  | "no-favorites" | "no-messages" | "custom";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  type?: EmptyStateType;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

const presets: Record<Exclude<EmptyStateType, "custom">, { 
  icon: LucideIcon; title: string; description: string;
  action?: { label: string; href: string };
}> = {
  "no-results": { icon: Search, title: "No results found", description: "Try adjusting your search or filters to find what you're looking for." },
  "no-bookings": { icon: Calendar, title: "No bookings yet", description: "Your bookings will appear here once you make a reservation.", action: { label: "Explore", href: "/" } },
  "no-notifications": { icon: Bell, title: "All caught up!", description: "You have no new notifications at the moment." },
  "no-events": { icon: Calendar, title: "No events found", description: "There are no events matching your criteria.", action: { label: "Browse events", href: "/events" } },
  "no-data": { icon: Package, title: "No data available", description: "There's nothing to display right now." },
  "no-location": { icon: MapPin, title: "Location not found", description: "We couldn't find the location you're looking for." },
  "empty-cart": { icon: ShoppingCart, title: "Your cart is empty", description: "Add items to your cart to continue." },
  "no-users": { icon: Users, title: "No users found", description: "There are no users matching your criteria." },
  "no-buses": { icon: Bus, title: "No buses available", description: "Try a different route or date to find available buses." },
  "no-rides": { icon: Car, title: "No ride history", description: "Your completed rides will appear here.", action: { label: "Book a ride", href: "/ride-booking" } },
  "no-stays": { icon: Home, title: "No stays found", description: "Explore our listings to find your perfect accommodation.", action: { label: "Browse stays", href: "/stays" } },
  "no-venues": { icon: Building2, title: "No venues available", description: "Check back later for new venue listings.", action: { label: "Browse venues", href: "/venues" } },
  "no-workspaces": { icon: Briefcase, title: "No workspaces found", description: "Discover co-working spaces in your area.", action: { label: "Browse workspaces", href: "/workspaces" } },
  "no-experiences": { icon: Compass, title: "No experiences yet", description: "Browse tours and activities near you.", action: { label: "Explore", href: "/experiences" } },
  "no-transactions": { icon: Wallet, title: "No transactions yet", description: "Your payment history will appear here." },
  "no-payment-methods": { icon: CreditCard, title: "No payment methods", description: "Add a card or mobile money to get started." },
  "no-active-orders": { icon: Ticket, title: "No active orders", description: "You don't have any upcoming trips or events.", action: { label: "Book now", href: "/" } },
  "no-past-orders": { icon: Ticket, title: "No order history", description: "Your completed orders will appear here." },
  "no-favorites": { icon: Heart, title: "No saved items", description: "Tap the heart icon on any listing to save it for later.", action: { label: "Start exploring", href: "/" } },
  "no-messages": { icon: Inbox, title: "No messages", description: "Conversations with hosts and support will appear here." },
};

export const EmptyState = ({
  type = "no-data", icon: CustomIcon, title, description,
  actionLabel, onAction, action, secondaryAction,
  className, size = "md", animate = true,
}: EmptyStateProps) => {
  const preset = type !== "custom" ? presets[type] : null;
  const Icon = CustomIcon || preset?.icon || FileText;
  const displayTitle = title || preset?.title || "Nothing here";
  const displayDescription = description || preset?.description || "";
  const displayAction = action || (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : preset?.action);

  const sizeClasses = {
    sm: { container: "py-6 px-4", icon: "h-8 w-8", iconBg: "h-14 w-14", title: "text-base", description: "text-xs", button: "h-9 px-4" },
    md: { container: "py-10 px-6", icon: "h-10 w-10", iconBg: "h-18 w-18", title: "text-lg", description: "text-sm", button: "h-11 px-6" },
    lg: { container: "py-16 px-8", icon: "h-12 w-12", iconBg: "h-24 w-24", title: "text-xl", description: "text-base", button: "h-12 px-8" },
  };
  const sizes = sizeClasses[size];

  const ActionButton = ({ actionConfig, variant = "default" }: { actionConfig: EmptyStateAction; variant?: "default" | "outline" }) => {
    const btn = (
      <Button variant={variant} onClick={actionConfig.onClick} className={cn("rounded-full gap-2", sizes.button)}>
        {actionConfig.label}
        <ArrowRight className="w-4 h-4" />
      </Button>
    );
    return actionConfig.href ? <Link to={actionConfig.href}>{btn}</Link> : btn;
  };

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.3 }}
      className={cn("flex flex-col items-center justify-center text-center", sizes.container, className)}
    >
      <motion.div
        initial={animate ? { scale: 0.8, opacity: 0 } : undefined}
        animate={animate ? { scale: 1, opacity: 1 } : undefined}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className={cn("rounded-full bg-muted/50 flex items-center justify-center mb-4", sizes.iconBg)}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon className={cn("text-muted-foreground/60", sizes.icon)} strokeWidth={1.5} />
        </motion.div>
      </motion.div>
      
      <h3 className={cn("font-semibold text-foreground mb-1", sizes.title)}>{displayTitle}</h3>
      {displayDescription && (
        <p className={cn("text-muted-foreground max-w-xs mb-4", sizes.description)}>{displayDescription}</p>
      )}

      {(displayAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          {displayAction && <ActionButton actionConfig={displayAction} />}
          {secondaryAction && <ActionButton actionConfig={secondaryAction} variant="outline" />}
        </div>
      )}
    </motion.div>
  );
};

/** Inline empty state for smaller areas */
interface InlineEmptyStateProps {
  message: string;
  action?: EmptyStateAction;
  icon?: LucideIcon;
  className?: string;
}

export const InlineEmptyState = ({ message, action, icon: Icon, className }: InlineEmptyStateProps) => (
  <div className={cn("flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/30", className)}>
    {Icon && (
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
        <Icon className="w-5 h-5" />
      </div>
    )}
    <p className="flex-1 text-sm text-muted-foreground">{message}</p>
    {action && (
      action.href ? (
        <Link to={action.href}><Button size="sm" variant="ghost" className="shrink-0">{action.label}</Button></Link>
      ) : (
        <Button size="sm" variant="ghost" onClick={action.onClick} className="shrink-0">{action.label}</Button>
      )
    )}
  </div>
);

/** Add-first empty state with prominent add button */
interface AddFirstEmptyStateProps {
  title: string;
  description: string;
  buttonLabel: string;
  onAdd: () => void;
  icon?: LucideIcon;
  className?: string;
}

export const AddFirstEmptyState = ({ title, description, buttonLabel, onAdd, icon: Icon, className }: AddFirstEmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("flex flex-col items-center justify-center text-center py-12 px-6", className)}
  >
    {Icon && (
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4"
      >
        <Icon className="w-8 h-8" />
      </motion.div>
    )}
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
    <Button onClick={onAdd} className="rounded-full gap-2 h-11 px-6">
      <Plus className="w-4 h-4" />
      {buttonLabel}
    </Button>
  </motion.div>
);
