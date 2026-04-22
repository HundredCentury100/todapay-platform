import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight } from "lucide-react";
import { favoriteRoutesService, FavoriteRoute } from "@/services/favoriteRoutesService";
import { useNavigate } from "react-router-dom";

export const FavoriteRoutes = () => {
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const { data, error } = await favoriteRoutesService.getFavorites();
    if (!error && data) {
      setFavorites(data);
    }
    setLoading(false);
  };

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await favoriteRoutesService.removeFavorite(id);
    if (!error) {
      setFavorites(favorites.filter(f => f.id !== id));
    }
  };

  const handleSearchRoute = (favorite: FavoriteRoute) => {
    if (favorite.route_type === 'bus') {
      navigate(`/bus/results?from=${favorite.from_location}&to=${favorite.to_location}`);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-40 bg-muted rounded-lg" />;
  }

  if (favorites.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Favorite Routes</h3>
      </div>

      <div className="space-y-2">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group"
            onClick={() => handleSearchRoute(favorite)}
          >
            <div className="flex-1">
              <p className="font-medium text-sm">
                {favorite.from_location} → {favorite.to_location}
              </p>
              <p className="text-xs text-muted-foreground">
                Searched {favorite.search_count} {favorite.search_count === 1 ? 'time' : 'times'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleRemove(favorite.id, e)}
              >
                <Heart className="h-4 w-4 fill-current" />
              </Button>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
