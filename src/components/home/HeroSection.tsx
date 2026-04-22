import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { SmartSearchOverlay } from "@/components/search/SmartSearchOverlay";
import { useParallax } from "@/hooks/useParallax";

export const HeroSection = () => {
  const [showSearch, setShowSearch] = useState(false);
  const { ref, style: parallaxStyle } = useParallax({ speed: 0.1 });

  return (
    <div className="px-5 pt-10 pb-4" ref={ref} style={parallaxStyle}>
      {/* Compact search bar */}
      <motion.button
        onClick={() => setShowSearch(true)}
        className="w-full group"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3.5 transition-colors group-hover:bg-secondary/80">
          <Search className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left text-muted-foreground text-sm font-medium">
            Search destinations, events...
          </span>
        </div>
      </motion.button>

      <SmartSearchOverlay open={showSearch} onOpenChange={setShowSearch} />
    </div>
  );
};
