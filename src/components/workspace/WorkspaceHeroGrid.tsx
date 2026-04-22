import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Images, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { WorkspaceWishlistButton } from "@/components/workspace/WorkspaceWishlistButton";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface WorkspaceHeroGridProps {
  images: string[];
  workspaceName: string;
  workspaceType: string;
  workspaceId: string;
  onShowGallery: () => void;
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

export const WorkspaceHeroGrid = ({
  images,
  workspaceName,
  workspaceType,
  workspaceId,
  onShowGallery,
}: WorkspaceHeroGridProps) => {
  const isMobile = useIsMobile();
  const [mobileIndex, setMobileIndex] = useState(0);
  const displayImages = images.length > 0 ? images : ["/placeholder.svg"];

  if (isMobile) {
    return (
      <div className="relative h-64 rounded-2xl overflow-hidden mb-4 group" onClick={onShowGallery}>
        <img
          src={displayImages[mobileIndex]}
          alt={workspaceName}
          className="w-full h-full object-cover"
        />
        {displayImages.length > 1 && (
          <>
            <Button
              variant="ghost" size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80"
              onClick={(e) => { e.stopPropagation(); setMobileIndex(i => i === 0 ? displayImages.length - 1 : i - 1); }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80"
              onClick={(e) => { e.stopPropagation(); setMobileIndex(i => i === displayImages.length - 1 ? 0 : i + 1); }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
              {displayImages.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  className={cn("w-2 h-2 rounded-full transition-colors", i === mobileIndex ? "bg-white" : "bg-white/50")}
                  onClick={(e) => { e.stopPropagation(); setMobileIndex(i); }}
                />
              ))}
            </div>
          </>
        )}
        <Badge className="absolute top-4 left-4 capitalize">
          {WORKSPACE_TYPE_LABELS[workspaceType] || workspaceType}
        </Badge>
        <div className="absolute top-4 right-4">
          <WorkspaceWishlistButton workspaceId={workspaceId} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden mb-6 cursor-pointer group" onClick={onShowGallery}>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px]">
        <div className="col-span-2 row-span-2">
          <img src={displayImages[0]} alt={workspaceName} className="w-full h-full object-cover group-hover:brightness-95 transition-all" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={cn("overflow-hidden", i === 2 && "rounded-tr-2xl", i === 4 && "rounded-br-2xl")}>
            <img
              src={displayImages[i] || displayImages[0]}
              alt={`${workspaceName} ${i + 1}`}
              className="w-full h-full object-cover group-hover:brightness-95 transition-all"
            />
          </div>
        ))}
      </div>
      <Badge className="absolute top-4 left-4 capitalize text-sm">
        {WORKSPACE_TYPE_LABELS[workspaceType] || workspaceType}
      </Badge>
      <div className="absolute top-4 right-4">
        <WorkspaceWishlistButton workspaceId={workspaceId} />
      </div>
      <Button variant="secondary" size="sm" className="absolute bottom-4 right-4" onClick={(e) => { e.stopPropagation(); onShowGallery(); }}>
        <Images className="h-4 w-4 mr-2" />
        Show all photos
      </Button>
    </div>
  );
};
