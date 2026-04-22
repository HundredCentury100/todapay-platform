import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, X } from "lucide-react";
import { favoriteRoutesService, SearchHistory } from "@/services/favoriteRoutesService";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export const RecentSearches = () => {
  const [searches, setSearches] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    const { data, error } = await favoriteRoutesService.getSearchHistory();
    if (!error && data) {
      setSearches(data);
    }
    setLoading(false);
  };

  const handleClearAll = async () => {
    const { error } = await favoriteRoutesService.clearHistory();
    if (!error) {
      setSearches([]);
    }
  };

  const handleSearchAgain = (search: SearchHistory) => {
    if (search.route_type === 'bus') {
      navigate(`/bus/results?from=${search.from_location}&to=${search.to_location}&date=${search.search_date}`);
    } else {
      navigate(`/event/results?location=${search.event_location}&type=${search.event_type}&date=${search.search_date}`);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-40 bg-muted rounded-lg" />;
  }

  if (searches.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Recent Searches</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClearAll}>
          Clear
        </Button>
      </div>

      <div className="space-y-2">
        {searches.map((search) => (
          <div
            key={search.id}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => handleSearchAgain(search)}
          >
            <div className="flex-1">
              {search.route_type === 'bus' ? (
                <div>
                  <p className="font-medium text-sm">
                    {search.from_location} → {search.to_location}
                  </p>
                  {search.search_date && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(search.search_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-medium text-sm">{search.event_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {search.event_location}
                    {search.search_date && ` • ${format(new Date(search.search_date), 'MMM d, yyyy')}`}
                  </p>
                </div>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    </Card>
  );
};
