import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, ChevronRight, Settings } from "lucide-react";
import { UserProfile } from "@/services/profileService";
import { Link } from "react-router-dom";

interface UserProfileHeaderProps {
  profile: UserProfile | null;
  onUploadAvatar?: (file: File) => void;
  isUploadingAvatar?: boolean;
}

export function UserProfileHeader({
  profile,
  onUploadAvatar,
  isUploadingAvatar,
}: UserProfileHeaderProps) {
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

  return (
    <div className="bg-card border-b">
      <div className="px-4 py-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xl bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>
            {onUploadAvatar && (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <Camera className="h-3 w-3" />
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

          {/* Name & Rating */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold truncate">
              {profile?.full_name || 'Add your name'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{profile?.email}</span>
            </div>
          </div>

          {/* Settings */}
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* View Profile Link */}
        <Link to="/profile/edit" className="block mt-4">
          <div className="flex items-center justify-between py-2 text-sm text-primary">
            <span>View and edit profile</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
