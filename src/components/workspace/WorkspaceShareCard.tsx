import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Download, MessageCircle, MapPin, Users, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface WorkspaceShareCardProps {
  name: string;
  workspaceType: string;
  city: string;
  country: string;
  capacity: number;
  hourlyRate?: number;
  image?: string;
}

const WORKSPACE_TYPE_LABELS: Record<string, string> = {
  hot_desk: "Hot Desk", dedicated_desk: "Dedicated Desk", private_office: "Private Office",
  meeting_room: "Meeting Room", conference_room: "Conference Room", virtual_office: "Virtual Office",
  event_space: "Event Space", podcast_studio: "Podcast Studio", photo_studio: "Photo Studio",
};

const WorkspaceShareCard = ({
  name, workspaceType, city, country, capacity, hourlyRate, image,
}: WorkspaceShareCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: "#09091A" });
      const link = document.createElement("a");
      link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-workspace.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success("Card downloaded!");
    } catch {
      toast.error("Failed to download card");
    }
  };

  const shareWhatsApp = () => {
    const text = `🖥️ Check out ${name} in ${city}!\n\n📍 ${city}, ${country}\n👥 Up to ${capacity} people\n${hourlyRate ? `💰 From $${hourlyRate}/hr` : ""}\n\nBook now on FulTicket!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full press-effect gap-1.5">
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share Workspace</DialogTitle>
        </DialogHeader>

        <div ref={cardRef} className="rounded-2xl overflow-hidden bg-card border border-border/50">
          <div className="h-40 relative overflow-hidden">
            {image ? (
              <img src={image} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-5xl">🖥️</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white font-bold text-lg leading-tight">{name}</p>
              <p className="text-white/80 text-xs mt-0.5">{WORKSPACE_TYPE_LABELS[workspaceType] || workspaceType}</p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {city}, {country}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Up to {capacity}
              </span>
            </div>
            {hourlyRate && (
              <p className="text-lg font-bold text-primary">${hourlyRate.toLocaleString()}/hr</p>
            )}
            <p className="text-[10px] text-muted-foreground/60 pt-1">Powered by FulTicket</p>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <Button onClick={shareWhatsApp} className="flex-1 rounded-full press-effect gap-1.5 bg-green-600 hover:bg-green-700 text-white">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
          <Button onClick={downloadCard} variant="outline" className="flex-1 rounded-full press-effect gap-1.5">
            <Download className="h-4 w-4" /> Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkspaceShareCard;
