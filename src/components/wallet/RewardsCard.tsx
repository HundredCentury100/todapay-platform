import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Gift, Star, ChevronRight, Sparkles } from "lucide-react";
import { LOYALTY_TIERS } from "@/services/profileService";

interface RewardsCardProps {
  points: number;
  tier: string;
  onViewRewards?: () => void;
}

export function RewardsCard({ points, tier, onViewRewards }: RewardsCardProps) {
  const currentTier = LOYALTY_TIERS[tier as keyof typeof LOYALTY_TIERS] || LOYALTY_TIERS.bronze;
  
  // Find next tier
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
  const currentTierIndex = tierOrder.indexOf(tier);
  const nextTier = currentTierIndex < tierOrder.length - 1 
    ? LOYALTY_TIERS[tierOrder[currentTierIndex + 1] as keyof typeof LOYALTY_TIERS]
    : null;

  const pointsToNextTier = nextTier ? nextTier.minPoints - points : 0;
  const progressToNextTier = nextTier 
    ? ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const tierColors = {
    bronze: 'from-amber-700 to-amber-900',
    silver: 'from-slate-400 to-slate-600',
    gold: 'from-yellow-400 to-amber-500',
    platinum: 'from-purple-500 to-indigo-600',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Rewards
          </CardTitle>
          <Badge 
            className={`bg-gradient-to-r ${tierColors[tier as keyof typeof tierColors] || tierColors.bronze} text-white border-0`}
          >
            <Star className="h-3 w-3 mr-1 fill-current" />
            {currentTier.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points Display */}
        <div className="text-center py-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
          <Sparkles className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-3xl font-bold">{points.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Reward Points</p>
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <div>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">Progress to {nextTier.name}</span>
              <span className="font-medium">{pointsToNextTier} points to go</span>
            </div>
            <Progress value={progressToNextTier} className="h-2" />
          </div>
        )}

        {/* Current Benefits */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Your Benefits
          </p>
          <div className="space-y-1">
            {currentTier.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* View All Rewards */}
        {onViewRewards && (
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={onViewRewards}
          >
            <span>View All Rewards</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
