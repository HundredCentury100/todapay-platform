import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  History, Heart, CreditCard, Gift, Users, HelpCircle, Percent, Ticket, LucideIcon, ChevronRight, Star, Send, Wallet
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ActionItem {
  icon: LucideIcon;
  label: string;
  path: string;
  bgColor: string;
  iconColor: string;
  prominent?: boolean;
}

// Prominent actions - displayed large at the top
const prominentActions: ActionItem[] = [
  { icon: Send, label: "Send Money", path: "/send", bgColor: "bg-primary/15", iconColor: "text-primary", prominent: true },
  { icon: Wallet, label: "Top Up Wallet", path: "/pay", bgColor: "bg-emerald-500/15", iconColor: "text-emerald-500", prominent: true },
  { icon: CreditCard, label: "Pay Bills", path: "/pay", bgColor: "bg-violet-500/15", iconColor: "text-violet-500", prominent: true },
];

// Other actions - displayed smaller below
const otherActions: ActionItem[] = [
  { icon: History, label: "History", path: "/account/bookings", bgColor: "bg-blue-500/15", iconColor: "text-blue-500" },
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
    <div className="px-5 space-y-6">
      {/* Prominent Actions - Large Cards */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {prominentActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Link
                to={user ? action.path : "/auth"}
                state={user ? undefined : { returnTo: action.path }}
                className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all press-effect tap-target"
              >
                <div className={`w-16 h-16 rounded-2xl ${action.bgColor} flex items-center justify-center transition-all group-hover:scale-110 group-active:scale-95 duration-200`}>
                  <action.icon className={`h-7 w-7 ${action.iconColor}`} strokeWidth={2.5} />
                </div>
                <span className="text-xs font-bold text-foreground text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Other Actions - Smaller Horizontal Scroll */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">More Services</h3>
          <Link to="/account" className="flex items-center gap-0.5 text-xs font-medium text-primary press-effect">
            View All
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
            {otherActions.map((action, index) => (
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
    </div>
  );
};
