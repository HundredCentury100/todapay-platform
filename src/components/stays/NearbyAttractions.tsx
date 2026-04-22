import { MapPin, Plane, UtensilsCrossed, ShoppingBag, Landmark, TreePine } from "lucide-react";

interface NearbyAttractionsProps {
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

// Zimbabwe-specific landmarks by city
const CITY_ATTRACTIONS: Record<string, { icon: typeof Plane; label: string; name: string; distance: string }[]> = {
  "Harare": [
    { icon: Plane, label: "Airport", name: "Robert Gabriel Mugabe International Airport", distance: "15 km" },
    { icon: UtensilsCrossed, label: "Dining", name: "Sam Levy's Village Restaurants", distance: "8.5 km" },
    { icon: ShoppingBag, label: "Shopping", name: "Eastgate Mall", distance: "2.1 km" },
    { icon: Landmark, label: "Attraction", name: "National Gallery of Zimbabwe", distance: "0.8 km" },
    { icon: TreePine, label: "Nature", name: "Mukuvisi Woodlands", distance: "5.2 km" },
  ],
  "Bulawayo": [
    { icon: Plane, label: "Airport", name: "Joshua Mqabuko Nkomo International Airport", distance: "22 km" },
    { icon: UtensilsCrossed, label: "Dining", name: "Bulawayo Centre Restaurants", distance: "1.5 km" },
    { icon: ShoppingBag, label: "Shopping", name: "Ascot Shopping Centre", distance: "3.8 km" },
    { icon: Landmark, label: "Attraction", name: "Natural History Museum", distance: "1.2 km" },
    { icon: TreePine, label: "Nature", name: "Matobo National Park", distance: "35 km" },
  ],
  "Victoria Falls": [
    { icon: Plane, label: "Airport", name: "Victoria Falls Airport", distance: "18 km" },
    { icon: UtensilsCrossed, label: "Dining", name: "The Lookout Café", distance: "2.5 km" },
    { icon: ShoppingBag, label: "Shopping", name: "Elephant's Walk Shopping Village", distance: "1.8 km" },
    { icon: Landmark, label: "Attraction", name: "Victoria Falls Rainforest", distance: "0.5 km" },
    { icon: TreePine, label: "Nature", name: "Zambezi National Park", distance: "6 km" },
  ],
};

const DEFAULT_ATTRACTIONS = [
  { icon: Plane, label: "Airport", name: "Nearest Airport", distance: "20 km" },
  { icon: UtensilsCrossed, label: "Restaurants", name: "Local restaurants nearby", distance: "1.5 km" },
  { icon: ShoppingBag, label: "Shopping", name: "Shopping centre", distance: "3 km" },
  { icon: Landmark, label: "Attractions", name: "City centre", distance: "2 km" },
  { icon: TreePine, label: "Nature", name: "Parks & nature reserves", distance: "8 km" },
];

export const NearbyAttractions = ({ city }: NearbyAttractionsProps) => {
  const attractions = CITY_ATTRACTIONS[city] || DEFAULT_ATTRACTIONS;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">What's Nearby</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attractions.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.label}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.distance} away</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
