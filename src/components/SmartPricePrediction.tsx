import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, Sparkles, Calendar, Info, ThumbsUp, Clock } from "lucide-react";
import { predictPrices, getBestBookingDay, getPriceTrendSummary, PricePrediction } from "@/services/pricePredictionService";
import { useCurrency } from "@/contexts/CurrencyContext";
import { OperatorTier } from "@/utils/pricingCalculator";
import { format } from "date-fns";

interface SmartPricePredictionProps {
  basePrice: number;
  operatorTier?: OperatorTier;
  itemName?: string;
}

const SmartPricePrediction = ({ 
  basePrice, 
  operatorTier = 'standard',
  itemName = 'This route'
}: SmartPricePredictionProps) => {
  const { convertPrice } = useCurrency();
  
  const predictions = useMemo(() => 
    predictPrices(basePrice, operatorTier, new Date(), 14),
    [basePrice, operatorTier]
  );
  
  const bestDay = useMemo(() => getBestBookingDay(predictions), [predictions]);
  const summary = useMemo(() => getPriceTrendSummary(predictions), [predictions]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-destructive" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, string> = {
      high: 'bg-green-500/10 text-green-600 border-green-500/20',
      medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      low: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    return variants[confidence] || variants.medium;
  };

  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case 'buy_now': return 'bg-green-500 text-white';
      case 'wait': return 'bg-yellow-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'buy_now': return 'Book Now';
      case 'wait': return 'Wait';
      default: return 'Neutral';
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Smart Price Prediction</h3>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>AI-powered predictions based on historical patterns, demand, and seasonal factors.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-green-500/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Lowest</p>
          <p className="font-bold text-green-600">{convertPrice(summary.lowestPrice)}</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Average</p>
          <p className="font-bold">{convertPrice(summary.averagePrice)}</p>
        </div>
        <div className="text-center p-3 bg-red-500/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Highest</p>
          <p className="font-bold text-red-600">{convertPrice(summary.highestPrice)}</p>
        </div>
      </div>

      {/* Best Day Recommendation */}
      {bestDay && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <ThumbsUp className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Best day to book</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(bestDay.date), 'EEEE, MMM d')} at {convertPrice(bestDay.predictedPrice)}
            </p>
          </div>
          <Badge className={getRecommendationStyle(bestDay.recommendation)}>
            {getRecommendationText(bestDay.recommendation)}
          </Badge>
        </div>
      )}

      {/* Price Calendar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="w-4 h-4" />
          <span>14-Day Price Forecast</span>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {predictions.slice(0, 14).map((prediction, idx) => {
            const date = new Date(prediction.date);
            const isToday = idx === 0;
            const isBestDay = prediction.date === bestDay?.date;
            
            return (
              <TooltipProvider key={prediction.date}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        p-2 rounded-lg text-center cursor-pointer transition-all
                        ${isBestDay ? 'ring-2 ring-primary bg-primary/10' : 'bg-muted/30 hover:bg-muted/50'}
                        ${isToday ? 'border-2 border-primary' : ''}
                      `}
                    >
                      <p className="text-[10px] text-muted-foreground">
                        {format(date, 'EEE')}
                      </p>
                      <p className="text-xs font-medium">
                        {format(date, 'd')}
                      </p>
                      <p className={`text-[10px] font-bold ${
                        prediction.percentChange < 0 ? 'text-green-600' : 
                        prediction.percentChange > 10 ? 'text-red-600' : ''
                      }`}>
                        {prediction.percentChange > 0 ? '+' : ''}{prediction.percentChange}%
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{format(date, 'EEEE, MMM d')}</span>
                        {getTrendIcon(prediction.trend)}
                      </div>
                      <p className="text-lg font-bold">{convertPrice(prediction.predictedPrice)}</p>
                      <Badge variant="outline" className={getConfidenceBadge(prediction.confidence)}>
                        {prediction.confidence} confidence
                      </Badge>
                      <div className="pt-2 border-t space-y-1">
                        <p className="text-xs font-medium">Price factors:</p>
                        {prediction.factors.map((factor, i) => (
                          <p key={i} className="text-xs text-muted-foreground">• {factor}</p>
                        ))}
                      </div>
                      <Badge className={getRecommendationStyle(prediction.recommendation)}>
                        {getRecommendationText(prediction.recommendation)}
                      </Badge>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>

      {/* Overall Trend */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Overall trend:</span>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon(summary.overallTrend)}
          <span className="text-sm font-medium capitalize">{summary.overallTrend}</span>
        </div>
      </div>
    </Card>
  );
};

export default SmartPricePrediction;
