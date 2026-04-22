import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Presentation, Users, Award, Wifi, Coffee, 
  Globe, BookOpen, Network, Clock, Building 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ConferenceDetailsCardProps {
  event: any;
}

const ConferenceDetailsCard = ({ event }: ConferenceDetailsCardProps) => {
  // Zimbabwe conference details
  const conferenceDetails = {
    format: "Hybrid",
    duration: "2 Days",
    sessions: 24,
    speakers: 18,
    tracks: [
      { name: "Technology & Innovation", sessions: 8 },
      { name: "Agritech & Mining", sessions: 6 },
      { name: "Entrepreneurship", sessions: 5 },
      { name: "Workshops", sessions: 5 },
    ],
    keynoteSpeakers: [
      {
        name: "Keynote Speaker",
        title: "Industry Leader",
        topic: "Building Pan-African Tech Enterprises",
        image: null,
      },
      {
        name: "Guest Speaker",
        title: "Social Impact Expert",
        topic: "Education & Social Impact at Scale",
        image: null,
      },
      {
        name: "Panel Lead",
        title: "Tech Entrepreneur",
        topic: "Connectivity & Digital Inclusion in Zimbabwe",
        image: null,
      },
    ],
    cpdCredits: {
      available: true,
      points: 12,
      accreditation: "Zimbabwe Institute of Engineers",
    },
    networking: [
      { time: "8:00 AM", activity: "Breakfast Networking" },
      { time: "12:30 PM", activity: "Lunch & Exhibition" },
      { time: "3:30 PM", activity: "Coffee Break Networking" },
      { time: "6:00 PM", activity: "Evening Reception" },
    ],
    exhibitors: 35,
    facilities: [
      { icon: Wifi, name: "Free WiFi", description: "High-speed internet" },
      { icon: Coffee, name: "Refreshments", description: "All-day catering" },
      { icon: Globe, name: "Translation", description: "3 languages" },
      { icon: BookOpen, name: "Materials", description: "Digital handouts" },
    ],
    virtualFeatures: [
      "Live streaming all sessions",
      "Interactive Q&A",
      "Virtual networking rooms",
      "On-demand replay (30 days)",
      "Digital certificate",
    ],
    dietaryOptions: [
      "Vegetarian",
      "Vegan",
      "Halal",
      "Kosher",
      "Gluten-free",
      "Nut-free",
    ],
  };

  return (
    <div className="space-y-6">
      {/* Conference Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5 text-primary" />
            Conference Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Globe className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Format</p>
              <Badge variant="default">{conferenceDetails.format}</Badge>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-semibold">{conferenceDetails.duration}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Presentation className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sessions</p>
              <p className="font-semibold">{conferenceDetails.sessions}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Speakers</p>
              <p className="font-semibold">{conferenceDetails.speakers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CPD Credits */}
      {conferenceDetails.cpdCredits.available && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <Award className="h-12 w-12 text-primary" />
            <div>
              <h4 className="font-bold">CPD/CE Credits Available</h4>
              <p className="text-sm text-muted-foreground">
                Earn {conferenceDetails.cpdCredits.points} CPD points • 
                Accredited by {conferenceDetails.cpdCredits.accreditation}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keynote Speakers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Keynote Speakers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conferenceDetails.keynoteSpeakers.map((speaker, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={speaker.image || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {speaker.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold">{speaker.name}</h4>
                  <p className="text-sm text-muted-foreground">{speaker.title}</p>
                  <p className="text-sm mt-2 text-primary">"{speaker.topic}"</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conference Tracks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Conference Tracks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {conferenceDetails.tracks.map((track, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">{track.name}</span>
                <Badge variant="outline">{track.sessions} sessions</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Networking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Networking Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {conferenceDetails.networking.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <Badge variant="outline" className="min-w-[80px] justify-center">
                  {item.time}
                </Badge>
                <span>{item.activity}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <Building className="inline h-4 w-4 mr-1" />
              {conferenceDetails.exhibitors} exhibitors in the exhibition hall
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Facilities */}
      <Card>
        <CardHeader>
          <CardTitle>Conference Facilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {conferenceDetails.facilities.map((facility, index) => (
              <div key={index} className="text-center p-4 bg-muted rounded-lg">
                <facility.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium text-sm">{facility.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{facility.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Virtual Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Virtual Attendance Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {conferenceDetails.virtualFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                {feature}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dietary Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-primary" />
            Dietary Options Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {conferenceDetails.dietaryOptions.map((option, index) => (
              <Badge key={index} variant="secondary">{option}</Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Please indicate dietary requirements when booking
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConferenceDetailsCard;
