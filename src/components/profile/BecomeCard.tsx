import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Car, Briefcase, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BecomeCardProps {
  type: "driver" | "merchant";
  className?: string;
}

const cardConfig = {
  driver: {
    icon: Car,
    title: "Start Earning as a Driver",
    description: "Set your own schedule, keep more of what you earn",
    gradient: "from-emerald-500/10 to-green-500/10",
    iconBg: "bg-emerald-500",
    path: "/driver/register",
    pathState: undefined as { mode: string; userType: string } | undefined,
  },
  merchant: {
    icon: Briefcase,
    title: "Launch Your Business",
    description: "Sell tickets, manage events, grow your audience",
    gradient: "from-violet-500/10 to-purple-500/10",
    iconBg: "bg-violet-500",
    path: "/auth",
    pathState: { mode: "signup", userType: "merchant" } as { mode: string; userType: string } | undefined,
  },
};

export const BecomeCard = ({ type, className }: BecomeCardProps) => {
  const navigate = useNavigate();
  const config = cardConfig[type];
  const Icon = config.icon;

  const handleClick = () => {
    if (type === "merchant") {
      navigate(config.path, { state: config.pathState });
    } else {
      navigate(config.path);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={cn(
        "w-full p-4 rounded-2xl bg-gradient-to-br border border-border/50 text-left transition-all hover:scale-[1.01] active:scale-[0.99]",
        config.gradient,
        className
      )}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.iconBg)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{config.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
        </div>
        
        <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </motion.button>
  );
};
