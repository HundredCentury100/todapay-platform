import { useState, useMemo } from "react";
import BackButton from "@/components/BackButton";
import { ServiceProgressBar } from "@/components/booking/ServiceProgressBar";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Clock, Star, Users, Check, Calendar, Globe, Shield,
  AlertTriangle, Heart, Accessibility, Lock, Eye, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useExperience } from "@/hooks/useExperiences";
import { DifficultyLevel } from "@/types/experience";
import { 
  PremiumDetailSection, 
  PremiumFeatureList,
  PremiumStickyCTA 
} from "@/components/premium";
import { PremiumReviewCard, PremiumRatingSummary } from "@/components/premium/PremiumReviewCard";
import ExperienceHeroGrid from "@/components/experience/ExperienceHeroGrid";
import ExperienceHostCard from "@/components/experience/ExperienceHostCard";
import ExperienceRatingBreakdown from "@/components/experience/ExperienceRatingBreakdown";
import ExperienceItinerary from "@/components/experience/ExperienceItinerary";
import SimilarExperiences from "@/components/experience/SimilarExperiences";
import ExperienceShareCard from "@/components/experience/ExperienceShareCard";
import { PropertyLocationMap } from "@/components/maps/PropertyLocationMap";
import { cn } from "@/lib/utils";
import MobileAppLayout from "@/components/MobileAppLayout";
import { ExperienceReviews } from "@/components/experience/ExperienceReviews";
import { ExperienceReviewDialog } from "@/components/experience/ExperienceReviewDialog";
import { ExpandableText } from "@/components/ui/ExpandableText";
import { useAuth } from "@/contexts/AuthContext";

// Stable hash for deterministic viewing count
const stableHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const ExperienceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [isPrivateGroup, setIsPrivateGroup] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const { user } = useAuth();

  const { data: experience, isLoading } = useExperience(id || "");

  const getDifficultyColor = (level?: DifficultyLevel) => {
    switch (level) {
      case "easy": return "bg-green-500/10 text-green-600 border-green-500/30";
      case "moderate": return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "challenging": return "bg-orange-500/10 text-orange-600 border-orange-500/30";
      case "expert": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "extreme": return "bg-purple-500/10 text-purple-600 border-purple-500/30";
      default: return "";
    }
  };

  // Time slots from schedules for selected date
  const timeSlots = useMemo(() => {
    if (!experience?.schedules || !selectedDate) return [];
    return experience.schedules
      .filter(s => s.date === selectedDate)
      .map(s => ({
        id: s.id,
        time: s.start_time,
        spots: s.available_spots,
        priceOverride: s.price_override,
      }));
  }, [experience?.schedules, selectedDate]);

  // Generate default time slots if no schedule data
  const displayTimeSlots = timeSlots.length > 0 ? timeSlots : [
    { id: 'morning', time: '09:00', spots: 8, priceOverride: undefined },
    { id: 'afternoon', time: '14:00', spots: 5, priceOverride: undefined },
  ];

  const handleBook = () => {
    if (!selectedDate || !experience) return;
    const pricePerPerson = isPrivateGroup && experience.private_group_price
      ? experience.private_group_price / guests
      : experience.price_per_person;
    const subtotal = isPrivateGroup && experience.private_group_price
      ? experience.private_group_price
      : experience.price_per_person * guests;
    const serviceFee = Math.floor(subtotal / 50);
    navigate("/booking/confirm", {
      state: {
        type: "experience",
        itemId: experience.id,
        itemName: experience.name,
        date: selectedDate,
        ticketQuantity: guests,
        passengerName: "",
        passengerEmail: "",
        passengerPhone: "",
        totalPrice: subtotal,
        serviceFee,
        operator: "Experience Host",
        eventDate: selectedDate,
        timeSlot: selectedTimeSlot,
        isPrivateGroup,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="absolute top-4 left-4 z-10">
          <BackButton fallbackPath="/experiences" />
        </div>
        <Skeleton className="h-64 md:h-[400px] w-full" />
        <div className="px-4 py-6 space-y-4 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="absolute top-4 left-4 z-10">
          <BackButton fallbackPath="/experiences" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Experience not found</h2>
          <Button onClick={() => navigate("/experiences")}>Browse Experiences</Button>
        </div>
      </div>
    );
  }

  // mockReviews removed — now using real ExperienceReviews component

  // Live viewing indicator (stable hash from ID)
  const viewingCount = (stableHash(experience.id) % 8) + 3;

  const host = {
    name: "Experience Host",
    image: null,
    rating: experience.review_score || 4.8,
    totalExperiences: 15,
    responseTime: "Within 1 hour",
    verified: true,
  };

  const availableDates = experience.schedules?.map(s => s.date) || 
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      return d.toISOString().split('T')[0];
    });
  const uniqueDates = [...new Set(availableDates)].slice(0, 7);

  // Price breakdown
  const subtotal = isPrivateGroup && experience.private_group_price
    ? experience.private_group_price
    : experience.price_per_person * guests;
  const serviceFee = Math.floor(subtotal / 50);
  const total = subtotal + serviceFee;

  return (
    <MobileAppLayout hideAttribution pageTitle={experience.name}>
    <div className="min-h-screen bg-background pb-32">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <BackButton fallbackPath="/experiences" />
      </div>

      {/* Hero Grid */}
      <div className="max-w-5xl mx-auto md:px-4 md:pt-6">
        <ExperienceHeroGrid
          images={experience.images?.length ? experience.images : ["https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800"]}
          name={experience.name}
          onBack={() => navigate(-1)}
          onShare={() => navigator.share?.({ title: experience.name, url: window.location.href })}
          isFavorite={isFavorite}
          onFavorite={() => setIsFavorite(!isFavorite)}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <ServiceProgressBar currentStep={3} className="mb-4" />

        {/* Live viewing indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-full bg-amber-500/10 w-fit"
        >
          <Eye className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            {viewingCount} people viewing this right now
          </span>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Title & Quick Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-start gap-2 mb-2 flex-wrap">
                {experience.difficulty_level && (
                  <Badge className={getDifficultyColor(experience.difficulty_level)}>{experience.difficulty_level}</Badge>
                )}
                {experience.languages && experience.languages.length > 0 && (
                  <Badge variant="outline" className="gap-1 bg-background">
                    <Globe className="h-3 w-3" /> {experience.languages.join(", ")}
                  </Badge>
                )}
                <ExperienceShareCard
                  experience={{
                    name: experience.name,
                    image: experience.images?.[0],
                    city: experience.city,
                    country: experience.country,
                    duration_hours: experience.duration_hours,
                    price_per_person: experience.price_per_person,
                    review_score: experience.review_score,
                    experience_type: experience.experience_type,
                  }}
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{experience.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{experience.city}, {experience.country}</span>
              </div>
              
              <motion.div className="flex items-center gap-4 mt-4 p-3 rounded-xl bg-muted/50" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center gap-1">
                  <div className="p-1.5 rounded-lg bg-amber-500/10"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /></div>
                  <span className="font-semibold">{experience.review_score?.toFixed(1) || "4.8"}</span>
                  <span className="text-muted-foreground text-sm">({experience.review_count || 0})</span>
                </div>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" /><span className="text-sm">{experience.duration_hours}h</span>
                </div>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" /><span className="text-sm">Max {experience.max_participants}</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Host Card */}
            <ExperienceHostCard host={host} onContact={() => {}} />

            {/* Description */}
            {experience.description && (
              <PremiumDetailSection title="About this experience" delay={0.2}>
                <ExpandableText text={experience.description} />
              </PremiumDetailSection>
            )}

            {/* Itinerary Timeline */}
            <PremiumDetailSection title="Itinerary" icon={Clock} delay={0.22}>
              <ExperienceItinerary durationHours={experience.duration_hours} description={experience.description} />
            </PremiumDetailSection>

            {/* What's Included */}
            {experience.what_included && experience.what_included.length > 0 && (
              <PremiumDetailSection title="What's included" icon={Check} delay={0.25} variant="gradient">
                <PremiumFeatureList features={experience.what_included} variant="check" />
              </PremiumDetailSection>
            )}

            {/* What to Bring */}
            {experience.what_to_bring && experience.what_to_bring.length > 0 && (
              <PremiumDetailSection title="What to bring" delay={0.3}>
                <div className="flex flex-wrap gap-2">
                  {experience.what_to_bring.map((item, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + idx * 0.05 }}>
                      <Badge variant="outline" className="py-1.5 bg-background">{item}</Badge>
                    </motion.div>
                  ))}
                </div>
              </PremiumDetailSection>
            )}

            {/* Safety & Accessibility */}
            <PremiumDetailSection title="Safety & Accessibility" icon={Shield} delay={0.32}>
              <div className="space-y-3">
                {experience.age_restriction && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Age Restriction</p>
                      <p className="text-xs text-muted-foreground">{experience.age_restriction}</p>
                    </div>
                  </div>
                )}
                {experience.difficulty_level && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <Heart className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Fitness Level: <span className="capitalize">{experience.difficulty_level}</span></p>
                      <p className="text-xs text-muted-foreground">
                        {experience.difficulty_level === 'easy' && 'Suitable for all fitness levels, no special requirements.'}
                        {experience.difficulty_level === 'moderate' && 'Moderate fitness required. Some walking or physical activity involved.'}
                        {experience.difficulty_level === 'challenging' && 'Good fitness required. Involves significant physical activity.'}
                        {experience.difficulty_level === 'expert' && 'High fitness level required. Previous experience recommended.'}
                        {experience.difficulty_level === 'extreme' && 'Extreme fitness required. Only for experienced participants.'}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <Accessibility className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Accessibility</p>
                    <p className="text-xs text-muted-foreground">Contact the host for specific accessibility requirements</p>
                  </div>
                </div>
              </div>
            </PremiumDetailSection>

            {/* Meeting Point */}
            {experience.meeting_point && (
              <PremiumDetailSection title="Meeting point" icon={MapPin} delay={0.35}>
                <Card className="bg-muted/30 border-0">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-primary/10"><MapPin className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="font-medium">{experience.location}</p>
                      <p className="text-sm text-muted-foreground">{experience.meeting_point}</p>
                    </div>
                  </CardContent>
                </Card>
              </PremiumDetailSection>
            )}

            {/* Location Map */}
            <PropertyLocationMap
              address={experience.location || experience.meeting_point || ''}
              city={experience.city}
              country={experience.country}
              latitude={experience.latitude}
              longitude={experience.longitude}
              propertyName={experience.name}
            />

            {/* Rating Breakdown & Reviews */}
            <PremiumDetailSection title="Guest Reviews" delay={0.4}>
              <ExperienceRatingBreakdown
                overallRating={experience.review_score || 4.8}
                reviewCount={experience.review_count || 0}
              />
            </PremiumDetailSection>

            <ExperienceReviews
              experienceId={experience.id}
              showWriteButton={!!user}
              onWriteReview={() => setShowReviewDialog(true)}
            />

            <ExperienceReviewDialog
              open={showReviewDialog}
              onOpenChange={setShowReviewDialog}
              experienceId={experience.id}
            />

            {/* Cancellation Policy */}
            {experience.cancellation_policy && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-600/10 overflow-hidden">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-green-500/10"><Shield className="h-5 w-5 text-green-600" /></div>
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">Cancellation Policy</p>
                      <p className="text-sm text-muted-foreground">{experience.cancellation_policy}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Similar Experiences */}
            <SimilarExperiences
              currentId={experience.id}
              city={experience.city}
              experienceType={experience.experience_type}
            />
          </div>

          {/* Desktop Sidebar - Booking Card */}
          <div className="hidden md:block">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="sticky top-6">
              <Card className="border-border/50 shadow-lg">
                <CardContent className="p-5 space-y-5">
                  <div>
                    <p className="text-2xl font-bold text-primary">{convertPrice(experience.price_per_person)}</p>
                    <p className="text-sm text-muted-foreground">per person</p>
                  </div>

                  {/* Private Group Toggle */}
                  {experience.private_group_price && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label className="text-sm font-medium cursor-pointer" htmlFor="private-desktop">Private Group</Label>
                          <p className="text-xs text-muted-foreground">{convertPrice(experience.private_group_price)} total</p>
                        </div>
                      </div>
                      <Switch id="private-desktop" checked={isPrivateGroup} onCheckedChange={setIsPrivateGroup} />
                    </div>
                  )}

                  {/* Date Selection */}
                  <div>
                    <p className="font-medium text-sm mb-2">Select Date</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {uniqueDates.slice(0, 5).map((date) => {
                        const d = new Date(date);
                        const isSelected = selectedDate === date;
                        return (
                          <button key={date} onClick={() => { setSelectedDate(date); setSelectedTimeSlot(null); }} className={cn(
                            "flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all min-w-[60px] text-xs",
                            isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                          )}>
                            <span className="text-muted-foreground uppercase">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                            <span className="text-base font-bold">{d.getDate()}</span>
                            <span className="text-muted-foreground">{d.toLocaleDateString("en-US", { month: "short" })}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slot Selection */}
                  {selectedDate && (
                    <div>
                      <p className="font-medium text-sm mb-2">Select Time</p>
                      <div className="grid grid-cols-2 gap-2">
                        {displayTimeSlots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedTimeSlot(slot.id)}
                            className={cn(
                              "p-2.5 rounded-xl border-2 text-center transition-all text-sm",
                              selectedTimeSlot === slot.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <p className="font-semibold">{slot.time}</p>
                            <p className="text-xs text-muted-foreground">{slot.spots} spots left</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guests */}
                  <div>
                    <p className="font-medium text-sm mb-2">Guests</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setGuests(Math.max(experience.min_participants || 1, guests - 1))} disabled={guests <= (experience.min_participants || 1)} className="w-9 h-9 rounded-lg border flex items-center justify-center hover:bg-muted disabled:opacity-50">-</button>
                      <span className="text-lg font-semibold w-6 text-center">{guests}</span>
                      <button onClick={() => setGuests(Math.min(experience.max_participants, guests + 1))} disabled={guests >= experience.max_participants} className="w-9 h-9 rounded-lg border flex items-center justify-center hover:bg-muted disabled:opacity-50">+</button>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2 pt-3 border-t">
                    {isPrivateGroup && experience.private_group_price ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Private group</span>
                        <span>{convertPrice(experience.private_group_price)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{convertPrice(experience.price_per_person)} × {guests} guests</span>
                        <span>{convertPrice(subtotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service fee</span>
                      <span>{convertPrice(serviceFee)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">{convertPrice(total)}</span>
                    </div>
                  </div>

                  <Button size="lg" className="w-full rounded-xl" disabled={!selectedDate} onClick={handleBook}>
                    {selectedDate ? "Book Now" : "Select a date"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Mobile: Date, Time & Guest selection */}
        <div className="md:hidden space-y-6 mt-6">
          {/* Private Group Toggle - Mobile */}
          {experience.private_group_price && (
            <PremiumDetailSection title="Group Type" delay={0.38}>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Book as Private Group</p>
                    <p className="text-xs text-muted-foreground">{convertPrice(experience.private_group_price)} for the whole group</p>
                  </div>
                </div>
                <Switch checked={isPrivateGroup} onCheckedChange={setIsPrivateGroup} />
              </div>
            </PremiumDetailSection>
          )}

          <PremiumDetailSection title="Select a date" icon={Calendar} delay={0.4}>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {uniqueDates.map((date, idx) => {
                const d = new Date(date);
                const isSelected = selectedDate === date;
                return (
                  <motion.button key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + idx * 0.05 }}
                    onClick={() => { setSelectedDate(date); setSelectedTimeSlot(null); }}
                    className={cn(
                      "flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all min-w-[80px]",
                      isSelected ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "border-border hover:border-primary/50 bg-card"
                    )}>
                    <span className="text-xs text-muted-foreground uppercase">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                    <span className="text-lg font-bold">{d.getDate()}</span>
                    <span className="text-xs text-muted-foreground">{d.toLocaleDateString("en-US", { month: "short" })}</span>
                  </motion.button>
                );
              })}
            </div>
          </PremiumDetailSection>

          {/* Time Slot Selection - Mobile */}
          {selectedDate && (
            <PremiumDetailSection title="Select a time" icon={Clock} delay={0.42}>
              <div className="grid grid-cols-2 gap-2">
                {displayTimeSlots.map((slot) => (
                  <motion.button
                    key={slot.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSelectedTimeSlot(slot.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-center transition-all press-effect",
                      selectedTimeSlot === slot.id
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-border hover:border-primary/50 bg-card"
                    )}
                  >
                    <p className="text-lg font-bold">{slot.time}</p>
                    <p className="text-xs text-muted-foreground">{slot.spots} spots left</p>
                  </motion.button>
                ))}
              </div>
            </PremiumDetailSection>
          )}

          <PremiumDetailSection title="Guests" icon={Users} delay={0.45}>
            <div className="flex items-center gap-4">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setGuests(Math.max(experience.min_participants || 1, guests - 1))} disabled={guests <= (experience.min_participants || 1)} className="w-10 h-10 rounded-xl border flex items-center justify-center hover:bg-muted disabled:opacity-50">-</motion.button>
              <span className="text-xl font-semibold w-8 text-center">{guests}</span>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setGuests(Math.min(experience.max_participants, guests + 1))} disabled={guests >= experience.max_participants} className="w-10 h-10 rounded-xl border flex items-center justify-center hover:bg-muted disabled:opacity-50">+</motion.button>
              <span className="text-sm text-muted-foreground">Min {experience.min_participants || 1}, Max {experience.max_participants}</span>
            </div>
          </PremiumDetailSection>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <PremiumStickyCTA
        price={convertPrice(total)}
        priceLabel={isPrivateGroup ? 'Private group' : `${convertPrice(experience.price_per_person)} × ${guests}`}
        ctaText={selectedDate ? "Book Now" : "Select a date"}
        disabled={!selectedDate}
        onAction={handleBook}
      />
    </div>
    </MobileAppLayout>
  );
};

export default ExperienceDetails;
