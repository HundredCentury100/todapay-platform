import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface StayShareCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: {
    name: string;
    city: string;
    country: string;
    star_rating?: number;
    review_score?: number;
    review_count?: number;
    images: string[];
    min_price?: number;
    property_type: string;
  };
}

export const StayShareCard = ({ open, onOpenChange, property }: StayShareCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `${property.name.replace(/\s+/g, "-")}-share.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Share card downloaded!");
    } catch {
      toast.error("Failed to generate image");
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "stay-share.png", { type: "image/png" });
        if (navigator.share) {
          await navigator.share({ title: property.name, text: `Check out ${property.name} in ${property.city}!`, files: [file] });
        } else {
          handleDownload();
        }
        setGenerating(false);
      });
    } catch {
      setGenerating(false);
      toast.error("Share failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share as Story Card</DialogTitle>
        </DialogHeader>

        {/* The shareable card */}
        <div
          ref={cardRef}
          className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-gradient-to-b from-primary/80 to-primary"
        >
          <img
            src={property.images?.[0] || "/placeholder.svg"}
            alt={property.name}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
          />
          <div className="relative h-full flex flex-col justify-between p-6 text-white">
            {/* Top */}
            <div>
              <span className="text-xs font-medium uppercase tracking-widest opacity-80">
                {property.property_type.replace("_", " ")}
              </span>
              {property.star_rating && (
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: property.star_rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              )}
            </div>

            {/* Center image */}
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30">
                <img
                  src={property.images?.[0] || "/placeholder.svg"}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Bottom */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold leading-tight">{property.name}</h2>
              <p className="text-sm opacity-90 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {property.city}, {property.country}
              </p>
              <div className="flex items-center justify-between pt-2">
                {property.min_price && (
                  <span className="text-lg font-bold">
                    From R{property.min_price}<span className="text-xs font-normal">/night</span>
                  </span>
                )}
                {property.review_score && property.review_score > 0 && (
                  <span className="bg-white/20 rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {property.review_score.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-[10px] opacity-50 pt-2 text-center">fulticket.com</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleDownload} disabled={generating}>
            <Download className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button className="flex-1" onClick={handleShare} disabled={generating}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
