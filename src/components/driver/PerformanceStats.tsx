import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Award } from "lucide-react";
import { DriverProfile } from "@/hooks/useDriverProfile";

interface PerformanceStatsProps {
  driver: DriverProfile;
}

export function PerformanceStats({ driver }: PerformanceStatsProps) {
  const stats = [
    {
      label: 'Acceptance Rate',
      value: driver.acceptance_rate,
      target: 85,
      icon: Target,
      trend: driver.acceptance_rate >= 85 ? 'up' : 'down',
      description: 'Target: 85%',
    },
    {
      label: 'Cancellation Rate',
      value: driver.cancellation_rate,
      target: 5,
      icon: TrendingDown,
      inverted: true, // Lower is better
      trend: driver.cancellation_rate <= 5 ? 'up' : 'down',
      description: 'Keep below 5%',
    },
    {
      label: 'Rating',
      value: driver.rating * 20, // Convert 5-star to percentage
      target: 90,
      icon: Award,
      displayValue: driver.rating.toFixed(1),
      trend: driver.rating >= 4.5 ? 'up' : 'down',
      description: 'Target: 4.5★',
    },
  ];

  const getProgressColor = (value: number, target: number, inverted?: boolean) => {
    const isGood = inverted ? value <= target : value >= target;
    return isGood ? 'bg-green-500' : 'bg-yellow-500';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const displayValue = stat.displayValue ?? `${stat.value}%`;
          const progressValue = stat.inverted ? 100 - stat.value : stat.value;

          return (
            <div key={stat.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{stat.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{displayValue}</span>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
              <Progress
                value={progressValue}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </div>
          );
        })}

        {/* Overall Score */}
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-center">
          <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
          <p className="text-3xl font-bold text-primary">
            {Math.round((driver.acceptance_rate + (100 - driver.cancellation_rate) + driver.rating * 20) / 3)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on acceptance, cancellation, and rating
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
