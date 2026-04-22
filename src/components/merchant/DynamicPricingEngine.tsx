import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, TrendingDown, Zap, Target, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PricingRecommendation {
  recommendedPrice: number;
  priceChange: number;
  priceChangePercentage: number;
  strategy: string;
  confidence: string;
  rationale: string;
  insights: string[];
  recommendations: string[];
  competitivePosition: string;
  urgencyLevel: string;
}

interface DynamicPricingEngineProps {
  itemType: "event" | "bus";
  merchantId: string;
}

const DynamicPricingEngine = ({ itemType, merchantId }: DynamicPricingEngineProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [pricing, setPricing] = useState<PricingRecommendation | null>(null);
  const [factors, setFactors] = useState<any>(null);
  const { toast } = useToast();

  const calculatePricing = async () => {
    if (!selectedItem || !basePrice) {
      toast({
        title: "Missing Information",
        description: "Please select an item and enter base price",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("dynamic-pricing", {
        body: {
          itemId: selectedItem,
          itemType,
          basePrice: parseFloat(basePrice),
          currentDate: new Date().toISOString(),
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Pricing Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setPricing(data.pricing);
      setFactors(data.factors);

      toast({
        title: "Pricing Calculated",
        description: "AI-powered dynamic pricing recommendation ready",
      });
    } catch (error) {
      console.error("Error calculating pricing:", error);
      toast({
        title: "Error",
        description: "Failed to calculate dynamic pricing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case "surge": return "bg-red-100 text-red-800 border-red-300";
      case "discount": return "bg-green-100 text-green-800 border-green-300";
      case "early_bird": return "bg-blue-100 text-blue-800 border-blue-300";
      case "last_minute": return "bg-orange-100 text-orange-800 border-orange-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    if (confidence === "high") return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (confidence === "medium") return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  const capacityUtilization = factors
    ? (factors.currentCapacity / factors.totalCapacity) * 100
    : 0;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">Dynamic Pricing Engine</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          AI-powered pricing optimization based on demand, timing, and market conditions
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Select {itemType === "event" ? "Event" : "Route"}</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${itemType}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo-1">Demo Item 1</SelectItem>
                <SelectItem value="demo-2">Demo Item 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Current Base Price ($)</Label>
            <Input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="Enter base price"
            />
          </div>
        </div>

        <Button
          onClick={calculatePricing}
          disabled={loading}
          className="w-full mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Market...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Calculate Dynamic Price
            </>
          )}
        </Button>
      </Card>

      {pricing && factors && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Current Price</span>
                <span className="text-2xl font-bold">${factors.basePrice}</span>
              </div>
            </Card>

            <Card className="p-6 border-primary">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Recommended Price</span>
                <div className="flex items-center gap-2">
                  {pricing.priceChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : pricing.priceChange < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  ) : null}
                  <span className="text-2xl font-bold">${pricing.recommendedPrice.toFixed(2)}</span>
                </div>
              </div>
              <Badge className={getStrategyColor(pricing.strategy)}>
                {pricing.strategy.replace('_', ' ').toUpperCase()}
              </Badge>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Price Change</span>
                <span className={`text-2xl font-bold ${pricing.priceChange > 0 ? 'text-green-600' : pricing.priceChange < 0 ? 'text-red-600' : ''}`}>
                  {pricing.priceChange > 0 ? '+' : ''}${pricing.priceChange.toFixed(2)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({pricing.priceChangePercentage > 0 ? '+' : ''}{pricing.priceChangePercentage.toFixed(1)}%)
              </span>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {getConfidenceIcon(pricing.confidence)}
              Pricing Analysis
              <Badge variant="outline" className="ml-auto">
                {pricing.confidence.toUpperCase()} Confidence
              </Badge>
            </h4>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Capacity Utilization</span>
                  <span className="font-semibold">{capacityUtilization.toFixed(1)}%</span>
                </div>
                <Progress value={capacityUtilization} />
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Days Until {itemType === 'event' ? 'Event' : 'Departure'}</p>
                  <p className="text-xl font-bold">{factors.daysUntilEvent}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Booking Velocity</p>
                  <p className="text-xl font-bold">{factors.bookingVelocity.toFixed(1)}/day</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Competitive Position</p>
                  <p className="text-xl font-bold capitalize">{pricing.competitivePosition.replace('_', ' ')}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Urgency Level</p>
                  <Badge variant={pricing.urgencyLevel === 'high' ? 'destructive' : 'outline'}>
                    {pricing.urgencyLevel.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-3">Rationale</h4>
            <p className="text-sm text-muted-foreground mb-4">{pricing.rationale}</p>

            <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Key Insights
            </h4>
            <ul className="space-y-2 mb-4">
              {pricing.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>

            <h4 className="text-lg font-semibold mb-3">Recommended Actions</h4>
            <ul className="space-y-2">
              {pricing.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
};

export default DynamicPricingEngine;
