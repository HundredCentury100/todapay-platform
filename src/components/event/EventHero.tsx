import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Heart, Star, Calendar, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EventShareDialog from "@/components/EventShareDialog";
import { AddToCalendarButton } from "@/components/calendar/AddToCalendarButton";

interface EventHeroProps {
  event: {
    id: string;
    name: string;
    image_url?: string;
    venue: string;
    location: string;
    event_date: string;
    event_time: string;
    type: string;
    description?: string;
  };
  averageRating?: number;
  reviewCount?: number;
}

const EventHero = ({ event, averageRating = 0, reviewCount = 0 }: EventHeroProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Hero Image */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6 }}
          src={event.image_url || "/placeholder.svg"}
          alt={event.name}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Top Actions - Floating */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between safe-area-pt">
          <Button
            variant="ghost"
            size="icon"
             className="w-10 h-10 rounded-full bg-background/80 shadow-md hover:bg-background"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
               className="w-10 h-10 rounded-full bg-background/80 shadow-md hover:bg-background"
            >
              <Heart className="h-5 w-5" />
            </Button>
            <EventShareDialog
              eventId={event.id}
              eventName={event.name}
              eventDate={event.event_date}
              eventVenue={event.venue}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-full bg-background/80 shadow-md hover:bg-background"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              }
            />
          </div>
        </div>
        
        {/* Floating Badges */}
        <div className="absolute bottom-24 left-4 flex gap-2">
          <Badge className="bg-primary text-primary-foreground">{event.type}</Badge>
          {averageRating > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {averageRating.toFixed(1)}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Content below hero - overlapping */}
      <div className="relative -mt-16 px-4 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-3">{event.name}</h1>
          
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{new Date(event.event_date).toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric'
              })}</span>
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
          
          {/* Quick Calendar Add */}
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
    </div>
  );
};

export default EventHero;
