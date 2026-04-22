import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Heart, ArrowRight, Clock, Bus, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatTime, getRelativeDate } from "@/utils/dateFormatters";

interface BusHeroProps {
  bus: {
    id: string;
    operator: string;
    from: string;
    to: string;
    departureTime: string;
    arrivalTime: string;
    duration?: string;
    type?: string;
    amenities?: string[];
  };
  travelDate?: Date;
}

const BusHero = ({ bus, travelDate = new Date() }: BusHeroProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      {/* Top Actions */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between safe-area-pt z-10">
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
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-background/80 shadow-md hover:bg-background"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Route Visualization */}
      <div className="pt-20 pb-6 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Operator & Type */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{bus.operator}</h1>
              {bus.type && (
                <Badge variant="secondary" className="text-xs">{bus.type}</Badge>
              )}
            </div>
          </div>

          {/* Route Visualization Card */}
          <div className="bg-background rounded-2xl p-4 shadow-sm border">
            <div className="flex items-center gap-4">
              {/* From */}
              <div className="flex-1">
                <p className="text-2xl font-bold">{formatTime(bus.departureTime)}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{bus.from}</p>
              </div>

              {/* Route Line */}
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-center w-full">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-primary via-primary/50 to-primary relative">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary to-primary/50"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ transformOrigin: "left" }}
                    />
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                {bus.duration && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {bus.duration}
                  </p>
                )}
              </div>

              {/* To */}
              <div className="flex-1 text-right">
                <p className="text-2xl font-bold">{formatTime(bus.arrivalTime)}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{bus.to}</p>
              </div>
            </div>

            {/* Date */}
            <div className="mt-3 pt-3 border-t flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{getRelativeDate(travelDate)}</span>
            </div>
          </div>

          {/* Amenities Pills */}
          {bus.amenities && bus.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bus.amenities.slice(0, 4).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {bus.amenities.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{bus.amenities.length - 4} more
                </Badge>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BusHero;
