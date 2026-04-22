import { useState } from "react";
import { Search, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { SmartSearchOverlay } from "@/components/search/SmartSearchOverlay";

export const SearchBar = () => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <div className="px-4">
        <motion.button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center gap-3 bg-secondary/60 hover:bg-secondary/80 rounded-2xl px-5 py-4 transition-colors press-effect tap-target"
          whileTap={{ scale: 0.98 }}
        >
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-left text-muted-foreground text-base">
            Where do you want to go?
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="h-8 w-px bg-border" />
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mic className="h-5 w-5 text-primary" />
            </div>
          </div>
        </motion.button>
      </div>

      <SmartSearchOverlay open={showSearch} onOpenChange={setShowSearch} />
    </>
  );
};
