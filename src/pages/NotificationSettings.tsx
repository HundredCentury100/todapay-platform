import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import MobileAppLayout from "@/components/MobileAppLayout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Smartphone, CheckCircle, Calendar, RefreshCw, CreditCard, ArrowUpCircle, MapPin, Sparkles, Bell, BellOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotificationPreferences {
  email_booking_confirmation: boolean;
  email_booking_reminder: boolean;
  email_reschedule_status: boolean;
  email_refund_status: boolean;
  email_upgrade_status: boolean;
  email_trip_updates: boolean;
  email_promotions: boolean;
  app_booking_confirmation: boolean;
  app_booking_reminder: boolean;
  app_reschedule_status: boolean;
  app_refund_status: boolean;
  app_upgrade_status: boolean;
  app_trip_updates: boolean;
  app_promotions: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email_booking_confirmation: true,
  email_booking_reminder: true,
  email_reschedule_status: true,
  email_refund_status: true,
  email_upgrade_status: true,
  email_trip_updates: true,
  email_promotions: false,
  app_booking_confirmation: true,
  app_booking_reminder: true,
  app_reschedule_status: true,
  app_refund_status: true,
  app_upgrade_status: true,
  app_trip_updates: true,
  app_promotions: false,
};

const notificationTypes = [
  {
    key: "booking_confirmation",
    title: "Booking Confirmations",
    description: "When your booking is confirmed",
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    key: "booking_reminder",
    title: "Booking Reminders",
    description: "24 hours before departure",
    icon: Calendar,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    key: "reschedule_status",
    title: "Reschedule Updates",
    description: "About your reschedule requests",
    icon: RefreshCw,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    key: "refund_status",
    title: "Refund Updates",
    description: "About your refund requests",
    icon: CreditCard,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    key: "upgrade_status",
    title: "Upgrade Updates",
    description: "Seat upgrade confirmations",
    icon: ArrowUpCircle,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    key: "trip_updates",
    title: "Trip Updates",
    description: "Important trip information",
    icon: MapPin,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    key: "promotions",
    title: "Promotions & Offers",
    description: "Special deals and discounts",
    icon: Sparkles,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
];

const NotificationSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"email" | "app">("email");
  const { 
    isSupported: pushSupported, 
    permission: pushPermission, 
    isSubscribed: pushSubscribed, 
    isLoading: pushLoading, 
    subscribe: pushSubscribe, 
    unsubscribe: pushUnsubscribe 
  } = usePushNotifications({
    onPermissionGranted: () => toast.success('Push notifications enabled!'),
    onPermissionDenied: () => toast.error('Notifications blocked. Enable in browser settings.')
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { returnTo: "/notifications" } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setPreferences({
          email_booking_confirmation: data.email_booking_confirmation,
          email_booking_reminder: data.email_booking_reminder,
          email_reschedule_status: data.email_reschedule_status,
          email_refund_status: data.email_refund_status,
          email_upgrade_status: data.email_upgrade_status,
          email_trip_updates: data.email_trip_updates,
          email_promotions: data.email_promotions,
          app_booking_confirmation: data.app_booking_confirmation,
          app_booking_reminder: data.app_booking_reminder,
          app_reschedule_status: data.app_reschedule_status,
          app_refund_status: data.app_refund_status,
          app_upgrade_status: data.app_upgrade_status,
          app_trip_updates: data.app_trip_updates,
          app_promotions: data.app_promotions,
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast.error("Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user?.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Preferences saved!");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggleAllForType = (type: "email" | "app", enabled: boolean) => {
    const newPrefs = { ...preferences };
    notificationTypes.forEach((nt) => {
      const key = `${type}_${nt.key}` as keyof NotificationPreferences;
      newPrefs[key] = enabled;
    });
    setPreferences(newPrefs);
    setHasChanges(true);
  };

  const getEnabledCount = (type: "email" | "app") => {
    return notificationTypes.filter(nt => {
      const key = `${type}_${nt.key}` as keyof NotificationPreferences;
      return preferences[key];
    }).length;
  };

  if (authLoading || loading) {
    return (
      <MobileAppLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 animate-pulse" />
              <Loader2 className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-primary" />
            </div>
            <p className="text-muted-foreground">Loading preferences...</p>
          </div>
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Sticky Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 bg-background border-b safe-area-pt"
        >
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <BackButton fallbackPath="/profile" />
              <div className="flex-1">
                <h1 className="font-bold text-lg">Notifications</h1>
                <p className="text-xs text-muted-foreground">Manage your alerts</p>
              </div>
            </div>
          </div>

          {/* Tab Pills */}
          <div className="px-4 pb-3">
            <div className="flex gap-2 p-1 bg-muted rounded-full">
              <button
                onClick={() => setActiveTab("email")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all tap-target",
                  activeTab === "email"
                    ? "bg-background shadow-md text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Mail className="w-4 h-4" />
                Email
                <span className={cn(
                  "w-5 h-5 rounded-full text-xs flex items-center justify-center",
                  activeTab === "email" ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
                )}>
                  {getEnabledCount("email")}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("app")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all tap-target",
                  activeTab === "app"
                    ? "bg-background shadow-md text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Smartphone className="w-4 h-4" />
                In-App
                <span className={cn(
                  "w-5 h-5 rounded-full text-xs flex items-center justify-center",
                  activeTab === "app" ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
                )}>
                  {getEnabledCount("app")}
                </span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="px-4 py-4 space-y-4">
          {/* Push Notifications Master Toggle */}
          {pushSupported && (
            <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  pushSubscribed ? "bg-primary/15" : "bg-muted"
                )}>
                  {pushSubscribed ? (
                    <Bell className="w-6 h-6 text-primary" />
                  ) : (
                    <BellOff className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    {pushPermission === 'denied' 
                      ? 'Blocked — enable in browser settings' 
                      : pushSubscribed 
                        ? 'Receiving push alerts on this device' 
                        : 'Get instant alerts on your device'}
                  </p>
                </div>
                <Switch
                  checked={pushSubscribed}
                  disabled={pushLoading || pushPermission === 'denied'}
                  onCheckedChange={async (checked) => {
                    if (checked) {
                      await pushSubscribe();
                    } else {
                      await pushUnsubscribe();
                    }
                  }}
                  className="shrink-0"
                />
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  {activeTab === "email" ? <Mail className="w-5 h-5 text-primary" /> : <Smartphone className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {activeTab === "email" ? "Email Notifications" : "Push Notifications"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {getEnabledCount(activeTab)} of {notificationTypes.length} enabled
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full text-xs"
                  onClick={() => toggleAllForType(activeTab, false)}
                >
                  Off All
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full text-xs"
                  onClick={() => toggleAllForType(activeTab, true)}
                >
                  On All
                </Button>
              </div>
            </div>
          </Card>

          {/* Notification List */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === "email" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === "email" ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {notificationTypes.map((type, index) => {
                const Icon = type.icon;
                const key = `${activeTab}_${type.key}` as keyof NotificationPreferences;
                const isEnabled = preferences[key];

                return (
                  <motion.div
                    key={key}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
                      <div className="p-4 flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                          isEnabled ? type.bgColor : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "w-6 h-6 transition-colors",
                            isEnabled ? type.color : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{type.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {type.description}
                          </p>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleToggle(key, checked)}
                          className="shrink-0"
                        />
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Fixed Bottom Save Button */}
        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-20 inset-x-0 p-4 bg-background border-t safe-area-pb z-40"
            >
              <div className="flex gap-3 max-w-lg mx-auto">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full h-12"
                  onClick={() => {
                    loadPreferences();
                    setHasChanges(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-full h-12 gap-2"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileAppLayout>
  );
};

export default NotificationSettings;
