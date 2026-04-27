import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Clock, Star, Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

interface ExperienceShareCardProps {
  experience: {
    name: string;
    image?: string;
    city: string;
    country: string;
    duration_hours: number;
    price_per_person: number;
    review_score?: number;
    experience_type: string;
  };
}

const ExperienceShareCard = ({ experience }: ExperienceShareCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.download = `${experience.name.replace(/\s+/g, '-')}-experience.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Card saved!", description: "Share it on WhatsApp or Instagram" });
    } catch {
      toast({ title: "Failed to generate", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "experience-card.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: experience.name,
            text: `Check out this experience: ${experience.name}!`,
            files: [file],
          });
        } else {
          handleDownload();
        }
        setGenerating(false);
      });
    } catch {
      setGenerating(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs press-effect">
          <Share2 className="h-3.5 w-3.5" />
          Share as Story
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm p-4">
        <DialogHeader>
          <DialogTitle className="text-base">Share Experience</DialogTitle>
        </DialogHeader>

        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary/80"
          style={{ aspectRatio: "9/16", maxHeight: 400 }}
        >
          {experience.image && (
            <img
              src={experience.image}
              alt={experience.name}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
              crossOrigin="anonymous"
            />
          )}
          <div className="relative z-10 flex flex-col justify-end h-full p-5 text-primary-foreground">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest opacity-80">Experience</p>
              <h2 className="text-2xl font-black leading-tight">{experience.name}</h2>
              <div className="space-y-1.5 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{experience.city}, {experience.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{experience.duration_hours} hours</span>
                </div>
                {experience.review_score && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <span>{experience.review_score.toFixed(1)} rating</span>
                  </div>
                )}
              </div>
              <div className="pt-2">
                <span className="text-xl font-bold">${experience.price_per_person}</span>
                <span className="text-sm opacity-80"> /person</span>
              </div>
              <div className="pt-3 border-t border-primary-foreground/20">
                <p className="text-[10px] uppercase tracking-wider opacity-60">Powered by TodaPay</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <Button onClick={handleDownload} disabled={generating} className="flex-1 gap-1.5 press-effect">
            <Download className="h-4 w-4" />
            Save
          </Button>
          <Button onClick={handleShare} disabled={generating} variant="outline" className="flex-1 gap-1.5 press-effect">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExperienceShareCard;
