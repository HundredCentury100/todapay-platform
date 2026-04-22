import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import { 
  BarChart3, TrendingUp, MapPin, Calendar, PieChart, 
  DollarSign, Target, Award
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";

interface Analytics {
  totalSpent: number;
  totalBookings: number;
  favoriteDestinations: Array<{ name: string; count: number }>;
  spendingByCategory: Record<string, number>;
  travelPatterns: {
    monthlySpending: Record<string, number>;
    bookingsByType: Array<{ type: string; count: number; amount: number }>;
    averageBookingValue: number;
  };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const MyAnalytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      
      try {
        const { data: cached } = await supabase
          .from('consumer_analytics')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (cached) {
          setAnalytics({
            totalSpent: cached.total_spent || 0,
            totalBookings: cached.total_bookings || 0,
            favoriteDestinations: (cached.favorite_destinations as Array<{ name: string; count: number }>) || [],
            spendingByCategory: (cached.spending_by_category as Record<string, number>) || {},
            travelPatterns: (cached.travel_patterns as Analytics['travelPatterns']) || {
              monthlySpending: {},
              bookingsByType: [],
              averageBookingValue: 0
            }
          });
        }

        const { data } = await supabase.functions.invoke('calculate-analytics', {
          body: { userId: user.id }
        });

        if (data?.success && data?.analytics) {
          setAnalytics(data.analytics);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <MobileAppLayout>
        <div className="min-h-screen bg-background pb-24">
          <header className="sticky top-0 z-50 bg-background border-b safe-area-pt">
            <div className="px-4 py-3 flex items-center gap-3">
              <BackButton fallbackPath="/profile" />
              <h1 className="font-bold text-lg">My Analytics</h1>
            </div>
          </header>
          <div className="px-4 py-4 grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </MobileAppLayout>
    );
  }

  const monthlyData = analytics?.travelPatterns?.monthlySpending 
    ? Object.entries(analytics.travelPatterns.monthlySpending)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-12)
        .map(([month, amount]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          amount
        }))
    : [];

  const categoryData = analytics?.spendingByCategory
    ? Object.entries(analytics.spendingByCategory).map(([category, amount]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: amount
      }))
    : [];

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background border-b safe-area-pt">
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath="/profile" />
            <div className="flex-1">
              <h1 className="font-bold text-lg">My Analytics</h1>
              <p className="text-xs text-muted-foreground">Travel & spending insights</p>
            </div>
          </div>
        </header>

        <main className="px-4 py-4 space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-2xl border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
                <p className="text-xl font-bold">{convertPrice(analytics?.totalSpent || 0)}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10">
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Bookings</p>
                </div>
                <p className="text-xl font-bold">{analytics?.totalBookings || 0}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10">
                    <Target className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Avg. Booking</p>
                </div>
                <p className="text-xl font-bold">
                  {convertPrice(analytics?.travelPatterns?.averageBookingValue || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10">
                    <Award className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Status</p>
                </div>
                <p className="text-xl font-bold">Active</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="spending" className="space-y-4">
            <TabsList className="w-full grid grid-cols-3 h-11 rounded-xl">
              <TabsTrigger value="spending" className="rounded-lg text-xs gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Spending
              </TabsTrigger>
              <TabsTrigger value="destinations" className="rounded-lg text-xs gap-1">
                <MapPin className="h-3.5 w-3.5" /> Places
              </TabsTrigger>
              <TabsTrigger value="categories" className="rounded-lg text-xs gap-1">
                <PieChart className="h-3.5 w-3.5" /> Categories
              </TabsTrigger>
            </TabsList>

            <TabsContent value="spending">
              <Card className="rounded-2xl border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4" />
                    Monthly Spending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyData.length > 0 ? (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis tickFormatter={(v) => `$${v}`} className="text-xs" />
                          <Tooltip 
                            formatter={(value: number) => [convertPrice(value), 'Spent']}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary))" 
                            fillOpacity={0.2} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      No spending data yet. Make your first booking!
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="destinations">
              <Card className="rounded-2xl border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" />
                    Favorite Destinations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.favoriteDestinations && analytics.favoriteDestinations.length > 0 ? (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.favoriteDestinations} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      No destination data yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories">
              <Card className="rounded-2xl border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChart className="h-4 w-4" />
                    Spending by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryData.length > 0 ? (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {categoryData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => convertPrice(value)}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      No category data yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default MyAnalytics;
