import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Ticket, Star, Users, Gift, ShoppingBag, Car, 
  Calendar, TrendingUp, Sparkles
} from "lucide-react";
import { format } from "date-fns";

interface PointsActivity {
  id: string;
  type: 'booking' | 'referral' | 'review' | 'bonus' | 'ride' | 'signup';
  description: string;
  points: number;
  date: string;
}

interface PointsActivityBreakdownProps {
  activities?: PointsActivity[];
  totalPoints?: number;
  isLoading?: boolean;
}

const activityConfig = {
  booking: { icon: Ticket, color: 'text-primary', bgColor: 'bg-primary/10', label: 'Booking' },
  referral: { icon: Users, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Referral' },
  review: { icon: Star, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Review' },
  bonus: { icon: Gift, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Bonus' },
  ride: { icon: Car, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Ride' },
  signup: { icon: Sparkles, color: 'text-pink-500', bgColor: 'bg-pink-500/10', label: 'Welcome' },
};

// Mock data for demo - in production, fetch from database
const mockActivities: PointsActivity[] = [
  { id: '1', type: 'signup', description: 'Welcome bonus', points: 100, date: new Date().toISOString() },
  { id: '2', type: 'booking', description: 'Bus ticket - JHB to Cape Town', points: 45, date: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', type: 'review', description: 'Left a 5-star review', points: 50, date: new Date(Date.now() - 172800000).toISOString() },
  { id: '4', type: 'referral', description: 'Friend signed up with your code', points: 500, date: new Date(Date.now() - 259200000).toISOString() },
];

export function PointsActivityBreakdown({
  activities = mockActivities,
  totalPoints = 0,
  isLoading = false,
}: PointsActivityBreakdownProps) {
  // Calculate breakdown by category
  const breakdown = activities.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + activity.points;
    return acc;
  }, {} as Record<string, number>);

  const sortedBreakdown = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-4 space-y-4">
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mb-1" />
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-4 w-12 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Points Breakdown by Category */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            How You Earned Points
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {sortedBreakdown.map(([type, points], idx) => {
              const config = activityConfig[type as keyof typeof activityConfig] || activityConfig.booking;
              const Icon = config.icon;
              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-3 rounded-xl ${config.bgColor}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
                  </div>
                  <p className="text-lg font-bold">+{points.toLocaleString()}</p>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Recent Points Activity
          </h3>
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity, idx) => {
              const config = activityConfig[activity.type] || activityConfig.booking;
              const Icon = config.icon;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${config.bgColor}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-green-600 bg-green-500/10 font-semibold">
                    +{activity.points}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
