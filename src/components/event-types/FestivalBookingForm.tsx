import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Music, Tent, Bus, Lock, Utensils, Users } from "lucide-react";

interface FestivalBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const FestivalBookingForm = ({ formData, setFormData }: FestivalBookingFormProps) => {
  const passTypes = [
    { value: "single-day", label: "Single Day Pass", description: "Access for one day only", price: "$85" },
    { value: "weekend", label: "Weekend Pass", description: "Fri-Sun general admission", price: "$200" },
    { value: "vip-day", label: "VIP Day Pass", description: "Single day with VIP perks", price: "$150" },
    { value: "vip-weekend", label: "VIP Weekend", description: "Full access + VIP areas", price: "$400" },
  ];

  const campingOptions = [
    { value: "none", label: "No camping (day visitor)", price: "" },
    { value: "general", label: "General Camping", description: "Bring your own tent", price: "+$50" },
    { value: "premium", label: "Premium Camping", description: "Dedicated area, private showers", price: "+$150" },
    { value: "glamping", label: "Glamping", description: "Pre-pitched luxury tent", price: "+$400" },
    { value: "rv", label: "RV/Caravan Site", description: "Powered sites", price: "+$200" },
  ];

  const addOns = [
    { id: "locker", label: "Festival Locker", description: "Secure storage with charging", price: "$25/day" },
    { id: "shuttle", label: "Shuttle Pass", description: "Unlimited festival shuttles", price: "$35" },
    { id: "parking", label: "Car Parking", description: "On-site parking spot", price: "$40" },
    { id: "meal-plan", label: "Meal Plan", description: "3 meals/day at food village", price: "$45/day" },
  ];

  const shuttleRoutes = [
    { value: "none", label: "No shuttle needed" },
    { value: "city", label: "City Center", price: "$15 return" },
    { value: "airport", label: "Airport", price: "$35 return" },
    { value: "station", label: "Train Station", price: "$20 return" },
  ];

  return (
    <div className="space-y-6">
      {/* Pass Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Music className="h-4 w-4" />
            Festival Pass Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.passType || "weekend"}
            onValueChange={(value) => setFormData({ ...formData, passType: value })}
            className="space-y-3"
          >
            {passTypes.map((pass) => (
              <div key={pass.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={pass.value} id={`pass-${pass.value}`} />
                <Label htmlFor={`pass-${pass.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{pass.label}</p>
                      <p className="text-sm text-muted-foreground">{pass.description}</p>
                    </div>
                    <Badge variant="default">{pass.price}</Badge>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Day Selection for single day */}
      {formData.passType === "single-day" || formData.passType === "vip-day" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Your Day</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.selectedDay || "friday"}
              onValueChange={(value) => setFormData({ ...formData, selectedDay: value })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="friday" id="friday" />
                <Label htmlFor="friday">Friday</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="saturday" id="saturday" />
                <Label htmlFor="saturday">Saturday</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sunday" id="sunday" />
                <Label htmlFor="sunday">Sunday</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      ) : null}

      {/* Camping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tent className="h-4 w-4" />
            Camping Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.camping || "none"}
            onValueChange={(value) => setFormData({ ...formData, camping: value })}
            className="space-y-3"
          >
            {campingOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={option.value} id={`camp-${option.value}`} />
                <Label htmlFor={`camp-${option.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{option.label}</p>
                      {option.description && (
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      )}
                    </div>
                    {option.price && <Badge variant="outline">{option.price}</Badge>}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Group Size (for camping) */}
      {formData.camping && formData.camping !== "none" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Camping Group Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.groupSize || "1"}
              onValueChange={(value) => setFormData({ ...formData, groupSize: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="How many in your group?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Just me</SelectItem>
                <SelectItem value="2">2 people</SelectItem>
                <SelectItem value="3">3 people</SelectItem>
                <SelectItem value="4">4 people</SelectItem>
                <SelectItem value="5+">5+ people (we'll assign adjacent spots)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Shuttle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bus className="h-4 w-4" />
            Shuttle Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.shuttle || "none"}
            onValueChange={(value) => setFormData({ ...formData, shuttle: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select shuttle route" />
            </SelectTrigger>
            <SelectContent>
              {shuttleRoutes.map((route) => (
                <SelectItem key={route.value} value={route.value}>
                  <div className="flex items-center gap-2">
                    <span>{route.label}</span>
                    {route.price && <span className="text-muted-foreground">({route.price})</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Festival Add-ons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {addOns.map((addon) => (
            <div key={addon.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={addon.id}
                checked={formData.addOns?.includes(addon.id)}
                onCheckedChange={(checked) => {
                  const currentAddOns = formData.addOns || [];
                  setFormData({
                    ...formData,
                    addOns: checked
                      ? [...currentAddOns, addon.id]
                      : currentAddOns.filter((id: string) => id !== addon.id),
                  });
                }}
              />
              <Label htmlFor={addon.id} className="flex-1 cursor-pointer">
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

      {/* Dietary Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils className="h-4 w-4" />
            Dietary Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["Vegetarian", "Vegan", "Halal", "Gluten-free", "Nut allergy"].map((diet) => (
            <div key={diet} className="flex items-center space-x-2">
              <Checkbox
                id={diet.toLowerCase()}
                checked={formData.dietary?.includes(diet.toLowerCase())}
                onCheckedChange={(checked) => {
                  const current = formData.dietary || [];
                  setFormData({
                    ...formData,
                    dietary: checked
                      ? [...current, diet.toLowerCase()]
                      : current.filter((d: string) => d !== diet.toLowerCase()),
                  });
                }}
              />
              <Label htmlFor={diet.toLowerCase()}>{diet}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="emergency-name">Contact Name</Label>
            <Input
              id="emergency-name"
              value={formData.emergencyName || ""}
              onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
              placeholder="Full name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="emergency-phone">Contact Phone</Label>
            <Input
              id="emergency-phone"
              value={formData.emergencyPhone || ""}
              onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
              placeholder="+27 XX XXX XXXX"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="festival-terms"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => setFormData({ ...formData, termsAccepted: checked })}
            />
            <Label htmlFor="festival-terms" className="cursor-pointer">
              <p className="font-medium">I accept the festival terms & conditions</p>
              <p className="text-sm text-muted-foreground">
                Including safety guidelines, prohibited items policy, and photography consent
              </p>
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FestivalBookingForm;
