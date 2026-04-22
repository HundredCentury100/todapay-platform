import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Gift, Star, Trophy, Zap, ChevronRight,
  Ticket, Percent, Coffee, Car, Loader2
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import MobileAppLayout from "@/components/MobileAppLayout";
import { PointsActivityBreakdown } from "@/components/wallet/PointsActivityBreakdown";
import { redeemRewardPoints } from "@/services/voucherService";
import { toast } from "sonner";

const tiers = [
  { name: "Bronze", minPoints: 0, color: "from-orange-600 to-orange-700", benefits: ["5% booking discount", "Priority support"] },
  { name: "Silver", minPoints: 1000, color: "from-gray-400 to-gray-500", benefits: ["10% booking discount", "Free cancellation", "Early access"] },
  { name: "Gold", minPoints: 5000, color: "from-amber-500 to-amber-600", benefits: ["15% booking discount", "Free upgrades", "VIP support"] },
  { name: "Platinum", minPoints: 15000, color: "from-slate-600 to-slate-800", benefits: ["20% booking discount", "All Gold benefits", "Exclusive events"] },
];

const rewards = [
  { id: "1", name: "10% Off Next Ride", points: 500, icon: Car, category: "Rides", discountType: "percentage", discountValue: 10, verticals: ["rides"] },
  { id: "2", name: "Free Coffee Voucher", points: 300, icon: Coffee, category: "Partners", discountType: "fixed", discountValue: 5, verticals: [] },
  { id: "3", name: "Event Ticket Discount", points: 750, icon: Ticket, category: "Events", discountType: "percentage", discountValue: 15, verticals: ["event"] },
  { id: "4", name: "15% Off Bus Ticket", points: 400, icon: Percent, category: "Buses", discountType: "percentage", discountValue: 15, verticals: ["bus"] },
];

const RewardsPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const points = profile?.loyalty_points || 0;
  const currentTier = profile?.loyalty_tier || "Bronze";

  const handleRedeem = async (reward: typeof rewards[0]) => {
    if (points < reward.points) {
      toast.error("Not enough points");
      return;
    }
    setRedeemingId(reward.id);
    const result = await redeemRewardPoints(
      reward.points,
      reward.name,
      reward.discountType,
      reward.discountValue,
      reward.verticals
    );
    if (result.success) {
      toast.success(`Redeemed! Voucher code: ${result.voucher_code}`);
      // Points will update on next render via profile hook
    } else {
      toast.error(result.error || "Failed to redeem");
    }
    setRedeemingId(null);
  };

  const currentTierData = tiers.find(t => t.name === currentTier) || tiers[0];
  const nextTier = tiers[tiers.findIndex(t => t.name === currentTier) + 1];
  const progressToNext = nextTier 
    ? Math.min(100, ((points - currentTierData.minPoints) / (nextTier.minPoints - currentTierData.minPoints)) * 100)
    : 100;

  if (!user) {
    return (
      <MobileAppLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
            <Gift className="h-12 w-12 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Earn Rewards</h2>
          <p className="text-muted-foreground mb-8 max-w-[280px]">
            Sign in to start earning points on every booking
          </p>
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className={`bg-gradient-to-br ${currentTierData.color} text-white px-4 pt-12 pb-8 safe-area-pt`}>
          <div className="flex items-center gap-3 mb-6">
            <BackButton className="text-white hover:bg-white/10 -ml-2" fallbackPath="/" />
            <h1 className="text-xl font-bold">Rewards</h1>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-5 w-5" />
                <span className="font-semibold">{currentTier} Member</span>
              </div>
              <p className="text-3xl font-bold">{points.toLocaleString()}</p>
              <p className="text-sm opacity-80">points earned</p>
            </div>
            <div className="h-20 w-20 rounded-2xl bg-white/10 flex items-center justify-center">
              <Star className="h-10 w-10" />
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>{nextTier.minPoints - points} points to {nextTier.name}</span>
                <span>{Math.round(progressToNext)}%</span>
              </div>
              <Progress value={progressToNext} className="h-2 bg-white/20" />
            </div>
          )}
        </div>

        <div className="px-4 py-6 space-y-6 -mt-4">
          {/* Current Benefits */}
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Your Benefits
              </h3>
              <div className="space-y-2">
                {currentTierData.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Rewards */}
          <div>
            <h3 className="font-semibold mb-4">Redeem Points</h3>
            <div className="grid grid-cols-2 gap-3">
              {rewards.map((reward) => (
                <motion.div
                  key={reward.id}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="rounded-xl border-0 shadow-sm h-full">
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <reward.icon className="h-5 w-5 text-primary" />
                      </div>
                      <p className="font-medium text-sm mb-1">{reward.name}</p>
                      <Badge variant="secondary" className="w-fit text-xs mb-3">
                        {reward.category}
                      </Badge>
                      <div className="mt-auto">
                        <Button 
                          size="sm" 
                          className="w-full"
                          disabled={points < reward.points || redeemingId === reward.id}
                          onClick={() => handleRedeem(reward)}
                        >
                          {redeemingId === reward.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : null}
                          {reward.points} pts
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tiers */}
          <div>
            <h3 className="font-semibold mb-4">Membership Tiers</h3>
            <div className="space-y-3">
              {tiers.map((tier) => {
                const isCurrentTier = tier.name === currentTier;
                const isAchieved = points >= tier.minPoints;
                return (
                  <Card 
                    key={tier.name} 
                    className={`rounded-xl border-0 shadow-sm ${isCurrentTier ? "ring-2 ring-primary" : ""}`}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center`}>
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{tier.name}</p>
                          {isCurrentTier && (
                            <Badge variant="default" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tier.minPoints.toLocaleString()}+ points
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Points Activity Breakdown */}
          <PointsActivityBreakdown totalPoints={points} />

          {/* How to Earn */}
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">How to Earn Points</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Every $1 spent</span>
                  <span className="font-medium">+1 point</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">First booking</span>
                  <span className="font-medium">+100 points</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Refer a friend</span>
                  <span className="font-medium">+500 points</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Write a review</span>
                  <span className="font-medium">+50 points</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default RewardsPage;
