import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockBuses } from "@/data/mockData";
import { ChevronLeft, ChevronRight, Bus, Wifi, Usb, UtensilsCrossed, Star, TrendingUp, MapPin, Clock } from "lucide-react";
import { ImageCarousel } from "@/components/ImageCarousel";

const CARDS_PER_PAGE = 10;

interface FeaturedBusCardsProps {
  limit?: number;
}

const FeaturedBusCards = ({ limit }: FeaturedBusCardsProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);

  const displayBuses = limit ? mockBuses.slice(0, limit) : mockBuses;
  const totalPages = Math.ceil(displayBuses.length / CARDS_PER_PAGE);
  
  const currentBuses = useMemo(() => {
    if (limit) return displayBuses;
    const start = currentPage * CARDS_PER_PAGE;
    return mockBuses.slice(start, start + CARDS_PER_PAGE);
  }, [currentPage, limit, displayBuses]);

  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi')) return <Wifi className="w-3.5 h-3.5" />;
    if (lowerAmenity.includes('usb')) return <Usb className="w-3.5 h-3.5" />;
    if (lowerAmenity.includes('snack') || lowerAmenity.includes('meal')) return <UtensilsCrossed className="w-3.5 h-3.5" />;
    return null;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
       return `$${price.toLocaleString()}`;
     }
     return `$${price}`;
  };

  return (
    <div className="w-full">
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${limit ? 'lg:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-4`}>
        {currentBuses.map((bus) => (
          <div
            key={bus.id}
            className="group relative bg-card rounded-2xl border border-border/50 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20"
            onClick={() => navigate('/buses')}
          >
            {/* Image Section */}
            <div className="relative h-36 overflow-hidden">
              <ImageCarousel
                images={(bus as any).images || (bus.image ? [bus.image] : [])}
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background">
                    <Bus className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                }
                className="h-36"
              />
              
              {/* Badges */}
              <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5">
                {(bus as any).trending && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 font-semibold shadow-lg">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}
                <Badge 
                  variant={bus.type === 'crossborder' ? 'default' : 'secondary'} 
                  className="text-[10px] px-2 py-0.5 shadow-md"
                >
                  {bus.type === 'crossborder' ? '🌍 Cross-Border' : '🚌 National'}
                </Badge>
              </div>

              {/* Rating */}
              {(bus as any).rating && (
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 shadow-md">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold">{(bus as any).rating}</span>
                </div>
              )}

              {/* Tier Badge */}
              {bus.operatorTier && (
                <div className="absolute bottom-2.5 right-2.5 z-10">
                  <Badge 
                    variant="outline"
                    className={`text-[10px] px-2 py-0.5 shadow-md ${
                      bus.operatorTier === 'premium' 
                        ? 'bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white border-0' 
                        : bus.operatorTier === 'budget' 
                        ? 'bg-green-500/90 text-white border-0'
                        : 'bg-background/90'
                    }`}
                  >
                    {bus.operatorTier === 'premium' ? '⭐ Premium' : bus.operatorTier === 'budget' ? '💰 Budget' : '✓ Standard'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-3.5 space-y-2.5">
              {/* Operator */}
              <div>
                <h3 className="font-semibold text-sm line-clamp-1">{bus.operator}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{bus.from} → {bus.to}</span>
                </div>
              </div>

              {/* Route Info */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{bus.duration}</span>
                </div>
                {bus.stops && bus.stops.length > 0 && (
                  <span className="text-muted-foreground/60">•</span>
                )}
                {bus.stops && bus.stops.length > 0 && (
                  <span>{bus.stops.length} stops</span>
                )}
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-1">
                {bus.amenities.slice(0, 4).map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50 text-[10px] text-muted-foreground"
                    title={amenity}
                  >
                    {getAmenityIcon(amenity)}
                    <span className="hidden sm:inline">{amenity.split(' ')[0]}</span>
                  </div>
                ))}
                {bus.amenities.length > 4 && (
                  <div className="px-1.5 py-0.5 rounded bg-muted/50 text-[10px] text-muted-foreground">
                    +{bus.amenities.length - 4}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-3.5 pb-3.5 flex items-center justify-between border-t border-border/30 pt-2.5">
              <div>
                <p className="text-xs text-muted-foreground">{bus.availableSeats} seats left</p>
                <p className="text-base font-bold text-primary">{formatPrice(bus.price)}</p>
              </div>
              <Button size="sm" className="h-8 text-xs rounded-full px-4 shadow-md">
                Book Now
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!limit && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-8 h-8 rounded-full text-sm transition-colors ${
                  currentPage === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FeaturedBusCards;
