import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Settings, Star, Car } from "lucide-react";
import { DriverProfile } from "@/hooks/useDriverProfile";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DriverProfileSectionProps {
  driver: DriverProfile;
  isOnline?: boolean;
  onToggleOnline?: () => void;
  onEditPhoto?: () => void;
}

export function DriverProfileSection({
  driver,
  isOnline,
  onToggleOnline,
  onEditPhoto,
}: DriverProfileSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = driver.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'D';

  return (
    <div className="bg-card border-b">
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          {/* Avatar with Online Indicator */}
          <div className="relative shrink-0">
            <Avatar className="h-14 w-14">
              <AvatarImage src={undefined} />
              <AvatarFallback className="text-lg bg-muted font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card transition-colors",
                isOnline ? 'bg-green-500' : 'bg-muted-foreground'
              )}
            />
            {onEditPhoto && (
              <Button
                size="icon"
                variant="secondary"
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full shadow-sm"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile photo"
              >
                <Camera className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Name & Rating */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{driver.full_name}</h1>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="ml-0.5 font-medium">{driver.rating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground text-xs">{driver.total_rides} rides</span>
            </div>
            {/* Vehicle inline */}
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <Car className="h-3 w-3 shrink-0" />
              <span className="truncate">{driver.vehicle_make} {driver.vehicle_model}</span>
              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4">
                {driver.license_plate}
              </Badge>
            </div>
          </div>

          {/* Settings */}
          <Link to="/driver/settings" className="shrink-0">
            <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Driver settings">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Online Toggle */}
        <div className="mt-3">
          <Button
            className={cn(
              "w-full h-12 text-sm font-medium rounded-xl transition-all touch-manipulation",
              isOnline ? 'bg-green-600 hover:bg-green-700 text-white' : ''
            )}
            variant={isOnline ? 'default' : 'outline'}
            onClick={onToggleOnline}
          >
            {isOnline ? '● Online - Receiving Rides' : 'Go Online'}
          </Button>
        </div>
      </div>
    </div>
  );
}
