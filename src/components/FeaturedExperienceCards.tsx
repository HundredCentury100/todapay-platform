import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Compass, MapPin, Clock, Users, Star, TrendingUp, Mountain } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ImageCarousel } from "@/components/ImageCarousel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const EXPERIENCE_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  tour: { label: "Tour", emoji: "🗺️" },
  adventure: { label: "Adventure", emoji: "🧗" },
  food_drink: { label: "Food & Drink", emoji: "🍽️" },
  wellness: { label: "Wellness", emoji: "🧘" },
  cultural: { label: "Cultural", emoji: "🏛️" },
  nature: { label: "Nature", emoji: "🌿" },
  water_sports: { label: "Water Sports", emoji: "🏄" },
  aerial: { label: "Aerial", emoji: "🪂" },
  workshop: { label: "Workshop", emoji: "🎨" },
  nightlife: { label: "Nightlife", emoji: "🎶" },
  photography: { label: "Photography", emoji: "📸" },
  volunteer: { label: "Volunteer", emoji: "🤝" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  moderate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  challenging: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  expert: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  extreme: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

interface FeaturedExperienceCardsProps {
  limit?: number;
  city?: string;
}

const FeaturedExperienceCards = ({ limit = 8, city }: FeaturedExperienceCardsProps) => {
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['featured-experiences', limit, city],
    queryFn: async () => {
      let query = supabase
        .from('experiences')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (city) {
        query = query.eq('city', city);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${limit <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-4`}>
        {Array.from({ length: limit }).map((_, i) => (
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

  if (experiences.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
        <Compass className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No experiences available yet</h3>
        <p className="text-sm text-muted-foreground">Check back soon for tours and activities!</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${limit <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-4`}>
      {experiences.map((exp: any) => {
        const typeInfo = EXPERIENCE_TYPE_LABELS[exp.experience_type] || { label: exp.experience_type, emoji: "🎯" };
        const images = Array.isArray(exp.images) ? exp.images : [];
        const difficultyClass = DIFFICULTY_COLORS[exp.difficulty_level] || "";

        return (
          <div
            key={exp.id}
            className="group relative bg-card rounded-2xl border border-border/50 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20 h-full flex flex-col"
            onClick={() => navigate(`/experiences/${exp.id}`)}
          >
            {/* Image */}
            <div className="relative h-36 overflow-hidden">
              <ImageCarousel
                images={images}
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background">
                    <Compass className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                }
                className="h-36"
              />

              <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5">
                <Badge className="bg-background/90 text-[10px] px-2 py-0.5 shadow-md">
                  {typeInfo.emoji} {typeInfo.label}
                </Badge>
              </div>

              {exp.difficulty_level && (
                <div className="absolute top-2.5 right-2.5 z-10">
                  <Badge className={`text-[10px] px-2 py-0.5 shadow-md capitalize ${difficultyClass}`}>
                    <Mountain className="w-3 h-3 mr-0.5" />
                    {exp.difficulty_level}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-3.5 space-y-2.5 flex-1">
              <div>
                <h3 className="font-semibold text-sm line-clamp-1">{exp.name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{exp.city}, {exp.country}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{exp.duration_hours}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>Max {exp.max_participants}</span>
                </div>
              </div>

              {exp.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{exp.description}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-3.5 pb-3.5 flex items-center justify-between border-t border-border/30 pt-2.5 mt-auto">
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="text-base font-bold text-primary">
                  {convertPrice(exp.price_per_person)}
                  <span className="text-xs font-normal text-muted-foreground">/person</span>
                </p>
              </div>
              <Button size="sm" className="h-8 text-xs rounded-full px-4 shadow-md">
                Book Now
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeaturedExperienceCards;
