import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VenueWithMerchant } from "@/services/venueService";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface VenueCardProps {
  venue: VenueWithMerchant;
}

const VenueCard = ({ venue }: VenueCardProps) => {
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [currentImage, setCurrentImage] = useState(0);
  const images = (venue.images as string[]) || [];

  const getCapacity = () =>
    venue.capacity_standing || venue.capacity_seated || venue.capacity_theater || 0;

  const getLowestPrice = () => {
    const prices = [venue.hourly_rate, venue.half_day_rate, venue.full_day_rate].filter(Boolean);
    return prices.length > 0 ? Math.min(...(prices as number[])) : 0;
  };

  const formatVenueType = (type: string) =>
    type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const createdDate = new Date(venue.created_at);
  const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const isNew = daysSinceCreated < 30;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      className="cursor-pointer group"
      onClick={() => navigate(`/venues/${venue.id}`)}
    >
      {/* Image - Airbnb square */}
      <div className="relative aspect-square rounded-2xl overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[currentImage]}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <span className="text-5xl">🏛️</span>
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {images.slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === currentImage ? "bg-white w-3" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
        {isNew && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-primary-foreground rounded-full shadow-md">New</Badge>
          </div>
        )}
      </div>

      {/* Content - Airbnb minimal */}
      <div className="pt-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[15px] line-clamp-1">{venue.name}</h3>
          <span className="flex items-center gap-1 text-sm shrink-0">
            <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
            4.8
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {venue.city}, {venue.country}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatVenueType(venue.venue_type)} · Up to {getCapacity()} guests
        </p>
        <p className="text-[15px] pt-1">
          <span className="font-semibold">{convertPrice(getLowestPrice())}</span>
          <span className="text-muted-foreground"> /hour</span>
        </p>
      </div>
    </div>
  );
};

export default VenueCard;
