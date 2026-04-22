import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Car, Briefcase, Shield, ChevronRight, Clock } from "lucide-react";
import { useDashboardMode } from "@/hooks/useDashboardMode";
import { cn } from "@/lib/utils";

interface RoleLinkProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  path: string;
  gradient: string;
  pending?: boolean;
}

const RoleLink = ({ icon: Icon, title, description, path, gradient, pending }: RoleLinkProps) => {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate(path)}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br border border-border/50 text-left transition-all hover:scale-[1.01] active:scale-[0.99]",
        gradient
      )}
      whileTap={{ scale: 0.98 }}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center",
        pending ? "bg-muted" : "bg-primary"
      )}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-foreground">{title}</p>
          {pending && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-medium">
              <Clock className="w-3 h-3" />
              Pending
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </motion.button>
  );
};

interface ProfileRoleLinksProps {
  className?: string;
}

export const ProfileRoleLinks = ({ className }: ProfileRoleLinksProps) => {
  const { isDriver, isMerchant, isAdmin, merchantRole, availableModes } = useDashboardMode();

  // Find merchant mode info for the correct path
  const merchantModeInfo = availableModes.find(m => m.mode === 'merchant');
  const driverModeInfo = availableModes.find(m => m.mode === 'driver');

  // Only show if user has at least one non-consumer role
  const hasRoles = isDriver || isMerchant || isAdmin;
  
  if (!hasRoles) {
    return null;
  }

  const getMerchantLabel = (role: string | null): string => {
    const labels: Record<string, string> = {
      bus_operator: "Bus Operator Dashboard",
      event_organizer: "Event Organizer Dashboard",
      venue_owner: "Venue Owner Dashboard",
      property_owner: "Property Dashboard",
      airline_partner: "Airline Dashboard",
      workspace_provider: "Workspace Dashboard",
      car_rental_company: "Car Rental Dashboard",
      transfer_provider: "Transfers Dashboard",
      experience_host: "Experiences Dashboard",
      travel_agent: "Agent Dashboard",
      booking_agent: "Agent Dashboard",
    };
    return role ? labels[role] || "Business Dashboard" : "Business Dashboard";
  };

  return (
    <motion.div 
      className={cn("space-y-3", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
        Your Dashboards
      </p>
      
      {isDriver && driverModeInfo && (
        <RoleLink
          icon={Car}
          title="Driver Dashboard"
          description="Manage rides, earnings & availability"
          path={driverModeInfo.path}
          gradient="from-emerald-500/10 to-green-500/10"
        />
      )}

      {isMerchant && merchantModeInfo && (
        <RoleLink
          icon={Briefcase}
          title={getMerchantLabel(merchantRole)}
          description="Manage bookings, revenue & listings"
          path={merchantModeInfo.path}
          gradient="from-violet-500/10 to-purple-500/10"
        />
      )}

      {isAdmin && (
        <RoleLink
          icon={Shield}
          title="Admin Panel"
          description="Platform management & oversight"
          path="/merchant/admin"
          gradient="from-red-500/10 to-orange-500/10"
        />
      )}
    </motion.div>
  );
};

export default ProfileRoleLinks;
