import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, Globe, Clock, Wifi, Video, 
  MessageSquare, Download, Award, Users, Headphones 
} from "lucide-react";

interface VirtualEventDetailsCardProps {
  event: any;
}

const VirtualEventDetailsCard = ({ event }: VirtualEventDetailsCardProps) => {
  // Zimbabwe virtual event details
  const virtualDetails = {
    platform: "Zoom Webinar",
    format: "Live + On-Demand",
    duration: "3 hours",
    timeZones: [
      { zone: "Africa/Harare (CAT)", time: "2:00 PM" },
      { zone: "Africa/Johannesburg (SAST)", time: "2:00 PM" },
      { zone: "Africa/Lusaka (CAT)", time: "2:00 PM" },
    ],
    technicalRequirements: [
      { requirement: "Internet Speed", value: "5 Mbps minimum recommended" },
      { requirement: "Browser", value: "Chrome, Firefox, Safari, Edge (latest)" },
      { requirement: "Device", value: "Desktop, laptop, tablet, or smartphone" },
      { requirement: "Audio", value: "Speakers or headphones" },
    ],
    interactiveFeatures: [
      { icon: MessageSquare, name: "Live Chat", description: "Chat with attendees and speakers" },
      { icon: Video, name: "Q&A Sessions", description: "Submit and vote on questions" },
      { icon: Users, name: "Breakout Rooms", description: "Small group discussions" },
      { icon: Download, name: "Live Polls", description: "Real-time audience polling" },
    ],
    accessOptions: [
      { type: "Live Access", description: "Watch live with full interactivity", included: true },
      { type: "Recording Access", description: "On-demand replay for 30 days", included: true },
      { type: "Downloadable Materials", description: "Slides, handouts, resources", included: true },
      { type: "Certificate", description: "Digital certificate of attendance", included: true },
    ],
    support: {
      email: "support@event.com",
      preEvent: "Tech check session 30 mins before",
      liveSupport: "Live chat support during event",
    },
    networkingLounge: {
      available: true,
      features: [
        "1-on-1 video meetings",
        "Virtual business card exchange",
        "Topic-based discussion rooms",
        "Attendee directory",
      ],
    },
    replayAccess: {
      duration: "30 days",
      downloadable: false,
      chapters: true,
    },
    accessibility: [
      "Closed captions (auto-generated)",
      "Screen reader compatible",
      "Keyboard navigation",
      "High contrast mode",
    ],
  };

  return (
    <div className="space-y-6">
      {/* Platform Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Virtual Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Video className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Platform</p>
              <p className="font-semibold text-sm">{virtualDetails.platform}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Globe className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Format</p>
              <Badge variant="default">{virtualDetails.format}</Badge>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-semibold">{virtualDetails.duration}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Headphones className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Support</p>
              <p className="font-semibold text-sm">Live Help</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Zones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Event Times by Region
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {virtualDetails.timeZones.map((tz, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">{tz.zone}</span>
                <Badge variant="outline">{tz.time}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            Technical Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {virtualDetails.technicalRequirements.map((req, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">{req.requirement}</span>
                <span className="text-sm text-muted-foreground">{req.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Interactive Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {virtualDetails.interactiveFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <feature.icon className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">{feature.name}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What's Included */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            What's Included
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {virtualDetails.accessOptions.map((option, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center ${option.included ? 'bg-green-500' : 'bg-muted'}`}>
                  {option.included && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <h4 className="font-medium">{option.type}</h4>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Networking Lounge */}
      {virtualDetails.networkingLounge.available && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Virtual Networking Lounge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {virtualDetails.networkingLounge.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  {feature}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Replay Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Recording & Replay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Access Period</p>
              <p className="font-bold">{virtualDetails.replayAccess.duration}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Downloadable</p>
              <p className="font-bold">{virtualDetails.replayAccess.downloadable ? 'Yes' : 'Stream Only'}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Chapters</p>
              <p className="font-bold">{virtualDetails.replayAccess.chapters ? 'Available' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            Technical Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="font-medium text-green-600 dark:text-green-400">Pre-Event Tech Check</p>
            <p className="text-sm">{virtualDetails.support.preEvent}</p>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="font-medium text-blue-600 dark:text-blue-400">During Event</p>
            <p className="text-sm">{virtualDetails.support.liveSupport}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">Email Support</p>
            <p className="text-sm text-primary">{virtualDetails.support.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {virtualDetails.accessibility.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                {feature}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VirtualEventDetailsCard;
