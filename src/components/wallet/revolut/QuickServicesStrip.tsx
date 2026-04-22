import { Link } from "react-router-dom";
import { PiggyBank, TrendingUp, Bitcoin, Shield, Gift, CreditCard, Calendar, Users, FileText, LucideIcon } from "lucide-react";

interface Service {
  icon: LucideIcon;
  label: string;
  to: string;
  color: string;
  bg: string;
}

const services: Service[] = [
  { icon: PiggyBank, label: "Vaults", to: "/wallet/vaults", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  { icon: CreditCard, label: "Card", to: "/wallet/card", color: "text-blue-400", bg: "bg-blue-500/15" },
  { icon: TrendingUp, label: "Stocks", to: "/wallet/analytics", color: "text-purple-400", bg: "bg-purple-500/15" },
  { icon: Bitcoin, label: "Crypto", to: "/wallet/analytics", color: "text-amber-400", bg: "bg-amber-500/15" },
  { icon: Users, label: "Split", to: "/wallet/split", color: "text-pink-400", bg: "bg-pink-500/15" },
  { icon: Calendar, label: "Scheduled", to: "/wallet/scheduled", color: "text-indigo-400", bg: "bg-indigo-500/15" },
  { icon: Shield, label: "Insurance", to: "/wallet/analytics", color: "text-cyan-400", bg: "bg-cyan-500/15" },
  { icon: Gift, label: "Rewards", to: "/rewards", color: "text-rose-400", bg: "bg-rose-500/15" },
  { icon: FileText, label: "Statements", to: "/wallet/statements", color: "text-slate-400", bg: "bg-slate-500/15" },
];

export function QuickServicesStrip() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-[hsl(var(--revolut-text))]">Discover</h3>
      </div>
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-3 min-w-max">
          {services.map((s) => (
            <Link
              key={s.label}
              to={s.to}
              className="revolut-card rounded-2xl p-4 w-24 flex flex-col items-center gap-2 hover:bg-[hsl(var(--revolut-card-elevated))] transition-colors"
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <span className="text-xs font-medium text-[hsl(var(--revolut-text))] text-center">
                {s.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
