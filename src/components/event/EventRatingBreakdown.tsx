import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface EventRatingBreakdownProps {
  overallRating: number;
  totalReviews: number;
  reviews: any[];
}

const CATEGORY_LABELS: Record<string, string> = {
  organization: "Organization",
  venue: "Venue",
  value: "Value",
  atmosphere: "Atmosphere",
  safety: "Safety",
};

export const EventRatingBreakdown = ({
  overallRating,
  totalReviews,
  reviews,
}: EventRatingBreakdownProps) => {
  if (totalReviews === 0) return null;

  // Aggregate sub_ratings from reviews
  const subRatings: Record<string, { sum: number; count: number }> = {};
  reviews.forEach((review: any) => {
    const sr = review.sub_ratings;
    if (sr && typeof sr === 'object') {
      Object.entries(sr).forEach(([key, val]) => {
        if (typeof val === 'number') {
          if (!subRatings[key]) subRatings[key] = { sum: 0, count: 0 };
          subRatings[key].sum += val;
          subRatings[key].count += 1;
        }
      });
    }
  });

  const hasSubRatings = Object.keys(subRatings).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
        <span className="text-2xl font-bold">{overallRating.toFixed(1)}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-lg font-medium">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</span>
      </div>

      {hasSubRatings && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const data = subRatings[key];
            if (!data) return null;
            const avg = data.sum / data.count;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm w-28 flex-shrink-0">{label}</span>
                <Progress value={(avg / 5) * 100} className="h-1.5 flex-1" />
                <span className="text-sm font-medium w-7 text-right">{avg.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
