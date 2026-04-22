import { Card } from "@/components/ui/card";
import { Package, Backpack, ShieldAlert, Music, Utensils, Camera, Shirt, Clock } from "lucide-react";

interface EventWhatToExpectProps {
  eventType: string;
}

const EXPECT_SECTIONS = [
  {
    title: "What's Included",
    icon: Package,
    items: {
      default: ["Entry to the event", "Access to all main areas", "Event program/brochure"],
      Festival: ["Entry to all stages", "Access to food & drink areas", "Festival wristband"],
      Conference: ["Conference badge", "Access to all sessions", "Networking events", "Complimentary refreshments"],
      Theater: ["Reserved seating", "Event program", "Access to intermission lounge"],
      Comedy: ["General admission", "2-drink minimum included"],
    },
  },
  {
    title: "What to Bring",
    icon: Backpack,
    items: {
      default: ["Valid ID or ticket QR code", "Comfortable clothing"],
      Festival: ["Sunscreen & hat", "Comfortable shoes", "Valid ID", "Portable phone charger"],
      Conference: ["Business cards", "Laptop/tablet", "Valid ID badge"],
      "Experiences": ["Comfortable clothing", "Camera", "Water bottle", "Valid ID"],
    },
  },
  {
    title: "Rules & Policies",
    icon: ShieldAlert,
    items: {
      default: ["No outside food or drinks", "No professional cameras", "Follow venue safety guidelines", "Arrive 30 minutes before start"],
      Festival: ["No glass containers", "No drones", "Bag search at entry", "No re-entry after exit"],
      Conference: ["Smart casual dress code", "No recording without permission", "Respect speaker Q&A time limits"],
    },
  },
];

const SECTION_ICONS: Record<string, React.ElementType> = {
  "What's Included": Package,
  "What to Bring": Backpack,
  "Rules & Policies": ShieldAlert,
};

export const EventWhatToExpect = ({ eventType }: EventWhatToExpectProps) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">What to Expect</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {EXPECT_SECTIONS.map((section) => {
          const Icon = SECTION_ICONS[section.title] || Package;
          const items = (section.items as any)[eventType] || section.items.default;

          return (
            <Card key={section.title} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-medium text-sm">{section.title}</h4>
              </div>
              <ul className="space-y-1.5">
                {items.map((item: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
