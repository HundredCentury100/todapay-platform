import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WorkspaceRatingBreakdownProps {
  overallRating: number;
  totalReviews: number;
  subRatings?: {
    space?: number;
    connectivity?: number;
    service?: number;
    value?: number;
    noise?: number;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  space: "Space Quality",
  connectivity: "Connectivity",
  service: "Service",
  value: "Value",
  noise: "Noise Level",
};

export const WorkspaceRatingBreakdown = ({
  overallRating,
  totalReviews,
  subRatings,
}: WorkspaceRatingBreakdownProps) => {
  if (totalReviews === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
        <span className="text-2xl font-bold">{overallRating.toFixed(1)}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-lg font-medium">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</span>
      </div>

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
