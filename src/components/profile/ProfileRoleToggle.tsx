import { motion } from "framer-motion";
import { User, Car, Briefcase, Shield, Check } from "lucide-react";
import { useDashboardMode, DashboardMode, DashboardModeInfo } from "@/hooks/useDashboardMode";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const modeIcons: Record<DashboardMode, React.ComponentType<{ className?: string }>> = {
  consumer: User,
  driver: Car,
  merchant: Briefcase,
  admin: Shield,
};

const modeLabels: Record<DashboardMode, string> = {
  consumer: "Personal",
  driver: "Driver",
  merchant: "Business",
  admin: "Admin",
};

interface ProfileRoleToggleProps {
  className?: string;
}

export const ProfileRoleToggle = ({ className }: ProfileRoleToggleProps) => {
  const { currentMode, availableModes, switchMode, hasMultipleModes, isLoading } = useDashboardMode();
  const navigate = useNavigate();

  if (isLoading || !hasMultipleModes) {
    return null;
  }

  const handleModeSwitch = (mode: DashboardModeInfo) => {
    switchMode(mode.mode);
    navigate(mode.path);
  };

  return (
    <motion.div 
      className={cn("bg-card rounded-2xl p-4 border border-border/50", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Switch Mode
      </p>
      
      <div className="flex gap-2">
        {availableModes.map((mode) => {
          const Icon = modeIcons[mode.mode];
          const isActive = currentMode === mode.mode;
          
          return (
            <motion.button
              key={mode.mode}
              onClick={() => handleModeSwitch(mode)}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-h-[72px]",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              )}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isActive && (
                  <motion.div 
                    className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <Check className="w-2 h-2 text-primary" />
                  </motion.div>
                )}
              </div>
              <span className="text-xs font-semibold">{modeLabels[mode.mode]}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
