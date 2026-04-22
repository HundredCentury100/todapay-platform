import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Car, 
  TrendingUp, 
  Users, 
  Coins, 
  Clock, 
  XCircle,
  CheckCircle,
  Calendar,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface RideStats {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  totalCreditsUsed: number;
  averageFare: number;
  averageDuration: number;
  activeDrivers: number;
  completionRate: number;
}

interface CancellationStats {
  reason: string;
  count: number;
  cancelledBy: string;
}

export default function RideAnalytics() {
  const [dateRange, setDateRange] = useState('7');

  const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
  const endDate = endOfDay(new Date());

  // Fetch ride statistics
  const { data: rideStats, isLoading: loadingStats } = useQuery({
    queryKey: ['ride-analytics', dateRange],
    queryFn: async (): Promise<RideStats> => {
      // Get completed rides
      const { data: completedRides, error: completedError } = await supabase
        .from('active_rides')
        .select('id, final_price, pickup_time, dropoff_time')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (completedError) throw completedError;

      // Get cancelled rides count
      const { count: cancelledCount } = await supabase
        .from('ride_cancellations')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get active drivers
      const { count: activeDrivers } = await supabase
        .from('drivers')
        .select('id', { count: 'exact' })
        .eq('status', 'active')
        .eq('is_online', true);

      const totalRides = (completedRides?.length || 0) + (cancelledCount || 0);
      const totalCreditsUsed = 0; // Credits system removed
      const totalFares = completedRides?.reduce((sum, r) => sum + (r.final_price || 0), 0) || 0;
      
      // Calculate average duration in minutes
      const durations = completedRides?.filter(r => r.pickup_time && r.dropoff_time)
        .map(r => {
          const pickup = new Date(r.pickup_time!);
          const dropoff = new Date(r.dropoff_time!);
          return (dropoff.getTime() - pickup.getTime()) / 60000;
        }) || [];
      
      const avgDuration = durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0;

      return {
        totalRides,
        completedRides: completedRides?.length || 0,
        cancelledRides: cancelledCount || 0,
        totalCreditsUsed,
        averageFare: completedRides?.length ? totalFares / completedRides.length : 0,
        averageDuration: avgDuration,
        activeDrivers: activeDrivers || 0,
        completionRate: totalRides > 0 ? ((completedRides?.length || 0) / totalRides) * 100 : 0,
      };
    },
  });

  // Fetch cancellation breakdown
  const { data: cancellationStats } = useQuery({
    queryKey: ['cancellation-stats', dateRange],
    queryFn: async (): Promise<CancellationStats[]> => {
      const { data, error } = await supabase
        .from('ride_cancellations')
        .select('cancellation_reason, cancelled_by')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Group by reason
      const grouped = data.reduce((acc: Record<string, CancellationStats>, item) => {
        const key = `${item.cancellation_reason}-${item.cancelled_by}`;
        if (!acc[key]) {
          acc[key] = {
            reason: item.cancellation_reason,
            count: 0,
            cancelledBy: item.cancelled_by,
          };
        }
        acc[key].count += 1;
        return acc;
      }, {});

      return Object.values(grouped).sort((a, b) => b.count - a.count);
    },
  });

  // Fetch recent completed rides
  const { data: recentRides } = useQuery({
    queryKey: ['recent-rides', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_rides')
        .select(`
          id,
          status,
          final_price,
          created_at,
          pickup_time,
          dropoff_time,
          payment_collected_method,
          drivers(full_name),
          ride_requests(pickup_address, dropoff_address, passenger_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const stats = [
    {
      title: 'Total Rides',
      value: rideStats?.totalRides || 0,
      icon: Car,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Completed',
      value: rideStats?.completedRides || 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Credits Used',
      value: rideStats?.totalCreditsUsed || 0,
      icon: Coins,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      suffix: ' credits',
    },
    {
      title: 'Active Drivers',
      value: rideStats?.activeDrivers || 0,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ride Analytics</h1>
          <p className="text-muted-foreground">
            Monitor ride-hailing performance and credit usage
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">
                    {stat.value.toLocaleString()}{stat.suffix || ''}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-xl font-bold">
                  {(rideStats?.completionRate || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Coins className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Fare</p>
                <p className="text-xl font-bold">
                  R {(rideStats?.averageFare || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Duration</p>
                <p className="text-xl font-bold">
                  {Math.round(rideStats?.averageDuration || 0)} mins
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rides" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rides">Recent Rides</TabsTrigger>
          <TabsTrigger value="cancellations">Cancellations</TabsTrigger>
        </TabsList>

        <TabsContent value="rides">
          <Card>
            <CardHeader>
              <CardTitle>Recent Rides</CardTitle>
              <CardDescription>Latest ride activity across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRides?.map((ride) => (
                  <div
                    key={ride.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        ride.status === 'completed' ? 'bg-green-500/10' : 
                        ride.status === 'cancelled' ? 'bg-destructive/10' : 'bg-blue-500/10'
                      }`}>
                        <Car className={`h-4 w-4 ${
                          ride.status === 'completed' ? 'text-green-500' : 
                          ride.status === 'cancelled' ? 'text-destructive' : 'text-blue-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {(ride.ride_requests as any)?.passenger_name || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">
                            {(ride.ride_requests as any)?.pickup_address || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={ride.status === 'completed' ? 'default' : 'secondary'}>
                        {ride.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        R {(ride.final_price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                {(!recentRides || recentRides.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No rides found for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancellations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                Cancellation Breakdown
              </CardTitle>
              <CardDescription>
                {rideStats?.cancelledRides || 0} cancellations in this period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cancellationStats?.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={stat.cancelledBy === 'driver' ? 'secondary' : 'outline'}>
                        {stat.cancelledBy}
                      </Badge>
                      <span className="text-sm">{stat.reason}</span>
                    </div>
                    <span className="font-semibold">{stat.count}</span>
                  </div>
                ))}

                {(!cancellationStats || cancellationStats.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No cancellations in this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
