import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface VenueRatingBreakdownProps {
  overallRating: number;
  reviewCount: number;
  breakdown?: { category: string; score: number }[];
}

const DEFAULT_BREAKDOWN = [
  { category: "Space Quality", score: 4.7 },
  { category: "Amenities", score: 4.5 },
  { category: "Service", score: 4.8 },
  { category: "Value", score: 4.4 },
  { category: "Accessibility", score: 4.6 },
];

const VenueRatingBreakdown = ({ overallRating, reviewCount, breakdown }: VenueRatingBreakdownProps) => {
  const categories = breakdown || DEFAULT_BREAKDOWN;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-2 rounded-xl">
          <Star className="h-5 w-5 fill-primary text-primary" />
          <span className="text-xl font-bold">{overallRating.toFixed(1)}</span>
        </div>
        <div>
          <p className="font-medium text-sm">Excellent</p>
          <p className="text-xs text-muted-foreground">{reviewCount} reviews</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat, idx) => (
          <motion.div key={cat.category} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + idx * 0.05 }} className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-28 flex-shrink-0">{cat.category}</span>
            <Progress value={(cat.score / 5) * 100} className="h-2 flex-1" />
            <span className="text-sm font-medium w-8 text-right">{cat.score.toFixed(1)}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default VenueRatingBreakdown;
