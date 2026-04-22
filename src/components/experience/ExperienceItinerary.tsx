import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface ItineraryStep {
  time: string;
  title: string;
  description?: string;
}

interface ExperienceItineraryProps {
  durationHours: number;
  description?: string;
}

const generateItinerary = (durationHours: number, description?: string): ItineraryStep[] => {
  // Generate a sensible default itinerary based on duration
  if (durationHours <= 2) {
    return [
      { time: "Start", title: "Meet & Introduction", description: "Meet your guide at the meeting point" },
      { time: `+${Math.floor(durationHours * 60 * 0.15)}min`, title: "Main Activity", description: "The core experience begins" },
      { time: `+${Math.floor(durationHours * 60 * 0.85)}min`, title: "Wrap Up", description: "Final highlights and farewell" },
    ];
  }
  if (durationHours <= 4) {
    return [
      { time: "Start", title: "Welcome & Briefing", description: "Safety briefing and group introductions" },
      { time: "+30min", title: "First Activity", description: "Begin the main experience" },
      { time: `+${Math.floor(durationHours * 60 * 0.5)}min`, title: "Break & Refreshments", description: "Quick break with included refreshments" },
      { time: `+${Math.floor(durationHours * 60 * 0.6)}min`, title: "Second Activity", description: "Continue with the highlight segment" },
      { time: `+${Math.floor(durationHours * 60 * 0.9)}min`, title: "Conclusion", description: "Group photos and farewell" },
    ];
  }
  return [
    { time: "Start", title: "Pickup & Welcome", description: "Hotel pickup or meeting point gathering" },
    { time: "+30min", title: "First Stop", description: "Begin exploring the first location" },
    { time: "+2h", title: "Lunch Break", description: "Enjoy a local meal (included)" },
    { time: "+3h", title: "Main Highlight", description: "The signature experience of the tour" },
    { time: `+${Math.floor(durationHours * 60 * 0.75)}min`, title: "Free Time", description: "Explore at your own pace" },
    { time: `+${Math.floor(durationHours * 60 * 0.9)}min`, title: "Return", description: "Head back to the meeting point" },
  ];
};

const ExperienceItinerary = ({ durationHours, description }: ExperienceItineraryProps) => {
  const steps = generateItinerary(durationHours, description);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>{durationHours} hour{durationHours !== 1 ? 's' : ''} total</span>
      </div>
      <div className="relative pl-6">
        {/* Timeline line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />
        
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="relative flex gap-3"
            >
              {/* Dot */}
              <div className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 ${
                idx === 0 ? 'bg-primary border-primary' : 'bg-background border-border'
              }`} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {step.time}
                  </span>
                </div>
                <p className="font-medium text-sm mt-1">{step.title}</p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExperienceItinerary;
