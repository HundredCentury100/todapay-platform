import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, ChevronRight, Star, Phone, Settings } from "lucide-react";
import { UserProfile } from "@/services/profileService";
import { Link } from "react-router-dom";

interface SuperAppProfileHeaderProps {
  profile: UserProfile | null;
  onUploadAvatar?: (file: File) => void;
  isUploadingAvatar?: boolean;
}

export function SuperAppProfileHeader({
  profile,
  onUploadAvatar,
  isUploadingAvatar,
}: SuperAppProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadAvatar?.(file);
    }
  };

  const tierColors: Record<string, string> = {
    Bronze: 'text-amber-700 bg-amber-100',
    Silver: 'text-slate-600 bg-slate-100',
    Gold: 'text-amber-500 bg-amber-50',
    Platinum: 'text-purple-600 bg-purple-100',
    bronze: 'text-amber-700 bg-amber-100',
    silver: 'text-slate-600 bg-slate-100',
    gold: 'text-amber-500 bg-amber-50',
    platinum: 'text-purple-600 bg-purple-100',
  };

  const tier = profile?.loyalty_tier || 'Bronze';
  const tierDisplay = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
  const tierClass = tierColors[tier] || tierColors.Bronze;

  return (
    <div className="relative">
      {/* Background gradient - Super app style */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/10 to-background h-40" />
      
      {/* Settings button */}
      <div className="absolute top-4 right-4 z-10">
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-background/80">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="relative px-5 pt-6 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {onUploadAvatar && (
              <>
                <Button
                  size="icon"
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow-md bg-primary hover:bg-primary/90"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-xl font-bold truncate">
              {profile?.full_name || 'Add your name'}
            </h1>
            
            {/* Tier badge */}
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tierClass}`}>
                <Star className="h-3 w-3" />
                {tierDisplay} Member
              </span>
            </div>

            {/* Phone */}
            {profile?.phone && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{profile.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Edit profile link */}
        <Link to="/profile/edit">
          <div className="flex items-center justify-between mt-4 py-3 px-4 bg-card rounded-xl border">
            <span className="text-sm font-medium">View and edit profile</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      </div>
    </div>
  );
}
