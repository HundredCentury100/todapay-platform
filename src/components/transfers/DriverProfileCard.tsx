import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Phone, MessageSquare, User, Car, Shield, Award, Globe } from "lucide-react";

interface DriverProfileCardProps {
  driver: {
    id: string;
    full_name: string;
    phone?: string | null;
    rating?: number | null;
    total_rides?: number | null;
    profile_photo_url?: string | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    vehicle_color?: string | null;
    license_plate?: string | null;
    years_experience?: number;
    languages?: string[];
    is_verified?: boolean;
  };
  compact?: boolean;
  showActions?: boolean;
  onCall?: () => void;
  onMessage?: () => void;
}

export const DriverProfileCard = ({
  driver,
  compact = false,
  showActions = true,
  onCall,
  onMessage,
}: DriverProfileCardProps) => {
  const yearsExp = driver.years_experience || Math.floor((driver.total_rides || 0) / 200) + 1;
  const languages = driver.languages || ['English', 'Shona'];

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center overflow-hidden shrink-0">
          {driver.profile_photo_url ? (
            <img src={driver.profile_photo_url} alt={driver.full_name} className="h-full w-full object-cover" />
          ) : (
            <User className="h-6 w-6 text-primary-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm truncate">{driver.full_name}</p>
            {driver.is_verified !== false && <Shield className="h-3.5 w-3.5 text-primary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {driver.vehicle_color} {driver.vehicle_make} {driver.vehicle_model} · {driver.license_plate}
          </p>
        </div>
        {driver.rating && (
          <Badge variant="outline" className="gap-0.5 shrink-0">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {driver.rating.toFixed(1)}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
      <CardContent className="p-0">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 pb-0">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center overflow-hidden shadow-lg">
                {driver.profile_photo_url ? (
                  <img src={driver.profile_photo_url} alt={driver.full_name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-primary-foreground" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                <Car className="h-3.5 w-3.5 text-white" />
              </div>
            </div>

            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{driver.full_name}</h3>
                {driver.is_verified !== false && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] h-5 gap-0.5">
                    <Shield className="h-2.5 w-2.5" /> Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {driver.vehicle_color} {driver.vehicle_make} {driver.vehicle_model}
              </p>
              <p className="text-xs text-muted-foreground">{driver.license_plate}</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x px-4 py-3 mt-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-lg">{driver.rating?.toFixed(1) || '5.0'}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Rating</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{(driver.total_rides || 0).toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Trips</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Award className="h-4 w-4 text-primary" />
              <span className="font-bold text-lg">{yearsExp}yr</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Experience</p>
          </div>
        </div>

        {/* Languages */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex gap-1 flex-wrap">
            {languages.map(lang => (
              <Badge key={lang} variant="secondary" className="text-[10px] rounded-full h-5 px-2">
                {lang}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className="flex gap-2 px-4 pb-4">
            <Button
              size="sm"
              className="flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-600 gap-2"
              onClick={() => {
                if (driver.phone) window.open(`tel:${driver.phone}`);
                onCall?.();
              }}
            >
              <Phone className="h-4 w-4" /> Call
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-12 rounded-xl gap-2"
              onClick={() => {
                if (driver.phone) window.open(`https://wa.me/${driver.phone.replace(/\D/g, '')}`);
                onMessage?.();
              }}
            >
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
