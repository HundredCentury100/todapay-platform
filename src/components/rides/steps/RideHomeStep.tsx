import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Search, Crosshair, History, RotateCcw, Navigation,
  Clock, ChevronRight, Home, Briefcase, Star, MapPin, Calendar,
  Zap, Shield, Users, Sparkles, TrendingUp, Brain, Heart,
  Leaf, PartyPopper, Moon, Sun, Coffee, X, ChevronDown
} from "lucide-react";
import { LazyLocationPicker } from "@/components/maps/LazyLocationPicker";
// Use compact mode - search input only, no embedded map
import { ScheduleRideModal } from "@/components/rides/ScheduleRideModal";
import { getSavedLocations, type SavedLocation } from "@/services/savedLocationsService";
import { cn } from "@/lib/utils";

const SAVED_ICONS: Record<string, React.ReactNode> = {
  home: <Home className="h-4 w-4" />,
  briefcase: <Briefcase className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  'map-pin': <MapPin className="h-4 w-4" />,
};

type RideMood = 'quick' | 'cheap' | 'comfort' | 'premium';

const RIDE_MOODS: { id: RideMood; label: string; icon: React.ReactNode; emoji: string; desc: string; gradient: string }[] = [
  { id: 'quick', label: 'Quick', icon: <Zap className="h-4 w-4" />, emoji: '⚡', desc: 'Fastest arrival', gradient: 'from-amber-500/20 to-orange-500/20' },
  { id: 'cheap', label: 'Save', icon: <Leaf className="h-4 w-4" />, emoji: '💰', desc: 'Best price', gradient: 'from-emerald-500/20 to-green-500/20' },
  { id: 'comfort', label: 'Comfort', icon: <Coffee className="h-4 w-4" />, emoji: '☁️', desc: 'Smooth ride', gradient: 'from-blue-500/20 to-cyan-500/20' },
  { id: 'premium', label: 'Premium', icon: <Star className="h-4 w-4" />, emoji: '✨', desc: 'Luxury experience', gradient: 'from-purple-500/20 to-pink-500/20' },
];

const getTimeSuggestion = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return { text: 'Morning commute?', icon: <Sun className="h-4 w-4 text-amber-500" />, suggestion: 'Work' };
  if (hour >= 11 && hour < 14) return { text: 'Lunch run?', icon: <Coffee className="h-4 w-4 text-amber-700" />, suggestion: 'Food' };
  if (hour >= 17 && hour < 20) return { text: 'Heading home?', icon: <Home className="h-4 w-4 text-primary" />, suggestion: 'Home' };
  if (hour >= 20 || hour < 2) return { text: 'Night out?', icon: <Moon className="h-4 w-4 text-indigo-400" />, suggestion: 'Fun' };
  return { text: 'Going somewhere?', icon: <Navigation className="h-4 w-4 text-primary" />, suggestion: null };
};

interface RideHomeStepProps {
  pickupAddress: string;
  dropoffAddress: string;
  userLocation?: { lat: number; lng: number };
  recentTrips: any[];
  onPickupChange: (address: string, coords: { lat: number; lng: number }) => void;
  onDropoffChange: (address: string, coords: { lat: number; lng: number }) => void;
  onProceed: () => void;
}

export const RideHomeStep = ({
  pickupAddress,
  dropoffAddress,
  userLocation,
  recentTrips,
  onPickupChange,
  onDropoffChange,
  onProceed,
}: RideHomeStepProps) => {
  const navigate = useNavigate();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [selectedMood, setSelectedMood] = useState<RideMood>('quick');
  const [editingField, setEditingField] = useState<'pickup' | 'dropoff' | null>(null);
  const timeSuggestion = getTimeSuggestion();

  useEffect(() => {
    getSavedLocations().then(setSavedLocations);
  }, []);

  const handleSavedLocationTap = async (loc: SavedLocation) => {
    if (loc.lat && loc.lng) {
      onDropoffChange(loc.address, { lat: loc.lat, lng: loc.lng });
      setEditingField(null);
      onProceed();
    }
  };

  const handleRecentTap = async (trip: any) => {
    const addr = trip.ride_request?.dropoff_address || "";
    if (typeof google !== 'undefined' && google?.maps?.Geocoder && addr) {
      try {
        const geocoder = new google.maps.Geocoder();
        const result = await geocoder.geocode({ address: addr });
        if (result?.results?.[0]?.geometry?.location) {
          const loc = result.results[0].geometry.location;
          onDropoffChange(addr, { lat: loc.lat(), lng: loc.lng() });
        } else { onDropoffChange(addr, { lat: 0, lng: 0 }); }
      } catch { onDropoffChange(addr, { lat: 0, lng: 0 }); }
    } else { onDropoffChange(addr, { lat: 0, lng: 0 }); }
    setEditingField(null);
    onProceed();
  };

  const nearbyRiders = Math.floor(Math.random() * 12) + 8;

  // When a field is being edited, show the search inline
  const isEditing = editingField !== null;

  return (
    <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative z-30 flex flex-col">

      {/* Header */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full press-effect" onClick={() => {
            if (isEditing) { setEditingField(null); } else { navigate(-1); }
          }}>
            {isEditing ? <X className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          </Button>
          <div className="flex-1 flex items-center gap-1.5">
            {timeSuggestion.icon}
            <h1 className="text-base font-bold text-foreground">
              {isEditing ? (editingField === 'pickup' ? 'Set pickup' : 'Where to?') : timeSuggestion.text}
            </h1>
          </div>
          {!isEditing && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-600">{nearbyRiders} nearby</span>
            </div>
          )}
        </div>
      </div>

      {/* Location inputs */}
      <div className="px-4 pb-2">
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="flex">
            <div className="flex flex-col items-center py-3 pl-3 gap-0">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-3 w-3 rounded-full border-2 border-emerald-500 bg-emerald-500/20"
              />
              <div className="w-[1.5px] flex-1 bg-gradient-to-b from-emerald-500/50 via-border to-primary/50 my-0.5" style={{ minHeight: 14 }} />
              <div className="h-3 w-3 rounded-sm border-2 border-primary bg-primary/20" />
            </div>
            <div className="flex-1">
              <button
                onClick={() => setEditingField('pickup')}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2.5 text-left transition-colors touch-manipulation",
                  editingField === 'pickup' ? "bg-muted/50" : "active:bg-muted/50"
                )}
              >
                <span className={cn("text-[13px] flex-1 truncate", pickupAddress && pickupAddress !== "Set pickup location" ? "text-foreground font-medium" : "text-muted-foreground")}>
                  {pickupAddress || "Set pickup location"}
                </span>
                <Crosshair className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              </button>

              <div className="h-px bg-border mx-2.5" />

              <button
                onClick={() => setEditingField('dropoff')}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2.5 text-left transition-colors touch-manipulation",
                  editingField === 'dropoff' ? "bg-muted/50" : "active:bg-muted/50"
                )}
              >
                <span className={cn("text-[13px] flex-1 truncate", dropoffAddress ? "text-foreground font-medium" : "text-muted-foreground")}>
                  {dropoffAddress || "Where to?"}
                </span>
                <Search className="h-3.5 w-3.5 text-primary shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {editingField === 'pickup' && (
          <motion.div
            key="pickup-search"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3"
          >
            <Button variant="outline" className="w-full justify-start gap-2 h-10 rounded-lg mb-2 text-[13px]" onClick={async () => {
              if (userLocation) {
                if (typeof google !== 'undefined') {
                  try {
                    const geocoder = new google.maps.Geocoder();
                    const result = await geocoder.geocode({ location: userLocation });
                    onPickupChange(result?.results?.[0]?.formatted_address || "Current Location", userLocation);
                  } catch { onPickupChange("Current Location", userLocation); }
                } else { onPickupChange("Current Location", userLocation); }
              } else {
                onPickupChange("Current Location", { lat: 0, lng: 0 });
              }
              setEditingField(null);
            }}>
              <Crosshair className="h-3.5 w-3.5 text-primary" />
              Use current location
            </Button>
            <LazyLocationPicker
              compact
              placeholder="Search pickup location..."
              biasLocation={userLocation}
              onLocationSelect={(loc) => {
                onPickupChange(loc.address, { lat: loc.lat, lng: loc.lng });
                setEditingField(null);
              }}
            />
          </motion.div>
        )}

        {editingField === 'dropoff' && (
          <motion.div
            key="dropoff-search"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3"
          >
            <LazyLocationPicker
              compact
              placeholder="Search destination..."
              biasLocation={userLocation}
              onLocationSelect={(loc) => {
                onDropoffChange(loc.address, { lat: loc.lat, lng: loc.lng });
                setEditingField(null);
                onProceed();
              }}
            />

            {savedLocations.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Saved places</p>
                <div className="space-y-0.5">
                  {savedLocations.slice(0, 4).map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => handleSavedLocationTap(loc)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {SAVED_ICONS[loc.icon || 'map-pin'] || <MapPin className="h-3.5 w-3.5" />}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-[13px] font-medium text-foreground">{loc.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{loc.address.split(',')[0]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recentTrips.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Recent</p>
                <div className="space-y-0.5">
                  {recentTrips.slice(0, 3).map((trip: any) => (
                    <button
                      key={trip.id}
                      onClick={() => handleRecentTap(trip)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation"
                    >
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <History className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{trip.ride_request?.dropoff_address?.split(',')[0] || 'Unknown'}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{trip.ride_request?.pickup_address?.split(',')[0] || ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── DEFAULT CONTENT ── */}
        {!isEditing && (
          <motion.div
            key="default-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Action pills */}
            <div className="px-4 pb-2">
              <div className="flex gap-1.5">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold press-effect border border-primary/20">
                  <Zap className="h-3 w-3" />
                  Now
                </button>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-[11px] font-medium press-effect"
                >
                  <Calendar className="h-3 w-3" />
                  Schedule
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-[11px] font-medium press-effect">
                  <Users className="h-3 w-3" />
                  Split fare
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-[11px] font-medium press-effect">
                  <Shield className="h-3 w-3" />
                  Safety
                </button>
              </div>
            </div>

            {/* Mood selector */}
            <div className="px-4 pb-2">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {RIDE_MOODS.map((mood) => (
                  <motion.button
                    key={mood.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedMood(mood.id)}
                    className={cn(
                      "relative flex flex-col items-center min-w-[68px] py-2 px-2.5 rounded-xl border transition-all touch-manipulation",
                      selectedMood === mood.id
                        ? "border-primary bg-primary/8 shadow-sm"
                        : "border-border/50 bg-card hover:border-primary/30"
                    )}
                  >
                    <span className="text-lg mb-0">{mood.emoji}</span>
                    <span className={cn("text-[11px] font-bold leading-tight", selectedMood === mood.id ? "text-primary" : "text-foreground")}>
                      {mood.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground leading-tight">{mood.desc}</span>
                    {selectedMood === mood.id && (
                      <motion.div layoutId="mood-indicator" className="absolute -bottom-0.5 w-6 h-0.5 rounded-full bg-primary" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* AI Smart suggestion */}
            {recentTrips.length > 0 && (
              <div className="px-4 pb-2">
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => handleRecentTap(recentTrips[0])}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-primary/8 via-primary/5 to-transparent border border-primary/15 press-effect touch-manipulation"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-primary">Smart suggestion</span>
                      <Sparkles className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-[13px] font-medium text-foreground truncate">
                      {recentTrips[0]?.ride_request?.dropoff_address?.split(',')[0] || 'Your usual destination'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">One tap</Badge>
                </motion.button>
              </div>
            )}

            {/* Saved places */}
            {savedLocations.length > 0 && (
              <div className="px-4 pb-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Quick access</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {savedLocations.slice(0, 4).map((loc, i) => (
                    <motion.button
                      key={loc.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.04 }}
                      onClick={() => handleSavedLocationTap(loc)}
                      className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/50 press-effect hover:bg-muted/50 transition-colors touch-manipulation"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {SAVED_ICONS[loc.icon || 'map-pin'] || <MapPin className="h-3.5 w-3.5" />}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-[11px] font-bold text-foreground">{loc.name}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{loc.address.split(',')[0]}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent trips */}
            {recentTrips.length > 0 && (
              <div className="px-4 pb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recent rides</p>
                  <button onClick={() => navigate('/rides')} className="text-[11px] text-primary font-semibold press-effect">
                    See all
                  </button>
                </div>
                <div className="space-y-0.5">
                  {recentTrips.slice(0, 5).map((trip: any, i: number) => (
                    <motion.button
                      key={trip.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.04 }}
                      onClick={() => handleRecentTap(trip)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation press-effect"
                    >
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <History className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[13px] font-medium truncate text-foreground">{trip.ride_request?.dropoff_address?.split(',')[0] || 'Unknown'}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{trip.ride_request?.pickup_address?.split(',')[0] || ''}</p>
                      </div>
                      <RotateCcw className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {recentTrips.length === 0 && savedLocations.length === 0 && (
              <div className="text-center py-8 px-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mx-auto mb-4 flex items-center justify-center"
                >
                  <Navigation className="h-10 w-10 text-primary" />
                </motion.div>
                <h3 className="font-bold text-base text-foreground mb-0.5">Ready to go?</h3>
                <p className="text-[13px] text-muted-foreground">Enter a destination above to get started</p>
              </div>
            )}

            {/* Safety badge */}
            <div className="px-4 pb-3">
              <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <Shield className="h-3 w-3 text-emerald-600" />
                <span className="text-[10px] font-medium text-emerald-700">All rides monitored · PIN-verified pickups · 24/7 safety team</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScheduleRideModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
      />
    </motion.div>
  );
};
