import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { WorkspaceData } from "@/services/workspaceService";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

interface WorkspaceCardProps {
  workspace: WorkspaceData;
}

const WORKSPACE_TYPE_LABELS: Record<string, string> = {
  hot_desk: "Hot Desk",
  dedicated_desk: "Dedicated Desk",
  private_office: "Private Office",
  meeting_room: "Meeting Room",
  conference_room: "Conference Room",
  virtual_office: "Virtual Office",
  event_space: "Event Space",
  podcast_studio: "Podcast Studio",
  photo_studio: "Photo Studio",
};

export const WorkspaceCard = ({ workspace }: WorkspaceCardProps) => {
  const { convertPrice } = useCurrency();
  const [currentImage, setCurrentImage] = useState(0);
  const images = workspace.images || [];
  
  const lowestRate = Math.min(
    workspace.hourly_rate || Infinity,
    workspace.daily_rate || Infinity,
    workspace.weekly_rate || Infinity,
    workspace.monthly_rate || Infinity
  );

  const rateLabel = workspace.hourly_rate 
    ? "/hour" 
    : workspace.daily_rate 
    ? "/day" 
    : workspace.weekly_rate 
    ? "/week" 
    : "/month";

  const createdDate = new Date(workspace.created_at);
  const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const isNew = daysSinceCreated < 30;

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };
  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Link to={`/workspaces/${workspace.id}`} className="group block">
      {/* Image - Airbnb square */}
      <div className="relative aspect-square rounded-2xl overflow-hidden">
        <img
          src={images[currentImage] || "/placeholder.svg"}
          alt={workspace.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {images.slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === currentImage ? "bg-white w-3" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
        {isNew && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-primary-foreground rounded-full shadow-md">New</Badge>
          </div>
        )}
      </div>

      {/* Content - Airbnb minimal */}
      <div className="pt-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[15px] line-clamp-1 group-hover:text-primary transition-colors">
            {workspace.name}
          </h3>
          <span className="flex items-center gap-1 text-sm shrink-0">
            <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
            4.5
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {workspace.city}, {workspace.country}
        </p>
        <p className="text-sm text-muted-foreground">
          {WORKSPACE_TYPE_LABELS[workspace.workspace_type] || workspace.workspace_type} · Up to {workspace.capacity}
        </p>
        <p className="text-[15px] pt-1">
          <span className="font-semibold">
            {convertPrice(lowestRate === Infinity ? 0 : lowestRate)}
          </span>
          <span className="text-muted-foreground"> {rateLabel}</span>
        </p>
      </div>
    </Link>
  );
};

export default WorkspaceCard;
