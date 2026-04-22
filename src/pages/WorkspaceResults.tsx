import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FadeTransition } from "@/components/ui/fade-transition";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import MobileAppLayout from "@/components/MobileAppLayout";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { WorkspaceFilters } from "@/components/workspace/WorkspaceFilters";
import { getWorkspaces, WorkspaceData } from "@/services/workspaceService";
import { WorkspaceType } from "@/types/workspace";
import { Search, MapPin, SlidersHorizontal, X, ArrowLeft, List, Map as MapIcon, Briefcase } from "lucide-react";
import { ResultsMapView } from "@/components/maps/ResultsMapView";
import { cn } from "@/lib/utils";

type SortOption = 'default' | 'price_low' | 'price_high' | 'capacity';

const sortOptions = [
  { value: "default", label: "Recommended" },
  { value: "price_low", label: "Cheapest" },
  { value: "price_high", label: "Priciest" },
  { value: "capacity", label: "Largest" },
];

const workspaceTypeChips: { emoji: string; label: string; value: WorkspaceType }[] = [
  { emoji: "🖥️", label: "Hot Desk", value: "hot_desk" },
  { emoji: "🏢", label: "Private Office", value: "private_office" },
  { emoji: "🤝", label: "Meeting Room", value: "meeting_room" },
  { emoji: "📹", label: "Conference", value: "conference_room" },
  { emoji: "💻", label: "Dedicated Desk", value: "dedicated_desk" },
  { emoji: "📧", label: "Virtual Office", value: "virtual_office" },
  { emoji: "🎪", label: "Event Space", value: "event_space" },
  { emoji: "🎙️", label: "Podcast Studio", value: "podcast_studio" },
  { emoji: "📸", label: "Photo Studio", value: "photo_studio" },
];

const durationFilters = [
  { emoji: "⏰", label: "Hourly" },
  { emoji: "☀️", label: "Half Day" },
  { emoji: "📅", label: "Full Day" },
  { emoji: "📆", label: "Weekly" },
  { emoji: "🗓️", label: "Monthly" },
];

const WorkspaceResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState(searchParams.get("location") || "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const [selectedTypes, setSelectedTypes] = useState<WorkspaceType[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [capacity, setCapacity] = useState(1);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  useEffect(() => {
    fetchWorkspaces();
  }, [searchLocation, selectedTypes, capacity]);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const data = await getWorkspaces({
        city: searchLocation,
        workspaceType: selectedTypes.length > 0 ? selectedTypes : undefined,
        capacity: capacity > 1 ? capacity : undefined,
      });
      setWorkspaces(data);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => fetchWorkspaces();

  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedAmenities([]);
    setCapacity(1);
    setPriceRange([0, 1000]);
  };

  const activeFilterCount = selectedTypes.length + (capacity > 1 ? 1 : 0) + selectedAmenities.length;

  const sortedWorkspaces = [...workspaces].sort((a, b) => {
    switch (sortBy) {
      case 'price_low': return (a.hourly_rate || a.daily_rate || 0) - (b.hourly_rate || b.daily_rate || 0);
      case 'price_high': return (b.hourly_rate || b.daily_rate || 0) - (a.hourly_rate || a.daily_rate || 0);
      case 'capacity': return b.capacity - a.capacity;
      default: return 0;
    }
  });

  const FiltersContent = (
    <WorkspaceFilters
      selectedTypes={selectedTypes}
      onTypesChange={setSelectedTypes}
      selectedAmenities={selectedAmenities}
      onAmenitiesChange={setSelectedAmenities}
      capacity={capacity}
      onCapacityChange={setCapacity}
      priceRange={priceRange}
      onPriceRangeChange={setPriceRange}
      onReset={resetFilters}
    />
  );

  return (
    <MobileAppLayout onRefresh={fetchWorkspaces}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b safe-area-pt">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" className="shrink-0 press-effect" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold">Find Workspaces</h1>
              <p className="text-xs text-muted-foreground">{isLoading ? "Searching..." : `${workspaces.length} workspaces found`}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="City or location"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12 rounded-2xl"
              />
            </div>
            <Button onClick={handleSearch} size="icon" className="h-12 w-12 rounded-2xl press-effect">
              <Search className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-2xl press-effect" onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}>
              {viewMode === 'list' ? <MapIcon className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
            <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon" className="h-12 w-12 relative rounded-2xl press-effect">
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
                    <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
                  </div>
                </DrawerHeader>
                <ScrollArea className="flex-1 p-4 max-h-[60vh]">{FiltersContent}</ScrollArea>
                <div className="p-4 border-t">
                  <Button className="w-full h-12 rounded-full press-effect" onClick={() => setIsFilterOpen(false)}>
                    Show {workspaces.length} Results
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Sort Pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {sortOptions.map(o => (
              <button
                key={o.value}
                onClick={() => setSortBy(o.value as SortOption)}
                className={cn(
                  "h-10 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-all press-effect",
                  sortBy === o.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Workspace Type Emoji Chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {workspaceTypeChips.map((chip) => {
              const isActive = selectedTypes.includes(chip.value);
              return (
                <button
                  key={chip.value}
                  onClick={() => {
                    setSelectedTypes((prev) =>
                      isActive ? prev.filter((t) => t !== chip.value) : [...prev, chip.value]
                    );
                  }}
                  className={cn(
                    "flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-all press-effect border",
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

          {/* Duration Quick Filters */}
          <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {durationFilters.map((df) => (
              <button
                key={df.label}
                className="flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap bg-secondary text-secondary-foreground press-effect"
              >
                <span>{df.emoji}</span>
                <span>{df.label}</span>
              </button>
            ))}
          </div>

          {activeFilterCount > 0 && (
            <ScrollArea className="w-full mt-3">
              <div className="flex gap-2 pb-1">
                {selectedTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="shrink-0 gap-1 rounded-full">
                    {type}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedTypes(selectedTypes.filter(t => t !== type))} />
                  </Badge>
                ))}
                {capacity > 1 && (
                  <Badge variant="secondary" className="shrink-0 gap-1 rounded-full">
                    {capacity}+ people
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setCapacity(1)} />
                  </Badge>
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-4">
        {viewMode === 'map' ? (
          <ResultsMapView
            items={sortedWorkspaces
              .filter(w => w.latitude && w.longitude)
              .map(w => ({
                id: w.id,
                lat: w.latitude!,
                lng: w.longitude!,
                title: w.name,
                subtitle: `${w.city}, ${w.country}`,
                price: w.hourly_rate ? `$${w.hourly_rate}/hr` : w.daily_rate ? `$${w.daily_rate}/day` : undefined,
                image: w.images?.[0],
              }))}
            onItemClick={(id) => navigate(`/workspaces/${id}`)}
            markerType="workspace"
            className="h-[calc(100vh-220px)] rounded-2xl overflow-hidden"
          />
        ) : isLoading ? (
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
        ) : sortedWorkspaces.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {sortedWorkspaces.map((workspace, index) => (
              <motion.div
                key={workspace.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="press-effect"
              >
                <WorkspaceCard workspace={workspace} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Briefcase className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No workspaces found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your filters</p>
            <Button variant="outline" onClick={resetFilters} className="rounded-full press-effect">Clear Filters</Button>
          </div>
        )}
      </div>
    </MobileAppLayout>
  );
};

export default WorkspaceResults;
