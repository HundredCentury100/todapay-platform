import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Bus,
  Calendar,
  Home,
  MapPin,
  Briefcase,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const CATEGORIES = [
  { id: "buses", label: "Buses", icon: Bus, color: "hsl(var(--rides))" },
  { id: "events", label: "Events", icon: Calendar, color: "hsl(var(--events))" },
  { id: "stays", label: "Stays", icon: Home, color: "hsl(var(--stays))" },
  { id: "venues", label: "Venues", icon: MapPin, color: "hsl(var(--venues))" },
  { id: "workspaces", label: "Workspaces", icon: Briefcase, color: "hsl(var(--workspace))" },
] as const;

const TRENDING = [
  "Harare → Bulawayo",
  "Victoria Falls stays",
  "Concerts in Harare",
  "Nyanga lodges",
  "Hwange Safari",
];

const STORAGE_KEY = "fulticket_recent_searches";

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").slice(0, 5);
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  const items = getRecent().filter((s) => s !== q);
  items.unshift(q);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 8)));
}

interface SmartSearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SmartSearchOverlay = ({ open, onOpenChange }: SmartSearchOverlayProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRecent(getRecent());
      setQuery("");
      setSelectedCategory(null);
    }
  }, [open]);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;
      saveRecent(searchQuery.trim());
      onOpenChange(false);
      navigate(`/inbox?q=${encodeURIComponent(searchQuery.trim())}`);
    },
    [navigate, onOpenChange]
  );

  const handleAskAI = useCallback(() => {
    onOpenChange(false);
    navigate("/inbox");
  }, [navigate, onOpenChange]);

  const clearRecent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecent([]);
  }, []);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-background flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
        >
          {/* Search header */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 safe-area-pt">
            <div className="flex-1 flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
                placeholder="Search destinations, events..."
                className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button onClick={() => setQuery("")} className="p-1">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-sm font-medium text-primary press-effect"
            >
              Cancel
            </button>
          </div>

          {/* Category filters */}
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === cat.id ? null : cat.id
                    )
                  }
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors press-effect ${
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <cat.icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-20">
            {/* AI search CTA */}
            <button
              onClick={handleAskAI}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-accent mb-4 press-effect"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">Ask AI Assistant</p>
                <p className="text-xs text-muted-foreground">Get personalized recommendations</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Recent searches */}
            {recent.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent
                  </h3>
                  <button
                    onClick={clearRecent}
                    className="text-xs text-primary font-medium"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {recent.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setQuery(item);
                        handleSearch(item);
                      }}
                      className="w-full flex items-center gap-3 py-2.5 press-effect"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Trending
              </h3>
              <div className="space-y-1">
                {TRENDING.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setQuery(item);
                      handleSearch(item);
                    }}
                    className="w-full flex items-center gap-3 py-2.5 press-effect"
                  >
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
