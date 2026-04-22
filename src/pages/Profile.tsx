import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MobileAppLayout from "@/components/MobileAppLayout";
import { PageLoader } from "@/components/ui/loading-states";
import { 
  Ticket, Bell, Shield, HelpCircle, CreditCard, Car,
  LogOut, Heart, Tag, Users, FileText, Wallet, Gift,
  ChevronRight, Phone, Camera, Settings, Sparkles, TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserWallet } from "@/hooks/useUserWallet";
import { useDashboardMode } from "@/hooks/useDashboardMode";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ProfileRoleLinks } from "@/components/profile/ProfileRoleLinks";
import { BecomeCard } from "@/components/profile/BecomeCard";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { TelegramLinkCard } from "@/components/profile/TelegramLinkCard";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useRef } from "react";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { convertPrice } = useCurrency();

  const { 
    profile, 
    isLoading: profileLoading, 
    uploadAvatar,
    isUploadingAvatar,
  } = useProfile();

  const {
    wallet,
    isLoading: walletLoading,
  } = useUserWallet();

  const { isDriver, isMerchant } = useDashboardMode();

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user-wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
    ]);
  }, [queryClient]);

  if (!authLoading && !user) {
    navigate("/auth", { state: { returnTo: "/profile" } });
    return null;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Signed out successfully");
  };

  if (authLoading || profileLoading) {
    return (
      <MobileAppLayout>
        <PageLoader message="Loading profile..." />
      </MobileAppLayout>
    );
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
  };

  const tierConfig: Record<string, { label: string; color: string; bg: string }> = {
    bronze: { label: 'Bronze', color: 'text-amber-700', bg: 'bg-amber-100' },
    silver: { label: 'Silver', color: 'text-slate-600', bg: 'bg-slate-100' },
    gold: { label: 'Gold', color: 'text-amber-500', bg: 'bg-amber-50' },
    platinum: { label: 'Platinum', color: 'text-violet-600', bg: 'bg-violet-100' },
  };

  const tier = (profile?.loyalty_tier || 'bronze').toLowerCase();
  const tierStyle = tierConfig[tier] || tierConfig.bronze;

  const showDriverCard = !isDriver;
  const showMerchantCard = !isMerchant;

  return (
    <MobileAppLayout onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background pb-24">
        
        {/* ── Profile Header ── */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background" />
          
          <div className="relative px-5 pt-6 pb-5 safe-area-pt">
            {/* Settings top-right */}
            <div className="flex justify-end mb-4">
              <Link to="/settings">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl bg-card border border-border/50"
                  aria-label="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Avatar + Name */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3">
                <Avatar className="h-24 w-24 border-4 border-card rounded-3xl shadow-lg">
                  <AvatarImage src={profile?.avatar_url || undefined} className="rounded-2xl" />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold rounded-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl shadow-md bg-primary hover:bg-primary/90"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  aria-label="Change profile photo"
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
              </div>

              <h1 className="text-xl font-bold">{profile?.full_name || 'Add your name'}</h1>
              
              {profile?.phone && (
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {profile.phone}
                </p>
              )}

              {/* Account # + Tier row */}
              <div className="flex items-center gap-2 mt-2">
                {profile?.account_number && (
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-muted/60 rounded-md text-muted-foreground">
                    {profile.account_number}
                  </span>
                )}
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                  tierStyle.bg, tierStyle.color
                )}>
                  <Sparkles className="h-3 w-3" />
                  {tierStyle.label}
                </span>
              </div>

              {/* Edit profile link */}
              <Link to="/profile/edit" className="mt-3">
                <span className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                  Edit profile <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Wallet & Points Quick Glance ── */}
        <div className="px-5 mt-2">
          <div className="grid grid-cols-2 gap-3">
            {/* Balance - links to /pay */}
            <Link to="/pay">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="relative overflow-hidden rounded-2xl p-4 text-left bg-primary active:scale-[0.97] transition-transform"
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                <div className="relative z-10 text-primary-foreground">
                  <Wallet className="h-5 w-5 mb-2 opacity-80" />
                  <p className="text-[11px] font-medium opacity-70">Balance</p>
                  <p className="text-xl font-bold tracking-tight">
                    {convertPrice(wallet?.balance || 0, wallet?.currency || 'USD')}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold mt-2 bg-white/20 rounded-full px-2 py-0.5">
                    <TrendingUp className="h-2.5 w-2.5" /> Manage
                  </span>
                </div>
              </motion.div>
            </Link>

            {/* Points */}
            <Link to="/rewards">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-2xl p-4 h-full bg-accent active:scale-[0.97] transition-transform"
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                <div className="relative z-10">
                  <Gift className="h-5 w-5 mb-2 text-accent-foreground opacity-80" />
                  <p className="text-[11px] font-medium text-accent-foreground/70">Points</p>
                  <p className="text-xl font-bold tracking-tight text-accent-foreground">
                    {(profile?.loyalty_points || 0).toLocaleString()}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold mt-2 text-accent-foreground/80 bg-accent-foreground/10 rounded-full px-2 py-0.5">
                    <Sparkles className="h-2.5 w-2.5" /> Rewards
                  </span>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>

        {/* ── Role Dashboards ── */}
        <div className="px-5 mt-5">
          <ProfileRoleLinks />
        </div>

        {/* ── Become Driver / Merchant ── */}
        {(showDriverCard || showMerchantCard) && (
          <div className="px-5 mt-4 space-y-2.5">
            {showDriverCard && <BecomeCard type="driver" />}
            {showMerchantCard && <BecomeCard type="merchant" />}
          </div>
        )}

        {/* ── Telegram Link ── */}
        <div className="px-5 mt-4">
          <TelegramLinkCard />
        </div>

        {/* ── Menu Sections ── */}
        <div className="px-5 mt-6 space-y-2">
          <MenuGroup title="Activity" items={[
            { icon: Car, label: "My Rides", path: "/rides" },
            { icon: Ticket, label: "My Orders", path: "/orders" },
            { icon: Heart, label: "Saved Places", path: "/saved" },
          ]} />

          <MenuGroup title="Promos" items={[
            { icon: Tag, label: "Promo Code", path: "/promo" },
            { icon: Users, label: "Invite Friends", path: "/referral" },
          ]} />

          <MenuGroup title="Account" items={[
            { icon: CreditCard, label: "Payment Methods", path: "/payment-methods" },
            { icon: Bell, label: "Notifications", path: "/notifications" },
            { icon: Shield, label: "Privacy & Security", path: "/privacy" },
          ]} />

          <MenuGroup items={[
            { icon: HelpCircle, label: "Help Center", path: "/help" },
            { icon: FileText, label: "Legal", path: "/legal" },
          ]} />

          {/* Sign Out & Delete */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card border border-border/50 overflow-hidden"
          >
            <motion.button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-destructive hover:bg-destructive/5 active:bg-destructive/10 transition-colors border-b border-border/20"
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium text-sm">Sign Out</span>
            </motion.button>
            <DeleteAccountDialog />
          </motion.div>
        </div>

        {/* Version */}
        <p className="text-center py-6 text-[11px] text-muted-foreground">
          Version 1.0.0 • Made with ❤️
        </p>
      </div>
    </MobileAppLayout>
  );
};

/* ── Compact Menu Group ── */
interface MenuItemDef {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  onClick?: () => void;
}

function MenuGroup({ title, items }: { title?: string; items: MenuItemDef[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border border-border/50 overflow-hidden"
    >
      {title && (
        <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
      )}
      {items.map((item, i) => {
        const Icon = item.icon;
        const inner = (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30 active:bg-secondary/50 transition-colors",
              i < items.length - 1 && "border-b border-border/20"
            )}
            onClick={item.onClick}
          >
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          </div>
        );
        return item.path ? <Link key={i} to={item.path}>{inner}</Link> : <div key={i}>{inner}</div>;
      })}
    </motion.div>
  );
}

export default Profile;
