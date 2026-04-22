import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar, MapPin } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getEvents } from "@/services/eventService";

interface SimilarEventsProps {
  currentEventId: string;
  eventType: string;
  location: string;
}

const SimilarEvents = ({ currentEventId, eventType, location }: SimilarEventsProps) => {
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [similarEvents, setSimilarEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchSimilar = async () => {
      const { data } = await getEvents({ type: eventType });
      if (data) {
        const filtered = data
          .filter((e: any) => e.id !== currentEventId)
          .slice(0, 8);
        setSimilarEvents(filtered);
      }
    };
    fetchSimilar();
  }, [currentEventId, eventType]);

  if (similarEvents.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg px-1">Similar Events</h3>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {similarEvents.map((event) => {
            const minPrice = event.event_ticket_tiers?.length
              ? Math.min(...event.event_ticket_tiers.map((t: any) => t.price))
              : 0;
            const eventDate = new Date(event.event_date);

            return (
              <Card
                key={event.id}
                className="shrink-0 w-[200px] overflow-hidden cursor-pointer press-effect group"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div className="relative h-28 overflow-hidden">
                  <img
                    src={event.image || event.images?.[0] || "/placeholder.svg"}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2">
                    <div className="bg-background/90 rounded-lg px-1.5 py-0.5 text-center shadow-sm">
                      <p className="text-[9px] font-bold text-primary uppercase leading-tight">
                        {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-sm font-black leading-tight">{eventDate.getDate()}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2.5 space-y-1">
                  <h4 className="text-xs font-semibold line-clamp-2 leading-snug">{event.name}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                  <p className="text-sm font-bold text-primary">
                    {minPrice === 0 ? "FREE" : `From ${convertPrice(minPrice)}`}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default SimilarEvents;
