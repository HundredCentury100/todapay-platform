import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Share2, Heart, Star, Calendar, MapPin, Clock, ChevronLeft, ChevronRight, Images, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EventShareDialog from "@/components/EventShareDialog";
import { AddToCalendarButton } from "@/components/calendar/AddToCalendarButton";
import { cn } from "@/lib/utils";

interface EventHeroGridProps {
  event: {
    id: string;
    name: string;
    image?: string;
    images?: string[];
    venue: string;
    location: string;
    event_date: string;
    event_time: string;
    type: string;
    description?: string;
    video_url?: string;
  };
  averageRating?: number;
  reviewCount?: number;
}

const EventHeroGrid = ({ event, averageRating = 0, reviewCount = 0 }: EventHeroGridProps) => {
  const navigate = useNavigate();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const allImages = event.images?.length ? event.images : (event.image ? [event.image] : ["/placeholder.svg"]);
  const displayImages = allImages.slice(0, 5);

  const TopActions = () => (
    <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 safe-area-pt">
      <Button
        variant="ghost"
        size="icon"
         className="w-10 h-10 rounded-full bg-background/80 shadow-md hover:bg-background"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-background/80 shadow-md hover:bg-background">
          <Heart className="h-5 w-5" />
        </Button>
        <EventShareDialog
          eventId={event.id}
          eventName={event.name}
          eventDate={event.event_date}
          eventVenue={event.venue}
          trigger={
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-background/80 shadow-md hover:bg-background">
              <Share2 className="h-5 w-5" />
            </Button>
          }
        />
      </div>
    </div>
  );

  // Mobile: Single hero with animation
  const MobileHero = () => (
    <div className="relative h-[50vh] overflow-hidden md:hidden">
      {videoPlaying && event.video_url ? (
        <iframe
          src={event.video_url}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      ) : (
        <>
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6 }}
            src={allImages[0]}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          {event.video_url && (
            <button
              onClick={(e) => { e.stopPropagation(); setVideoPlaying(true); }}
              className="absolute inset-0 flex items-center justify-center z-5"
            >
              <div className="w-16 h-16 rounded-full bg-background/80 flex items-center justify-center shadow-lg press-effect">
                <Play className="h-7 w-7 text-primary ml-1" />
              </div>
            </button>
          )}
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      <TopActions />
      <div className="absolute bottom-24 left-4 flex gap-2">
        <Badge className="bg-primary text-primary-foreground">{event.type}</Badge>
        {averageRating > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {averageRating.toFixed(1)}
          </Badge>
        )}
      </div>
      {allImages.length > 1 && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-24 right-4 rounded-full gap-1.5"
          onClick={() => setGalleryOpen(true)}
        >
          <Images className="h-4 w-4" />
          {allImages.length}
        </Button>
      )}
    </div>
  );

  // Desktop: 5-image grid
  const DesktopGrid = () => (
    <div className="hidden md:block relative">
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-2xl overflow-hidden mx-4 mt-4">
        {/* Main large image */}
        <div
          className="col-span-2 row-span-2 relative cursor-pointer group"
          onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
        >
          <img src={displayImages[0]} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        {/* Small images */}
        {displayImages.slice(1, 5).map((img, i) => (
          <div
            key={i}
            className={cn(
              "relative cursor-pointer group overflow-hidden",
              i === 1 && "rounded-tr-2xl",
              i === 3 && "rounded-br-2xl"
            )}
            onClick={() => { setGalleryIndex(i + 1); setGalleryOpen(true); }}
          >
            <img src={img} alt={`${event.name} ${i + 2}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            {/* Show all photos button on last image */}
            {i === 3 && allImages.length > 5 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-medium text-sm">+{allImages.length - 5} more</span>
              </div>
            )}
          </div>
        ))}
        {/* Fill empty slots */}
        {displayImages.length < 5 && Array.from({ length: 5 - displayImages.length }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-muted flex items-center justify-center">
            <Calendar className="h-8 w-8 text-muted-foreground/30" />
          </div>
        ))}
      </div>
      <TopActions />
      <div className="absolute bottom-4 left-8 flex gap-2">
        <Badge className="bg-primary text-primary-foreground">{event.type}</Badge>
        {averageRating > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {averageRating.toFixed(1)} ({reviewCount})
          </Badge>
        )}
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="absolute bottom-4 right-8 rounded-full gap-1.5"
        onClick={() => setGalleryOpen(true)}
      >
        <Images className="h-4 w-4" />
        Show all photos
      </Button>
    </div>
  );

  return (
    <>
      <MobileHero />
      <DesktopGrid />

      {/* Event Info */}
      <div className="relative px-4 pb-4 md:pt-4 -mt-16 md:mt-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">{event.name}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span>{event.event_time}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="line-clamp-1">{event.venue}, {event.location}</span>
          </div>
          <div className="mt-3">
            <AddToCalendarButton
              title={event.name}
              description={event.description || `Event at ${event.venue}`}
              location={`${event.venue}, ${event.location}`}
              startDate={new Date(`${event.event_date}T${event.event_time}`)}
              size="sm"
              variant="outline"
              className="text-xs"
            />
          </div>
        </motion.div>
      </div>

      {/* Full Gallery Dialog */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0">
          <div className="relative h-[80vh] flex items-center justify-center">
            <img
              src={allImages[galleryIndex]}
              alt={`${event.name} ${galleryIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full"
                  onClick={() => setGalleryIndex((galleryIndex - 1 + allImages.length) % allImages.length)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full"
                  onClick={() => setGalleryIndex((galleryIndex + 1) % allImages.length)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {galleryIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventHeroGrid;
