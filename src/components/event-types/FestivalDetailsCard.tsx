import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Music, Calendar, MapPin, Tent, Bus, Lock, 
  Utensils, Droplets, Zap, Shield, Sun, Moon 
} from "lucide-react";

interface FestivalDetailsCardProps {
  event: any;
}

const FestivalDetailsCard = ({ event }: FestivalDetailsCardProps) => {
  // Zimbabwe festival details
  const festivalDetails = {
    duration: "3 Days",
    dates: "Dec 27-29, 2026",
    gates: { open: "10:00 AM", close: "2:00 AM" },
    stages: [
      { name: "Main Stage", capacity: "30,000", genre: "Headliners" },
      { name: "Zambezi Tent", capacity: "10,000", genre: "Amapiano/DJ" },
      { name: "Mbira Garden", capacity: "3,000", genre: "Traditional/Acoustic" },
      { name: "Discovery Stage", capacity: "2,000", genre: "Emerging Artists" },
    ],
    headliners: [
      { name: "Main Act", day: "Friday", time: "10:00 PM" },
      { name: "Co-Headliner", day: "Saturday", time: "11:00 PM" },
      { name: "Closing Act", day: "Sunday", time: "9:00 PM" },
    ],
    campingOptions: [
      { type: "General Camping", description: "Bring your own tent, shared facilities", price: "$40" },
      { type: "Premium Camping", description: "Designated area, private showers", price: "$120" },
      { type: "Glamping", description: "Pre-pitched luxury tent, bedding included", price: "$300" },
      { type: "Caravan/Overlander", description: "Powered sites available", price: "$150" },
    ],
    facilities: [
      { icon: Droplets, name: "Water Stations", description: "Free refill points throughout" },
      { icon: Utensils, name: "Food Village", description: "30+ vendors incl. sadza, braai & vegan" },
      { icon: Lock, name: "Lockers", description: "Phone charging available" },
      { icon: Shield, name: "Medical Tents", description: "24/7 first aid" },
      { icon: Zap, name: "Charging Stations", description: "Free device charging" },
    ],
    shuttleServices: [
      { route: "Harare CBD", frequency: "Every 30 mins", price: "$10 return" },
      { route: "RGM Airport", frequency: "Every 2 hours", price: "$25 return" },
      { route: "Eastgate Mall", frequency: "Every hour", price: "$8 return" },
    ],
    ageRestrictions: {
      general: "All ages welcome",
      alcoholAreas: "18+ only",
      lateNight: "18+ after midnight",
    },
    whatToBring: [
      "Valid ID (required for alcohol)",
      "Sunscreen & hat",
      "Reusable water bottle",
      "Comfortable shoes",
      "Rain gear (rainy season!)",
      "Portable phone charger",
      "USD cash & EcoCash",
    ],
    prohibited: [
      "Glass containers",
      "Outside alcohol",
      "Professional cameras",
      "Drones",
      "Illegal substances",
      "Weapons of any kind",
    ],
  };

  return (
    <div className="space-y-6">
      {/* Festival Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Festival Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-semibold">{festivalDetails.duration}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Sun className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Gates Open</p>
              <p className="font-semibold">{festivalDetails.gates.open}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Moon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Gates Close</p>
              <p className="font-semibold">{festivalDetails.gates.close}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Music className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Stages</p>
              <p className="font-semibold">{festivalDetails.stages.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Festival Stages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {festivalDetails.stages.map((stage, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">{stage.name}</h4>
                  <Badge variant="outline">{stage.genre}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Capacity: {stage.capacity}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Headliners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Headliners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {festivalDetails.headliners.map((artist, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-lg">
                <div>
                  <h4 className="font-bold text-lg">{artist.name}</h4>
                  <p className="text-sm text-muted-foreground">{artist.day}</p>
                </div>
                <Badge className="bg-primary">{artist.time}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Camping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tent className="h-5 w-5 text-primary" />
            Camping Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {festivalDetails.campingOptions.map((option, index) => (
              <div key={index} className="p-4 border rounded-lg hover:border-primary transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">{option.type}</h4>
                  <Badge variant="secondary">{option.price}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Facilities */}
      <Card>
        <CardHeader>
          <CardTitle>Festival Facilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {festivalDetails.facilities.map((facility, index) => (
              <div key={index} className="text-center p-4 bg-muted rounded-lg">
                <facility.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium text-sm">{facility.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{facility.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shuttle Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5 text-primary" />
            Shuttle Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {festivalDetails.shuttleServices.map((shuttle, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{shuttle.route}</p>
                  <p className="text-sm text-muted-foreground">{shuttle.frequency}</p>
                </div>
                <Badge variant="outline">{shuttle.price}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What to Bring / Prohibited */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 dark:text-green-400">✓ What to Bring</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {festivalDetails.whatToBring.map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">✕ Prohibited Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {festivalDetails.prohibited.map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Age Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle>Age Restrictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="font-medium text-green-600 dark:text-green-400">General Areas</p>
              <p className="text-sm">{festivalDetails.ageRestrictions.general}</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="font-medium text-amber-600 dark:text-amber-400">Alcohol Areas</p>
              <p className="text-sm">{festivalDetails.ageRestrictions.alcoholAreas}</p>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="font-medium text-purple-600 dark:text-purple-400">Late Night</p>
              <p className="text-sm">{festivalDetails.ageRestrictions.lateNight}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FestivalDetailsCard;
