import { useState, useEffect, useMemo } from "react";
import { ResultsGridSkeleton, StayResultCardSkeleton } from "@/components/skeletons/ResultsSkeletons";
import { FadeTransition } from "@/components/ui/fade-transition";
import { useRecentVerticalSearches } from "@/hooks/useRecentVerticalSearches";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ResultsMapView } from "@/components/maps/ResultsMapView";
import { 
  Building2, MapPin, Star, Users, Map, List,
  SlidersHorizontal, Calendar, ArrowRight, Bell, GitCompare,
  ChevronLeft, ChevronRight, Flame, Award, TrendingDown
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { searchProperties } from "@/services/stayService";
import { Property, PropertyType } from "@/types/stay";
import { cn } from "@/lib/utils";
import { PropertyWishlistButton } from "@/components/stays/PropertyWishlistButton";
import { PropertyCompareProvider, usePropertyCompare } from "@/contexts/PropertyCompareContext";
import { PropertyCompareDrawer } from "@/components/stays/PropertyCompareDrawer";
import { PropertyPriceAlertDialog } from "@/components/stays/PropertyPriceAlertDialog";
import { AnimatePresence, motion } from "framer-motion";
import MobileAppLayout from "@/components/MobileAppLayout";
import { useCurrency } from "@/contexts/CurrencyContext";

const PROPERTY_TYPE_CHIPS: { type: PropertyType; emoji: string; label: string }[] = [
  { type: "hotel", emoji: "🏨", label: "Hotel" },
  { type: "resort", emoji: "🏖️", label: "Resort" },
  { type: "villa", emoji: "🏡", label: "Villa" },
  { type: "apartment", emoji: "🏢", label: "Apartment" },
  { type: "lodge", emoji: "🛖", label: "Lodge" },
  { type: "hostel", emoji: "🏠", label: "Hostel" },
  { type: "guesthouse", emoji: "🏘️", label: "Guest House" },
  { type: "cottage", emoji: "🛕", label: "Cottage" },
  { type: "cabin", emoji: "🪵", label: "Cabin" },
  { type: "boutique_hotel", emoji: "✨", label: "Boutique" },
];

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "price_low", label: "Price ↑" },
  { value: "price_high", label: "Price ↓" },
  { value: "rating", label: "Top Rated" },
];

function getAutoBadge(property: Property, avgPrice: number): { label: string; icon: React.ReactNode; className: string } | null {
  if (property.review_score && property.review_score >= 4.5) {
    return { label: "Top Rated", icon: <Award className="w-3 h-3" />, className: "bg-amber-500/90 text-white" };
  }
  const price = property.min_price || 0;
  if (price > 0 && avgPrice > 0 && price < avgPrice * 0.7) {
    return { label: "Great Value", icon: <TrendingDown className="w-3 h-3" />, className: "bg-emerald-500/90 text-white" };
  }
  if (property.rooms && property.rooms.some(r => r.quantity <= 2)) {
    return { label: "Selling Fast", icon: <Flame className="w-3 h-3" />, className: "bg-red-500/90 text-white" };
  }
  return null;
}

const StayResultsContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { convertPrice } = useCurrency();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showTotalPrice, setShowTotalPrice] = useState(false);

  const location = searchParams.get("location") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = parseInt(searchParams.get("guests") || "2");
  const rooms = parseInt(searchParams.get("rooms") || "1");

  const [selectedTypes, setSelectedTypes] = useState<PropertyType[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("recommended");

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    return differenceInDays(new Date(checkOut), new Date(checkIn)) || 1;
  }, [checkIn, checkOut]);

  const avgPrice = useMemo(() => {
    if (properties.length === 0) return 0;
    const prices = properties.map(p => p.min_price || 0).filter(p => p > 0);
    return prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  }, [properties]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await searchProperties({
        city: location,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests,
        rooms,
        property_type: selectedTypes.length > 0 ? selectedTypes : undefined,
        star_rating: selectedRatings.length > 0 ? selectedRatings : undefined,
        min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_price: priceRange[1] < 500 ? priceRange[1] : undefined,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      });
      setProperties(data);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [location, checkIn, checkOut, guests, rooms, selectedTypes, selectedRatings, priceRange, selectedAmenities]);

  const sortedProperties = useMemo(() => {
    const sorted = [...properties];
    switch (sortBy) {
      case "price_low":
        return sorted.sort((a, b) => (a.min_price || 0) - (b.min_price || 0));
      case "price_high":
        return sorted.sort((a, b) => (b.min_price || 0) - (a.min_price || 0));
      case "rating":
        return sorted.sort((a, b) => (b.star_rating || 0) - (a.star_rating || 0));
      default:
        return sorted;
    }
  }, [properties, sortBy]);

  const handleTypeToggle = (type: PropertyType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleRatingToggle = (rating: number) => {
    setSelectedRatings(prev =>
      prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
    );
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedRatings([]);
    setPriceRange([0, 500]);
    setSelectedAmenities([]);
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedRatings.length > 0 || selectedAmenities.length > 0 || priceRange[0] > 0 || priceRange[1] < 500;
  const activeFiltersCount = (selectedTypes.length > 0 ? 1 : 0) + (selectedRatings.length > 0 ? 1 : 0) + (selectedAmenities.length > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0);

  return (
    <MobileAppLayout className="pb-24" onRefresh={fetchProperties}>
      <div>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background border-b safe-area-pt">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/" />
            <button
              className="flex-1 min-w-0 text-left bg-muted/50 rounded-full px-4 py-2 border border-border/50 hover:bg-muted transition-colors"
              onClick={() => navigate(`/stays?location=${encodeURIComponent(location)}`)}
            >
              <h1 className="font-bold text-sm truncate">
                {location ? `Stays in ${location}` : "Find Your Stay"}
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {checkIn && checkOut && (
                  <>
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(checkIn), "MMM d")} - {format(new Date(checkOut), "MMM d")}</span>
                    <span className="text-primary font-medium">({nights}N)</span>
                  </>
                )}
                <span>•</span>
                <Users className="w-3 h-3" />
                <span>{guests}G, {rooms}R</span>
              </div>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full press-effect"
              onClick={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
            >
              {viewMode === 'list' ? <Map className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full press-effect"
              onClick={() => setShowPriceAlert(true)}
            >
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Property Type Emoji Chips */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-4 pb-2">
            {PROPERTY_TYPE_CHIPS.map((chip) => (
              <button
                key={chip.type}
                onClick={() => handleTypeToggle(chip.type)}
                className={cn(
                  "h-10 min-w-[44px] px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all tap-target press-effect flex items-center gap-1.5 flex-shrink-0",
                  selectedTypes.includes(chip.type)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                <span>{chip.emoji}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>

        {/* Sort Pills + Price Toggle */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 items-center px-4 pb-3">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={cn(
                  "h-10 min-w-[44px] px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all tap-target press-effect flex-shrink-0",
                  sortBy === option.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
            <div className="w-px h-6 bg-border mx-1 flex-shrink-0" />
            <button
              onClick={() => setShowTotalPrice(p => !p)}
              className={cn(
                "h-10 min-w-[44px] px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all tap-target press-effect flex-shrink-0",
                showTotalPrice
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {showTotalPrice ? "Total" : "Per Night"}
            </button>
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>
      </header>

      {/* Main Content */}
      {viewMode === 'map' ? (
        <div className="flex-1" style={{ height: 'calc(100vh - 180px)' }}>
          <ResultsMapView
            items={sortedProperties
              .filter(p => p.latitude && p.longitude)
              .map(p => ({
                id: p.id,
                lat: p.latitude!,
                lng: p.longitude!,
                title: p.name,
                subtitle: `${p.city}, ${p.country}`,
                price: `${convertPrice(showTotalPrice ? (p.min_price || 0) * nights : (p.min_price || 0))}${showTotalPrice ? ' total' : '/night'}`,
                image: p.images?.[0],
                rating: p.review_score,
              }))}
            onItemClick={(id) => {
              const searchQuery = new URLSearchParams({
                checkIn,
                checkOut,
                guests: guests.toString(),
                rooms: rooms.toString(),
              }).toString();
              navigate(`/stays/${id}?${searchQuery}`);
            }}
            markerType="property"
            className="h-full w-full"
          />
        </div>
      ) : (
      <main className="px-4 py-4 space-y-4">
        {loading ? (
          <ResultsGridSkeleton Card={StayResultCardSkeleton} count={8} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
        ) : sortedProperties.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Building2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No properties found</h3>
            <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters or search</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={clearFilters} variant="outline" className="rounded-full press-effect">
                Clear Filters
              </Button>
              <Button onClick={() => setShowPriceAlert(true)} variant="outline" className="rounded-full press-effect">
                <Bell className="w-4 h-4 mr-2" />
                Price Alert
              </Button>
            </div>
          </div>
        ) : (
          <FadeTransition isLoading={false}>
          <AnimatePresence mode="popLayout">
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {sortedProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ delay: index * 0.03 }}
                  layout
                >
                  <PropertyCard 
                    property={property} 
                    nights={nights}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    guests={guests}
                    rooms={rooms}
                    showTotalPrice={showTotalPrice}
                    avgPrice={avgPrice}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
          </FadeTransition>
        )}
      </main>
      )}

      {/* Fixed Bottom Filter Button — above mobile nav */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetTrigger asChild>
          <button
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-super flex items-center gap-2 font-medium tap-target press-effect"
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
            {/* Star Rating */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Star Rating</Label>
              <div className="flex gap-2">
                {[5, 4, 3, 2, 1].map(rating => (
                  <button
                    key={rating}
                    onClick={() => handleRatingToggle(rating)}
                    className={cn(
                      "flex items-center gap-1 h-10 px-4 rounded-full text-sm font-medium transition-all tap-target press-effect",
                      selectedRatings.includes(rating)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {rating}
                    <Star className="w-3 h-3 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Price per night: {convertPrice(priceRange[0])} - {convertPrice(priceRange[1])}+
              </Label>
              <Slider
                value={priceRange}
                min={0}
                max={500}
                step={10}
                onValueChange={(value) => setPriceRange(value as [number, number])}
              />
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {['wifi', 'parking', 'pool', 'gym', 'restaurant', 'spa', 'air_conditioning', 'kitchen', 'laundry'].map(amenity => (
                  <button
                    key={amenity}
                    onClick={() => handleAmenityToggle(amenity)}
                    className={cn(
                      "h-10 px-4 rounded-full text-sm font-medium capitalize transition-all tap-target press-effect",
                      selectedAmenities.includes(amenity)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {amenity.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 rounded-full h-12 press-effect"
                onClick={clearFilters}
              >
                Reset
              </Button>
              <Button 
                className="flex-1 rounded-full h-12 press-effect"
                onClick={() => setShowFilters(false)}
              >
                Show {sortedProperties.length} Results
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      <PropertyCompareDrawer />
      
      <PropertyPriceAlertDialog
        open={showPriceAlert}
        onOpenChange={setShowPriceAlert}
        city={location}
        currentPrice={avgPrice}
      />
      </div>
    </MobileAppLayout>
  );
};

// Property Card Component with Image Carousel + Auto-Badges
const PropertyCard = ({ 
  property, 
  nights,
  checkIn,
  checkOut,
  guests,
  rooms,
  showTotalPrice,
  avgPrice,
}: { 
  property: Property; 
  nights: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  showTotalPrice: boolean;
  avgPrice: number;
}) => {
  const { addToCompare, removeFromCompare, isInCompare } = usePropertyCompare();
  const { convertPrice } = useCurrency();
  const inCompare = isInCompare(property.id);
  const [imgIndex, setImgIndex] = useState(0);
  
  const lowestPrice = property.min_price || (property.rooms && property.rooms.length > 0 
    ? Math.min(...property.rooms.map(r => r.base_price)) 
    : 0);

  const displayImages = property.images && property.images.length > 0 ? property.images : ["/placeholder.svg"];
  const autoBadge = getAutoBadge(property, avgPrice);

  const searchQuery = new URLSearchParams({
    checkIn,
    checkOut,
    guests: guests.toString(),
    rooms: rooms.toString(),
  }).toString();

  return (
    <Card className="overflow-hidden rounded-2xl border-0 shadow-none hover:shadow-md transition-all group press-effect bg-transparent">
      {/* Image Carousel - Airbnb style */}
      <div className="relative aspect-square rounded-2xl overflow-hidden">
        <Link to={`/stays/${property.id}?${searchQuery}`}>
          <img
            src={displayImages[imgIndex]}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Carousel controls */}
        {displayImages.length > 1 && (
          <>
            <Button
              variant="ghost" size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.preventDefault(); setImgIndex(i => i === 0 ? displayImages.length - 1 : i - 1); }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.preventDefault(); setImgIndex(i => i === displayImages.length - 1 ? 0 : i + 1); }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {displayImages.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  className={cn("w-1.5 h-1.5 rounded-full transition-colors", i === imgIndex ? "bg-white" : "bg-white/50")}
                  onClick={(e) => { e.preventDefault(); setImgIndex(i); }}
                />
              ))}
            </div>
          </>
        )}

        {/* Auto badge */}
        {autoBadge && (
          <div className="absolute top-3 left-3">
            <Badge className={cn("rounded-full flex items-center gap-1 shadow-md", autoBadge.className)}>
              {autoBadge.icon}
              {autoBadge.label}
            </Badge>
          </div>
        )}
        
        {/* Wishlist Button */}
        <div className="absolute top-3 right-3">
          <PropertyWishlistButton propertyId={property.id} />
        </div>
      </div>

      {/* Content - Airbnb minimal style */}
      <div className="pt-3 space-y-1">
        <Link to={`/stays/${property.id}?${searchQuery}`}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-[15px] line-clamp-1 group-hover:text-primary transition-colors">
              {property.name}
            </h3>
            {property.review_score && (
              <span className="flex items-center gap-1 text-sm shrink-0">
                <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
                {property.review_score.toFixed(1)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            {property.city}, {property.country}
          </p>
          <p className="text-sm text-muted-foreground capitalize">
            {property.property_type.replace('_', ' ')}
            {property.star_rating ? ` · ${property.star_rating} star` : ''}
          </p>
        </Link>
        <div className="pt-1">
          {showTotalPrice ? (
            <p className="text-[15px]">
              <span className="font-semibold">{convertPrice(lowestPrice * nights)}</span>
              <span className="text-muted-foreground"> total · {nights} nights</span>
            </p>
          ) : (
            <p className="text-[15px]">
              <span className="font-semibold">{convertPrice(lowestPrice)}</span>
              <span className="text-muted-foreground"> /night</span>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

// Wrap with Provider
const StayResults = () => (
  <PropertyCompareProvider>
    <StayResultsContent />
  </PropertyCompareProvider>
);

export default StayResults;
