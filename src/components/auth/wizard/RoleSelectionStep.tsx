import { motion } from "framer-motion";
import { User, Car, Briefcase, Plane, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardRole = "consumer" | "driver" | "merchant" | "agent";

interface RoleOption {
  id: WizardRole;
  icon: any;
  label: string;
  tagline: string;
  features: string[];
  gradient: string;
  iconBg: string;
}

const roles: RoleOption[] = [
  {
    id: "consumer",
    icon: User,
    label: "Traveler",
    tagline: "Book trips, events & more",
    features: ["Bus & flight bookings", "Event tickets", "Stays & car rentals"],
    gradient: "from-sky-500 to-blue-600",
    iconBg: "bg-sky-500",
  },
  {
    id: "driver",
    icon: Car,
    label: "Driver",
    tagline: "Earn on your schedule",
    features: ["Flexible hours", "Instant earnings", "Growing passenger base"],
    gradient: "from-emerald-500 to-green-600",
    iconBg: "bg-emerald-500",
  },
  {
    id: "merchant",
    icon: Briefcase,
    label: "Merchant",
    tagline: "Grow your business",
    features: ["List your services", "Manage bookings", "Track revenue"],
    gradient: "from-violet-500 to-purple-600",
    iconBg: "bg-violet-500",
  },
  {
    id: "agent",
    icon: Plane,
    label: "Agent",
    tagline: "Book for your clients",
    features: ["Earn commissions", "Client management", "Float accounts"],
    gradient: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-500",
  },
];

interface RoleSelectionStepProps {
  selectedRole: WizardRole | null;
  onSelect: (role: WizardRole) => void;
}

export const RoleSelectionStep = ({ selectedRole, onSelect }: RoleSelectionStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">How will you use fulticket?</h1>
        <p className="text-muted-foreground text-sm mt-1">Choose your primary role — you can switch anytime</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {roles.map((role, i) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          return (
            <motion.button
              key={role.id}
              type="button"
              onClick={() => onSelect(role.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "relative p-4 rounded-2xl border-2 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border/50 bg-card hover:border-border hover:shadow-md"
              )}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </motion.div>
              )}
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-3", role.iconBg)}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="font-bold text-foreground">{role.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{role.tagline}</p>
              <ul className="mt-3 space-y-1">
                {role.features.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
