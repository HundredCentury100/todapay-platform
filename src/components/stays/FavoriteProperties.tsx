import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { favoritePropertiesService, FavoriteProperty } from '@/services/favoritePropertiesService';
import { PropertyWishlistButton } from './PropertyWishlistButton';

export function FavoriteProperties() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await favoritePropertiesService.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProperty = (propertyId: string) => {
    navigate(`/stays/${propertyId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Favorite Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Favorite Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No favorite properties yet</p>
            <Button 
              variant="link" 
              onClick={() => navigate('/stays')}
              className="mt-2"
            >
              Browse properties
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Favorite Properties ({favorites.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {favorites.map((fav) => (
          <div
            key={fav.id}
            className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => handleViewProperty(fav.property_id)}
          >
            {fav.property?.images?.[0] ? (
              <img
                src={fav.property.images[0]}
                alt={fav.property.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{fav.property?.name}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{fav.property?.city}, {fav.property?.country}</span>
              </div>
              {fav.property?.star_rating && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{fav.property.star_rating} stars</span>
                </div>
              )}
            </div>
            <PropertyWishlistButton propertyId={fav.property_id} variant="icon" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
