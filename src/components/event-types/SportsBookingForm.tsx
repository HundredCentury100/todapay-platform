import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trophy, MapPin, ShieldCheck, Shirt, Users, Utensils, Car } from "lucide-react";

interface SportsBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const SportsBookingForm = ({ formData, setFormData }: SportsBookingFormProps) => {
  const sportTypes = [
    { value: "football", label: "Football / Soccer" },
    { value: "cricket", label: "Cricket" },
    { value: "rugby", label: "Rugby" },
    { value: "basketball", label: "Basketball" },
    { value: "athletics", label: "Athletics / Track" },
    { value: "marathon", label: "Marathon / Running" },
    { value: "boxing", label: "Boxing / MMA" },
    { value: "tennis", label: "Tennis" },
    { value: "other", label: "Other Sport" },
  ];

  const seatingZones = [
    { value: "vvip", label: "VVIP Executive Box", description: "Private suite, catering included, best view", price: "+$200" },
    { value: "vip", label: "VIP Stand", description: "Cushioned seats, fast-track entry, hospitality", price: "+$80" },
    { value: "grandstand", label: "Grandstand", description: "Covered seating with great view", price: "+$30" },
    { value: "wing", label: "Wing Stand", description: "Covered side-view seating", price: "+$15" },
    { value: "terrace", label: "Open Terrace", description: "Uncovered standing/seating area", price: "Included" },
  ];

  const fanPackages = [
    { value: "none", label: "No fan package" },
    { value: "supporter", label: "Supporter Pack", description: "Scarf + face paint + thunderstick", price: "$15" },
    { value: "ultimate", label: "Ultimate Fan Pack", description: "Replica jersey + scarf + flag + face paint", price: "$60" },
    { value: "family", label: "Family Pack", description: "2 adult + 2 kids supporter packs", price: "$45" },
  ];

  const teamSupport = [
    { value: "home", label: "Home Team" },
    { value: "away", label: "Away Team" },
    { value: "neutral", label: "Neutral" },
  ];

  const addOns = [
    { id: "parking", label: "Stadium Parking", description: "Reserved parking spot near entrance", price: "$10" },
    { id: "program", label: "Match Day Program", description: "Official printed program", price: "$5" },
    { id: "jersey-print", label: "Jersey Name Print", description: "Custom name & number on jersey", price: "$20" },
    { id: "meet-players", label: "Post-Match Player Meet", description: "Pitch-side meet & greet (limited)", price: "$75" },
    { id: "halftime-food", label: "Half-Time Meal Voucher", description: "Burger, chips & drink combo", price: "$12" },
  ];

  return (
    <div className="space-y-6">
      {/* Sport Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4" />
            Sport Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.sportType || ""}
            onValueChange={(value) => setFormData({ ...formData, sportType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sport type" />
            </SelectTrigger>
            <SelectContent>
              {sportTypes.map((sport) => (
                <SelectItem key={sport.value} value={sport.value}>{sport.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Team Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shirt className="h-4 w-4" />
            Which Side Are You Supporting?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.teamSupport || "home"}
            onValueChange={(value) => setFormData({ ...formData, teamSupport: value })}
            className="flex gap-4"
          >
            {teamSupport.map((team) => (
              <div key={team.value} className="flex items-center space-x-2">
                <RadioGroupItem value={team.value} id={`team-${team.value}`} />
                <Label htmlFor={`team-${team.value}`}>{team.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Seating Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Seating Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.seatingZone || "terrace"}
            onValueChange={(value) => setFormData({ ...formData, seatingZone: value })}
            className="space-y-3"
          >
            {seatingZones.map((zone) => (
              <div key={zone.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={zone.value} id={`zone-${zone.value}`} />
                <Label htmlFor={`zone-${zone.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{zone.label}</p>
                      <p className="text-sm text-muted-foreground">{zone.description}</p>
                    </div>
                    <Badge variant="outline">{zone.price}</Badge>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Group Size */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Group Size
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.groupSize || "1"}
            onValueChange={(value) => setFormData({ ...formData, groupSize: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="How many attending?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 person</SelectItem>
              <SelectItem value="2">2 people</SelectItem>
              <SelectItem value="3-4">3-4 people</SelectItem>
              <SelectItem value="5-8">5-8 people</SelectItem>
              <SelectItem value="9+">9+ people (group discount applies)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Fan Package */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            Fan Merchandise Package
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.fanPackage || "none"}
            onValueChange={(value) => setFormData({ ...formData, fanPackage: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select fan package" />
            </SelectTrigger>
            <SelectContent>
              {fanPackages.map((pkg) => (
                <SelectItem key={pkg.value} value={pkg.value}>
                  <div className="flex items-center gap-2">
                    <span>{pkg.label}</span>
                    {pkg.price && <span className="text-muted-foreground">- {pkg.price}</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.fanPackage && formData.fanPackage !== "none" && (
            <p className="text-sm text-muted-foreground mt-2">
              {fanPackages.find(p => p.value === formData.fanPackage)?.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Match Day Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils className="h-4 w-4" />
            Match Day Add-ons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {addOns.map((addon) => (
            <div key={addon.id} className="flex items-start space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={`sport-${addon.id}`}
                checked={formData.addOns?.includes(addon.id)}
                onCheckedChange={(checked) => {
                  const current = formData.addOns || [];
                  setFormData({
                    ...formData,
                    addOns: checked
                      ? [...current, addon.id]
                      : current.filter((id: string) => id !== addon.id),
                  });
                }}
              />
              <Label htmlFor={`sport-${addon.id}`} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{addon.label}</p>
                    <p className="text-sm text-muted-foreground">{addon.description}</p>
                  </div>
                  <Badge variant="secondary">{addon.price}</Badge>
                </div>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Transport */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-4 w-4" />
            Transport to Stadium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.transport || "none"}
            onValueChange={(value) => setFormData({ ...formData, transport: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Need transport?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">I'll make my own way</SelectItem>
              <SelectItem value="fan-bus">Fan Bus from City Center ($8 return)</SelectItem>
              <SelectItem value="shuttle">Private Shuttle ($20 return)</SelectItem>
              <SelectItem value="parking-only">Self-drive + Parking ($10)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
};

export default SportsBookingForm;
