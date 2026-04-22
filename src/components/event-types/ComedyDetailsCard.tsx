import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Laugh, Wine, Users, AlertCircle, Star, Clock, Mic } from "lucide-react";

interface ComedyDetailsCardProps {
  event: any;
}

const ComedyDetailsCard = ({ event }: ComedyDetailsCardProps) => {
  // Zimbabwe comedy details
  const comedyDetails = {
    showType: "Stand-up Comedy",
    duration: "90 minutes",
    ageRestriction: "18+",
    contentWarning: "Adult language and themes",
    drinkMinimum: 2,
    drinkMinimumValue: "$15",
    comedian: {
      name: "Headliner",
      bio: "Award-winning comedian known for sharp social commentary and hilarious crowd work",
      credits: ["Harare Comedy Festival Headliner", "HIFA Main Stage"],
      socialMedia: "",
    },
    openingActs: [
      { name: "Opening Act 1", time: "7:30 PM" },
      { name: "Opening Act 2", time: "8:00 PM" },
    ],
    seatingOptions: [
      { type: "VIP Table", description: "Front row tables, 4 seats each, bottle service available", price: "Premium" },
      { type: "Standard Table", description: "Center tables, 2-4 seats, great view", price: "Standard" },
      { type: "Theater Seating", description: "Traditional seats, full stage view", price: "Budget" },
      { type: "Bar Seating", description: "Casual seating at the bar area", price: "Economy" },
    ],
    venueRules: [
      "Two drink minimum per person",
      "No heckling - performers will handle it",
      "Photography allowed before show only",
      "Late seating between acts only",
      "No recording during performance",
    ],
    packages: [
      { name: "Date Night", includes: ["2 VIP seats", "Champagne bottle", "Biltong platter"], price: "$120" },
      { name: "Crew Outing", includes: ["6 standard seats", "Pitcher of cocktails", "Snack platter"], price: "$180" },
      { name: "Meet & Greet", includes: ["VIP seat", "Photo with comedian", "Signed poster"], price: "$80" },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Show Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Laugh className="h-5 w-5 text-primary" />
            Show Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Mic className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Show Type</p>
              <p className="font-semibold text-sm">{comedyDetails.showType}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-semibold">{comedyDetails.duration}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
              <p className="text-sm text-muted-foreground">Age</p>
              <Badge variant="destructive">{comedyDetails.ageRestriction}</Badge>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Wine className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Drink Min.</p>
              <p className="font-semibold">{comedyDetails.drinkMinimum} drinks</p>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              ⚠️ Content Warning: {comedyDetails.contentWarning}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Headliner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Featured Comedian
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-xl font-bold">{comedyDetails.comedian.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">{comedyDetails.comedian.bio}</p>
            <p className="text-sm text-primary mt-2">{comedyDetails.comedian.socialMedia}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">As Seen On</p>
            <div className="flex flex-wrap gap-2">
              {comedyDetails.comedian.credits.map((credit, index) => (
                <Badge key={index} variant="secondary">{credit}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lineup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Show Lineup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {comedyDetails.openingActs.map((act, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{act.name}</p>
                  <p className="text-sm text-muted-foreground">Opening Act</p>
                </div>
                <Badge variant="outline">{act.time}</Badge>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div>
                <p className="font-bold">{comedyDetails.comedian.name}</p>
                <p className="text-sm text-muted-foreground">Headliner</p>
              </div>
              <Badge>8:30 PM</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seating Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Seating Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {comedyDetails.seatingOptions.map((option, index) => (
              <div key={index} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{option.type}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                <Badge variant="outline">{option.price}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wine className="h-5 w-5 text-primary" />
            Special Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {comedyDetails.packages.map((pkg, index) => (
              <div key={index} className="p-4 border rounded-lg hover:border-primary transition-colors">
                <h4 className="font-bold text-lg">{pkg.name}</h4>
                <p className="text-2xl font-bold text-primary mt-1">{pkg.price}</p>
                <ul className="mt-3 space-y-1">
                  {pkg.includes.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Venue Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Club Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {comedyDetails.venueRules.map((rule, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                {rule}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComedyDetailsCard;
