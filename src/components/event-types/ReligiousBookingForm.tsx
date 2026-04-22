import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Church, Heart, Users, Music, HandHeart, Car } from "lucide-react";

interface ReligiousBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const ReligiousBookingForm = ({ formData, setFormData }: ReligiousBookingFormProps) => {
  const eventTypes = [
    { value: "crusade", label: "Crusade / Revival" },
    { value: "worship-night", label: "Worship Night" },
    { value: "convention", label: "Convention / Conference" },
    { value: "prayer-meeting", label: "Prayer Meeting" },
    { value: "youth-camp", label: "Youth Camp" },
    { value: "choir-concert", label: "Choir Concert" },
    { value: "thanksgiving", label: "Thanksgiving Service" },
    { value: "other", label: "Other" },
  ];

  const denominations = [
    { value: "non-denominational", label: "Non-Denominational" },
    { value: "pentecostal", label: "Pentecostal" },
    { value: "apostolic", label: "Apostolic" },
    { value: "catholic", label: "Catholic" },
    { value: "anglican", label: "Anglican" },
    { value: "methodist", label: "Methodist" },
    { value: "sda", label: "Seventh Day Adventist" },
    { value: "baptist", label: "Baptist" },
    { value: "islamic", label: "Islamic" },
    { value: "other", label: "Other" },
  ];

  const ministrySignups = [
    { id: "prayer-team", label: "Prayer Team", description: "Join the prayer ministry during event" },
    { id: "worship-team", label: "Worship Team", description: "Participate in praise & worship" },
    { id: "ushering", label: "Ushering / Hospitality", description: "Help with seating & welcoming" },
    { id: "children-ministry", label: "Children's Ministry", description: "Volunteer for kids program" },
    { id: "counselling", label: "Counselling Team", description: "Post-service counselling support" },
  ];

  const offeringOptions = [
    { value: "none", label: "No pre-set offering" },
    { value: "tithe", label: "Tithe Offering" },
    { value: "seed-offering", label: "Seed Offering ($10)" },
    { value: "building-fund", label: "Building Fund Contribution ($25)" },
    { value: "missions", label: "Missions Offering ($15)" },
    { value: "custom", label: "Custom Amount" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Church className="h-4 w-4" />
            Event Category
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={formData.religiousEventType || ""}
            onValueChange={(value) => setFormData({ ...formData, religiousEventType: value })}
          >
            <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
            <SelectContent>
              {eventTypes.map((et) => (
                <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div>
            <Label>Denomination / Faith</Label>
            <Select
              value={formData.denomination || "non-denominational"}
              onValueChange={(value) => setFormData({ ...formData, denomination: value })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {denominations.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Group Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={formData.groupSize || "1"}
            onValueChange={(value) => setFormData({ ...formData, groupSize: value })}
          >
            <SelectTrigger><SelectValue placeholder="Number attending" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Individual</SelectItem>
              <SelectItem value="2">Couple</SelectItem>
              <SelectItem value="3-5">Family (3-5)</SelectItem>
              <SelectItem value="6-10">Small Group (6-10)</SelectItem>
              <SelectItem value="11-20">Church Group (11-20)</SelectItem>
              <SelectItem value="20+">Large Group (20+)</SelectItem>
            </SelectContent>
          </Select>
          <div>
            <Label>Church / Fellowship Name (optional)</Label>
            <Input
              placeholder="Your home church"
              value={formData.churchName || ""}
              onChange={(e) => setFormData({ ...formData, churchName: e.target.value })}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4" />
            Prayer Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Share any prayer requests (confidential)..."
            value={formData.prayerRequests || ""}
            onChange={(e) => setFormData({ ...formData, prayerRequests: e.target.value })}
            rows={3}
          />
          <div className="flex items-center space-x-2 mt-3">
            <Checkbox
              id="prayer-wall"
              checked={formData.addToPrayerWall || false}
              onCheckedChange={(checked) => setFormData({ ...formData, addToPrayerWall: checked })}
            />
            <Label htmlFor="prayer-wall" className="text-sm">
              Add to public prayer wall (anonymous)
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Music className="h-4 w-4" />
            Ministry Sign-Up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ministrySignups.map((ministry) => (
            <div key={ministry.id} className="flex items-start space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={`ministry-${ministry.id}`}
                checked={formData.ministrySignups?.includes(ministry.id)}
                onCheckedChange={(checked) => {
                  const current = formData.ministrySignups || [];
                  setFormData({
                    ...formData,
                    ministrySignups: checked
                      ? [...current, ministry.id]
                      : current.filter((id: string) => id !== ministry.id),
                  });
                }}
              />
              <Label htmlFor={`ministry-${ministry.id}`} className="flex-1 cursor-pointer">
                <p className="font-medium">{ministry.label}</p>
                <p className="text-sm text-muted-foreground">{ministry.description}</p>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HandHeart className="h-4 w-4" />
            Offering / Donation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={formData.offering || "none"}
            onValueChange={(value) => setFormData({ ...formData, offering: value })}
          >
            <SelectTrigger><SelectValue placeholder="Pre-commit offering" /></SelectTrigger>
            <SelectContent>
              {offeringOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.offering === "custom" && (
            <div>
              <Label>Custom Amount ($)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Enter amount"
                value={formData.customOffering || ""}
                onChange={(e) => setFormData({ ...formData, customOffering: e.target.value })}
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-4 w-4" />
            Transport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.transport || "own"}
            onValueChange={(value) => setFormData({ ...formData, transport: value })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="own">Own transport</SelectItem>
              <SelectItem value="church-bus">Church Bus (free)</SelectItem>
              <SelectItem value="shuttle">Event Shuttle ($5 return)</SelectItem>
              <SelectItem value="need-lift">Need a lift (carpool match)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReligiousBookingForm;
