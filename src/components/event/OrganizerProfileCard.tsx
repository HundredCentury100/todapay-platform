import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Star, Calendar, ExternalLink, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMerchantByOrganizerName } from "@/services/organizerService";

interface OrganizerProfileCardProps {
  organizerName: string;
}

export const OrganizerProfileCard = ({ organizerName }: OrganizerProfileCardProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [eventCount, setEventCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: merchant } = await getMerchantByOrganizerName(organizerName);
        if (merchant) setProfile(merchant);

        // Get event count and avg rating
        const { data: events } = await supabase
          .from('events')
          .select('id')
          .eq('organizer', organizerName);

        setEventCount(events?.length || 0);

        if (events && events.length > 0) {
          const eventIds = events.map(e => e.id);
          const { data: reviews } = await supabase
            .from('event_reviews')
            .select('rating')
            .in('event_id', eventIds);

          if (reviews && reviews.length > 0) {
            setAvgRating(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length);
          }
        }
      } catch (e) {
        console.error('Error loading organizer profile:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [organizerName]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">Organized by</h3>
            <Badge variant="secondary" className="gap-1 text-xs">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </Badge>
          </div>
          <p className="font-bold text-base">
            {profile?.business_name || organizerName}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{eventCount} events</span>
            </div>
            {avgRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{avgRating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => navigate(`/events?organizer=${encodeURIComponent(organizerName)}`)}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          All Events
        </Button>
      </div>
    </Card>
  );
};
