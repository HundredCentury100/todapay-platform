import { motion } from "framer-motion";
import { ArrowLeft, Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PremiumHeroProps {
  images: string[];
  currentIndex: number;
  onImageChange: (index: number) => void;
  onBack: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  badges?: Array<{ label: string; variant?: "default" | "secondary" | "outline" }>;
  overlay?: React.ReactNode;
  height?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}

export const PremiumHero = ({
  images,
  currentIndex,
  onImageChange,
  onBack,
  onShare,
  onFavorite,
  isFavorite = false,
  badges = [],
  overlay,
  height = "md",
  children,
}: PremiumHeroProps) => {
  const heightClasses = {
    sm: "h-56",
    md: "h-72",
    lg: "h-96",
  };

  return (
    <div className={cn("relative", heightClasses[height])}>
       {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Image */}
      <motion.img
        key={currentIndex}
        initial={{ opacity: 0.8, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        src={images[currentIndex] || "/placeholder.svg"}
        alt="Hero"
        className="w-full h-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

      {/* Header actions */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start safe-area-pt z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            variant="ghost"
            size="icon"
             className="h-10 w-10 rounded-full bg-background/80 shadow-md hover:bg-background"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div 
          className="flex gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {onShare && (
            <Button
              variant="ghost"
              size="icon"
               className="h-10 w-10 rounded-full bg-background/80 shadow-md hover:bg-background"
              onClick={onShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          )}
          {onFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full bg-background/80 shadow-md hover:bg-background",
                isFavorite && "text-red-500"
              )}
              onClick={onFavorite}
            >
              <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
            </Button>
          )}
        </motion.div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <motion.div 
          className="absolute top-16 left-4 flex flex-wrap gap-2 z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {badges.map((badge, idx) => (
            <Badge 
              key={idx} 
              variant={badge.variant || "secondary"}
              className="bg-background/80 shadow-md"
            >
              {badge.label}
            </Badge>
          ))}
        </motion.div>
      )}

      {/* Image indicators */}
      {images.length > 1 && (
        <motion.div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onImageChange(idx)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                idx === currentIndex
                  ? "w-6 bg-primary shadow-lg shadow-primary/50"
                  : "w-2 bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </motion.div>
      )}

      {/* Custom overlay content */}
      {overlay}

      {/* Bottom content */}
      {children && (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-4 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};
