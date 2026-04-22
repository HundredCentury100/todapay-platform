import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Car, Star, CheckCircle, Camera, MapPin } from "lucide-react";
import { DriverProfile } from "@/hooks/useDriverProfile";

interface DriverProfileHeaderProps {
  driver: DriverProfile;
  isOnline?: boolean;
  onToggleOnline?: () => void;
  onEditPhoto?: () => void;
}

export function DriverProfileHeader({
  driver,
  isOnline,
  onToggleOnline,
  onEditPhoto,
}: DriverProfileHeaderProps) {
  const initials = driver.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'D';

  // Calculate acceptance rate color
  const getAcceptanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-xl p-6">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-20 w-20 border-4 border-background shadow-md">
            <AvatarImage src={undefined} />
            <AvatarFallback className="text-xl bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          {onEditPhoto && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 h-7 w-7 rounded-full"
              onClick={onEditPhoto}
            >
              <Camera className="h-3 w-3" />
            </Button>
          )}
          {/* Online indicator */}
          <div
            className={`absolute top-0 right-0 h-4 w-4 rounded-full border-2 border-background ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">{driver.full_name}</h2>
            {driver.background_check_status === 'approved' && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
            <div className="flex items-center text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="ml-1 font-medium">{driver.rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{driver.total_rides} rides</span>
          </div>

          {/* Vehicle */}
          <div className="flex items-center gap-1 mt-2 justify-center sm:justify-start text-sm text-muted-foreground">
            <Car className="h-4 w-4" />
            <span>{driver.vehicle_make} {driver.vehicle_model}</span>
            <Badge variant="outline" className="ml-2 font-mono text-xs">
              {driver.license_plate}
            </Badge>
          </div>
        </div>

        {/* Online Toggle */}
        {onToggleOnline && (
          <Button
            variant={isOnline ? 'default' : 'outline'}
            className={isOnline ? 'bg-green-600 hover:bg-green-700' : ''}
            onClick={onToggleOnline}
          >
            {isOnline ? 'Online' : 'Go Online'}
          </Button>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <p className="text-2xl font-bold">{driver.total_rides}</p>
          <p className="text-xs text-muted-foreground">Total Rides</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${getAcceptanceColor(driver.acceptance_rate)}`}>
            {driver.acceptance_rate}%
          </p>
          <p className="text-xs text-muted-foreground">Acceptance</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{driver.cancellation_rate}%</p>
          <p className="text-xs text-muted-foreground">Cancellation</p>
        </div>
      </div>
    </div>
  );
}
