import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Theater, Clock, Shirt, Coffee, Accessibility, Star, Music, Eye } from "lucide-react";

interface TheaterDetailsCardProps {
  event: any;
}

const TheaterDetailsCard = ({ event }: TheaterDetailsCardProps) => {
  // Zimbabwe theater details
  const theaterDetails = {
    runtime: "2 hours 15 minutes",
    intermissions: 1,
    intermissionDuration: "20 minutes",
    dressCode: "Smart Casual",
    ageRating: "PG-13",
    language: "English & Shona",
    subtitles: ["English", "Ndebele"],
    director: "Director",
    cast: [
      { name: "Lead Actor", role: "Lead" },
      { name: "Supporting Actor", role: "Supporting" },
      { name: "Supporting Actress", role: "Supporting" },
    ],
    awards: ["NAMA Best Production 2025", "HIFA Outstanding Performance"],
    accessibilityFeatures: [
      "Wheelchair accessible seating",
      "Audio description available",
      "Sign language interpretation (select shows)",
      "Hearing loop system",
    ],
    seatingViews: [
      { section: "Orchestra", view: "Best overall view, close to stage" },
      { section: "Mezzanine", view: "Elevated view, great acoustics" },
      { section: "Balcony", view: "Full stage panorama, budget-friendly" },
    ],
    intermissionServices: [
      "Bar service available",
      "Light refreshments",
      "Merchandise stand",
      "Restrooms on all levels",
    ],
  };

  return (
    <div className="space-y-6">
      {/* Show Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Theater className="h-5 w-5 text-primary" />
            Show Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Runtime</p>
              <p className="font-semibold">{theaterDetails.runtime}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Coffee className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Intermissions</p>
              <p className="font-semibold">{theaterDetails.intermissions}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Shirt className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Dress Code</p>
              <p className="font-semibold">{theaterDetails.dressCode}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Badge variant="outline">{theaterDetails.ageRating}</Badge>
              <p className="text-sm text-muted-foreground mt-1">Age Rating</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Language & Subtitles</h4>
            <p className="text-sm text-muted-foreground">
              Performed in {theaterDetails.language}
              {theaterDetails.subtitles.length > 0 && (
                <span> • Subtitles: {theaterDetails.subtitles.join(", ")}</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cast & Crew */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Cast & Creative Team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Director</p>
            <p className="font-semibold">{theaterDetails.director}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Featured Cast</p>
            <div className="flex flex-wrap gap-2">
              {theaterDetails.cast.map((member, index) => (
                <Badge key={index} variant="secondary">
                  {member.name} ({member.role})
                </Badge>
              ))}
            </div>
          </div>
          {theaterDetails.awards.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Awards & Recognition</p>
              <div className="flex flex-wrap gap-2">
                {theaterDetails.awards.map((award, index) => (
                  <Badge key={index} variant="default" className="bg-amber-500">
                    🏆 {award}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seating Views */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Seating Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {theaterDetails.seatingViews.map((view, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Badge variant="outline">{view.section}</Badge>
                <p className="text-sm text-muted-foreground">{view.view}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Intermission Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-primary" />
            Intermission Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {theaterDetails.intermissionServices.map((service, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {service}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-primary" />
            Accessibility Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {theaterDetails.accessibilityFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default TheaterDetailsCard;
