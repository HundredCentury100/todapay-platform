import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Bus, Calendar, Home as HomeIcon, Briefcase, Building2, Compass, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllBookingDrafts, clearBookingProgress, BookingProgress, getBookingAge } from "@/hooks/useBookingProgress";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

const typeConfig = {
  bus: { icon: Bus, color: "bg-service-bus", label: "Bus Booking" },
  event: { icon: Calendar, color: "bg-service-event", label: "Event Tickets" },
  stay: { icon: HomeIcon, color: "bg-service-stays", label: "Stay Booking" },
  workspace: { icon: Briefcase, color: "bg-service-workspace", label: "Workspace" },
  venue: { icon: Building2, color: "bg-service-venue", label: "Venue Booking" },
  experience: { icon: Compass, color: "bg-service-experience", label: "Experience" },
};

interface DraftCardProps {
  draft: BookingProgress;
  onDismiss: (id: string) => void;
  isCompact?: boolean;
}

const DraftCard = ({ draft, onDismiss, isCompact }: DraftCardProps) => {
  const { convertPrice } = useCurrency();
  const config = typeConfig[draft.type] || typeConfig.bus;
  const IconComponent = config.icon;
  const { text: timeAgo, isRecent } = getBookingAge(draft.updatedAt);

  if (isCompact) {
    return (
      <div className="relative bg-secondary/50 rounded-xl border border-border/50 overflow-hidden">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDismiss(draft.id); }}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/80 transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>

        <Link to={draft.path} className="block p-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center shrink-0`}>
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="font-medium text-sm truncate">{draft.itemName}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className={cn(isRecent && "text-primary")}>{timeAgo}</span>
                {draft.price && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-foreground">{convertPrice(draft.price)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 overflow-hidden">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDismiss(draft.id); }}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-background/80 transition-colors z-10"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <Link to={draft.path} className="block p-4">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center shrink-0`}>
            <IconComponent className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Continue Booking
              </span>
              <span className={cn(
                "text-xs flex items-center gap-1",
                isRecent ? "text-primary" : "text-muted-foreground"
              )}>
                <Clock className="h-3 w-3" />
                {timeAgo}
              </span>
            </div>

            <h3 className="font-semibold text-foreground truncate">
              {draft.itemName}
            </h3>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
              {draft.from && draft.to && (
                <span>{draft.from} → {draft.to}</span>
              )}
              {draft.date && (
                <span>{draft.date}</span>
              )}
              {draft.selectedSeats && draft.selectedSeats.length > 0 && (
                <span>{draft.selectedSeats.length} seat(s) selected</span>
              )}
              {draft.ticketQuantity && draft.ticketQuantity > 0 && (
                <span>{draft.ticketQuantity} ticket(s)</span>
              )}
            </div>

            <div className="flex items-center justify-between mt-3">
              {draft.price && (
                <span className="text-lg font-bold text-primary">
                  {convertPrice(draft.price)}
                </span>
              )}
              <Button size="sm" className="rounded-full gap-1 ml-auto">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export const ContinueBookingCard = () => {
  const [drafts, setDrafts] = useState<BookingProgress[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadedDrafts = getAllBookingDrafts();
    if (loadedDrafts.length > 0) {
      setDrafts(loadedDrafts);
    }
  }, []);

  const handleDismiss = (id: string) => {
    clearBookingProgress(id);
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const handleDismissAll = () => {
    setDismissed(true);
    clearBookingProgress();
  };

  if (drafts.length === 0 || dismissed) return null;

  const mainDraft = drafts[0];
  const otherDrafts = drafts.slice(1);
  const hasMultiple = drafts.length > 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className="px-4 mb-4"
      >
        <div className="space-y-2">
          {/* Main draft card */}
          <DraftCard 
            draft={mainDraft} 
            onDismiss={handleDismiss}
          />

          {/* Multiple drafts indicator */}
          {hasMultiple && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors"
              >
                <span className="text-sm text-muted-foreground">
                  {otherDrafts.length} more saved booking{otherDrafts.length > 1 ? 's' : ''}
                </span>
                {showAll ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {showAll && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-2"
                  >
                    {otherDrafts.map((draft, index) => (
                      <motion.div
                        key={draft.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <DraftCard
                          draft={draft}
                          onDismiss={handleDismiss}
                          isCompact
                        />
                      </motion.div>
                    ))}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismissAll}
                      className="w-full text-muted-foreground hover:text-destructive"
                    >
                      Clear all saved bookings
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
