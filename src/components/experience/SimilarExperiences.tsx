import { Link } from "react-router-dom";
import { Star, Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useExperiences } from "@/hooks/useExperiences";
import { ExperienceType } from "@/types/experience";

interface SimilarExperiencesProps {
  currentId: string;
  city: string;
  experienceType: ExperienceType;
}

const SimilarExperiences = ({ currentId, city, experienceType }: SimilarExperiencesProps) => {
  const { convertPrice } = useCurrency();
  const { data: experiences = [] } = useExperiences({
    experienceType: [experienceType],
  });

  const similar = experiences.filter(e => e.id !== currentId).slice(0, 6);

  if (similar.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Similar Experiences</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {similar.map((exp) => (
          <Link key={exp.id} to={`/experiences/${exp.id}`} className="shrink-0 w-[200px]">
            <Card className="overflow-hidden rounded-xl border-border/50 press-effect">
              <div className="relative h-28">
                <img
                  src={exp.images?.[0] || "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400"}
                  alt={exp.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-background/90 rounded-md px-1.5 py-0.5">
                  <span className="text-xs font-bold text-primary">{convertPrice(exp.price_per_person)}</span>
                </div>
              </div>
              <div className="p-2.5 space-y-1">
                <h4 className="text-sm font-medium line-clamp-2 leading-tight">{exp.name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" /> {exp.duration_hours}h
                  </span>
                  {exp.review_score && (
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {exp.review_score.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SimilarExperiences;
