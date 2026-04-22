import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Car, Briefcase, Plane, Building2, Shield } from "lucide-react";

const roles = [
  { 
    id: "consumer", icon: User, label: "Traveler", 
    description: "Book trips & events",
    gradient: "from-sky-500/10 to-blue-500/10",
    iconBg: "bg-sky-500",
    path: "/auth",
    state: { mode: "signup", userType: "consumer" },
  },
  { 
    id: "driver", icon: Car, label: "Driver", 
    description: "Earn on your schedule",
    gradient: "from-emerald-500/10 to-green-500/10",
    iconBg: "bg-emerald-500",
    path: "/auth",
    state: { mode: "signup", userType: "driver" },
  },
  { 
    id: "merchant", icon: Briefcase, label: "Merchant", 
    description: "Grow your business",
    gradient: "from-violet-500/10 to-purple-500/10",
    iconBg: "bg-violet-500",
    path: "/auth",
    state: { mode: "signup", userType: "merchant" },
  },
  { 
    id: "agent", icon: Plane, label: "Agent", 
    description: "Book for clients",
    gradient: "from-amber-500/10 to-orange-500/10",
    iconBg: "bg-amber-500",
    path: "/auth",
    state: { mode: "signup", userType: "agent" },
  },
  { 
    id: "corporate", icon: Building2, label: "Corporate", 
    description: "Manage team travel",
    gradient: "from-slate-500/10 to-gray-500/10",
    iconBg: "bg-slate-500",
    path: "/corporate/register",
    state: {},
  },
  { 
    id: "admin", icon: Shield, label: "Master Admin", 
    description: "Platform access",
    gradient: "from-red-500/10 to-rose-500/10",
    iconBg: "bg-red-500",
    path: "/merchant/admin/auth",
    state: {},
  },
];

export const RolePreviewCards = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.5 }}
      className="px-4"
    >
      <p className="text-center text-sm text-muted-foreground mb-4">
        One app for everyone
      </p>
      
      <div className="grid grid-cols-3 gap-2.5">
        {roles.map((role, index) => (
          <motion.button
            key={role.id}
            onClick={() => navigate(role.path, { state: role.state })}
            className={`p-3 rounded-2xl bg-gradient-to-br ${role.gradient} border border-border/50 text-center active:scale-95 transition-transform`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 + index * 0.08 }}
          >
            <div className={`w-9 h-9 ${role.iconBg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <role.icon className="w-4 h-4 text-white" />
            </div>
            <p className="font-semibold text-xs text-foreground leading-tight">{role.label}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{role.description}</p>
          </motion.button>
        ))}
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-4">
        Switch anytime in settings
      </p>
    </motion.div>
  );
};
