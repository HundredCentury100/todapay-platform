import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/types/stay";

interface ListingQualityScoreProps {
  property: Property;
}

export const ListingQualityScore = ({ property }: ListingQualityScoreProps) => {
  const checks = [
    { label: "Photos", done: (property.images?.length || 0) >= 3 },
    { label: "Description", done: (property.description?.length || 0) >= 50 },
    { label: "Amenities", done: (property.amenities?.length || 0) >= 5 },
    { label: "Rooms", done: (property.rooms?.length || 0) >= 1 },
    { label: "Policies", done: !!property.policies?.cancellation },
    { label: "Location", done: !!property.address && !!property.city },
  ];

  const completed = checks.filter(c => c.done).length;
  const score = Math.round((completed / checks.length) * 100);

  const color = score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-500";
  const bgColor = score >= 80 ? "bg-green-100 dark:bg-green-900/30" : score >= 50 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-red-100 dark:bg-red-900/30";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={`${bgColor} ${color} text-xs font-semibold`}>
          {score}%
        </Badge>
        <span className="text-xs text-muted-foreground">Listing quality</span>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  );
};
