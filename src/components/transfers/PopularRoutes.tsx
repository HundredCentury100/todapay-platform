import { motion } from "framer-motion";
import { MapPin, Plane, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PopularRoute {
  from: string;
  to: string;
  emoji: string;
  tag?: string;
  isAirport?: boolean;
}

const POPULAR_ROUTES: PopularRoute[] = [
  { from: "RGM Airport", to: "Harare CBD", emoji: "✈️", tag: "Most Popular", isAirport: true },
  { from: "RGM Airport", to: "Borrowdale", emoji: "✈️", isAirport: true },
  { from: "Vic Falls Airport", to: "Vic Falls Hotels", emoji: "🏨", tag: "Tourist", isAirport: true },
  { from: "Harare CBD", to: "Eastgate Mall", emoji: "🏙️" },
  { from: "J.M. Nkomo Airport", to: "Bulawayo CBD", emoji: "✈️", isAirport: true },
  { from: "Harare", to: "Kariba", emoji: "🌊", tag: "Long Distance" },
  { from: "Sam Levy's Village", to: "RGM Airport", emoji: "🛍️", isAirport: true },
  { from: "Avondale", to: "Mt Pleasant", emoji: "🏘️" },
];

interface PopularRoutesProps {
  onSelectRoute: (from: string, to: string) => void;
  className?: string;
}

export const PopularRoutes = ({ onSelectRoute, className }: PopularRoutesProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Popular Routes</h4>
      </div>
      
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {POPULAR_ROUTES.map((route, idx) => (
          <motion.button
            key={`${route.from}-${route.to}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => onSelectRoute(route.from, route.to)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all whitespace-nowrap shrink-0 press-effect"
          >
            <span className="text-base">{route.emoji}</span>
            <div className="text-left">
              <p className="text-xs font-medium leading-tight">{route.from}</p>
              <p className="text-[10px] text-muted-foreground">→ {route.to}</p>
            </div>
            {route.tag && (
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                {route.tag}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
