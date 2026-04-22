import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MapPin, Users } from "lucide-react";
import { getVenues, VenueWithMerchant } from "@/services/venueService";

interface SimilarVenuesProps {
  currentVenueId: string;
  city: string;
  venueType: string;
}

const SimilarVenues = ({ currentVenueId, city, venueType }: SimilarVenuesProps) => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<VenueWithMerchant[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getVenues({ city, date: "" });
        setVenues(data.filter((v) => v.id !== currentVenueId).slice(0, 8));
      } catch {
        // silent
      }
    };
    fetch();
  }, [currentVenueId, city]);

  if (venues.length === 0) return null;

  const formatType = (t: string) =>
    t.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">You May Also Like</h3>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {venues.map((v) => {
            const images = v.images as string[];
            const capacity = v.capacity_standing || v.capacity_seated || 0;
            return (
              <Card
                key={v.id}
                className="shrink-0 w-60 cursor-pointer overflow-hidden hover:shadow-md transition-shadow press-effect"
                onClick={() => navigate(`/venues/${v.id}`)}
              >
                <div className="h-32 overflow-hidden relative">
                  {images.length > 0 ? (
                    <img src={images[0]} alt={v.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-3xl">🏛️</div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-background/90 text-foreground text-xs">
                    {formatType(v.venue_type)}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{v.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{v.city}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {capacity > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> Up to {capacity}
                      </span>
                    )}
                    {v.hourly_rate && (
                      <span className="text-sm font-bold text-primary">
                        ${v.hourly_rate.toLocaleString()}/hr
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default SimilarVenues;
