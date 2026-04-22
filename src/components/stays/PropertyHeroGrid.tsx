import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Images, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { PropertyWishlistButton } from "@/components/stays/PropertyWishlistButton";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface PropertyHeroGridProps {
  images: string[];
  propertyName: string;
  propertyType: string;
  propertyId: string;
  onShowGallery: () => void;
  onShowShare: () => void;
}

export const PropertyHeroGrid = ({
  images,
  propertyName,
  propertyType,
  propertyId,
  onShowGallery,
  onShowShare,
}: PropertyHeroGridProps) => {
  const isMobile = useIsMobile();
  const [mobileIndex, setMobileIndex] = useState(0);
  const displayImages = images.length > 0 ? images : ["/placeholder.svg"];

  // Touch swipe support
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
    if (Math.abs(dx) > 50 && dy < 80) {
      if (dx < 0) setMobileIndex(i => i === displayImages.length - 1 ? 0 : i + 1);
      else setMobileIndex(i => i === 0 ? displayImages.length - 1 : i - 1);
    }
    touchStart.current = null;
  }, [displayImages.length]);

  // Mobile: swipeable carousel
  if (isMobile) {
    return (
      <div
        className="relative h-64 rounded-2xl overflow-hidden mb-4 group touch-manipulation"
        onClick={onShowGallery}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={displayImages[mobileIndex]}
          alt={propertyName}
          className="w-full h-full object-cover"
        />
        {displayImages.length > 1 && (
          <>
            <Button
              variant="ghost" size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 h-8 w-8"
              onClick={(e) => { e.stopPropagation(); setMobileIndex(i => i === 0 ? displayImages.length - 1 : i - 1); }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 h-8 w-8"
              onClick={(e) => { e.stopPropagation(); setMobileIndex(i => i === displayImages.length - 1 ? 0 : i + 1); }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {displayImages.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  className={cn("w-2 h-2 rounded-full transition-colors", i === mobileIndex ? "bg-white" : "bg-white/50")}
                  onClick={(e) => { e.stopPropagation(); setMobileIndex(i); }}
                />
              ))}
              {displayImages.length > 5 && (
                <span className="text-white text-[10px] ml-1">+{displayImages.length - 5}</span>
              )}
            </div>
          </>
        )}
        <Badge className="absolute top-4 left-4 capitalize">{propertyType.replace('_', ' ')}</Badge>
        <div className="absolute top-4 right-4 flex gap-2">
          <PropertyWishlistButton propertyId={propertyId} />
          <Button variant="ghost" size="icon" className="bg-background/80 h-8 w-8" onClick={(e) => { e.stopPropagation(); onShowShare(); }}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Desktop: Airbnb-style 5-image grid
  return (
    <div className="relative rounded-2xl overflow-hidden mb-6 cursor-pointer group" onClick={onShowGallery}>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px]">
        <div className="col-span-2 row-span-2">
          <img src={displayImages[0]} alt={propertyName} className="w-full h-full object-cover group-hover:brightness-95 transition-all" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={cn("overflow-hidden", i === 2 && "rounded-tr-2xl", i === 4 && "rounded-br-2xl")}>
            <img
              src={displayImages[i] || displayImages[0]}
              alt={`${propertyName} ${i + 1}`}
              className="w-full h-full object-cover group-hover:brightness-95 transition-all"
            />
          </div>
        ))}
      </div>
      <Badge className="absolute top-4 left-4 capitalize text-sm">{propertyType.replace('_', ' ')}</Badge>
      <div className="absolute top-4 right-4 flex gap-2">
        <PropertyWishlistButton propertyId={propertyId} />
        <Button variant="ghost" size="icon" className="bg-background/80 hover:bg-background" onClick={(e) => { e.stopPropagation(); onShowShare(); }}>
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
      <Button variant="secondary" size="sm" className="absolute bottom-4 right-4" onClick={(e) => { e.stopPropagation(); onShowGallery(); }}>
        <Images className="h-4 w-4 mr-2" />
        Show all photos
      </Button>
    </div>
  );
};
