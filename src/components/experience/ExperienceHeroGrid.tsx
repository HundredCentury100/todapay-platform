import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Share2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExperienceHeroGridProps {
  images: string[];
  name: string;
  onBack: () => void;
  onShare?: () => void;
  isFavorite?: boolean;
  onFavorite?: () => void;
}

const ExperienceHeroGrid = ({ images, name, onBack, onShare, isFavorite, onFavorite }: ExperienceHeroGridProps) => {
  const isMobile = useIsMobile();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const displayImages = images.length > 0 ? images : ["https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800"];

  if (isMobile) {
    return (
      <div className="relative">
        <div className="relative h-64 overflow-hidden">
          <motion.div
            className="flex h-full"
            animate={{ x: `-${activeIndex * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {displayImages.map((img, i) => (
              <img key={i} src={img} alt={`${name} ${i + 1}`} className="h-full w-full object-cover flex-shrink-0" />
            ))}
          </motion.div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {displayImages.map((_, i) => (
              <button key={i} onClick={() => setActiveIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? "bg-white w-4" : "bg-white/50"}`} />
            ))}
          </div>
        </div>
        <div className="absolute top-4 left-4 right-4 flex justify-between">
           <Button size="icon" variant="ghost" className="bg-black/50 text-white rounded-full h-10 w-10" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            {onShare && (
              <Button size="icon" variant="ghost" className="bg-black/50 text-white rounded-full h-10 w-10" onClick={onShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            )}
            {onFavorite && (
              <Button size="icon" variant="ghost" className="bg-black/50 text-white rounded-full h-10 w-10" onClick={onFavorite}>
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden cursor-pointer group" onClick={() => setGalleryOpen(true)}>
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px]">
          <div className="col-span-2 row-span-2 relative overflow-hidden">
            <img src={displayImages[0]} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          {displayImages.slice(1, 5).map((img, i) => (
            <div key={i} className="relative overflow-hidden">
              <img src={img} alt={`${name} ${i + 2}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {i === 3 && displayImages.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">+{displayImages.length - 5}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="absolute top-4 left-4 right-4 flex justify-between">
           <Button size="icon" variant="ghost" className="bg-black/50 text-white rounded-full" onClick={(e) => { e.stopPropagation(); onBack(); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            {onShare && (
              <Button size="icon" variant="ghost" className="bg-black/50 text-white rounded-full" onClick={(e) => { e.stopPropagation(); onShare?.(); }}>
                <Share2 className="h-5 w-5" />
              </Button>
            )}
            {onFavorite && (
              <Button size="icon" variant="ghost" className="bg-black/50 text-white rounded-full" onClick={(e) => { e.stopPropagation(); onFavorite?.(); }}>
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-5xl p-0 bg-black border-0">
          <div className="relative h-[80vh] flex items-center justify-center">
            <Button size="icon" variant="ghost" className="absolute top-4 right-4 text-white z-10" onClick={() => setGalleryOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
            <Button size="icon" variant="ghost" className="absolute left-4 text-white" onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0}>
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <AnimatePresence mode="wait">
              <motion.img key={activeIndex} src={displayImages[activeIndex]} alt="" className="max-h-full max-w-full object-contain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </AnimatePresence>
            <Button size="icon" variant="ghost" className="absolute right-4 text-white" onClick={() => setActiveIndex(Math.min(displayImages.length - 1, activeIndex + 1))} disabled={activeIndex === displayImages.length - 1}>
              <ChevronRight className="h-8 w-8" />
            </Button>
            <div className="absolute bottom-4 text-white text-sm">{activeIndex + 1} / {displayImages.length}</div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExperienceHeroGrid;
