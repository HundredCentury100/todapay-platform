import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Star, TrendingUp, Wifi, Car, Coffee, Waves, Dumbbell } from "lucide-react";
import { getFeaturedProperties } from "@/services/stayService";
import { Property } from "@/types/stay";
import { ImageCarousel } from "@/components/ImageCarousel";
import { useCurrency } from "@/contexts/CurrencyContext";

const PROPERTY_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  hotel: { label: "Hotel", emoji: "🏨" },
  lodge: { label: "Lodge", emoji: "🏕️" },
  apartment: { label: "Apartment", emoji: "🏢" },
  villa: { label: "Villa", emoji: "🏡" },
  hostel: { label: "Hostel", emoji: "🛏️" },
  guesthouse: { label: "Guest House", emoji: "🏠" },
  resort: { label: "Resort", emoji: "🌴" },
  cottage: { label: "Cottage", emoji: "🏘️" },
  cabin: { label: "Cabin", emoji: "🪵" },
  boutique_hotel: { label: "Boutique", emoji: "✨" },
};


const getAmenityIcon = (amenity: string) => {
  const icons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="w-3 h-3" />,
    pool: <Waves className="w-3 h-3" />,
    gym: <Dumbbell className="w-3 h-3" />,
    parking: <Car className="w-3 h-3" />,
    restaurant: <Coffee className="w-3 h-3" />,
  };
  return icons[amenity.toLowerCase()] || null;
};

interface FeaturedPropertyCardsProps {
  limit?: number;
}

const FeaturedPropertyCards = ({ limit }: FeaturedPropertyCardsProps) => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getFeaturedProperties(limit || 8);
        setProperties(data);
      } catch (error) {
        console.error("Error fetching featured properties:", error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [limit]);

  if (loading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${limit ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        {Array.from({ length: limit || 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <Skeleton className="h-36 w-full" />
            <div className="p-3.5 space-y-2.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No featured properties yet</h3>
        <p className="text-sm text-muted-foreground">Check back soon for amazing stays</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${limit ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
      {properties.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
};

const PropertyCard = ({ property }: { property: any }) => {
  const { convertPrice } = useCurrency();
  const lowestPrice = property.min_price || (property.rooms && property.rooms.length > 0 
    ? Math.min(...property.rooms.map((r: any) => r.base_price)) 
    : 0);

  const typeInfo = PROPERTY_TYPE_LABELS[property.property_type] || { label: property.property_type, emoji: "🏨" };

  return (
    <Link to={`/stays/${property.id}`}>
      <div className="group relative bg-card rounded-2xl border border-border/50 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative h-36 overflow-hidden">
          <ImageCarousel
            images={property.images || []}
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background">
                <Building2 className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
            }
            className="h-36"
          />
          
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5">
            {property.trending && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 font-semibold shadow-lg">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            <Badge className="bg-background/90 text-[10px] px-2 py-0.5 shadow-md">
              {typeInfo.emoji} {typeInfo.label}
            </Badge>
          </div>

          {/* Rating & Stars */}
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
            {property.star_rating && (
              <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-background/90 shadow-md">
                {Array.from({ length: property.star_rating }).map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            )}
          </div>

          {/* User Rating */}
          {property.rating && (
            <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 shadow-md">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold">{property.rating}</span>
              {property.reviewCount && (
                <span className="text-[10px] text-muted-foreground">({property.reviewCount})</span>
              )}
            </div>
          )}

          {/* Region Badge */}
          {property.region && (
            <div className="absolute bottom-2.5 left-2.5 z-10">
              <Badge variant="outline" className="bg-background/90 text-[10px] px-2 py-0.5 shadow-md">
                {property.region}
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-3.5 space-y-2.5 flex-1">
          <div>
            <h3 className="font-semibold text-sm line-clamp-1">{property.name}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{property.city}, {property.country}</span>
            </div>
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {property.amenities.slice(0, 4).map((amenity: string) => (
                <div key={amenity} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50 text-[10px] text-muted-foreground">
                  {getAmenityIcon(amenity)}
                  <span className="capitalize">{amenity.replace('_', ' ')}</span>
                </div>
              ))}
              {property.amenities.length > 4 && (
                <div className="px-1.5 py-0.5 rounded bg-muted/50 text-[10px] text-muted-foreground">
                  +{property.amenities.length - 4}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3.5 pb-3.5 flex items-center justify-between border-t border-border/30 pt-2.5 mt-auto">
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            {lowestPrice > 0 ? (
              <p className="text-base font-bold text-primary">
                {convertPrice(lowestPrice)}<span className="text-xs font-normal text-muted-foreground">/night</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Contact for price</p>
            )}
          </div>
          <Button size="sm" className="h-8 text-xs rounded-full px-4 shadow-md">
            Book Now
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedPropertyCards;
