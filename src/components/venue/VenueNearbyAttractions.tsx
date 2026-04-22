import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface NearbyItem {
  name: string;
  type: string;
  distance: string;
  emoji: string;
}

const getNearbyForCity = (city: string): NearbyItem[] => {
  const cityLower = city.toLowerCase();
  if (cityLower.includes("harare")) {
    return [
      { name: "RGM International Airport", type: "Airport", distance: "18 km", emoji: "✈️" },
      { name: "Sam Levy's Village", type: "Shopping", distance: "5 km", emoji: "🛍️" },
      { name: "Harare Gardens", type: "Park", distance: "2 km", emoji: "🌿" },
      { name: "Borrowdale Village", type: "Shopping", distance: "8 km", emoji: "🏬" },
      { name: "Meikles Hotel", type: "Hotel", distance: "1 km", emoji: "🏨" },
      { name: "National Gallery", type: "Culture", distance: "1.5 km", emoji: "🖼️" },
    ];
  }
  if (cityLower.includes("bulawayo")) {
    return [
      { name: "Joshua Mqabuko Airport", type: "Airport", distance: "22 km", emoji: "✈️" },
      { name: "Matopos National Park", type: "Nature", distance: "35 km", emoji: "🏞️" },
      { name: "Bulawayo Railway Museum", type: "Culture", distance: "3 km", emoji: "🚂" },
      { name: "Ascot Shopping Centre", type: "Shopping", distance: "4 km", emoji: "🛍️" },
    ];
  }
  if (cityLower.includes("victoria falls") || cityLower.includes("vic falls")) {
    return [
      { name: "Victoria Falls Airport", type: "Airport", distance: "20 km", emoji: "✈️" },
      { name: "Victoria Falls (Mosi-oa-Tunya)", type: "Landmark", distance: "2 km", emoji: "🌊" },
      { name: "Victoria Falls Bridge", type: "Landmark", distance: "3 km", emoji: "🌉" },
      { name: "Elephant Hills Resort", type: "Hotel", distance: "4 km", emoji: "🏨" },
    ];
  }
  return [
    { name: "City Centre", type: "Area", distance: "2 km", emoji: "🏙️" },
    { name: "Nearest Airport", type: "Airport", distance: "20 km", emoji: "✈️" },
    { name: "Shopping Centre", type: "Shopping", distance: "3 km", emoji: "🛍️" },
  ];
};

interface VenueNearbyAttractionsProps {
  city: string;
}

const VenueNearbyAttractions = ({ city }: VenueNearbyAttractionsProps) => {
  const nearby = getNearbyForCity(city);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" /> What's Nearby
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {nearby.map((item) => (
          <Card key={item.name} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <span className="text-xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.type}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{item.distance}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VenueNearbyAttractions;
