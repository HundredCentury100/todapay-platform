import { useState, useMemo, useEffect } from "react";
import { ServiceProgressBar } from "@/components/booking/ServiceProgressBar";
import { ResultsListSkeleton, BusResultCardSkeleton } from "@/components/skeletons/ResultsSkeletons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import BackButton from "@/components/BackButton";
import FareDateStrip from "@/components/bus/FareDateStrip";
import BusClassSelector from "@/components/bus/BusClassSelector";
import FlightStyleBusCard from "@/components/bus/FlightStyleBusCard";
import { AdContainer } from "@/components/ads/AdContainer";
import { ResultsMapView } from "@/components/maps/ResultsMapView";
import { SlidersHorizontal, Bus, Sparkles, ArrowRight, Map, List } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getRelativeDate } from "@/utils/dateFormatters";
import { searchBuses } from "@/services/busService";
import { mockBuses } from "@/data/mockData";
import { BusClassTier } from "@/types/booking";
import { cn } from "@/lib/utils";
import MobileAppLayout from "@/components/MobileAppLayout";
import { startOfToday } from "date-fns";

const sortOptions = [
  { value: "price-asc", label: "Cheapest" },
  { value: "duration-asc", label: "Fastest" },
  { value: "departure-asc", label: "Earliest" },
  { value: "departure-desc", label: "Latest" },
  { value: "rating-desc", label: "Top Rated" },
];

const BusResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || "Harare";
  const to = searchParams.get("to") || "Bulawayo";
  const { convertPrice } = useCurrency();

  const [sortBy, setSortBy] = useState("price-asc");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedClass, setSelectedClass] = useState<BusClassTier>("standard");
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const fetchBuses = async () => {
    setLoading(true);
    const { data, error } = await searchBuses(from, to);
    
    if (error || !data || data.length === 0) {
      setBuses(mockBuses);
    } else {
      const transformedData = data.map((schedule: any) => ({
        id: schedule.id,
        operator: schedule.buses.operator,
        from: schedule.from_location,
        to: schedule.to_location,
        departureTime: schedule.departure_time,
        arrivalTime: schedule.arrival_time,
        duration: schedule.duration,
        price: Number(schedule.base_price),
        availableSeats: schedule.availableSeats,
        totalSeats: schedule.buses.total_seats,
        amenities: schedule.buses.amenities || [],
        image: schedule.buses.image,
        type: schedule.buses.type,
        stops: schedule.stops || [],
        pickupAddress: schedule.pickup_address,
        dropoffAddress: schedule.dropoff_address,
      }));
      setBuses(transformedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBuses();
  }, [from, to]);

  const handleRefresh = async () => {
    await fetchBuses();
  };

  // Compute auto-badges
  const badgeMap = useMemo(() => {
    const map: Record<string, ('best-value' | 'fastest' | 'cheapest')[]> = {};
    if (buses.length === 0) return map;

    const getClassPrice = (bus: any) => {
      const cls = bus.busClass?.find((c: any) => c.tier === selectedClass);
      return cls?.price || bus.price;
    };

    const cheapest = buses.reduce((min, b) => getClassPrice(b) < getClassPrice(min) ? b : min, buses[0]);
    const fastest = buses.reduce((min, b) => parseInt(b.duration) < parseInt(min.duration) ? b : min, buses[0]);
    
    // Best value = highest rating-to-price ratio
    const bestValue = buses.reduce((best, b) => {
      const score = (b.rating || 4) / getClassPrice(b);
      const bestScore = (best.rating || 4) / getClassPrice(best);
      return score > bestScore ? b : best;
    }, buses[0]);

    buses.forEach(b => { map[b.id] = []; });
    if (cheapest) map[cheapest.id].push('cheapest');
    if (fastest) map[fastest.id].push('fastest');
    if (bestValue && bestValue.id !== cheapest?.id) map[bestValue.id].push('best-value');

    return map;
  }, [buses, selectedClass]);

  const filteredAndSortedBuses = useMemo(() => {
    const getClassPrice = (bus: any) => {
      const cls = bus.busClass?.find((c: any) => c.tier === selectedClass);
      return cls?.price || bus.price;
    };

    let filtered = buses.filter((bus: any) => {
      const price = getClassPrice(bus);
      if (price < priceRange[0] || price > priceRange[1]) return false;
      // Only show buses that have the selected class
      if (bus.busClass && !bus.busClass.some((c: any) => c.tier === selectedClass)) return false;
      return true;
    });

    filtered.sort((a, b) => {
      const priceA = getClassPrice(a);
      const priceB = getClassPrice(b);
      switch (sortBy) {
        case "price-asc": return priceA - priceB;
        case "price-desc": return priceB - priceA;
        case "duration-asc": return parseInt(a.duration) - parseInt(b.duration);
        case "departure-asc": return a.departureTime.localeCompare(b.departureTime);
        case "departure-desc": return b.departureTime.localeCompare(a.departureTime);
        case "rating-desc": return (b.rating || 0) - (a.rating || 0);
        default: return 0;
      }
    });

    return filtered;
  }, [buses, sortBy, priceRange, selectedClass]);

  const resetFilters = () => {
    setSortBy("price-asc");
    setPriceRange([0, 1000]);
    setSelectedClass("standard");
  };

  return (
    <MobileAppLayout className="safe-area-pt" onRefresh={handleRefresh}>
      <div>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-lg font-semibold truncate">
                <span className="truncate">{from}</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="truncate">{to}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {getRelativeDate(selectedDate)} • {filteredAndSortedBuses.length} buses
              </p>
            </div>
          </div>
        </div>
        <ServiceProgressBar currentStep={2} className="px-4 pb-2" />

        {/* Fare Date Strip */}
        <FareDateStrip
          buses={buses}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Class Selector + Sort Pills */}
        <div className="px-4 pb-2 space-y-2">
          <BusClassSelector selected={selectedClass} onChange={setSelectedClass} compact />
        </div>
        
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-4 pb-3">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-full whitespace-nowrap h-8 px-3 text-xs",
                  sortBy === option.value && "bg-primary text-primary-foreground"
                )}
                onClick={() => setSortBy(option.value)}
              >
                {option.label}
              </Button>
            ))}
            
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full h-8 px-3 gap-1.5 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                </Button>
              </SheetTrigger>
              
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8 px-3 gap-1.5 text-xs press-effect"
                onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              >
                {viewMode === 'list' ? <Map className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                {viewMode === 'list' ? 'Map' : 'List'}
              </Button>
              <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
                <SheetHeader className="pb-4">
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 overflow-y-auto pb-20">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Price Range: {convertPrice(priceRange[0])} - {convertPrice(priceRange[1])}
                    </Label>
                    <Slider
                      min={0}
                      max={1000}
                      step={50}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Travel Class</Label>
                    <BusClassSelector selected={selectedClass} onChange={setSelectedClass} />
                  </div>

                  <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-pb">
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 h-12 rounded-2xl" onClick={() => { resetFilters(); setFilterSheetOpen(false); }}>
                        Reset
                      </Button>
                      <Button className="flex-1 h-12 rounded-2xl" onClick={() => setFilterSheetOpen(false)}>
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Main Content */}
      {viewMode === 'map' ? (
        <div className="h-[calc(100vh-280px)]">
          <ResultsMapView
            items={filteredAndSortedBuses
              .filter((bus: any) => bus.pickupAddress || bus.from)
              .map((bus: any) => ({
                id: bus.id,
                lat: bus.pickupLat || -17.8292 + Math.random() * 0.05,
                lng: bus.pickupLng || 31.0522 + Math.random() * 0.05,
                title: `${bus.operator} - ${bus.from} → ${bus.to}`,
                subtitle: `${bus.departureTime} - ${bus.arrivalTime} • ${bus.duration}`,
                price: convertPrice(bus.price),
                rating: bus.rating,
              }))}
            onItemClick={(id) => navigate(`/buses/${id}`)}
            markerType="bus-stop"
          />
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3 pb-24">
          {loading ? (
            <ResultsListSkeleton Card={BusResultCardSkeleton} count={5} />
          ) : filteredAndSortedBuses.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl">
              <div className="h-20 w-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Bus className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No buses found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or class</p>
              <Button onClick={resetFilters} className="rounded-2xl">
                Reset Filters
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedBuses.map((bus, index) => (
                <FlightStyleBusCard
                  key={bus.id}
                  bus={bus}
                  index={index}
                  badges={badgeMap[bus.id] || []}
                  selectedClass={selectedClass}
                  onClick={() => navigate(`/buses/${bus.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </MobileAppLayout>
  );
};

export default BusResults;
