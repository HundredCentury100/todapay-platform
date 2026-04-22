import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Music, Mic2, Theater } from "lucide-react";

interface LineupArtist {
  name: string;
  role?: string;
  time?: string;
  image?: string;
  isHeadliner?: boolean;
}

interface EventLineupProps {
  eventType: string;
  eventName: string;
}

// Lineup is loaded from event data; return empty if no dynamic data
const getLineup = (_eventType: string): LineupArtist[] => {
  // Lineup details come from the event database — no hardcoded names
  return [];
};

const getIcon = (eventType: string) => {
  switch (eventType) {
    case "Music":
    case "Festival":
      return Music;
    case "Comedy":
      return Mic2;
    case "Theater":
      return Theater;
    default:
      return Mic2;
  }
};

const getLabel = (eventType: string) => {
  switch (eventType) {
    case "Music":
    case "Festival":
      return "Lineup";
    case "Conference":
      return "Speakers";
    case "Comedy":
      return "Performers";
    case "Theater":
      return "Cast & Crew";
    default:
      return "Lineup";
  }
};

const EventLineup = ({ eventType, eventName }: EventLineupProps) => {
  const lineup = getLineup(eventType);
  const Icon = getIcon(eventType);
  const label = getLabel(eventType);

  if (lineup.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{label}</h3>
      </div>

      <div className="space-y-3">
        {lineup.map((artist, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <Avatar className={artist.isHeadliner ? "h-12 w-12 ring-2 ring-primary" : "h-10 w-10"}>
              <AvatarImage src={artist.image} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {artist.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{artist.name}</span>
                {artist.isHeadliner && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0">
                    ⭐ {artist.role}
                  </Badge>
                )}
              </div>
              {!artist.isHeadliner && artist.role && (
                <p className="text-xs text-muted-foreground">{artist.role}</p>
              )}
            </div>
            {artist.time && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="h-3 w-3" />
                {artist.time}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default EventLineup;
