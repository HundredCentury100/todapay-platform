import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PriceTrendIndicatorProps {
  trend: 'up' | 'down' | 'stable';
  availableSeats: number;
  totalSeats: number;
}

const PriceTrendIndicator = ({ trend, availableSeats, totalSeats }: PriceTrendIndicatorProps) => {
  const occupancyRate = ((totalSeats - availableSeats) / totalSeats) * 100;
  const isHighDemand = occupancyRate > 70;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {trend === 'up' && (
        <Badge variant="destructive" className="text-xs">
          <TrendingUp className="w-3 h-3 mr-1" />
          Price Rising
        </Badge>
      )}
      {trend === 'down' && (
        <Badge variant="default" className="text-xs bg-green-500">
          <TrendingDown className="w-3 h-3 mr-1" />
          Price Dropping
        </Badge>
      )}
      {trend === 'stable' && (
        <Badge variant="secondary" className="text-xs">
          <Minus className="w-3 h-3 mr-1" />
          Stable Price
        </Badge>
      )}
      
      {isHighDemand && (
        <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
          🔥 High Demand
        </Badge>
      )}
      
      {availableSeats <= 5 && (
        <Badge variant="destructive" className="text-xs animate-pulse">
          Only {availableSeats} seats left at this price!
        </Badge>
      )}
    </div>
  );
};

export default PriceTrendIndicator;
