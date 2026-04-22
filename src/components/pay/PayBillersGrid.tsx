import { useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Biller {
  id: string;
  name: string;
  description: string;
  logo: string;
  path: string;
  country?: "ZW" | "ZA";
}

interface PayBillersGridProps {
  billers: Biller[];
  showBillers: boolean;
  setShowBillers: (v: boolean) => void;
}

const COUNTRY_META: Record<string, { flag: string; label: string }> = {
  ZW: { flag: "🇿🇼", label: "Zimbabwe" },
  ZA: { flag: "🇿🇦", label: "South Africa" },
};

const isEmojiLogo = (logo: string) => !logo.startsWith("/") && !logo.includes("/") && logo.length <= 4;

export const PayBillersGrid = ({ billers, showBillers, setShowBillers }: PayBillersGridProps) => {
  const billersRef = useRef<HTMLDivElement>(null);

  const grouped = useMemo(() => {
    const map: Record<string, Biller[]> = {};
    for (const b of billers) {
      const key = b.country || "ZW";
      (map[key] ||= []).push(b);
    }
    return map;
  }, [billers]);

  const countryOrder = Object.keys(grouped);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <button
        onClick={() => {
          setShowBillers(!showBillers);
          setTimeout(() => billersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        }}
        className="w-full text-left"
      >
        <Card className="rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all press-effect">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Pay Bills</p>
                <p className="text-[10px] text-muted-foreground">Zimbabwe & South Africa · electricity, airtime & more</p>
              </div>
            </div>
            <ChevronRight className={cn("h-5 w-5 text-muted-foreground transition-transform", showBillers && "rotate-90")} />
          </CardContent>
        </Card>
      </button>

      <AnimatePresence>
        {showBillers && (
          <motion.div
            ref={billersRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-4">
              {countryOrder.map((countryCode) => {
                const meta = COUNTRY_META[countryCode] ?? { flag: "🌍", label: countryCode };
                return (
                  <div key={countryCode}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-base">{meta.flag}</span>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {meta.label}
                      </h4>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {grouped[countryCode].map((biller) => (
                        <Link
                          key={biller.id}
                          to={biller.path}
                          className="flex flex-col items-center gap-2 p-3 rounded-2xl border bg-card hover:shadow-md transition-all press-effect"
                        >
                          {isEmojiLogo(biller.logo) ? (
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">
                              {biller.logo}
                            </div>
                          ) : (
                            <img src={biller.logo} alt={biller.name} className="w-10 h-10 rounded-xl object-contain" />
                          )}
                          <div className="text-center">
                            <p className="text-xs font-semibold">{biller.name}</p>
                            <p className="text-[10px] text-muted-foreground">{biller.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
