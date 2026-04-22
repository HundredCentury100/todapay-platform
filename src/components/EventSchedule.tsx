import { Clock, MapPin, User, Music, Mic } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ScheduleItem {
  time: string;
  title: string;
  description?: string;
  speaker?: {
    name: string;
    role: string;
    image?: string;
  };
  location?: string;
  type?: "performance" | "break" | "session" | "networking";
}

interface EventScheduleProps {
  eventDate: string;
  schedule?: ScheduleItem[];
}

// Generate mock schedule based on event type
const generateMockSchedule = (eventDate: string): ScheduleItem[] => {
  return [
    {
      time: "14:00",
      title: "Gates Open",
      description: "Doors open for general admission. Early entry for VIP ticket holders.",
      type: "session",
      location: "Main Entrance",
    },
    {
      time: "15:00",
      title: "Opening Act",
      description: "Local talent showcase to kick off the event.",
      type: "performance",
      speaker: {
        name: "DJ Fresh",
        role: "Opening DJ Set",
        image: "",
      },
    },
    {
      time: "16:30",
      title: "Intermission",
      description: "Food and beverages available. Visit merchandise stalls.",
      type: "break",
      location: "Food Court Area",
    },
    {
      time: "17:00",
      title: "Main Event",
      description: "The headline performance you've been waiting for!",
      type: "performance",
      speaker: {
        name: "Headliner",
        role: "Main Performance",
        image: "",
      },
    },
    {
      time: "20:00",
      title: "Meet & Greet",
      description: "VIP ticket holders can meet the performers.",
      type: "networking",
      location: "VIP Lounge",
    },
    {
      time: "21:00",
      title: "Event Closes",
      description: "Thank you for attending! Safe travels home.",
      type: "session",
    },
  ];
};

const getTypeIcon = (type?: string) => {
  switch (type) {
    case "performance":
      return <Music className="h-4 w-4" />;
    case "break":
      return <Clock className="h-4 w-4" />;
    case "networking":
      return <User className="h-4 w-4" />;
    default:
      return <Mic className="h-4 w-4" />;
  }
};

const getTypeBadgeColor = (type?: string) => {
  switch (type) {
    case "performance":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "break":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    case "networking":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    default:
      return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  }
};

const EventSchedule = ({ eventDate, schedule }: EventScheduleProps) => {
  const scheduleItems = schedule || generateMockSchedule(eventDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Event Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[47px] top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {scheduleItems.map((item, index) => (
              <div key={index} className="relative flex gap-4">
                {/* Time */}
                <div className="w-12 text-right">
                  <span className="text-sm font-medium text-muted-foreground">{item.time}</span>
                </div>

                {/* Timeline dot */}
                <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {getTypeIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    {item.type && (
                      <Badge variant="outline" className={getTypeBadgeColor(item.type)}>
                        {item.type}
                      </Badge>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  )}

                  {item.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </div>
                  )}

                  {item.speaker && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={item.speaker.image} />
                        <AvatarFallback className="text-xs">
                          {item.speaker.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{item.speaker.name}</p>
                        <p className="text-xs text-muted-foreground">{item.speaker.role}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventSchedule;
