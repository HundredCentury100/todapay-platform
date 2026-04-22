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
      { name: "Nando's Borrowdale", type: "Restaurant", distance: "200m", emoji: "🍗" },
      { name: "Sam Levy's Village", type: "Shopping", distance: "1.5 km", emoji: "🛍️" },
      { name: "Arundel Village Mall", type: "Shopping", distance: "2 km", emoji: "🏬" },
      { name: "RGM International Airport", type: "Airport", distance: "18 km", emoji: "✈️" },
      { name: "Harare Gardens", type: "Park", distance: "3 km", emoji: "🌿" },
      { name: "Total Energies Station", type: "Parking", distance: "100m", emoji: "🅿️" },
    ];
  }
  if (cityLower.includes("bulawayo")) {
    return [
      { name: "Bulawayo Centre", type: "Shopping", distance: "1 km", emoji: "🛍️" },
      { name: "Ascot Shopping Centre", type: "Shopping", distance: "3 km", emoji: "🏬" },
      { name: "National Art Gallery", type: "Culture", distance: "2 km", emoji: "🖼️" },
      { name: "Joshua Mqabuko Airport", type: "Airport", distance: "22 km", emoji: "✈️" },
    ];
  }
  if (cityLower.includes("victoria falls") || cityLower.includes("vic falls")) {
    return [
      { name: "Victoria Falls Airport", type: "Airport", distance: "20 km", emoji: "✈️" },
      { name: "Shearwater Café", type: "Café", distance: "500m", emoji: "☕" },
      { name: "Victoria Falls Craft Village", type: "Shopping", distance: "1 km", emoji: "🎨" },
    ];
  }
  return [
    { name: "City Centre", type: "Area", distance: "2 km", emoji: "🏙️" },
    { name: "Nearest Café", type: "Café", distance: "200m", emoji: "☕" },
    { name: "Parking Lot", type: "Parking", distance: "100m", emoji: "🅿️" },
  ];
};

interface WorkspaceNearbyAttractionsProps {
  city: string;
}

const WorkspaceNearbyAttractions = ({ city }: WorkspaceNearbyAttractionsProps) => {
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

export default WorkspaceNearbyAttractions;
