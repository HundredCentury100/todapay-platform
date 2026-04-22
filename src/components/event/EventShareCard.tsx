import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, MapPin, Clock, Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

interface EventShareCardProps {
  event: {
    name: string;
    image?: string;
    venue: string;
    location: string;
    event_date: string;
    event_time: string;
    type: string;
  };
}

const EventShareCard = ({ event }: EventShareCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const eventDate = new Date(event.event_date);

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
      link.download = `${event.name.replace(/\s+/g, '-')}-invite.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Story card saved!", description: "Share it on WhatsApp or Instagram" });
    } catch (err) {
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
        const file = new File([blob], "event-invite.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: event.name,
            text: `Join me at ${event.name}!`,
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
          <DialogTitle className="text-base">Share Event Card</DialogTitle>
        </DialogHeader>

        {/* The card to render as image */}
        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary/80"
          style={{ aspectRatio: "9/16", maxHeight: 400 }}
        >
          {event.image && (
            <img
              src={event.image}
              alt={event.name}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
              crossOrigin="anonymous"
            />
          )}
          <div className="relative z-10 flex flex-col justify-end h-full p-5 text-primary-foreground">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest opacity-80">You're invited to</p>
              <h2 className="text-2xl font-black leading-tight">{event.name}</h2>
              <div className="space-y-1.5 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{event.event_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue}, {event.location}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-primary-foreground/20">
                <p className="text-[10px] uppercase tracking-wider opacity-60">Powered by FulTicket</p>
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

export default EventShareCard;
