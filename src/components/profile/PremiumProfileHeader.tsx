import { useRef } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, ChevronRight, Star, Phone, Settings, Sparkles } from "lucide-react";
import { UserProfile } from "@/services/profileService";
import { Link } from "react-router-dom";

interface PremiumProfileHeaderProps {
  profile: UserProfile | null;
  onUploadAvatar?: (file: File) => void;
  isUploadingAvatar?: boolean;
}

export function PremiumProfileHeader({
  profile,
  onUploadAvatar,
  isUploadingAvatar,
}: PremiumProfileHeaderProps) {
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

  const tierConfig: Record<string, { color: string; bg: string; glow: string }> = {
    bronze: { color: 'text-amber-700', bg: 'bg-gradient-to-r from-amber-100 to-orange-100', glow: 'shadow-amber-500/20' },
    silver: { color: 'text-slate-600', bg: 'bg-gradient-to-r from-slate-100 to-gray-200', glow: 'shadow-slate-500/20' },
    gold: { color: 'text-amber-500', bg: 'bg-gradient-to-r from-amber-50 to-yellow-100', glow: 'shadow-amber-500/20' },
    platinum: { color: 'text-violet-600', bg: 'bg-gradient-to-r from-violet-100 to-purple-100', glow: 'shadow-violet-500/20' },
  };

  const tier = (profile?.loyalty_tier || 'bronze').toLowerCase();
  const tierDisplay = tier.charAt(0).toUpperCase() + tier.slice(1);
  const tierStyle = tierConfig[tier] || tierConfig.bronze;

  return (
    <div className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-background" />
      
      {/* Floating orbs */}
      <motion.div
        className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Settings button */}
      <motion.div 
        className="absolute top-4 right-4 z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Link to="/settings">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-11 w-11 rounded-2xl bg-card border border-border/50 hover:bg-card/80 hover:shadow-md"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 px-5 pt-8 pb-5 safe-area-pt">
        <motion.div 
          className="flex items-start gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Avatar */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary to-primary/50 rounded-3xl blur-sm opacity-50" />
            <Avatar className="relative h-24 w-24 border-4 border-card rounded-3xl shadow-super-lg">
              <AvatarImage src={profile?.avatar_url || undefined} className="rounded-2xl" />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold rounded-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            {onUploadAvatar && (
              <>
                <Button
                  size="icon"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl shadow-lg bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <Camera className="h-4 w-4 text-primary-foreground" />
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
          <div className="flex-1 min-w-0 pt-2">
            <h1 className="text-2xl font-bold truncate">
              {profile?.full_name || 'Add your name'}
            </h1>
            
            {/* Tier badge */}
            <motion.div 
              className="flex items-center gap-2 mt-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tierStyle.bg} ${tierStyle.color} shadow-sm ${tierStyle.glow}`}>
                <Sparkles className="h-3 w-3" />
                {tierDisplay} Member
              </span>
            </motion.div>

            {/* Account Number */}
            {profile?.account_number && (
              <motion.div 
                className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <span className="px-2 py-0.5 bg-muted/50 rounded-md">{profile.account_number}</span>
              </motion.div>
            )}

            {/* Phone */}
            {profile?.phone && (
              <motion.div 
                className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Phone className="h-4 w-4" />
                <span>{profile.phone}</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Edit profile card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link to="/profile/edit">
            <div className="flex items-center justify-between mt-5 py-3.5 px-4 bg-card rounded-2xl border border-border/50 hover:bg-card/80 hover:shadow-md transition-all duration-300 group">
              <span className="text-sm font-medium">View and edit profile</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
