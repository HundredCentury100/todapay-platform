import { motion } from "framer-motion";
import { LucideIcon, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  description?: string;
  path?: string;
  onClick?: () => void;
  iconGradient?: string;
  badge?: string | number;
  danger?: boolean;
}

interface PremiumMenuSectionProps {
  title?: string;
  items: MenuItem[];
  delay?: number;
}

const defaultGradients = [
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-green-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-teal-500 to-cyan-600",
];

export function PremiumMenuSection({ title, items, delay = 0 }: PremiumMenuSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl overflow-hidden border border-border/50"
    >
      {title && (
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}
      <div className="divide-y divide-border/30">
        {items.map((item, index) => {
          const Icon = item.icon;
          const gradient = item.iconGradient || (item.danger ? "from-destructive to-destructive/80" : defaultGradients[index % defaultGradients.length]);
          
          const content = (
            <motion.div
              key={index}
              className={cn(
                "flex items-center gap-4 px-4 py-4 transition-all duration-200 cursor-pointer",
                "hover:bg-secondary/30 active:bg-secondary/50",
                item.danger && "hover:bg-destructive/5"
              )}
              onClick={item.onClick}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon with gradient */}
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                  `bg-gradient-to-br ${gradient}`
                )}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium",
                  item.danger && "text-destructive"
                )}>
                  {item.label}
                </p>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {item.description}
                  </p>
                )}
              </div>
              
              {/* Badge */}
              {item.badge !== undefined && (
                <span className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                  {item.badge}
                </span>
              )}
              
              {/* Arrow */}
              {!item.danger && (
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
            </motion.div>
          );

          if (item.path) {
            return (
              <Link key={index} to={item.path}>
                {content}
              </Link>
            );
          }

          return <div key={index}>{content}</div>;
        })}
      </div>
    </motion.div>
  );
}
