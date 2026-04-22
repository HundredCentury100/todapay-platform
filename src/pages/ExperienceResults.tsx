import { useState, useMemo } from "react";
import BackButton from "@/components/BackButton";
import { FadeTransition } from "@/components/ui/fade-transition";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, Filter, MapPin, Clock, Star, Users,
  ChevronRight, Compass, Map, Flame, Award, TrendingUp,
  ArrowUpDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ResultsMapView } from "@/components/maps/ResultsMapView";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageCarousel } from "@/components/ImageCarousel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import MobileAppLayout from "@/components/MobileAppLayout";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useExperiences } from "@/hooks/useExperiences";
import { EXPERIENCE_CATEGORIES, ExperienceType, DifficultyLevel } from "@/types/experience";
import { cn } from "@/lib/utils";

const CATEGORY_EMOJIS: Record<string, string> = {
  tour: '🗺️',
  adventure: '🧗',
  food_drink: '🍽️',
  wellness: '🧘',
  cultural: '🏛️',
  nature: '🌿',
  water_sports: '🏄',
  aerial: '🪂',
  workshop: '🎨',
  nightlife: '🌙',
  photography: '📸',
  volunteer: '🤝',
};

type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'duration' | 'rating';
type DateFilter = 'all' | 'today' | 'weekend' | 'week';

const ExperienceResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedTypes, setSelectedTypes] = useState<ExperienceType[]>([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const { data: experiences = [], isLoading, refetch } = useExperiences({
    search: searchQuery || undefined,
    experienceType: selectedTypes.length > 0 ? selectedTypes : undefined,
    difficulty: selectedDifficulty.length > 0 ? selectedDifficulty : undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 500 ? priceRange[1] : undefined,
  });

  // Sort & filter
  const sortedExperiences = useMemo(() => {
    let sorted = [...experiences];
    switch (sortBy) {
      case 'price_asc': sorted.sort((a, b) => a.price_per_person - b.price_per_person); break;
      case 'price_desc': sorted.sort((a, b) => b.price_per_person - a.price_per_person); break;
      case 'duration': sorted.sort((a, b) => a.duration_hours - b.duration_hours); break;
      case 'rating': sorted.sort((a, b) => (b.review_score || 0) - (a.review_score || 0)); break;
      default: sorted.sort((a, b) => (b.review_count || 0) - (a.review_count || 0)); break;
    }
    return sorted;
  }, [experiences, sortBy]);

  const handleRefresh = async () => { await refetch(); };

  const toggleType = (type: ExperienceType) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleDifficulty = (level: DifficultyLevel) => {
    setSelectedDifficulty(prev =>
      prev.includes(level) ? prev.filter(d => d !== level) : [...prev, level]
    );
  };

  const getDifficultyColor = (level?: DifficultyLevel) => {
    switch (level) {
      case "easy": return "bg-green-500/10 text-green-600";
      case "moderate": return "bg-amber-500/10 text-amber-600";
      case "challenging": return "bg-orange-500/10 text-orange-600";
      case "expert": return "bg-red-500/10 text-red-600";
      case "extreme": return "bg-purple-500/10 text-purple-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getAutoBadge = (exp: typeof experiences[0]) => {
    if ((exp.review_score || 0) >= 4.8 && (exp.review_count || 0) >= 5)
      return { label: "Top Rated", icon: Award, className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" };
    if (exp.max_participants <= 6)
      return { label: "Intimate", icon: Users, className: "bg-blue-500/15 text-blue-700 dark:text-blue-400" };
    if (exp.price_per_person > 0 && exp.duration_hours > 0 && (exp.price_per_person / exp.duration_hours) < 15)
      return { label: "Best Value", icon: TrendingUp, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" };
    return null;
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedDifficulty([]);
    setPriceRange([0, 500]);
    setDateFilter('all');
    setFilterOpen(false);
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedDifficulty.length > 0 || priceRange[0] > 0 || priceRange[1] < 500;

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'popular', label: 'Popular' },
    { value: 'price_asc', label: 'Price ↑' },
    { value: 'price_desc', label: 'Price ↓' },
    { value: 'duration', label: 'Duration' },
    { value: 'rating', label: 'Rating' },
  ];

  const DATE_FILTERS: { value: DateFilter; label: string }[] = [
    { value: 'all', label: 'Any date' },
    { value: 'today', label: 'Today' },
    { value: 'weekend', label: 'This Weekend' },
    { value: 'week', label: 'This Week' },
  ];

  return (
    <MobileAppLayout onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 safe-area-pt">
          <div className="flex items-center gap-3 mb-3">
            <BackButton fallbackPath="/" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold">Experiences</h1>
              <p className="text-xs text-muted-foreground">{sortedExperiences.length} found</p>
            </div>
          </div>
          
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tours, activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-2xl"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-2xl shrink-0 press-effect"
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            >
              {viewMode === 'list' ? <Map className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant={hasActiveFilters ? "default" : "outline"} 
                  size="icon" 
                  className="h-12 w-12 rounded-2xl shrink-0 relative press-effect"
                >
                  <Filter className="h-5 w-5" />
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl safe-area-pb">
                <SheetHeader className="flex flex-row items-center justify-between">
                  <SheetTitle>Filters</SheetTitle>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all
                    </Button>
                  )}
                </SheetHeader>
                <div className="mt-6 space-y-6 overflow-y-auto">
                  {/* Price Range */}
                  <div>
                    <Label className="text-sm font-medium">Price Range</Label>
                    <div className="mt-3 px-2">
                      <Slider value={priceRange} onValueChange={setPriceRange} max={500} step={10} className="w-full" />
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>{convertPrice(priceRange[0])}</span>
                        <span>{convertPrice(priceRange[1])}</span>
                      </div>
                    </div>
                  </div>
                  {/* Difficulty */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Difficulty</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["easy", "moderate", "challenging", "expert", "extreme"] as DifficultyLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => toggleDifficulty(level)}
                          className={cn(
                            "h-10 px-4 rounded-full text-sm font-medium capitalize transition-all press-effect",
                            selectedDifficulty.includes(level) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Categories */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Categories</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {EXPERIENCE_CATEGORIES.map((cat) => (
                        <div key={cat.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={cat.id}
                            checked={selectedTypes.includes(cat.id as ExperienceType)}
                            onCheckedChange={() => toggleType(cat.id as ExperienceType)}
                          />
                          <label htmlFor={cat.id} className="text-sm cursor-pointer">{cat.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full h-12 rounded-full press-effect" onClick={() => setFilterOpen(false)}>
                    Show {sortedExperiences.length} results
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Category Emoji Chips */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-4 py-3">
            {EXPERIENCE_CATEGORIES.map((cat) => {
              const emoji = CATEGORY_EMOJIS[cat.id] || '🎯';
              const isSelected = selectedTypes.includes(cat.id as ExperienceType);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleType(cat.id as ExperienceType)}
                  className={cn(
                    "h-10 min-w-[44px] px-3.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1.5 transition-all press-effect border flex-shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-base">{emoji}</span>
                  {cat.name.split(" & ")[0].split(" ")[0]}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>

        {/* Quick Date Filters */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-4 pb-2">
            {DATE_FILTERS.map((df) => (
              <button
                key={df.value}
                onClick={() => setDateFilter(df.value)}
                className={cn(
                  "h-10 min-w-[44px] px-3 rounded-full text-xs font-medium whitespace-nowrap transition-all press-effect flex-shrink-0",
                  dateFilter === df.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {df.label}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>

        {/* Sort Pills */}
        <ScrollArea className="w-full">
          <div className="flex items-center gap-2 px-4 pb-3">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={cn(
                  "h-10 min-w-[44px] px-3 rounded-full text-xs font-medium whitespace-nowrap transition-all press-effect flex-shrink-0",
                  sortBy === opt.value
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>

        {/* Results */}
        <div className="px-4 pb-24 space-y-4">
          <p className="text-sm text-muted-foreground">
            {sortedExperiences.length} experience{sortedExperiences.length !== 1 ? 's' : ''} found
          </p>

          {viewMode === 'map' ? (
            <ResultsMapView
              items={sortedExperiences
                .filter(e => e.latitude && e.longitude)
                .map(e => ({
                  id: e.id,
                  lat: e.latitude!,
                  lng: e.longitude!,
                  title: e.name,
                  subtitle: `${e.city}, ${e.country}`,
                  price: `$${e.price_per_person}/person`,
                  image: e.images?.[0],
                  rating: e.review_score || undefined,
                }))}
              onItemClick={(id) => navigate(`/experiences/${id}`)}
              markerType="event"
              className="h-[calc(100vh-280px)] rounded-2xl overflow-hidden"
            />
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array(8).fill(0).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-2xl" />
              ))}
            </div>
          ) : sortedExperiences.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Compass className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No experiences found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Try adjusting your filters or search for something else
              </p>
              <Button variant="outline" onClick={clearFilters} className="rounded-full press-effect">
                Clear filters
              </Button>
            </div>
          ) : (
            <FadeTransition isLoading={false}>
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {sortedExperiences.map((experience, idx) => {
                  const autoBadge = getAutoBadge(experience);
                  return (
                    <motion.div
                      key={experience.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Link to={`/experiences/${experience.id}`} className="group press-effect block">
                        {/* Image - Airbnb square */}
                        <div className="relative aspect-square rounded-2xl overflow-hidden">
                          <ImageCarousel
                            images={experience.images?.length ? experience.images : ["https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800"]}
                            aspectRatio="square"
                            showArrows={true}
                            showDots={true}
                          />
                          {/* Badges overlay */}
                          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                            {autoBadge && (
                              <Badge className={cn("gap-1 shadow-md", autoBadge.className)}>
                                <autoBadge.icon className="h-3 w-3" />
                                {autoBadge.label}
                              </Badge>
                            )}
                          </div>
                          {experience.max_participants <= 4 && (
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-red-500/90 text-white border-0 gap-1 animate-pulse shadow-md">
                                <Flame className="h-3 w-3" /> Selling Fast
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Content - Airbnb minimal */}
                        <div className="pt-3 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-[15px] line-clamp-1">{experience.name}</h3>
                            {experience.review_score && (
                              <span className="flex items-center gap-1 text-sm shrink-0">
                                <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
                                {experience.review_score.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {experience.city}, {experience.country}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {experience.duration_hours}h · Max {experience.max_participants} guests
                            {experience.difficulty_level ? ` · ${experience.difficulty_level}` : ''}
                          </p>
                          <p className="text-[15px] pt-1">
                            <span className="font-semibold">{convertPrice(experience.price_per_person)}</span>
                            <span className="text-muted-foreground"> /person</span>
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </FadeTransition>
          )}
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default ExperienceResults;
