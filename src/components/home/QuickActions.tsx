import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  History, Heart, CreditCard, Gift, Users, HelpCircle, Percent, Ticket, LucideIcon, ChevronRight, Star
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ActionItem {
  icon: LucideIcon;
  label: string;
  path: string;
  bgColor: string;
  iconColor: string;
}

const actions: ActionItem[] = [
  { icon: History, label: "History", path: "/account/bookings", bgColor: "bg-blue-500/15", iconColor: "text-blue-500" },
  { icon: CreditCard, label: "Pay Bills", path: "/pay", bgColor: "bg-violet-500/15", iconColor: "text-violet-500" },
  { icon: Heart, label: "Saved", path: "/saved", bgColor: "bg-rose-500/15", iconColor: "text-rose-500" },
  { icon: Percent, label: "Promos", path: "/promos", bgColor: "bg-emerald-500/15", iconColor: "text-emerald-500" },
  { icon: Star, label: "Rewards", path: "/rewards", bgColor: "bg-amber-500/15", iconColor: "text-amber-500" },
  { icon: Gift, label: "Gift Cards", path: "/gift-cards", bgColor: "bg-fuchsia-500/15", iconColor: "text-fuchsia-500" },
  { icon: Users, label: "Refer", path: "/referral", bgColor: "bg-cyan-500/15", iconColor: "text-cyan-500" },
  { icon: Ticket, label: "Vouchers", path: "/vouchers", bgColor: "bg-pink-500/15", iconColor: "text-pink-500" },
  { icon: HelpCircle, label: "Help", path: "/help", bgColor: "bg-slate-500/15", iconColor: "text-slate-500" },
];

export const QuickActions = () => {
  const { user } = useAuth();

  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
        <Link to="/account" className="flex items-center gap-0.5 text-xs font-medium text-primary press-effect">
          More
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
        <motion.div 
          className="flex gap-4 pb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {actions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
            >
              <Link
                to={user ? action.path : "/auth"}
                state={user ? undefined : { returnTo: action.path }}
                className="group flex flex-col items-center gap-2 min-w-[56px] press-effect tap-target"
              >
                <div className={`w-12 h-12 rounded-2xl ${action.bgColor} flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-md group-active:scale-95 duration-200`}>
                  <action.icon className={`h-5.5 w-5.5 ${action.iconColor}`} strokeWidth={2.2} />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap group-hover:text-foreground transition-colors">
                  {action.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
