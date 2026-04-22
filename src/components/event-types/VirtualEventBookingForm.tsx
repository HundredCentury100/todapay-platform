import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Monitor, Globe, Video, MessageSquare, Download, Headphones } from "lucide-react";

interface VirtualEventBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const VirtualEventBookingForm = ({ formData, setFormData }: VirtualEventBookingFormProps) => {
  const accessTypes = [
    { value: "live", label: "Live Access Only", description: "Watch live, no replay", price: "$49" },
    { value: "live-replay", label: "Live + Replay", description: "Live access + 30-day replay", price: "$79" },
    { value: "premium", label: "Premium Access", description: "Live + replay + downloadable materials", price: "$129" },
    { value: "vip", label: "VIP Experience", description: "All access + private Q&A session", price: "$199" },
  ];

  const timeZones = [
    { value: "Africa/Harare", label: "Zimbabwe (CAT)" },
    { value: "Africa/Johannesburg", label: "South Africa (SAST)" },
    { value: "Africa/Lusaka", label: "Zambia (CAT)" },
    { value: "Africa/Maputo", label: "Mozambique (CAT)" },
    { value: "Africa/Gaborone", label: "Botswana (CAT)" },
  ];

  const interactiveFeatures = [
    { id: "qa", label: "Live Q&A Participation", description: "Submit and vote on questions" },
    { id: "polls", label: "Interactive Polls", description: "Participate in real-time polls" },
    { id: "breakout", label: "Breakout Rooms", description: "Join small group discussions" },
    { id: "networking", label: "Networking Lounge", description: "Connect with other attendees" },
  ];

  const techRequirements = [
    { label: "Internet Speed", value: "5 Mbps+" },
    { label: "Browser", value: "Chrome, Firefox, Safari (latest)" },
    { label: "Device", value: "Desktop, laptop, tablet, or smartphone" },
  ];

  return (
    <div className="space-y-6">
      {/* Access Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="h-4 w-4" />
            Access Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.accessType || "live-replay"}
            onValueChange={(value) => setFormData({ ...formData, accessType: value })}
            className="space-y-3"
          >
            {accessTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={type.value} id={`access-${type.value}`} />
                <Label htmlFor={`access-${type.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    <Badge variant="default">{type.price}</Badge>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Time Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Your Time Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.timeZone || "Africa/Johannesburg"}
            onValueChange={(value) => setFormData({ ...formData, timeZone: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your time zone" />
            </SelectTrigger>
            <SelectContent>
              {timeZones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-2">
            We'll send reminders in your local time
          </p>
        </CardContent>
      </Card>

      {/* Interactive Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Interactive Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground mb-3">
            Select which features you'd like to participate in
          </p>
          {interactiveFeatures.map((feature) => (
            <div key={feature.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={feature.id}
                checked={formData.features?.includes(feature.id) ?? true}
                onCheckedChange={(checked) => {
                  const current = formData.features || interactiveFeatures.map(f => f.id);
                  setFormData({
                    ...formData,
                    features: checked
                      ? [...current, feature.id]
                      : current.filter((f: string) => f !== feature.id),
                  });
                }}
              />
              <Label htmlFor={feature.id} className="flex-1 cursor-pointer">
                <p className="font-medium">{feature.label}</p>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            Calendar & Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="calendar-invite"
              checked={formData.calendarInvite ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, calendarInvite: checked })}
            />
            <Label htmlFor="calendar-invite">Send calendar invite (.ics file)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reminder-24h"
              checked={formData.reminder24h ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, reminder24h: checked })}
            />
            <Label htmlFor="reminder-24h">Remind me 24 hours before</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reminder-1h"
              checked={formData.reminder1h ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, reminder1h: checked })}
            />
            <Label htmlFor="reminder-1h">Remind me 1 hour before</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reminder-15m"
              checked={formData.reminder15m}
              onCheckedChange={(checked) => setFormData({ ...formData, reminder15m: checked })}
            />
            <Label htmlFor="reminder-15m">Remind me 15 minutes before</Label>
          </div>
        </CardContent>
      </Card>

      {/* Tech Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4" />
            Technical Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <p className="font-medium text-sm">Minimum Requirements:</p>
            {techRequirements.map((req, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{req.label}</span>
                <span>{req.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tech-check"
              checked={formData.joinTechCheck}
              onCheckedChange={(checked) => setFormData({ ...formData, joinTechCheck: checked })}
            />
            <Label htmlFor="tech-check" className="cursor-pointer">
              <p className="font-medium">Join pre-event tech check session</p>
              <p className="text-sm text-muted-foreground">30 minutes before event - test your setup</p>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accessibility Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="captions"
              checked={formData.captions ?? true}
              onCheckedChange={(checked) => setFormData({ ...formData, captions: checked })}
            />
            <Label htmlFor="captions">Enable closed captions</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="high-contrast"
              checked={formData.highContrast}
              onCheckedChange={(checked) => setFormData({ ...formData, highContrast: checked })}
            />
            <Label htmlFor="high-contrast">High contrast mode</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="audio-only"
              checked={formData.audioOnly}
              onCheckedChange={(checked) => setFormData({ ...formData, audioOnly: checked })}
            />
            <Label htmlFor="audio-only">Audio-only option (low bandwidth)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Support Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Headphones className="h-4 w-4" />
            Support Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="support-phone">Phone Number (for urgent support)</Label>
            <Input
              id="support-phone"
              value={formData.supportPhone || ""}
              onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
              placeholder="+27 XX XXX XXXX"
              className="mt-1"
            />
          </div>
          <Select
            value={formData.supportPreference || "chat"}
            onValueChange={(value) => setFormData({ ...formData, supportPreference: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Preferred support channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chat">Live Chat</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone Call</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="virtual-terms"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => setFormData({ ...formData, termsAccepted: checked })}
            />
            <Label htmlFor="virtual-terms" className="cursor-pointer">
              <p className="font-medium">I agree to the virtual event terms</p>
              <p className="text-sm text-muted-foreground">
                Including recording consent, code of conduct, and privacy policy
              </p>
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VirtualEventBookingForm;
