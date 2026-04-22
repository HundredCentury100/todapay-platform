import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RatingBreakdownProps {
  overallRating: number;
  totalReviews: number;
  subRatings?: {
    cleanliness?: number;
    accuracy?: number;
    checkin?: number;
    communication?: number;
    location?: number;
    value?: number;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  cleanliness: "Cleanliness",
  accuracy: "Accuracy",
  checkin: "Check-in",
  communication: "Communication",
  location: "Location",
  value: "Value",
};

export const RatingBreakdown = ({
  overallRating,
  totalReviews,
  subRatings,
}: RatingBreakdownProps) => {
  if (totalReviews === 0) return null;

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="flex items-center gap-3">
        <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
        <span className="text-2xl font-bold">{overallRating.toFixed(1)}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-lg font-medium">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</span>
      </div>

      {/* Sub-rating Bars */}
      {subRatings && Object.keys(subRatings).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const rating = subRatings[key as keyof typeof subRatings];
            if (!rating) return null;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm w-28 flex-shrink-0">{label}</span>
                <Progress value={(rating / 5) * 100} className="h-1.5 flex-1" />
                <span className="text-sm font-medium w-7 text-right">{rating.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
