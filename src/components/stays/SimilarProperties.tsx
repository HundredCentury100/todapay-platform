import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Property, PropertyType, PropertyPolicies, RoomType, BedConfiguration } from "@/types/stay";

interface SimilarPropertiesProps {
  currentPropertyId: string;
  city: string;
  propertyType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

export const SimilarProperties = ({
  currentPropertyId,
  city,
  propertyType,
  checkIn,
  checkOut,
  guests,
  rooms,
}: SimilarPropertiesProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [scrollPos, setScrollPos] = useState(0);
  const { convertPrice } = useCurrency();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("properties")
        .select("*, rooms(*)")
        .eq("status", "active")
        .neq("id", currentPropertyId)
        .or(`city.ilike.%${city}%,property_type.eq.${propertyType}`)
        .limit(10);

      if (data) {
        setProperties(
          data.map((p: any) => ({
            ...p,
            property_type: p.property_type as PropertyType,
            amenities: (p.amenities || []) as string[],
            policies: (p.policies || {}) as unknown as PropertyPolicies,
            images: (p.images || []) as string[],
            rooms: (p.rooms || []).map((r: any) => ({
              ...r,
              room_type: r.room_type as RoomType,
              amenities: (r.amenities || []) as string[],
              images: (r.images || []) as string[],
              bed_configuration: (r.bed_configuration || {}) as BedConfiguration,
            })),
          }))
        );
      }
    };
    fetch();
  }, [currentPropertyId, city, propertyType]);

  if (properties.length === 0) return null;

  const searchQuery = new URLSearchParams({ checkIn, checkOut, guests: guests.toString(), rooms: rooms.toString() }).toString();

  const scroll = (dir: number) => {
    const el = document.getElementById("similar-properties-scroll");
    if (el) {
      const newPos = el.scrollLeft + dir * 300;
      el.scrollTo({ left: newPos, behavior: "smooth" });
      setScrollPos(newPos);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Similar Properties</h3>
        <div className="hidden md:flex gap-1">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => scroll(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => scroll(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div id="similar-properties-scroll" className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
        {properties.map((property) => {
          const minPrice = property.rooms && property.rooms.length > 0
            ? Math.min(...property.rooms.map((r) => r.base_price))
            : property.min_price || 0;

          return (
            <Link
              key={property.id}
              to={`/stays/${property.id}?${searchQuery}`}
              className="snap-start shrink-0 w-[260px]"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all group press-effect h-full">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={property.images?.[0] || "/placeholder.svg"}
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <Badge className="absolute top-2 left-2 bg-background/90 text-foreground rounded-full capitalize text-xs">
                    {property.property_type.replace("_", " ")}
                  </Badge>
                  {property.star_rating && property.star_rating >= 4 && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5">
                      {Array.from({ length: property.star_rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <h4 className="font-semibold text-sm line-clamp-1">{property.name}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {property.city}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-primary">{convertPrice(minPrice)}<span className="text-xs font-normal text-muted-foreground">/night</span></span>
                    {property.review_score && property.review_score > 0 && (
                      <span className="text-xs flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {property.review_score.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
