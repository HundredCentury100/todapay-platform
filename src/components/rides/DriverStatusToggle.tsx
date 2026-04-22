import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Power, MapPin, DollarSign, TrendingUp, 
  Navigation, Clock, Zap 
} from "lucide-react";
import { toggleDriverOnline } from "@/services/rideService";
import { toast } from "sonner";

interface DriverStatusToggleProps {
  driverId: string;
  initialOnline?: boolean;
  onStatusChange?: (isOnline: boolean) => void;
}

export const DriverStatusToggle = ({ 
  driverId, 
  initialOnline = false,
  onStatusChange 
}: DriverStatusToggleProps) => {
  const [isOnline, setIsOnline] = useState(initialOnline);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [todayStats, setTodayStats] = useState({
    rides: Math.floor(Math.random() * 10),
    earnings: Math.floor(Math.random() * 500) + 100,
    hours: Math.floor(Math.random() * 8) + 1,
  });

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await toggleDriverOnline(
        driverId, 
        checked, 
        currentLocation?.lat, 
        currentLocation?.lng
      );
      
      if (error) throw error;
      
      setIsOnline(checked);
      onStatusChange?.(checked);
      toast.success(checked ? "You're now online and receiving ride requests" : "You're now offline");
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Main Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isOnline ? 'bg-green-500/20' : 'bg-muted'}`}>
            <Power className={`h-5 w-5 ${isOnline ? 'text-green-500' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="font-medium">Driver Mode</p>
            <p className="text-sm text-muted-foreground">
              {isOnline ? 'Accepting ride requests' : 'Currently offline'}
            </p>
          </div>
        </div>
        <Switch
          checked={isOnline}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-center">
        <Badge 
          variant={isOnline ? "default" : "secondary"} 
          className={`text-sm px-4 py-1 ${isOnline ? 'bg-green-500 hover:bg-green-600' : ''}`}
        >
          {isOnline ? (
            <>
              <Zap className="h-3 w-3 mr-1" />
              ONLINE
            </>
          ) : (
            'OFFLINE'
          )}
        </Badge>
      </div>

      {/* Location */}
      {currentLocation && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Location active • {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span>
        </div>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Navigation className="h-3 w-3" />
            <span className="text-xs">Rides</span>
          </div>
          <p className="font-semibold">{todayStats.rides}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <DollarSign className="h-3 w-3" />
            <span className="text-xs">Earned</span>
          </div>
          <p className="font-semibold">R{todayStats.earnings}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Clock className="h-3 w-3" />
            <span className="text-xs">Hours</span>
          </div>
          <p className="font-semibold">{todayStats.hours}h</p>
        </div>
      </div>
    </Card>
  );
};

export default DriverStatusToggle;
