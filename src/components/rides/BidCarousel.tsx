import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Car, Check, Zap, Trophy, TrendingDown, ChevronLeft, ChevronRight, MessageCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { RideBid } from "@/types/ride";
import { cn } from "@/lib/utils";

interface BidCarouselProps {
  bids: RideBid[];
  onAcceptBid: (bid: RideBid) => void;
  acceptingBidId: string | null;
  newBidId?: string | null;
}

type SmartLabel = {
  type: 'best_value' | 'fastest' | 'top_rated';
  label: string;
  icon: React.ReactNode;
  color: string;
};

const getSmartLabels = (bids: RideBid[]): Map<string, SmartLabel> => {
  const labels = new Map<string, SmartLabel>();
  
  if (bids.length === 0) return labels;
  
  // Find best value (lowest price)
  const sortedByPrice = [...bids].sort((a, b) => a.bid_amount - b.bid_amount);
  if (sortedByPrice[0]) {
    labels.set(sortedByPrice[0].id, {
      type: 'best_value',
      label: 'Best Value',
      icon: <TrendingDown className="h-3 w-3" />,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    });
  }
  
  // Find fastest arrival (lowest ETA)
  const sortedByEta = [...bids].sort((a, b) => a.eta_minutes - b.eta_minutes);
  if (sortedByEta[0] && !labels.has(sortedByEta[0].id)) {
    labels.set(sortedByEta[0].id, {
      type: 'fastest',
      label: 'Fastest Arrival',
      icon: <Zap className="h-3 w-3" />,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    });
  }
  
  // Find top rated (highest rating)
  const sortedByRating = [...bids].sort((a, b) => (b.driver?.rating || 0) - (a.driver?.rating || 0));
  if (sortedByRating[0] && !labels.has(sortedByRating[0].id) && (sortedByRating[0].driver?.rating || 0) >= 4.5) {
    labels.set(sortedByRating[0].id, {
      type: 'top_rated',
      label: 'Top Rated',
      icon: <Trophy className="h-3 w-3" />,
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
    });
  }
  
  return labels;
};

export const BidCarousel = ({ bids, onAcceptBid, acceptingBidId, newBidId }: BidCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'center',
    containScroll: 'trimSnaps'
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  
  const smartLabels = getSmartLabels(bids);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Scroll to new bid when it arrives
  useEffect(() => {
    if (newBidId && emblaApi) {
      const newBidIndex = bids.findIndex(b => b.id === newBidId);
      if (newBidIndex !== -1) {
        emblaApi.scrollTo(newBidIndex);
      }
    }
  }, [newBidId, bids, emblaApi]);

  if (bids.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      {canScrollPrev && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/95 shadow-lg border-0"
          onClick={scrollPrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      {canScrollNext && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/95 shadow-lg border-0"
          onClick={scrollNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {/* Carousel */}
      <div className="overflow-hidden px-2" ref={emblaRef}>
        <div className="flex gap-3 touch-pan-y">
          <AnimatePresence mode="popLayout">
            {bids.map((bid, index) => {
              const label = smartLabels.get(bid.id);
              const isNew = bid.id === newBidId;
              const isSelected = index === selectedIndex;
              
              return (
                <motion.div
                  key={bid.id}
                  initial={isNew ? { x: 100, opacity: 0, scale: 0.8 } : false}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex-[0_0_85%] min-w-0 sm:flex-[0_0_70%]"
                >
                  <Card 
                    className={cn(
                      "transition-all duration-300 overflow-hidden",
                      isSelected ? "shadow-xl ring-2 ring-primary/20" : "shadow-md opacity-80",
                      isNew && "ring-2 ring-green-500 animate-pulse"
                    )}
                  >
                    <CardContent className="p-0">
                      {/* Smart Label Banner */}
                      {label && (
                        <div className={cn("px-4 py-2 flex items-center gap-2 border-b", label.color)}>
                          {label.icon}
                          <span className="text-xs font-semibold">{label.label}</span>
                          <Sparkles className="h-3 w-3 ml-auto animate-pulse" />
                        </div>
                      )}
                      
                      <div className="p-4 space-y-4">
                        {/* Driver Info */}
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-16 w-16 ring-2 ring-background shadow-md">
                              <AvatarImage src={bid.driver?.profile_photo_url} />
                              <AvatarFallback className="text-lg bg-gradient-to-br from-primary/20 to-primary/10">
                                {bid.driver?.full_name?.split(' ').map(n => n[0]).join('') || 'DR'}
                              </AvatarFallback>
                            </Avatar>
                            {/* Vehicle badge */}
                            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center ring-2 ring-background">
                              <Car className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg truncate">{bid.driver?.full_name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <span className="font-medium">{bid.driver?.rating?.toFixed(1) || '5.0'}</span>
                              </div>
                              <span>•</span>
                              <span>{bid.driver?.total_rides || 0} trips</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Car className="h-3 w-3" />
                              <span className="truncate">
                                {bid.driver?.vehicle_color} {bid.driver?.vehicle_make} {bid.driver?.vehicle_model}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price and ETA */}
                        <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
                          <div className="text-center">
                            <div className="text-3xl font-black text-primary">R{bid.bid_amount}</div>
                            <div className="text-xs text-muted-foreground">Offered price</div>
                          </div>
                          <div className="h-10 w-px bg-border" />
                          <div className="text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <Clock className="h-5 w-5 text-muted-foreground" />
                              <span className="text-2xl font-bold">{bid.eta_minutes}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">mins away</div>
                          </div>
                        </div>

                        {/* Driver Message */}
                        {bid.message && (
                          <div className="bg-muted/30 rounded-lg p-3 flex gap-2">
                            <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-sm italic text-muted-foreground">"{bid.message}"</p>
                          </div>
                        )}

                        {/* Accept Button */}
                        <Button
                          className="w-full h-14 text-lg font-semibold rounded-xl"
                          size="lg"
                          onClick={() => onAcceptBid(bid)}
                          disabled={acceptingBidId !== null}
                        >
                          {acceptingBidId === bid.id ? (
                            <span className="flex items-center gap-2">
                              <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Accepting...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Check className="h-5 w-5" />
                              Accept This Driver
                            </span>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Dots indicator */}
      {bids.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {bids.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === selectedIndex 
                  ? "w-6 bg-primary" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BidCarousel;
