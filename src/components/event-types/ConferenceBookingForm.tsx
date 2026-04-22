import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Presentation, Globe, Utensils, Award, Users, BookOpen } from "lucide-react";

interface ConferenceBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const ConferenceBookingForm = ({ formData, setFormData }: ConferenceBookingFormProps) => {
  const attendanceTypes = [
    { value: "in-person", label: "In-Person", description: "Full access to venue & networking", price: "$299" },
    { value: "virtual", label: "Virtual", description: "Live stream + on-demand replay", price: "$149" },
    { value: "hybrid", label: "Hybrid (Day 1 Virtual + Day 2 In-Person)", description: "Flexible attendance", price: "$249" },
  ];

  const tracks = [
    { id: "tech", label: "Technology & Innovation", sessions: 8 },
    { id: "business", label: "Business Strategy", sessions: 6 },
    { id: "leadership", label: "Leadership", sessions: 5 },
    { id: "workshops", label: "Hands-on Workshops", sessions: 5, extra: "+$50" },
  ];

  const workshops = [
    { id: "ai-basics", label: "AI for Business Leaders", time: "Day 1, 2:00 PM", spots: 25 },
    { id: "data-viz", label: "Data Visualization Masterclass", time: "Day 1, 4:00 PM", spots: 20 },
    { id: "pitch", label: "Perfect Your Pitch", time: "Day 2, 9:00 AM", spots: 30 },
    { id: "networking", label: "Strategic Networking", time: "Day 2, 2:00 PM", spots: 40 },
  ];

  const dietaryOptions = [
    "Standard",
    "Vegetarian",
    "Vegan",
    "Halal",
    "Kosher",
    "Gluten-free",
    "Dairy-free",
    "Nut-free",
  ];

  return (
    <div className="space-y-6">
      {/* Attendance Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Attendance Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.attendanceType || "in-person"}
            onValueChange={(value) => setFormData({ ...formData, attendanceType: value })}
            className="space-y-3"
          >
            {attendanceTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={type.value} id={`attendance-${type.value}`} />
                <Label htmlFor={`attendance-${type.value}`} className="flex-1 cursor-pointer">
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

      {/* Professional Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Professional Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="company">Company/Organization</Label>
            <Input
              id="company"
              value={formData.company || ""}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Your company name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="job-title">Job Title</Label>
            <Input
              id="job-title"
              value={formData.jobTitle || ""}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="Your role"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="linkedin">LinkedIn Profile (optional)</Label>
            <Input
              id="linkedin"
              value={formData.linkedin || ""}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              placeholder="linkedin.com/in/yourprofile"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Track Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Preferred Tracks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground mb-3">
            Select tracks you're interested in (helps us personalize your schedule)
          </p>
          {tracks.map((track) => (
            <div key={track.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={track.id}
                checked={formData.tracks?.includes(track.id)}
                onCheckedChange={(checked) => {
                  const current = formData.tracks || [];
                  setFormData({
                    ...formData,
                    tracks: checked
                      ? [...current, track.id]
                      : current.filter((t: string) => t !== track.id),
                  });
                }}
              />
              <Label htmlFor={track.id} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{track.label}</p>
                    <p className="text-sm text-muted-foreground">{track.sessions} sessions</p>
                  </div>
                  {track.extra && <Badge variant="outline">{track.extra}</Badge>}
                </div>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Workshop Registration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Presentation className="h-4 w-4" />
            Workshop Registration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground mb-3">
            Limited spots available - register early!
          </p>
          {workshops.map((workshop) => (
            <div key={workshop.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={workshop.id}
                checked={formData.workshops?.includes(workshop.id)}
                onCheckedChange={(checked) => {
                  const current = formData.workshops || [];
                  setFormData({
                    ...formData,
                    workshops: checked
                      ? [...current, workshop.id]
                      : current.filter((w: string) => w !== workshop.id),
                  });
                }}
              />
              <Label htmlFor={workshop.id} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{workshop.label}</p>
                    <p className="text-sm text-muted-foreground">{workshop.time}</p>
                  </div>
                  <Badge variant="secondary">{workshop.spots} spots left</Badge>
                </div>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CPD Credits */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4" />
            CPD/CE Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="cpd-request"
              checked={formData.requestCPD}
              onCheckedChange={(checked) => setFormData({ ...formData, requestCPD: checked })}
            />
            <Label htmlFor="cpd-request" className="cursor-pointer">
              <p className="font-medium">Request CPD Certificate (12 points available)</p>
              <p className="text-sm text-muted-foreground">Certificate will be issued after attendance verification</p>
            </Label>
          </div>
          {formData.requestCPD && (
            <div>
              <Label htmlFor="professional-id">Professional Registration Number</Label>
              <Input
                id="professional-id"
                value={formData.professionalId || ""}
                onChange={(e) => setFormData({ ...formData, professionalId: e.target.value })}
                placeholder="Your professional body registration"
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dietary Requirements */}
      {formData.attendanceType !== "virtual" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Utensils className="h-4 w-4" />
              Dietary Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={formData.dietary || "Standard"}
              onValueChange={(value) => setFormData({ ...formData, dietary: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dietary preference" />
              </SelectTrigger>
              <SelectContent>
                {dietaryOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <Label htmlFor="allergies">Specific Allergies (optional)</Label>
              <Textarea
                id="allergies"
                value={formData.allergies || ""}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="Please list any specific allergies or requirements"
                className="mt-1"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Networking Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Networking Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="networking-opt-in"
              checked={formData.networkingOptIn}
              onCheckedChange={(checked) => setFormData({ ...formData, networkingOptIn: checked })}
            />
            <Label htmlFor="networking-opt-in">Include my profile in attendee directory</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="matchmaking"
              checked={formData.matchmaking}
              onCheckedChange={(checked) => setFormData({ ...formData, matchmaking: checked })}
            />
            <Label htmlFor="matchmaking">Opt-in to AI-powered networking matchmaking</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sponsor-contact"
              checked={formData.sponsorContact}
              onCheckedChange={(checked) => setFormData({ ...formData, sponsorContact: checked })}
            />
            <Label htmlFor="sponsor-contact">Allow sponsors to contact me with relevant offers</Label>
          </div>
        </CardContent>
      </Card>

      {/* Special Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Special Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.specialRequirements || ""}
            onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
            placeholder="Any accessibility needs, interpreter requirements, or other special requests"
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ConferenceBookingForm;
