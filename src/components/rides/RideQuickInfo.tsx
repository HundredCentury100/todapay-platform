import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Car, Clock, MapPin, Shield, Share2, 
  AlertTriangle, Star, Navigation 
} from "lucide-react";
import { useEffect, useState } from "react";

interface RideQuickInfoProps {
  userLocation?: { lat: number; lng: number };
  onQuickDestination?: (destination: string) => void;
}

const QUICK_DESTINATIONS = [
  { name: "Airport", icon: "✈️" },
  { name: "City Center", icon: "🏙️" },
  { name: "Shopping Mall", icon: "🛒" },
  { name: "Hospital", icon: "🏥" },
];

export const RideQuickInfo = ({ userLocation, onQuickDestination }: RideQuickInfoProps) => {
  const [nearbyDrivers, setNearbyDrivers] = useState(Math.floor(Math.random() * 15) + 5);
  const [avgWaitTime, setAvgWaitTime] = useState(Math.floor(Math.random() * 5) + 2);

  useEffect(() => {
    // Simulate real-time driver count updates
    const interval = setInterval(() => {
      setNearbyDrivers(prev => Math.max(3, prev + Math.floor(Math.random() * 5) - 2));
      setAvgWaitTime(Math.max(1, Math.floor(Math.random() * 6) + 1));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      {/* Nearby Drivers & Wait Time */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Car className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">{nearbyDrivers} drivers</p>
            <p className="text-xs text-muted-foreground">nearby</p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-accent/50 border border-border">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">~{avgWaitTime} min</p>
            <p className="text-xs text-muted-foreground">avg. pickup</p>
          </div>
        </div>
      </div>

      {/* Quick Destinations */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Destinations</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_DESTINATIONS.map((dest) => (
            <Button
              key={dest.name}
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onQuickDestination?.(dest.name)}
            >
              <span className="mr-1">{dest.icon}</span>
              {dest.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Safety Features */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-green-500" />
            <span>Verified Drivers</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Share2 className="h-3.5 w-3.5 text-blue-500" />
            <span>Share Trip</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
            <span>Emergency SOS</span>
          </div>
        </div>
      </div>

      {/* Surge Indicator (when applicable) */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <Star className="h-4 w-4 text-yellow-500" />
        <p className="text-xs text-yellow-700 dark:text-yellow-400">
          Standard pricing in your area. No surge right now!
        </p>
      </div>
    </div>
  );
};

export default RideQuickInfo;
