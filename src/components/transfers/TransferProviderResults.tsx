import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Users, Briefcase, Car, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";

export interface TransferProvider {
  id: string;
  type: 'driver' | 'company';
  name: string;
  vehicle_info: string;
  vehicle_type: string;
  rating: number | null;
  total_rides: number | null;
  max_passengers: number;
  max_luggage: number;
  base_fare: number;
  price_per_km: number;
  minimum_fare: number;
  estimated_price: number;
  fixed_route_price?: number;
  amenities?: string[];
  profile_photo?: string | null;
  eta_minutes?: number;
}

interface TransferProviderResultsProps {
  providers: TransferProvider[];
  loading: boolean;
  onSelect: (provider: TransferProvider) => void;
  selectedId?: string;
}

export const TransferProviderResults = ({
  providers,
  loading,
  onSelect,
  selectedId,
}: TransferProviderResultsProps) => {
  const { convertPrice } = useCurrency();

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Finding available drivers...</h3>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
            <Car className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No drivers available</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your vehicle type or service options
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by price ascending
  const sorted = [...providers].sort((a, b) => a.estimated_price - b.estimated_price);
  const cheapest = sorted[0]?.id;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Available Options</h3>
        <Badge variant="secondary" className="rounded-full text-xs">
          {providers.length} found
        </Badge>
      </div>

      {sorted.map((provider, index) => {
        const isSelected = selectedId === provider.id;
        const isCheapest = provider.id === cheapest;
        const displayPrice = provider.fixed_route_price || provider.estimated_price;

        return (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Card
              className={`rounded-2xl border transition-all active:scale-[0.98] ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-lg ring-1 ring-primary/20'
                  : 'border-border/50 shadow-md hover:shadow-lg'
              }`}
              onClick={() => onSelect(provider)}
            >
              <CardContent className="p-0">
                {/* Main row */}
                <div className="flex items-center gap-3 p-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {provider.profile_photo ? (
                      <img src={provider.profile_photo} alt="" className="w-12 h-12 object-cover" />
                    ) : (
                      <Car className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm truncate">{provider.name}</p>
                      {isSelected && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{provider.vehicle_info}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-primary leading-tight">
                      {convertPrice(displayPrice)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {provider.fixed_route_price ? 'Fixed' : 'Est.'}
                    </p>
                  </div>
                </div>

                {/* Bottom bar with badges */}
                <div className="flex items-center gap-1.5 px-3 pb-3 flex-wrap">
                  {isCheapest && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] rounded-full h-5 px-2">
                      Best Price
                    </Badge>
                  )}
                  {provider.rating != null && provider.rating > 0 && (
                    <Badge variant="outline" className="gap-0.5 text-[10px] rounded-full h-5 px-2">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      {provider.rating.toFixed(1)}
                    </Badge>
                  )}
                  {provider.total_rides != null && provider.total_rides > 0 && (
                    <Badge variant="outline" className="text-[10px] rounded-full h-5 px-2">
                      {provider.total_rides} trips
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-0.5 text-[10px] rounded-full h-5 px-2">
                    <Users className="h-2.5 w-2.5" /> {provider.max_passengers}
                  </Badge>
                  <Badge variant="outline" className="gap-0.5 text-[10px] rounded-full h-5 px-2">
                    <Briefcase className="h-2.5 w-2.5" /> {provider.max_luggage}
                  </Badge>
                  {provider.eta_minutes && (
                    <Badge variant="outline" className="gap-0.5 text-[10px] rounded-full h-5 px-2">
                      <Clock className="h-2.5 w-2.5" /> {provider.eta_minutes}m
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
