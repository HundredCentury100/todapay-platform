import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeasonFilterProps {
  events: any[];
  selectedSeason: string;
  onSelectSeason: (season: string) => void;
}

const SeasonFilter = ({ events, selectedSeason, onSelectSeason }: SeasonFilterProps) => {
  const seasons = useMemo(() => {
    const seasonMap = new Map<string, number>();
    events.forEach((event: any) => {
      if (event.season_name) {
        seasonMap.set(event.season_name, (seasonMap.get(event.season_name) || 0) + 1);
      }
    });
    return Array.from(seasonMap.entries()).map(([name, count]) => ({ name, count }));
  }, [events]);

  if (seasons.length === 0) return null;

  return (
    <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2">
        <button
          onClick={() => onSelectSeason("all")}
          className={cn(
            "h-8 px-3.5 rounded-full text-xs font-medium whitespace-nowrap transition-all press-effect flex items-center gap-1.5",
            selectedSeason === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground"
          )}
        >
          All Seasons
        </button>
        {seasons.map((season) => (
          <button
            key={season.name}
            onClick={() => onSelectSeason(season.name)}
            className={cn(
              "h-8 px-3.5 rounded-full text-xs font-medium whitespace-nowrap transition-all press-effect flex items-center gap-1.5",
              selectedSeason === season.name
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Trophy className="h-3 w-3" />
            {season.name}
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 ml-0.5">{season.count}</Badge>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SeasonFilter;
