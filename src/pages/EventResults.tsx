import { useState, useMemo, useEffect } from "react";
import { ResultsGridSkeleton, EventResultCardSkeleton } from "@/components/skeletons/ResultsSkeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentVerticalSearches } from "@/hooks/useRecentVerticalSearches";
import { FadeTransition } from "@/components/ui/fade-transition";
import SeasonFilter from "@/components/events/SeasonFilter";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import BackButton from "@/components/BackButton";
import PriceAlertDialog from "@/components/PriceAlertDialog";
import { AdContainer } from "@/components/ads/AdContainer";
import { Calendar, MapPin, Clock, Ticket, SlidersHorizontal, Star, Sparkles, Users, ArrowRight, Map, List, Flame, Eye } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getEvents } from "@/services/eventService";
import { ImageCarousel } from "@/components/ImageCarousel";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import MobileAppLayout from "@/components/MobileAppLayout";
import ResultsMapView from "@/components/maps/ResultsMapView";

const sortOptions = [
  { value: "date-asc", label: "Soonest" },
  { value: "date-desc", label: "Latest" },
  { value: "price-asc", label: "Cheapest" },
  { value: "price-desc", label: "Priciest" },
  { value: "tickets-desc", label: "Popular" },
];

const categoryChips = [
  { value: "all", label: "All", emoji: "🎉" },
  { value: "Music", label: "Music", emoji: "🎵" },
  { value: "Sports", label: "Sports", emoji: "⚽" },
  { value: "Theater", label: "Theater", emoji: "🎭" },
  { value: "Festival", label: "Festival", emoji: "🎪" },
  { value: "Comedy", label: "Comedy", emoji: "😂" },
  { value: "Conference", label: "Conference", emoji: "🎤" },
  { value: "Marathon", label: "Marathon", emoji: "🏃" },
  { value: "School", label: "School", emoji: "🏫" },
  { value: "Religious", label: "Religious", emoji: "⛪" },
  { value: "Exhibition", label: "Expo", emoji: "🎪" },
  { value: "Charity", label: "Charity", emoji: "💝" },
  { value: "Nightlife", label: "Nightlife", emoji: "🎶" },
  { value: "Workshop", label: "Workshop", emoji: "🎓" },
  { value: "Food & Drink", label: "Food & Drink", emoji: "🍷" },
  { value: "Cultural", label: "Cultural", emoji: "🎭" },
  { value: "Virtual", label: "Virtual", emoji: "💻" },
  { value: "Experiences", label: "Experiences", emoji: "✨" },
];

const dateFilters = [
  { value: "all", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "weekend", label: "This Weekend" },
  { value: "month", label: "This Month" },
];

const EventResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = searchParams.get("location") || "All Cities";
  const { convertPrice } = useCurrency();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date-asc");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [minTickets, setMinTickets] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  useEffect(() => {
    fetchEvents();
  }, [location]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await getEvents({
      location: location !== "All Cities" ? location : undefined,
    });
    if (data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const allEventTypes = useMemo(() => {
    const typesSet = new Set<string>();
    events.forEach(event => typesSet.add(event.type));
    return Array.from(typesSet);
  }, [events]);

  const filteredAndSortedEvents = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86400000);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    let filtered = events.filter((event: any) => {
      const minPrice = Math.min(
        ...event.event_ticket_tiers.map((tier: any) => tier.price)
      );
      const totalAvailable = event.event_ticket_tiers.reduce(
        (sum: number, tier: any) => sum + tier.available_tickets,
        0
      );

      if (minPrice < priceRange[0] || minPrice > priceRange[1]) return false;
      if (totalAvailable < minTickets) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(event.type)) return false;

      // Category filter
      if (selectedCategory !== "all" && event.type !== selectedCategory) return false;

      // Season filter
      if (selectedSeason !== "all" && event.season_name !== selectedSeason) return false;

      // Date filter
      if (dateFilter !== "all") {
        const eventDate = new Date(event.event_date);
        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        if (dateFilter === "today" && eventDay.getTime() !== today.getTime()) return false;
        if (dateFilter === "tomorrow" && eventDay.getTime() !== tomorrow.getTime()) return false;
        if (dateFilter === "weekend" && eventDay > endOfWeek) return false;
        if (dateFilter === "month" && eventDay > endOfMonth) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return Math.min(...a.event_ticket_tiers.map((t: any) => t.price)) - Math.min(...b.event_ticket_tiers.map((t: any) => t.price));
        case "price-desc":
          return Math.max(...b.event_ticket_tiers.map((t: any) => t.price)) - Math.max(...a.event_ticket_tiers.map((t: any) => t.price));
        case "date-asc":
          return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        case "date-desc":
          return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
        case "tickets-desc":
          return b.event_ticket_tiers.reduce((s: number, t: any) => s + t.available_tickets, 0) - a.event_ticket_tiers.reduce((s: number, t: any) => s + t.available_tickets, 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [events, sortBy, priceRange, selectedTypes, minTickets, selectedCategory, dateFilter, selectedSeason]);

  const toggleEventType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const resetFilters = () => {
    setSortBy("date-asc");
    setPriceRange([0, 1000]);
    setSelectedTypes([]);
    setMinTickets(0);
    setSelectedCategory("all");
    setDateFilter("all");
    setSelectedSeason("all");
  };

  const activeFiltersCount = (selectedTypes.length > 0 ? 1 : 0) + 
    (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0) + 
    (minTickets > 0 ? 1 : 0) +
    (selectedCategory !== "all" ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0) +
    (selectedSeason !== "all" ? 1 : 0);

  // Map items for map view
  const mapItems = useMemo(() => {
    return filteredAndSortedEvents
      .filter((e: any) => e.lat && e.lng)
      .map((e: any) => ({
        id: e.id,
        lat: e.lat,
        lng: e.lng,
        title: e.name,
        subtitle: e.venue,
        price: convertPrice(Math.min(...e.event_ticket_tiers.map((t: any) => t.price))),
        image: e.image || e.images?.[0],
        rating: e.average_rating,
      }));
  }, [filteredAndSortedEvents, convertPrice]);

  // Helper: compute social proof signals per event
  const getSellingFast = (event: any) => {
    const totalTickets = event.event_ticket_tiers.reduce((s: number, t: any) => s + t.total_tickets, 0);
    const sold = totalTickets - event.event_ticket_tiers.reduce((s: number, t: any) => s + t.available_tickets, 0);
    return totalTickets > 0 && (sold / totalTickets) > 0.7;
  };

  return (
    <MobileAppLayout className="pb-24" onRefresh={fetchEvents}>
      <div>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background border-b safe-area-pt">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/" />
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg truncate">Events & Experiences</h1>
              <p className="text-xs text-muted-foreground truncate">
                {location} • {filteredAndSortedEvents.length} found
              </p>
            </div>
            {/* Map/List Toggle */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full shrink-0 press-effect"
              onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
            >
              {viewMode === "list" ? <Map className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Category Emoji Chips */}
        <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {categoryChips.map((chip) => (
              <button
                key={chip.value}
                onClick={() => setSelectedCategory(chip.value)}
                className={cn(
                  "h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all press-effect flex items-center gap-1.5",
                  selectedCategory === chip.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                <span>{chip.emoji}</span>
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Date Filters */}
        <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {dateFilters.map((df) => (
              <button
                key={df.value}
                onClick={() => setDateFilter(df.value)}
                className={cn(
                  "h-8 px-3.5 rounded-full text-xs font-medium whitespace-nowrap transition-all press-effect",
                  dateFilter === df.value
                    ? "bg-accent text-accent-foreground border border-primary/30"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {df.label}
              </button>
            ))}
          </div>
        </div>

        {/* Season/League Filter */}
        <SeasonFilter
          events={events}
          selectedSeason={selectedSeason}
          onSelectSeason={setSelectedSeason}
        />

        {/* Sort Pills */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={cn(
                  "h-10 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-all tap-target press-effect",
                  sortBy === option.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Map View */}
      {viewMode === "map" ? (
        <div className="h-[calc(100vh-200px)]">
          <ResultsMapView
            items={mapItems}
            onItemClick={(id) => navigate(`/events/${id}`)}
            markerType="event"
            className="h-full"
          />
        </div>
      ) : (
        <main className="px-4 py-4 space-y-4">
          {/* Featured Ad */}
          <AdContainer 
            adType="banner" 
            placement="event-results-top" 
            variant="horizontal"
            filters={{ eventType: 'event' }}
            className="rounded-2xl overflow-hidden"
          />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
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
          ) : filteredAndSortedEvents.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No events found</h3>
              <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters</p>
              <Button onClick={resetFilters} variant="outline" className="rounded-full press-effect">
                Reset Filters
              </Button>
            </div>
          ) : (
            <FadeTransition isLoading={false}>
            <AnimatePresence mode="popLayout">
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {filteredAndSortedEvents.map((event, index) => {
                  const minPrice = Math.min(...event.event_ticket_tiers.map((t: any) => t.price));
                  const totalAvailable = event.event_ticket_tiers.reduce(
                    (sum: number, tier: any) => sum + tier.available_tickets, 0
                  );
                  const isFree = minPrice === 0;
                  const eventDate = new Date(event.event_date);
                  const isToday = eventDate.toDateString() === new Date().toDateString();
                  const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                  const sellingFast = getSellingFast(event);

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ delay: index * 0.03 }}
                      layout
                      className="press-effect cursor-pointer group"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      {/* Image - Airbnb square */}
                      <div className="relative aspect-square rounded-2xl overflow-hidden">
                        <ImageCarousel
                          images={event.images || (event.image ? [event.image] : [])}
                          fallback={
                            <div className="w-full h-full flex items-center justify-center bg-secondary">
                              <Calendar className="w-12 h-12 text-muted-foreground" />
                            </div>
                          }
                          className="h-full"
                          aspectRatio="square"
                        />
                        
                        {/* Date chip overlay */}
                        <div className="absolute top-3 left-3 z-10">
                          <div className="bg-background/90 rounded-xl px-2.5 py-1.5 text-center shadow-md">
                            <p className="text-[10px] font-bold text-primary uppercase leading-tight">
                              {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                            </p>
                            <p className="text-lg font-black leading-tight">
                              {eventDate.getDate()}
                            </p>
                          </div>
                        </div>

                        {/* Urgency badges */}
                        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
                          {sellingFast && (
                            <Badge className="bg-destructive text-destructive-foreground border-0 gap-1 animate-pulse shadow-md text-[10px]">
                              <Flame className="h-3 w-3" /> Selling Fast
                            </Badge>
                          )}
                          {(isToday || isTomorrow) && (
                            <Badge className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full shadow-md">
                              {isToday ? "Today" : "Tomorrow"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Content - Airbnb minimal */}
                      <div className="pt-3 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-[15px] line-clamp-1 group-hover:text-primary transition-colors">
                            {event.name}
                          </h3>
                          {event.average_rating > 0 && (
                            <span className="flex items-center gap-1 text-sm shrink-0">
                              <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
                              {event.average_rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.venue}, {event.location}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {event.event_time ? ` · ${event.event_time}` : ''}
                        </p>
                        <p className="text-[15px] pt-1">
                          {isFree ? (
                            <span className="font-semibold text-green-600">FREE</span>
                          ) : (
                            <>
                              <span className="font-semibold">{convertPrice(minPrice)}</span>
                              <span className="text-muted-foreground"> /ticket</span>
                            </>
                          )}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
            </FadeTransition>
          )}
        </main>
      )}

      {/* Fixed Bottom Filter Button */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetTrigger asChild>
          <button
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-super flex items-center gap-2 font-medium tap-target press-effect"
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-primary-foreground text-primary w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold">Filters</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 pb-8">
            {/* Price Range */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
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

            {/* Minimum Tickets */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Minimum Tickets Available: {minTickets}
              </Label>
              <Slider
                min={0}
                max={100}
                step={10}
                value={[minTickets]}
                onValueChange={([value]) => setMinTickets(value)}
                className="w-full"
              />
            </div>

            {/* Event Types */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Event Type</Label>
              <div className="flex flex-wrap gap-2">
                {allEventTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleEventType(type)}
                    className={cn(
                      "h-10 px-4 rounded-full text-sm font-medium transition-all tap-target press-effect",
                      selectedTypes.includes(type)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 rounded-full h-12 press-effect"
                onClick={resetFilters}
              >
                Reset
              </Button>
              <Button 
                className="flex-1 rounded-full h-12 press-effect"
                onClick={() => setFiltersOpen(false)}
              >
                Show {filteredAndSortedEvents.length} Results
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </MobileAppLayout>
  );
};

export default EventResults;
