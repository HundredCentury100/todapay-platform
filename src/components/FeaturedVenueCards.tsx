import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MapPin, Users, Building2, TrendingUp, Star, Sparkles } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ImageCarousel } from "@/components/ImageCarousel";
import { useQuery } from "@tanstack/react-query";
import { getFeaturedVenues } from "@/services/venueService";
import { Skeleton } from "@/components/ui/skeleton";

const CARDS_PER_PAGE = 10;

// Mock venues for fallback - Zimbabwe focused
const mockVenues = [
  {
    id: "venue-1",
    name: "Rainbow Towers Hotel & Conference Centre",
    venue_type: "conference_center",
    city: "Harare",
    country: "Zimbabwe",
    images: ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80"],
    capacity_standing: 2000,
    capacity_seated: 1500,
    hourly_rate: 500,
    trending: true,
    rating: 4.7,
    reviewCount: 234,
    region: "Zimbabwe",
    description: "Zimbabwe's premier conference and events venue in the heart of Harare.",
  },
  {
    id: "venue-2",
    name: "Victoria Falls Safari Lodge",
    venue_type: "outdoor_venue",
    city: "Victoria Falls",
    country: "Zimbabwe",
    images: ["https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&q=80"],
    capacity_standing: 300,
    capacity_seated: 200,
    daily_rate: 2500,
    trending: true,
    rating: 4.9,
    reviewCount: 567,
    region: "Zimbabwe",
    description: "Stunning bush venue overlooking a waterhole frequented by wildlife.",
  },
  {
    id: "venue-3",
    name: "Meikles Hotel Ballroom",
    venue_type: "ballroom",
    city: "Harare",
    country: "Zimbabwe",
    images: ["https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80"],
    capacity_standing: 400,
    capacity_seated: 250,
    hourly_rate: 400,
    rating: 4.8,
    reviewCount: 189,
    region: "Zimbabwe",
    description: "Elegant colonial-era ballroom perfect for weddings and galas.",
  },
  {
    id: "venue-4",
    name: "Bulawayo Theatre",
    venue_type: "theater",
    city: "Bulawayo",
    country: "Zimbabwe",
    images: ["https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"],
    capacity_standing: 800,
    capacity_seated: 600,
    daily_rate: 1500,
    trending: true,
    rating: 4.5,
    reviewCount: 432,
    region: "Zimbabwe",
    description: "Historic theatre in the City of Kings, perfect for concerts and shows.",
  },
  {
    id: "venue-5",
    name: "Leopard Rock Hotel",
    venue_type: "outdoor_venue",
    city: "Mutare",
    country: "Zimbabwe",
    images: ["https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80"],
    capacity_standing: 500,
    capacity_seated: 350,
    daily_rate: 2000,
    rating: 4.7,
    reviewCount: 234,
    region: "Zimbabwe",
    description: "Stunning mountain resort venue in the Eastern Highlands.",
  },
  {
    id: "venue-6",
    name: "Elephant Hills Resort",
    venue_type: "conference_center",
    city: "Victoria Falls",
    country: "Zimbabwe",
    images: ["https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80"],
    capacity_standing: 600,
    capacity_seated: 450,
    daily_rate: 2200,
    rating: 4.6,
    reviewCount: 312,
    region: "Zimbabwe",
    description: "Golf resort with conference facilities overlooking the Zambezi.",
  },
  {
    id: "venue-7",
    name: "National Gallery of Zimbabwe",
    venue_type: "gallery",
    city: "Harare",
    country: "Zimbabwe",
    images: ["https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80"],
    capacity_standing: 300,
    capacity_seated: 150,
    daily_rate: 800,
    rating: 4.4,
    reviewCount: 89,
    region: "Zimbabwe",
    description: "Historic gallery space perfect for exhibitions and cultural events.",
  },
  {
    id: "venue-8",
    name: "Matopos Hills Lodge",
    venue_type: "outdoor_venue",
    city: "Matobo",
    country: "Zimbabwe",
    images: ["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80"],
    capacity_standing: 200,
    capacity_seated: 120,
    daily_rate: 1800,
    rating: 4.5,
    reviewCount: 98,
    region: "Zimbabwe",
    description: "Stunning outdoor venue set among the ancient Matopos Hills granite formations.",
  },
];

const VENUE_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  conference_center: { label: "Conference", emoji: "🏛️" },
  convention_center: { label: "Convention", emoji: "🎪" },
  ballroom: { label: "Ballroom", emoji: "💃" },
  rooftop: { label: "Rooftop", emoji: "🌆" },
  garden: { label: "Garden", emoji: "🌳" },
  gallery: { label: "Gallery", emoji: "🖼️" },
  restaurant: { label: "Restaurant", emoji: "🍽️" },
  hotel: { label: "Hotel", emoji: "🏨" },
};

interface FeaturedVenueCardsProps {
  limit?: number;
}

const FeaturedVenueCards = ({ limit }: FeaturedVenueCardsProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const { convertPrice } = useCurrency();

  const { data: dbVenues = [], isLoading } = useQuery({
    queryKey: ['featured-venues', limit],
    queryFn: () => getFeaturedVenues(limit || 10),
  });

  // Use database venues if available, otherwise fall back to mock data
  const venues = dbVenues.length > 0 ? dbVenues : mockVenues;
  
  const displayVenues = limit ? venues.slice(0, limit) : venues;
  const totalPages = Math.ceil(displayVenues.length / CARDS_PER_PAGE);
  
  const currentVenues = useMemo(() => {
    if (limit) return displayVenues;
    const start = currentPage * CARDS_PER_PAGE;
    return venues.slice(start, start + CARDS_PER_PAGE);
  }, [currentPage, limit, displayVenues, venues]);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${limit ? 'lg:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-4`}>
          {Array.from({ length: limit || 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              <Skeleton className="h-36 w-full" />
              <div className="p-3.5 space-y-2.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="w-full text-center py-12 bg-card rounded-2xl border border-border/50">
        <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No venues available yet</h3>
        <p className="text-sm text-muted-foreground">Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${limit ? 'lg:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-4`}>
        {currentVenues.map((venue: any) => {
          const price = venue.hourly_rate || venue.daily_rate || 0;
          const priceLabel = venue.hourly_rate ? '/hour' : '/day';
          const typeInfo = VENUE_TYPE_LABELS[venue.venue_type] || { label: venue.venue_type?.replace(/_/g, ' '), emoji: "🏛️" };
          
          return (
            <div
              key={venue.id}
              className="group relative bg-card rounded-2xl border border-border/50 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20 h-full flex flex-col"
              onClick={() => navigate(`/venues/${venue.id}`)}
            >
              {/* Image Section */}
              <div className="relative h-36 overflow-hidden">
                <ImageCarousel
                  images={venue.images || []}
                  fallback={
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background">
                      <Building2 className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  }
                  className="h-36"
                />
                
                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5">
                  {venue.trending && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 font-semibold shadow-lg">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  <Badge className="bg-background/90 text-[10px] px-2 py-0.5 shadow-md capitalize">
                    {typeInfo.emoji} {typeInfo.label}
                  </Badge>
                </div>

                {/* Rating */}
                {venue.rating && (
                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 shadow-md">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold">{venue.rating}</span>
                  </div>
                )}

                {/* Region Badge */}
                {venue.region && (
                  <div className="absolute bottom-2.5 left-2.5 z-10">
                    <Badge variant="outline" className="bg-background/90 text-[10px] px-2 py-0.5 shadow-md">
                      {venue.region}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-3.5 space-y-2.5 flex-1">
                <div>
                  <h3 className="font-semibold text-sm line-clamp-1">{venue.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>{venue.city}, {venue.country}</span>
                  </div>
                </div>

                {(venue.capacity_standing || venue.capacity_seated) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>Up to {(venue.capacity_standing || venue.capacity_seated).toLocaleString()} guests</span>
                  </div>
                )}

                {venue.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{venue.description}</p>
                )}
              </div>

              {/* Footer */}
              <div className="px-3.5 pb-3.5 flex items-center justify-between border-t border-border/30 pt-2.5 mt-auto">
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  {price > 0 ? (
                    <p className="text-base font-bold text-primary">
                      {convertPrice(price)}<span className="text-xs font-normal text-muted-foreground">{priceLabel}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Contact for price</p>
                  )}
                </div>
                <Button size="sm" className="h-8 text-xs rounded-full px-4 shadow-md">
                  Enquire
                </Button>
              </div>
            </div>
          );
        })}
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

export default FeaturedVenueCards;
