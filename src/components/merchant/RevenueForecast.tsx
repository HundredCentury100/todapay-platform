import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Loader2, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ForecastData {
  date: string;
  predictedRevenue: number;
  predictedBookings: number;
  confidenceLevel: "high" | "medium" | "low";
  lowerBound: number;
  upperBound: number;
}

interface ForecastSummary {
  expectedTotalRevenue: number;
  expectedTotalBookings: number;
  trendDirection: "upward" | "stable" | "downward";
  growthRate: number;
}

interface RevenueForecastProps {
  merchantType: "bus_operator" | "event_organizer";
  merchantId: string;
}

const RevenueForecast = ({ merchantType, merchantId }: RevenueForecastProps) => {
  const [loading, setLoading] = useState(false);
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [summary, setSummary] = useState<ForecastSummary | null>(null);
  const { toast } = useToast();

  const generateForecast = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("revenue-forecast", {
        body: { merchantType, merchantId },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast({
          title: "Forecast Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setForecasts(data.forecast.forecasts);
      setInsights(data.forecast.insights);
      setSummary(data.forecast.summary);

      toast({
        title: "Forecast Generated",
        description: "AI-powered revenue forecast is ready",
      });
    } catch (error) {
      console.error("Error generating forecast:", error);
      toast({
        title: "Error",
        description: "Failed to generate forecast. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const chartData = forecasts.map((f) => ({
    date: new Date(f.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: f.predictedRevenue,
    lower: f.lowerBound,
    upper: f.upperBound,
    bookings: f.predictedBookings,
  }));

  const getTrendIcon = () => {
    if (!summary) return null;
    if (summary.trendDirection === "upward") return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (summary.trendDirection === "downward") return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-yellow-600" />;
  };

  const getTrendColor = () => {
    if (!summary) return "text-muted-foreground";
    if (summary.trendDirection === "upward") return "text-green-600";
    if (summary.trendDirection === "downward") return "text-red-600";
    return "text-yellow-600";
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Revenue Forecasting
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Machine learning-powered predictions for the next 30 days
            </p>
          </div>
          <Button onClick={generateForecast} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Forecast
              </>
            )}
          </Button>
        </div>

        {summary && (
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="p-4 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expected Revenue</p>
                  <p className="text-2xl font-bold">${summary.expectedTotalRevenue.toLocaleString()}</p>
                </div>
                {getTrendIcon()}
              </div>
              <p className={`text-xs mt-2 ${getTrendColor()}`}>
                {summary.growthRate > 0 ? "+" : ""}{summary.growthRate.toFixed(1)}% vs current period
              </p>
            </Card>

            <Card className="p-4 border-primary/20">
              <div>
                <p className="text-sm text-muted-foreground">Expected Bookings</p>
                <p className="text-2xl font-bold">{summary.expectedTotalBookings}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Avg {(summary.expectedTotalBookings / 30).toFixed(1)} per day
              </p>
            </Card>

            <Card className="p-4 border-primary/20">
              <div>
                <p className="text-sm text-muted-foreground">Trend Direction</p>
                <p className="text-2xl font-bold capitalize">{summary.trendDirection}</p>
              </div>
              <Badge variant="outline" className="mt-2">
                AI-Powered
              </Badge>
            </Card>
          </div>
        )}
      </Card>

      {forecasts.length > 0 && (
        <>
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">Revenue Forecast with Confidence Intervals</h4>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="upper"
                  stackId="1"
                  stroke="hsl(var(--muted))"
                  fill="hsl(var(--muted))"
                  fillOpacity={0.3}
                  name="Upper Bound"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="2"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  name="Predicted Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stackId="3"
                  stroke="hsl(var(--muted))"
                  fill="hsl(var(--muted))"
                  fillOpacity={0.3}
                  name="Lower Bound"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">Booking Forecast</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  name="Predicted Bookings"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {insights.length > 0 && (
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">AI Insights</h4>
              <ul className="space-y-2">
                {insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-sm">{insight}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default RevenueForecast;
