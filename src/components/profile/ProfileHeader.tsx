import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Camera, CheckCircle, Shield, Star } from "lucide-react";
import { UserProfile, LOYALTY_TIERS } from "@/services/profileService";

interface ProfileHeaderProps {
  profile: UserProfile | null;
  completionPercentage: number;
  onUploadAvatar?: (file: File) => void;
  isUploadingAvatar?: boolean;
}

export function ProfileHeader({
  profile,
  completionPercentage,
  onUploadAvatar,
  isUploadingAvatar,
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  const loyaltyTier = LOYALTY_TIERS[profile?.loyalty_tier as keyof typeof LOYALTY_TIERS] || LOYALTY_TIERS.bronze;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      onUploadAvatar?.(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-xl p-6">
      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            <AvatarImage src={previewUrl || profile?.avatar_url || undefined} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          {onUploadAvatar && (
            <>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
              >
                <Camera className="h-4 w-4" />
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

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <h2 className="text-xl font-semibold">{profile?.full_name || 'Welcome!'}</h2>
            {profile?.email_verified && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {profile?.phone_verified && (
              <Shield className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
          
          {/* Loyalty Tier */}
          <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
            <Badge variant="outline" className="capitalize">
              <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
              {loyaltyTier.name}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {profile?.loyalty_points || 0} points
            </span>
          </div>
        </div>
      </div>

      {/* Profile Completion */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Profile Completion</span>
          <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
        {completionPercentage < 100 && (
          <p className="text-xs text-muted-foreground mt-1">
            Complete your profile to unlock all features
          </p>
        )}
      </div>
    </div>
  );
}
