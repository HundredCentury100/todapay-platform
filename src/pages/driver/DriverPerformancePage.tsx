import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  ThumbsUp,
  Award,
  Target,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceStats {
  rating: number;
  totalRides: number;
  completionRate: number;
  acceptanceRate: number;
  onTimeRate: number;
  tier: string;
}

const DriverPerformancePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PerformanceStats>({
    rating: 0,
    totalRides: 0,
    completionRate: 0,
    acceptanceRate: 0,
    onTimeRate: 0,
    tier: "Bronze",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPerformance();
    }
  }, [user]);

  const loadPerformance = async () => {
    if (!user) return;
    try {
      const { data: driver, error } = await supabase
        .from("drivers")
        .select("id, rating, total_rides, acceptance_rate")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (driver) {
        // Calculate tier based on rides
        let tier = "Bronze";
        if (driver.total_rides >= 500) tier = "Platinum";
        else if (driver.total_rides >= 200) tier = "Gold";
        else if (driver.total_rides >= 50) tier = "Silver";

        // Fetch real completion and on-time rates from active_rides
        let completionRate = 0;
        let onTimeRate = 0;

        const { data: rides } = await supabase
          .from("active_rides")
          .select("status, pickup_time, driver_arrived_at")
          .eq("driver_id", driver.id as string);

        if (rides && rides.length > 0) {
          const completed = rides.filter((r: any) => r.status === "completed").length;
          completionRate = Math.round((completed / rides.length) * 100);

          // On-time: driver arrived before or within 5 min of pickup
          const onTime = rides.filter((r: any) => {
            if (!r.pickup_time || !r.driver_arrived_at) return false;
            const pickup = new Date(r.pickup_time).getTime();
            const arrived = new Date(r.driver_arrived_at).getTime();
            return arrived <= pickup + 5 * 60 * 1000;
          }).length;
          const ridesWithPickup = rides.filter((r: any) => r.pickup_time && r.driver_arrived_at).length;
          onTimeRate = ridesWithPickup > 0 ? Math.round((onTime / ridesWithPickup) * 100) : 0;
        }

        setStats({
          rating: driver.rating || 4.5,
          totalRides: driver.total_rides || 0,
          completionRate,
          acceptanceRate: driver.acceptance_rate || 85,
          onTimeRate,
          tier,
        });
      }
    } catch (error) {
      console.error("Error loading performance:", error);
    } finally {
      setLoading(false);
    }
  };

  const tierColors: Record<string, string> = {
    Bronze: "text-amber-700 bg-amber-100",
    Silver: "text-slate-600 bg-slate-100",
    Gold: "text-amber-500 bg-amber-50",
    Platinum: "text-purple-600 bg-purple-100",
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Performance</h1>
        <p className="text-sm text-muted-foreground">
          Track your driving performance and ratings
        </p>
      </div>

      {/* Rating & Tier Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-8 w-8 text-primary fill-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.rating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Overall Rating</p>
              </div>
            </div>
            <Badge className={tierColors[stats.tier]}>
              <Award className="h-3 w-3 mr-1" />
              {stats.tier}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Rides"
          value={stats.totalRides.toString()}
          iconColor="text-blue-600"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          icon={CheckCircle}
          label="Completion Rate"
          value={`${stats.completionRate}%`}
          iconColor="text-green-600"
          bgColor="bg-green-500/10"
        />
        <StatCard
          icon={ThumbsUp}
          label="Acceptance Rate"
          value={`${stats.acceptanceRate}%`}
          iconColor="text-purple-600"
          bgColor="bg-purple-500/10"
        />
        <StatCard
          icon={Clock}
          label="On-Time Rate"
          value={`${stats.onTimeRate}%`}
          iconColor="text-orange-600"
          bgColor="bg-orange-500/10"
        />
      </div>

      {/* Progress to Next Tier */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Progress to Next Tier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.tier === "Platinum" ? (
            <p className="text-sm text-muted-foreground">
              Congratulations! You've reached the highest tier.
            </p>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span>{stats.tier}</span>
                <span>
                  {stats.tier === "Bronze"
                    ? "Silver (50 rides)"
                    : stats.tier === "Silver"
                    ? "Gold (200 rides)"
                    : "Platinum (500 rides)"}
                </span>
              </div>
              <Progress
                value={
                  stats.tier === "Bronze"
                    ? (stats.totalRides / 50) * 100
                    : stats.tier === "Silver"
                    ? ((stats.totalRides - 50) / 150) * 100
                    : ((stats.totalRides - 200) / 300) * 100
                }
              />
              <p className="text-xs text-muted-foreground">
                {stats.tier === "Bronze"
                  ? `${50 - stats.totalRides} more rides to Silver`
                  : stats.tier === "Silver"
                  ? `${200 - stats.totalRides} more rides to Gold`
                  : `${500 - stats.totalRides} more rides to Platinum`}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-medium text-sm mb-2">Performance Tips</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Accept more ride requests to improve your acceptance rate</li>
            <li>• Arrive on time to pickups for better on-time scores</li>
            <li>• Complete rides without cancellation for higher ratings</li>
            <li>• Higher tiers unlock better earning opportunities</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  iconColor,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor: string;
  bgColor: string;
}) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`p-2 rounded-full ${bgColor}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default DriverPerformancePage;
