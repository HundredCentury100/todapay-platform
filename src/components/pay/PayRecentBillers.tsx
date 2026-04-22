import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, X } from "lucide-react";

interface SavedBiller {
  billerId: string;
  billerName: string;
  accountNumber: string;
  label?: string;
}

interface PayRecentBillersProps {
  topBillers: SavedBiller[];
  billerLogoMap: Record<string, string>;
  billerPathMap: Record<string, string>;
  removeBiller: (billerId: string, accountNumber: string) => void;
}

export const PayRecentBillers = ({
  topBillers, billerLogoMap, billerPathMap, removeBiller,
}: PayRecentBillersProps) => {
  if (topBillers.length === 0) return null;

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Recent Billers</h3>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {topBillers.map((saved) => {
          const logo = billerLogoMap[saved.billerId];
          const path = billerPathMap[saved.billerId];
          if (!path) return null;
          return (
            <Link key={`${saved.billerId}-${saved.accountNumber}`} to={path} className="relative shrink-0">
              <div className="w-[100px] rounded-2xl border bg-card p-3 flex flex-col items-center text-center gap-1.5 hover:shadow-md transition-all press-effect">
                {logo && (
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                    <img src={logo} alt={saved.billerName} className="w-7 h-7 object-contain" />
                  </div>
                )}
                <p className="font-semibold text-[11px] leading-tight">{saved.billerName}</p>
                <p className="text-[9px] text-muted-foreground leading-tight truncate w-full">
                  {saved.label || saved.accountNumber}
                </p>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeBiller(saved.billerId, saved.accountNumber); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-muted border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
};
