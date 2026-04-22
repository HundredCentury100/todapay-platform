import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Ticket, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ImageCarousel } from "@/components/ImageCarousel";
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";

const CARDS_PER_PAGE = 10;

interface FeaturedEventCardsProps {
  limit?: number;
}

const getCategoryEmoji = (type: string) => {
  const emojis: Record<string, string> = {
    'Music': '🎵',
    'Sports': '⚽',
    'Cultural': '🎭',
    'Conference': '💼',
    'Comedy': '😂',
  };
  return emojis[type] || '🎉';
};

const FeaturedEventCards = ({ limit }: FeaturedEventCardsProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const { convertPrice } = useCurrency();

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['featured-events'],
    queryFn: () => getEvents(),
  });

  const events = eventsData?.data || [];
  
  const displayEvents = limit ? events.slice(0, limit) : events;
  const totalPages = Math.ceil(displayEvents.length / CARDS_PER_PAGE);
  
  const currentEvents = useMemo(() => {
    if (limit) return displayEvents;
    const start = currentPage * CARDS_PER_PAGE;
    return events.slice(start, start + CARDS_PER_PAGE);
  }, [currentPage, limit, displayEvents, events]);

  const getMinPrice = (event: any) => {
    if (event.event_ticket_tiers && event.event_ticket_tiers.length > 0) {
      return Math.min(...event.event_ticket_tiers.map((tier: any) => tier.price));
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className={`grid grid-cols-2 ${limit ? 'lg:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-3`}>
          {Array.from({ length: limit || 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <div className="p-3 space-y-2">
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

  if (events.length === 0) {
    return (
      <div className="w-full text-center py-12">
        <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No events available at the moment</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className={`grid grid-cols-2 ${limit ? 'lg:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-3`}>
        {currentEvents.map((event: any) => {
          const minPrice = getMinPrice(event);
          const isFree = minPrice === 0;
          const totalAvailable = event.event_ticket_tiers?.reduce((sum: number, tier: any) => sum + tier.available_tickets, 0) || 0;
          const eventDate = new Date(event.event_date);
          const isLowStock = totalAvailable > 0 && totalAvailable < 20;
          
          return (
            <div
              key={event.id}
              className="group relative bg-card rounded-xl border border-border/50 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/20 active:scale-[0.98]"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              {/* Image Section */}
              <div className="relative h-28 sm:h-32 overflow-hidden">
                {event.images?.length > 0 || event.image ? (
                  <ImageCarousel
                    images={event.images || (event.image ? [event.image] : [])}
                    fallback={
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <span className="text-3xl">{getCategoryEmoji(event.type)}</span>
                      </div>
                    }
                    className="h-28 sm:h-32"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <span className="text-3xl">{getCategoryEmoji(event.type)}</span>
                  </div>
                )}
                
                {/* Date chip overlay */}
                <div className="absolute top-2 left-2 z-10">
                  <div className="bg-background/90 rounded-lg px-1.5 py-0.5 text-center shadow-sm">
                    <p className="text-[9px] font-bold text-primary uppercase leading-tight">
                      {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-sm font-black leading-tight">{eventDate.getDate()}</p>
                  </div>
                </div>

                {/* Status badges */}
                <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                  {isFree && (
                    <Badge className="bg-green-500/90 text-white text-[9px] px-1.5 py-0 font-bold rounded-full h-4">
                      FREE
                    </Badge>
                  )}
                  {isLowStock && (
                    <Badge className="bg-orange-500/90 text-white text-[9px] px-1.5 py-0 font-medium rounded-full h-4">
                      Few Left
                    </Badge>
                  )}
                </div>

                {/* Type badge bottom */}
                <div className="absolute bottom-2 left-2 z-10">
                  <Badge variant="secondary" className="bg-background/80 text-[9px] px-1.5 py-0 h-4 rounded-full">
                    {getCategoryEmoji(event.type)} {event.type}
                  </Badge>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-2.5 space-y-1.5">
                <h3 className="font-semibold text-xs line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {event.name}
                </h3>

                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>

                {totalAvailable > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Ticket className="w-2.5 h-2.5 shrink-0" />
                    <span>{totalAvailable} left</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-2.5 pb-2.5 flex items-center justify-between pt-1.5 border-t border-border/30">
                <div>
                  <p className="text-[9px] text-muted-foreground">From</p>
                  {isFree ? (
                    <p className="text-sm font-bold text-green-600">FREE</p>
                  ) : (
                    <p className="text-sm font-bold text-primary">{convertPrice(minPrice)}</p>
                  )}
                </div>
                <Button size="sm" className="h-7 text-[10px] rounded-full px-3 gap-0.5">
                  Tickets
                  <ArrowRight className="w-3 h-3" />
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

export default FeaturedEventCards;
