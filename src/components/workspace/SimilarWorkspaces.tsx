import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MapPin, Users } from "lucide-react";
import { getWorkspaces, WorkspaceData } from "@/services/workspaceService";
import { useCurrency } from "@/contexts/CurrencyContext";

const WORKSPACE_TYPE_LABELS: Record<string, string> = {
  hot_desk: "Hot Desk",
  dedicated_desk: "Dedicated Desk",
  private_office: "Private Office",
  meeting_room: "Meeting Room",
  conference_room: "Conference Room",
  virtual_office: "Virtual Office",
  event_space: "Event Space",
  podcast_studio: "Podcast Studio",
  photo_studio: "Photo Studio",
};

interface SimilarWorkspacesProps {
  currentWorkspaceId: string;
  city: string;
  workspaceType: string;
}

const SimilarWorkspaces = ({ currentWorkspaceId, city }: SimilarWorkspacesProps) => {
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getWorkspaces({ city });
        setWorkspaces(data.filter((w) => w.id !== currentWorkspaceId).slice(0, 8));
      } catch {
        // silent
      }
    };
    fetch();
  }, [currentWorkspaceId, city]);

  if (workspaces.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">You May Also Like</h3>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {workspaces.map((w) => {
            const lowestRate = Math.min(
              w.hourly_rate || Infinity,
              w.daily_rate || Infinity
            );
            return (
              <Card
                key={w.id}
                className="shrink-0 w-60 cursor-pointer overflow-hidden hover:shadow-md transition-shadow press-effect"
                onClick={() => navigate(`/workspaces/${w.id}`)}
              >
                <div className="h-32 overflow-hidden relative">
                  {w.images?.[0] ? (
                    <img src={w.images[0]} alt={w.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-3xl">🖥️</div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-background/90 text-foreground text-xs">
                    {WORKSPACE_TYPE_LABELS[w.workspace_type] || w.workspace_type}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{w.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{w.city}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> Up to {w.capacity}
                    </span>
                    {lowestRate !== Infinity && (
                      <span className="text-sm font-bold text-primary">
                        {convertPrice(lowestRate)}/hr
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

export default SimilarWorkspaces;
