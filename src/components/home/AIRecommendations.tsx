import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, MapPin, Star, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Recommendation {
  id?: string;
  vertical: string;
  title: string;
  reason: string;
  matchScore: number;
  image?: string;
  price?: number;
  location?: string;
}

const VERTICAL_COLORS: Record<string, string> = {
  event: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  experience: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  stay: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  venue: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  bus: "bg-primary/10 text-primary",
};

const VERTICAL_LABELS: Record<string, string> = {
  event: "🎫 Event",
  experience: "🧗 Experience",
  stay: "🏨 Stay",
  venue: "🏛️ Venue",
  bus: "🚌 Bus",
};

export const AIRecommendations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      setError(false);
      try {
        const { data, error: fnError } = await supabase.functions.invoke('smart-recommendations', {
          body: { userId: user.id },
        });

        if (fnError) throw fnError;
        if (data?.recommendations) {
          setRecommendations(data.recommendations.slice(0, 6));
        }
      } catch (err) {
        console.error('Recommendations error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user?.id]);

  const handleClick = (rec: Recommendation) => {
    const routes: Record<string, string> = {
      event: `/events/${rec.id || ''}`,
      experience: `/experiences/${rec.id || ''}`,
      stay: `/stays/${rec.id || ''}`,
      venue: `/venues/${rec.id || ''}`,
      bus: '/buses',
    };
    const route = routes[rec.vertical] || '/';
    navigate(route);
  };

  if (!user || error) return null;

  if (loading) {
    return (
      <section className="px-4 py-2">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Recommended for You</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="min-w-[240px] h-[160px] rounded-xl shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="px-4 py-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Recommended for You</h3>
        </div>
        <span className="text-xs text-muted-foreground">AI-powered</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {recommendations.map((rec, index) => (
          <Card
            key={`${rec.vertical}-${index}`}
            className="min-w-[240px] shrink-0 cursor-pointer hover:shadow-md transition-shadow border-border/50 overflow-hidden"
            onClick={() => handleClick(rec)}
          >
            {rec.image && (
              <div className="h-24 w-full overflow-hidden">
                <img
                  src={rec.image}
                  alt={rec.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <CardContent className={`p-3 ${rec.image ? '' : 'pt-3'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${VERTICAL_COLORS[rec.vertical] || ''}`}>
                  {VERTICAL_LABELS[rec.vertical] || rec.vertical}
                </Badge>
                {rec.matchScore >= 80 && (
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <h4 className="font-medium text-sm line-clamp-1">{rec.title}</h4>
              {rec.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {rec.location}
                </p>
              )}
              <p className="text-xs text-primary/80 mt-1 line-clamp-1 italic">{rec.reason}</p>
              <div className="flex items-center justify-between mt-2">
                {rec.price && (
                  <span className="text-sm font-semibold text-primary">
                    {convertPrice(rec.price)}
                  </span>
                )}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
