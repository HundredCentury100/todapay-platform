import { motion } from "framer-motion";
import { Ticket, Building2, Car, ShieldCheck, Headphones, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type UserType = "consumer" | "merchant" | "driver" | "corporate" | "admin" | "agent";

interface RoleSelectorProps {
  selectedRole: UserType | null;
  onSelectRole: (role: UserType) => void;
  compact?: boolean;
}

const roles = [
  {
    id: "consumer" as UserType,
    icon: Ticket,
    title: "Traveler",
    description: "Book buses, events, stays & rides",
    gradient: "from-blue-500 to-cyan-400",
    glow: "shadow-blue-500/20",
    iconBg: "bg-blue-500/10 text-blue-500",
  },
  {
    id: "merchant" as UserType,
    icon: Building2,
    title: "Business",
    description: "Manage your services & inventory",
    gradient: "from-violet-500 to-purple-400",
    glow: "shadow-violet-500/20",
    iconBg: "bg-violet-500/10 text-violet-500",
  },
  {
    id: "agent" as UserType,
    icon: Headphones,
    title: "Agent",
    description: "Sell tickets & earn commissions",
    gradient: "from-emerald-500 to-teal-400",
    glow: "shadow-emerald-500/20",
    iconBg: "bg-emerald-500/10 text-emerald-500",
  },
  {
    id: "driver" as UserType,
    icon: Car,
    title: "Driver",
    description: "Earn as a ride or transfer partner",
    gradient: "from-amber-500 to-orange-400",
    glow: "shadow-amber-500/20",
    iconBg: "bg-amber-500/10 text-amber-500",
  },
  {
    id: "corporate" as UserType,
    icon: Users,
    title: "Corporate",
    description: "Manage team travel & expenses",
    gradient: "from-slate-500 to-gray-400",
    glow: "shadow-slate-500/20",
    iconBg: "bg-slate-500/10 text-slate-500",
  },
  {
    id: "admin" as UserType,
    icon: ShieldCheck,
    title: "Admin",
    description: "Platform administration",
    gradient: "from-rose-500 to-pink-400",
    glow: "shadow-rose-500/20",
    iconBg: "bg-rose-500/10 text-rose-500",
  },
];

export const RoleSelector = ({ selectedRole, onSelectRole, compact }: RoleSelectorProps) => {
  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {roles.filter(r => r.id !== "admin").map((role, idx) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          return (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSelectRole(role.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                isSelected ? `bg-gradient-to-br ${role.gradient} text-white shadow-lg ${role.glow}` : role.iconBg
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn("text-xs font-semibold", isSelected ? "text-primary" : "text-muted-foreground")}>{role.title}</span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">How will you use fulticket?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Choose your primary use case
        </p>
      </div>

      <div className="grid gap-3">
        {roles.map((role, idx) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              onClick={() => onSelectRole(role.id)}
              className={cn(
                "relative w-full p-4 rounded-2xl border-2 transition-all text-left group",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                  isSelected
                    ? `bg-gradient-to-br ${role.gradient} text-white shadow-lg ${role.glow}`
                    : "bg-muted group-hover:bg-muted/80"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{role.title}</h3>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelector;
