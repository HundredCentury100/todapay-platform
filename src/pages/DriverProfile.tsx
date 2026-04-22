import { useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { PageLoader } from "@/components/ui/loading-states";
import {
  Car, FileText, Shield, HelpCircle,
  LogOut, Bell, History, ChevronRight, Star,
  Camera, Settings, Wallet, DollarSign, Clock,
  Navigation, Phone, User, TrendingUp, Target, XCircle,
  AlertTriangle, CheckCircle, Zap, Loader2,
  Award, Flame, MapPin, BarChart3, Calendar,
  ThumbsUp, Medal, Crown, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useDriverProfile } from "@/hooks/useDriverProfile";
import { useUserWallet } from "@/hooks/useUserWallet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrency } from "@/contexts/CurrencyContext";

// Driver tier system
const getDriverTier = (totalRides: number, rating: number) => {
  if (totalRides >= 5000 && rating >= 4.8) return { name: 'Diamond', icon: Crown, color: 'text-cyan-400', bg: 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30', next: null, progress: 100 };
  if (totalRides >= 2000 && rating >= 4.6) return { name: 'Platinum', icon: Medal, color: 'text-violet-400', bg: 'bg-gradient-to-br from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30', next: 'Diamond', progress: Math.min(100, (totalRides / 5000) * 100) };
  if (totalRides >= 500 && rating >= 4.4) return { name: 'Gold', icon: Award, color: 'text-amber-400', bg: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30', next: 'Platinum', progress: Math.min(100, (totalRides / 2000) * 100) };
  if (totalRides >= 100) return { name: 'Silver', icon: Star, color: 'text-slate-300', bg: 'bg-gradient-to-br from-slate-500/20 to-gray-500/20', border: 'border-slate-500/30', next: 'Gold', progress: Math.min(100, (totalRides / 500) * 100) };
  return { name: 'Bronze', icon: Sparkles, color: 'text-orange-400', bg: 'bg-gradient-to-br from-orange-500/20 to-red-500/20', border: 'border-orange-500/30', next: 'Silver', progress: Math.min(100, (totalRides / 100) * 100) };
};

const DriverProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { convertPrice } = useCurrency();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const {
    driver,
    isLoading: driverLoading,
    toggleOnlineStatus,
  } = useDriverProfile(user?.id);

  const { wallet, balance } = useUserWallet();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
  }, [queryClient]);

  if (!authLoading && !user) {
    navigate("/auth", { state: { returnTo: "/driver" } });
    return null;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Signed out successfully");
  };

  if (authLoading || driverLoading) {
    return <PageLoader message="Loading driver profile..." />;
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm mx-auto">
          <div className="h-20 w-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Car className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Become a Driver</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Start earning by joining our driver network. Quick registration, flexible hours.
          </p>
          <Button onClick={() => navigate('/driver/register')} className="w-full h-12 rounded-xl text-sm font-medium" size="lg">
            Register as Driver
          </Button>
          <button onClick={() => navigate(-1)} className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOnline = driver.is_online;
  const initials = driver.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'D';
  const tier = getDriverTier(driver.total_rides, driver.rating);
  const TierIcon = tier.icon;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !driver) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/profile.${ext}`;
      const { error: uploadError } = await supabase.storage.from('driver-documents').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: signedData, error: signedError } = await supabase.storage.from('driver-documents').createSignedUrl(filePath, 60 * 60 * 24 * 365);
      if (signedError) throw signedError;
      const { error: updateError } = await supabase.from('drivers').update({ profile_photo_url: signedData.signedUrl, updated_at: new Date().toISOString() }).eq('id', driver.id);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      toast.success('Profile photo updated');
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getStatusBadge = () => {
    switch (driver.status) {
      case 'active': return { label: 'Active', color: 'bg-green-500/10 text-green-600 border-green-500/20' };
      case 'pending': return { label: 'Pending', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      case 'suspended': return { label: 'Suspended', color: 'bg-destructive/10 text-destructive border-destructive/20' };
      default: return { label: driver.status, color: 'bg-muted text-muted-foreground' };
    }
  };
  const statusBadge = getStatusBadge();

  return (
    <div className="min-h-screen bg-background pb-6">

      {/* ── Hero Header with Gradient ── */}
      <div className="relative overflow-hidden">
        <div className={cn(
          "absolute inset-0 transition-all duration-700",
          isOnline
            ? "bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-background"
            : "bg-gradient-to-br from-primary/15 via-primary/5 to-background"
        )} />
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />

        <div className="relative px-5 pt-6 pb-5 safe-area-pt">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="h-9 rounded-xl bg-card/80 backdrop-blur-sm border border-border gap-1.5 text-xs font-medium">
                <User className="h-4 w-4" /> Personal
              </Button>
            </Link>
            <Link to="/driver/settings">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-card/80 backdrop-blur-sm border border-border" aria-label="Settings">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4"
          >
            <div className="relative shrink-0">
              <Avatar className="h-24 w-24 border-4 border-card rounded-2xl shadow-xl">
                <AvatarImage src={(driver as any).profile_photo_url || undefined} className="rounded-xl object-cover" />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold rounded-xl">{initials}</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-lg shadow-lg bg-primary hover:bg-primary/90"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                aria-label="Change photo"
              >
                {uploadingPhoto ? <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" /> : <Camera className="h-4 w-4 text-primary-foreground" />}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <div className={cn(
                "absolute top-0 right-0 h-4 w-4 rounded-full border-2 border-card transition-colors",
                isOnline ? "bg-green-500" : "bg-muted-foreground/50"
              )} />
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-xl font-bold truncate">{driver.full_name}</h1>

              {/* Rating with stars */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("h-3.5 w-3.5", s <= Math.round(driver.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                  ))}
                </div>
                <span className="text-sm font-bold text-amber-500">{driver.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({driver.total_rides})</span>
              </div>

              {/* Tier badge + Status */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={cn("text-[10px] px-2.5 py-0.5 font-bold border gap-1", tier.bg, tier.border, tier.color)}>
                  <TierIcon className="h-3 w-3" />
                  {tier.name} Driver
                </Badge>
                <Badge className={cn("text-[10px] px-2 py-0.5 font-semibold border", statusBadge.color)}>
                  {statusBadge.label}
                </Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Big Online Toggle ── */}
      <div className="px-5 mt-1">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            className={cn(
              "w-full h-14 text-base font-semibold rounded-2xl transition-all touch-manipulation shadow-sm relative overflow-hidden",
              isOnline
                ? "bg-green-600 hover:bg-green-700 text-white shadow-green-600/20"
                : "bg-card border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5"
            )}
            variant={isOnline ? 'default' : 'outline'}
            onClick={() => toggleOnlineStatus(!isOnline)}
          >
            <div className="flex items-center gap-2 relative z-10">
              {isOnline ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                  Online — Receiving Rides
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Go Online
                </>
              )}
            </div>
            {isOnline && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-500 to-green-600"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                style={{ opacity: 0.15 }}
              />
            )}
          </Button>
        </motion.div>
      </div>

      {/* ── Tier Progress Card ── */}
      <div className="px-5 mt-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className={cn("rounded-2xl p-4 border", tier.bg, tier.border)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TierIcon className={cn("h-5 w-5", tier.color)} />
                <span className={cn("text-sm font-bold", tier.color)}>{tier.name} Tier</span>
              </div>
              {tier.next && (
                <span className="text-[10px] text-muted-foreground">Next: {tier.next}</span>
              )}
            </div>
            <Progress value={tier.progress} className="h-2 bg-muted/30" />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {driver.total_rides} rides completed • {tier.progress.toFixed(0)}% to next tier
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Wallet + Earnings Row ── */}
      <div className="px-5 mt-3 grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
          <Link to="/pay">
            <div className="rounded-2xl p-3.5 bg-card border border-border active:scale-[0.98] transition-transform h-full">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <p className="text-[10px] font-medium text-muted-foreground">Wallet Balance</p>
              <p className="text-lg font-bold tracking-tight">{convertPrice(balance || 0, wallet?.currency || 'USD')}</p>
            </div>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
          <Link to="/driver/earnings">
            <div className="rounded-2xl p-3.5 bg-primary text-primary-foreground active:scale-[0.98] transition-transform relative overflow-hidden h-full">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl" />
              <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center mb-2 relative z-10">
                <DollarSign className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-medium opacity-70 relative z-10">Total Earnings</p>
              <p className="text-lg font-bold tracking-tight relative z-10">{convertPrice(driver.total_earnings || 0, 'USD')}</p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* ── Performance Stats Grid ── */}
      <div className="px-5 mt-4">
        <motion.div animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-2">
          {[
            { icon: Car, value: driver.total_rides.toString(), label: 'Rides', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { icon: Target, value: `${driver.acceptance_rate}%`, label: 'Accept', color: driver.acceptance_rate >= 90 ? 'text-green-500' : driver.acceptance_rate >= 70 ? 'text-amber-500' : 'text-destructive', bg: 'bg-green-500/10' },
            { icon: XCircle, value: `${driver.cancellation_rate}%`, label: 'Cancel', color: driver.cancellation_rate <= 5 ? 'text-green-500' : driver.cancellation_rate <= 10 ? 'text-amber-500' : 'text-destructive', bg: 'bg-destructive/10' },
            { icon: Star, value: driver.rating.toFixed(1), label: 'Rating', color: 'text-amber-500', bg: 'bg-amber-500/10' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center rounded-2xl bg-card border border-border py-3 px-1"
              whileTap={{ scale: 0.95 }}
            >
              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center mb-1.5", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <p className={cn("text-lg font-bold leading-none", stat.color)}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Vehicle Showcase Card ── */}
      <div className="px-5 mt-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Link to="/driver/vehicle">
            <div className="rounded-2xl bg-card border border-border p-4 active:bg-secondary/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
                    <Car className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{driver.vehicle_make} {driver.vehicle_model}</p>
                    <p className="text-xs text-muted-foreground">
                      {driver.vehicle_year} • {driver.vehicle_color}
                    </p>
                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 mt-1 h-5">
                      {driver.license_plate}
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* ── Document Verification Status ── */}
      <div className="px-5 mt-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-card border border-border/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verification</p>
            <Link to="/driver/documents" className="text-xs text-primary font-medium flex items-center gap-0.5">
              Manage <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <VerificationItem label="License" verified={driver.license_verified} />
            <VerificationItem label="Insurance" verified={driver.insurance_verified} />
            <VerificationItem label="Background" verified={driver.background_check_status === 'approved'} pending={driver.background_check_status === 'pending'} />
          </div>
        </motion.div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="px-5 mt-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Navigation, label: 'Requests', path: '/driver/requests', color: 'from-blue-500/20 to-blue-600/10' },
              { icon: Clock, label: 'Active', path: '/driver/active', color: 'from-green-500/20 to-green-600/10' },
              { icon: History, label: 'History', path: '/driver/history', color: 'from-purple-500/20 to-purple-600/10' },
              { icon: BarChart3, label: 'Stats', path: '/driver/performance', color: 'from-amber-500/20 to-amber-600/10' },
            ].map((action) => (
              <Link key={action.label} to={action.path}>
                <div className={cn("flex flex-col items-center rounded-2xl py-3 px-2 bg-gradient-to-br border border-border/50 active:scale-[0.95] transition-transform", action.color)}>
                  <action.icon className="h-5 w-5 text-foreground mb-1.5" />
                  <span className="text-[10px] font-medium">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Menu Sections ── */}
      <div className="px-5 mt-5 space-y-2">
        <DriverMenuGroup title="Earnings & Payments" items={[
          { icon: DollarSign, label: "Earnings Dashboard", path: "/driver/earnings" },
          { icon: Wallet, label: "Driver Wallet", path: "/pay" },
        ]} />

        <DriverMenuGroup title="Vehicle & Documents" items={[
          { icon: Car, label: "Vehicle Details", path: "/driver/vehicle" },
          { icon: FileText, label: "Documents", path: "/driver/documents" },
        ]} />

        <DriverMenuGroup title="Account" items={[
          { icon: TrendingUp, label: "Performance Analytics", path: "/driver/performance" },
          { icon: Bell, label: "Notifications", path: "/notification-settings" },
          { icon: Shield, label: "Privacy & Security", path: "/privacy" },
          { icon: Phone, label: "Contact Info", path: "/profile/edit" },
          { icon: HelpCircle, label: "Help & Support", path: "/help" },
        ]} />

        {/* Sign Out */}
        <motion.button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-destructive hover:bg-destructive/5 active:bg-destructive/10 transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium text-sm">Sign Out</span>
        </motion.button>
      </div>

      {/* Version */}
      <p className="text-center py-6 text-[11px] text-muted-foreground">
        Driver v2.0 • Made with ❤️
      </p>
    </div>
  );
};

/* ── Verification Status Item ── */
function VerificationItem({ label, verified, pending }: { label: string; verified: boolean; pending?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/40 py-2.5 px-2">
      {verified ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : pending ? (
        <Clock className="h-5 w-5 text-amber-500" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-destructive/70" />
      )}
      <span className="text-[10px] font-medium text-muted-foreground text-center">{label}</span>
    </div>
  );
}

/* ── Compact Menu Group ── */
interface DriverMenuItemDef {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  onClick?: () => void;
}

function DriverMenuGroup({ title, items }: { title?: string; items: DriverMenuItemDef[] }) {
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

export default DriverProfile;
