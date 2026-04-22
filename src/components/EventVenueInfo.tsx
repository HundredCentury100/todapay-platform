import { MapPin, Car, Train, Phone, Globe, Clock, Info, Shirt, Camera, UtensilsCrossed } from "lucide-react";
import { GoogleMapsLink } from "@/components/ui/GoogleMapsLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface EventVenueInfoProps {
  venue: string;
  location: string;
  eventType?: string;
}

const EventVenueInfo = ({ venue, location, eventType }: EventVenueInfoProps) => {
  // Mock venue details - in production, fetch from database
  const venueDetails = {
    address: `${venue}, ${location}`,
    parkingInfo: "Paid parking available on-site. $50 per vehicle. Overflow parking at nearby mall.",
    publicTransport: "Accessible via Gautrain (Sandton Station) and multiple Rea Vaya bus routes.",
    contactPhone: "+27 11 123 4567",
    website: "https://venue-example.com",
    openingTime: "Gates open 2 hours before event",
  };

  const whatToBring = [
    { icon: <Shirt className="h-4 w-4" />, item: "Comfortable clothing and shoes", required: true },
    { icon: <Camera className="h-4 w-4" />, item: "Camera (no professional equipment)", required: false },
    { icon: <UtensilsCrossed className="h-4 w-4" />, item: "Cash for food vendors", required: false },
  ];

  const eventRules = [
    "No outside food or beverages allowed",
    "No professional cameras or recording equipment",
    "No weapons or dangerous items",
    "No re-entry once you leave the venue",
    "Children under 12 must be accompanied by an adult",
    "Management reserves the right of admission",
  ];

  return (
    <div className="space-y-4">
      {/* Venue Location Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Venue & Directions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Map placeholder */}
          <div className="h-48 bg-muted rounded-lg flex items-center justify-center border border-border">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{venueDetails.address}</p>
              <GoogleMapsLink 
                address={venueDetails.address} 
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                Open in Google Maps →
              </GoogleMapsLink>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Car className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Parking</p>
                <p className="text-xs text-muted-foreground">{venueDetails.parkingInfo}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Train className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Public Transport</p>
                <p className="text-xs text-muted-foreground">{venueDetails.publicTransport}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Gates Open</p>
                <p className="text-xs text-muted-foreground">{venueDetails.openingTime}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Venue Contact</p>
                <p className="text-xs text-muted-foreground">{venueDetails.contactPhone}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What to Bring & Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-primary" />
            Event Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what-to-bring">
              <AccordionTrigger className="text-sm font-medium">
                What to Bring
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {whatToBring.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <span className="text-primary">{item.icon}</span>
                      <span>{item.item}</span>
                      {item.required && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rules">
              <AccordionTrigger className="text-sm font-medium">
                Event Rules & Policies
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {eventRules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="accessibility">
              <AccordionTrigger className="text-sm font-medium">
                Accessibility Information
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Wheelchair accessible entrances and seating areas available</p>
                  <p>• Accessible restrooms on all levels</p>
                  <p>• Sign language interpreters available upon request (48h notice)</p>
                  <p>• Service animals welcome</p>
                  <p>Contact venue for specific accessibility requirements</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventVenueInfo;
