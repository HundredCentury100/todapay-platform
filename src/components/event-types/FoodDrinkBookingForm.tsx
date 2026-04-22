import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UtensilsCrossed, Wine, Users, AlertTriangle, Car, Package } from "lucide-react";

interface FoodDrinkBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const FoodDrinkBookingForm = ({ formData, setFormData }: FoodDrinkBookingFormProps) => {
  const eventTypes = [
    { value: "food-festival", label: "Food Festival" },
    { value: "wine-tasting", label: "Wine Tasting" },
    { value: "beer-fest", label: "Beer Festival / Craft Brew" },
    { value: "braai-comp", label: "Braai Competition" },
    { value: "cooking-demo", label: "Cooking Demonstration" },
    { value: "supper-club", label: "Pop-up / Supper Club" },
    { value: "market", label: "Food Market / Bazaar" },
    { value: "other", label: "Other" },
  ];

  const experienceTiers = [
    { value: "general", label: "General Admission", description: "Entry + food vendor access", price: "$10" },
    { value: "tasting-pass", label: "Tasting Pass", description: "Entry + 10 tasting tokens", price: "$25" },
    { value: "premium", label: "Premium Experience", description: "All tastings + chef demos + seated area", price: "$50" },
    { value: "vip", label: "VIP Foodie", description: "Everything + private chef table + wine pairing", price: "$100" },
  ];

  const dietaryRestrictions = [
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "gluten-free", label: "Gluten-Free" },
    { id: "halal", label: "Halal" },
    { id: "kosher", label: "Kosher" },
    { id: "nut-free", label: "Nut-Free" },
    { id: "dairy-free", label: "Dairy-Free" },
    { id: "none", label: "No restrictions" },
  ];

  const tastingPreferences = [
    { id: "local-cuisine", label: "Zimbabwean / Local Cuisine" },
    { id: "african-fusion", label: "African Fusion" },
    { id: "international", label: "International" },
    { id: "street-food", label: "Street Food" },
    { id: "fine-dining", label: "Fine Dining" },
    { id: "desserts", label: "Desserts & Pastries" },
    { id: "spirits", label: "Spirits & Cocktails" },
    { id: "craft-beer", label: "Craft Beer" },
  ];

  const addOns = [
    { id: "extra-tokens", label: "Extra Tasting Tokens (5)", price: "$10" },
    { id: "recipe-book", label: "Event Recipe Booklet", price: "$8" },
    { id: "apron", label: "Branded Chef Apron", price: "$12" },
    { id: "cooler-bag", label: "Cooler Bag for Takeaways", price: "$15" },
    { id: "kids-menu", label: "Kids Tasting Menu", price: "$5" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UtensilsCrossed className="h-4 w-4" />
            Event Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.foodEventType || ""}
            onValueChange={(value) => setFormData({ ...formData, foodEventType: value })}
          >
            <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
            <SelectContent>
              {eventTypes.map((et) => (
                <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wine className="h-4 w-4" />
            Experience Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.experienceTier || ""}
            onValueChange={(value) => setFormData({ ...formData, experienceTier: value })}
            className="space-y-3"
          >
            {experienceTiers.map((tier) => (
              <div key={tier.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={tier.value} id={`food-tier-${tier.value}`} />
                <Label htmlFor={`food-tier-${tier.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{tier.label}</p>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </div>
                    <Badge variant="outline">{tier.price}</Badge>
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
            <Users className="h-4 w-4" />
            Group & Seating
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.groupSize || "1"}
            onValueChange={(value) => setFormData({ ...formData, groupSize: value })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 person</SelectItem>
              <SelectItem value="2">2 people</SelectItem>
              <SelectItem value="3-4">3-4 people</SelectItem>
              <SelectItem value="5-8">5-8 people</SelectItem>
              <SelectItem value="9+">9+ people</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Dietary Restrictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {dietaryRestrictions.map((diet) => (
              <div key={diet.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`diet-${diet.id}`}
                  checked={formData.dietary?.includes(diet.id)}
                  onCheckedChange={(checked) => {
                    const current = formData.dietary || [];
                    setFormData({
                      ...formData,
                      dietary: checked
                        ? [...current, diet.id]
                        : current.filter((id: string) => id !== diet.id),
                    });
                  }}
                />
                <Label htmlFor={`diet-${diet.id}`} className="text-sm">{diet.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UtensilsCrossed className="h-4 w-4" />
            Tasting Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {tastingPreferences.map((pref) => (
              <div key={pref.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`pref-${pref.id}`}
                  checked={formData.tastingPrefs?.includes(pref.id)}
                  onCheckedChange={(checked) => {
                    const current = formData.tastingPrefs || [];
                    setFormData({
                      ...formData,
                      tastingPrefs: checked
                        ? [...current, pref.id]
                        : current.filter((id: string) => id !== pref.id),
                    });
                  }}
                />
                <Label htmlFor={`pref-${pref.id}`} className="text-sm">{pref.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Add-ons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {addOns.map((addon) => (
            <div key={addon.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={`food-addon-${addon.id}`}
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
              <Label htmlFor={`food-addon-${addon.id}`} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{addon.label}</p>
                  <Badge variant="secondary">{addon.price}</Badge>
                </div>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-4 w-4" />
            Designated Driver
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="designated-driver"
              checked={formData.designatedDriver || false}
              onCheckedChange={(checked) => setFormData({ ...formData, designatedDriver: checked })}
            />
            <Label htmlFor="designated-driver" className="text-sm">
              I am the designated driver (alcohol-free wristband)
            </Label>
          </div>
          <Select
            value={formData.transport || "own"}
            onValueChange={(value) => setFormData({ ...formData, transport: value })}
          >
            <SelectTrigger><SelectValue placeholder="Transport" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="own">Own transport</SelectItem>
              <SelectItem value="shuttle">Event Shuttle ($5 return)</SelectItem>
              <SelectItem value="vaya">Vaya Ride (pre-book, $8)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
};

export default FoodDrinkBookingForm;
