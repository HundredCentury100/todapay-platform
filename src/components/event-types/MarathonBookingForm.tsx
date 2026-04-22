import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Timer, MapPin, Heart, Shirt, Package, Trophy } from "lucide-react";

interface MarathonBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const MarathonBookingForm = ({ formData, setFormData }: MarathonBookingFormProps) => {
  const raceCategories = [
    { value: "full", label: "Full Marathon (42.195km)", price: "$45" },
    { value: "half", label: "Half Marathon (21.1km)", price: "$35" },
    { value: "10k", label: "10K Run", price: "$20" },
    { value: "5k", label: "5K Fun Run", price: "$15" },
    { value: "kids", label: "Kids Dash (2km)", price: "$8" },
    { value: "wheelchair", label: "Wheelchair Category", price: "$20" },
  ];

  const paceGroups = [
    { value: "elite", label: "Elite (Sub 3:00)" },
    { value: "sub-330", label: "Sub 3:30" },
    { value: "sub-400", label: "Sub 4:00" },
    { value: "sub-430", label: "Sub 4:30" },
    { value: "sub-500", label: "Sub 5:00" },
    { value: "open", label: "Open / Casual" },
  ];

  const bibPickupOptions = [
    { value: "expo-fri", label: "Expo Friday (Pre-race day)" },
    { value: "expo-sat", label: "Expo Saturday (Day before)" },
    { value: "race-morning", label: "Race Morning (+$5 late fee)" },
    { value: "posted", label: "Post to Address (+$10)" },
  ];

  const merchAddOns = [
    { id: "finisher-medal", label: "Engraved Finisher Medal", price: "$15" },
    { id: "race-tee", label: "Official Race T-Shirt", price: "$20" },
    { id: "timing-chip", label: "Personal Timing Chip (keep)", price: "$12" },
    { id: "photo-pack", label: "Professional Race Photos", price: "$25" },
    { id: "pace-band", label: "Custom Pace Wristband", price: "$3" },
    { id: "hydration-vest", label: "Hydration Vest Rental", price: "$10" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4" />
            Race Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.raceCategory || ""}
            onValueChange={(value) => setFormData({ ...formData, raceCategory: value })}
            className="space-y-3"
          >
            {raceCategories.map((cat) => (
              <div key={cat.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={cat.value} id={`race-${cat.value}`} />
                <Label htmlFor={`race-${cat.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{cat.label}</p>
                    <Badge variant="outline">{cat.price}</Badge>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="h-4 w-4" />
            Pace Group
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.paceGroup || ""}
            onValueChange={(value) => setFormData({ ...formData, paceGroup: value })}
          >
            <SelectTrigger><SelectValue placeholder="Select your pace group" /></SelectTrigger>
            <SelectContent>
              {paceGroups.map((pg) => (
                <SelectItem key={pg.value} value={pg.value}>{pg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-3">
            <Label htmlFor="estimated-time">Estimated Finish Time (optional)</Label>
            <Input
              id="estimated-time"
              placeholder="e.g. 4:30:00"
              value={formData.estimatedTime || ""}
              onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Bib Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.bibPickup || "expo-sat"}
            onValueChange={(value) => setFormData({ ...formData, bibPickup: value })}
            className="space-y-2"
          >
            {bibPickupOptions.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`bib-${opt.value}`} />
                <Label htmlFor={`bib-${opt.value}`}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shirt className="h-4 w-4" />
            T-Shirt Size
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.tshirtSize || ""}
            onValueChange={(value) => setFormData({ ...formData, tshirtSize: value })}
          >
            <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
            <SelectContent>
              {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((size) => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4" />
            Medical & Emergency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="blood-type">Blood Type</Label>
            <Select
              value={formData.bloodType || ""}
              onValueChange={(value) => setFormData({ ...formData, bloodType: value })}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select blood type" /></SelectTrigger>
              <SelectContent>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                  <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="medical-conditions">Medical Conditions / Allergies</Label>
            <Textarea
              id="medical-conditions"
              placeholder="List any conditions race marshals should know about..."
              value={formData.medicalConditions || ""}
              onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="emergency-name">Emergency Contact Name</Label>
            <Input
              id="emergency-name"
              placeholder="Full name"
              value={formData.emergencyName || ""}
              onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="emergency-phone">Emergency Contact Phone</Label>
            <Input
              id="emergency-phone"
              placeholder="+263..."
              value={formData.emergencyPhone || ""}
              onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="medical-clearance"
              checked={formData.medicalClearance || false}
              onCheckedChange={(checked) => setFormData({ ...formData, medicalClearance: checked })}
            />
            <Label htmlFor="medical-clearance" className="text-sm">
              I confirm I am medically fit to participate and have consulted a physician
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Race Day Add-ons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {merchAddOns.map((addon) => (
            <div key={addon.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={`marathon-${addon.id}`}
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
              <Label htmlFor={`marathon-${addon.id}`} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{addon.label}</p>
                  <Badge variant="secondary">{addon.price}</Badge>
                </div>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarathonBookingForm;
