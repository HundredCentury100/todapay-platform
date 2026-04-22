import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FadeTransition } from "@/components/ui/fade-transition";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import MobileAppLayout from "@/components/MobileAppLayout";
import VenueCard from "@/components/venue/VenueCard";
import VenueFilters from "@/components/venue/VenueFilters";
import { getVenues, VenueWithMerchant } from "@/services/venueService";
import { VenueType } from "@/types/venue";
import { Search, SlidersHorizontal, MapPin, ArrowLeft, X, List, Map as MapIcon, Landmark } from "lucide-react";
import { toast } from "sonner";
import { ResultsMapView } from "@/components/maps/ResultsMapView";
import { cn } from "@/lib/utils";

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "price_low", label: "Cheapest" },
  { value: "price_high", label: "Priciest" },
  { value: "capacity", label: "Largest" },
];

const venueTypeChips: { emoji: string; label: string; value: VenueType }[] = [
  { emoji: "🏛️", label: "Conference", value: "conference_center" },
  { emoji: "🎪", label: "Banquet Hall", value: "banquet_hall" },
  { emoji: "🌿", label: "Garden", value: "garden" },
  { emoji: "🏖️", label: "Rooftop", value: "rooftop" },
  { emoji: "🍽️", label: "Restaurant", value: "restaurant" },
  { emoji: "🎭", label: "Theater", value: "theater" },
  { emoji: "🖼️", label: "Gallery", value: "gallery" },
  { emoji: "🏨", label: "Hotel Ballroom", value: "hotel_ballroom" },
  { emoji: "📸", label: "Studio", value: "studio" },
  { emoji: "🏞️", label: "Outdoor", value: "outdoor" },
  { emoji: "🏭", label: "Warehouse", value: "warehouse" },
  { emoji: "🏛️", label: "Museum", value: "museum" },
];

const eventTypeFilters = [
  { emoji: "💒", label: "Wedding" },
  { emoji: "🏢", label: "Corporate" },
  { emoji: "🎂", label: "Birthday" },
  { emoji: "🎤", label: "Conference" },
  { emoji: "🎉", label: "Gala" },
  { emoji: "📸", label: "Photo Shoot" },
];

const VenueResults = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [venues, setVenues] = useState<VenueWithMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState(searchParams.get('city') || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState("recommended");
  const [filters, setFilters] = useState({
    venueTypes: [] as VenueType[],
    amenities: [] as string[],
    minCapacity: 0,
    maxPrice: 50000,
  });

  useEffect(() => {
    fetchVenues();
  }, [searchParams, filters]);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const city = searchParams.get('city') || '';
      const data = await getVenues({
        city,
        date: searchParams.get('date') || '',
        venue_type: filters.venueTypes.length > 0 ? filters.venueTypes : undefined,
        capacity: filters.minCapacity || undefined,
        max_price: filters.maxPrice < 50000 ? filters.maxPrice : undefined,
      });

      let filteredData = data;
      if (filters.amenities.length > 0) {
        filteredData = data.filter(venue =>
          filters.amenities.every(amenity => venue.amenities.includes(amenity))
        );
      }

      setVenues(filteredData);
    } catch (error) {
      console.error("Error fetching venues:", error);
      toast.error("Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (searchCity) {
      params.set('city', searchCity);
    } else {
      params.delete('city');
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      venueTypes: [],
      amenities: [],
      minCapacity: 0,
      maxPrice: 50000,
    });
  };

  const activeFilterCount = filters.venueTypes.length + 
    (filters.minCapacity > 0 ? 1 : 0) + 
    (filters.maxPrice < 50000 ? 1 : 0) +
    filters.amenities.length;

  const sortedVenues = [...venues].sort((a, b) => {
    switch (sortBy) {
      case "price_low": return (a.hourly_rate || 0) - (b.hourly_rate || 0);
      case "price_high": return (b.hourly_rate || 0) - (a.hourly_rate || 0);
      case "capacity": return ((b as any).capacity || 0) - ((a as any).capacity || 0);
      default: return 0;
    }
  });

  return (
    <MobileAppLayout onRefresh={fetchVenues}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b safe-area-pt">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 press-effect"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold">Find Venues</h1>
              <p className="text-xs text-muted-foreground">{loading ? 'Searching...' : `${venues.length} venues found`}</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12 rounded-2xl"
              />
            </div>
            <Button onClick={handleSearch} size="icon" className="h-12 w-12 rounded-2xl press-effect">
              <Search className="h-4 w-4" />
            </Button>

            {/* List/Map Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="h-12 w-12 shrink-0 rounded-2xl press-effect"
            >
              {viewMode === 'list' ? <MapIcon className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>

            {/* Mobile Filter Button */}
            <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl relative press-effect">
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh] rounded-t-3xl">
                <DrawerHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <DrawerTitle>Filters</DrawerTitle>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Reset
                    </Button>
                  </div>
                </DrawerHeader>
                <ScrollArea className="flex-1 p-4 max-h-[60vh]">
                  <VenueFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClear={clearFilters}
                  />
                </ScrollArea>
                <div className="p-4 border-t">
                  <Button className="w-full h-12 rounded-full press-effect" onClick={() => setIsFilterOpen(false)}>
                    Show {venues.length} Results
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Sort + Venue Type Chips — combined in single scrollable row */}
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            {sortOptions.map(o => (
              <button
                key={o.value}
                onClick={() => setSortBy(o.value)}
                className={cn(
                  "h-9 px-4 rounded-full text-xs font-medium whitespace-nowrap transition-all press-effect shrink-0",
                  sortBy === o.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {o.label}
              </button>
            ))}
            <div className="w-px h-6 bg-border my-auto mx-0.5 shrink-0" />
            {venueTypeChips.slice(0, 6).map((chip) => {
              const isActive = filters.venueTypes.includes(chip.value);
              return (
                <button
                  key={chip.value}
                  onClick={() => {
                    setFilters((f) => ({
                      ...f,
                      venueTypes: isActive
                        ? f.venueTypes.filter((t) => t !== chip.value)
                        : [...f.venueTypes, chip.value],
                    }));
                  }}
                  className={cn(
                    "flex items-center gap-1 h-9 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-all press-effect border shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border/50"
                  )}
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
          {activeFilterCount > 0 && (
            <ScrollArea className="w-full mt-3">
              <div className="flex gap-2 pb-1">
                {filters.venueTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="shrink-0 gap-1 rounded-full">
                    {type}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters(f => ({ ...f, venueTypes: f.venueTypes.filter(t => t !== type) }))}
                    />
                  </Badge>
                ))}
                {filters.minCapacity > 0 && (
                  <Badge variant="secondary" className="shrink-0 gap-1 rounded-full">
                    {filters.minCapacity}+ guests
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters(f => ({ ...f, minCapacity: 0 }))} />
                  </Badge>
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Results - mobile-first single column */}
      <div className="px-4 py-4">
        {viewMode === 'map' ? (
          <ResultsMapView
            items={sortedVenues
              .filter(v => v.latitude && v.longitude)
              .map(v => ({
                id: v.id,
                lat: v.latitude!,
                lng: v.longitude!,
                title: v.name,
                subtitle: `${v.city}, ${v.country}`,
                price: v.hourly_rate ? `$${v.hourly_rate}/hr` : undefined,
                image: (v.images as string[])?.[0],
              }))}
            onItemClick={(id) => navigate(`/venues/${id}`)}
            markerType="venue"
            className="h-[calc(100vh-220px)] rounded-2xl overflow-hidden"
          />
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <div className="pt-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedVenues.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {sortedVenues.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="press-effect"
              >
                <VenueCard venue={venue} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Landmark className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No venues found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={clearFilters} className="rounded-full press-effect">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </MobileAppLayout>
  );
};

export default VenueResults;
