import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Laugh, Wine, Users, Star } from "lucide-react";

interface ComedyBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const ComedyBookingForm = ({ formData, setFormData }: ComedyBookingFormProps) => {
  const seatingTypes = [
    { value: "vip-table", label: "VIP Front Table", description: "Front row, 4 seats, bottle service", price: "+$100" },
    { value: "standard-table", label: "Standard Table", description: "Center tables, 2-4 seats", price: "+$40" },
    { value: "theater", label: "Theater Seating", description: "Traditional rows, great view", price: "Included" },
    { value: "bar", label: "Bar Seating", description: "Casual bar area seating", price: "-$10" },
  ];

  const drinkPackages = [
    { value: "none", label: "Pay as you go (2 drink minimum applies)", price: "" },
    { value: "beer", label: "Beer Package", description: "4 craft beers", price: "$28" },
    { value: "cocktail", label: "Cocktail Package", description: "3 signature cocktails", price: "$36" },
    { value: "premium", label: "Premium Open Bar", description: "2 hours all-inclusive", price: "$75" },
  ];

  const foodOptions = [
    { id: "nachos", label: "Loaded Nachos", price: "$14" },
    { id: "wings", label: "Buffalo Wings", price: "$16" },
    { id: "sliders", label: "Mini Burgers (3)", price: "$18" },
    { id: "platter", label: "Sharing Platter", price: "$35" },
  ];

  const specialPackages = [
    { value: "none", label: "No special package" },
    { value: "date-night", label: "Date Night", description: "2 VIP seats + champagne + appetizer", price: "$150" },
    { value: "birthday", label: "Birthday Bash", description: "4 seats + cake + shoutout from comedian", price: "$180" },
    { value: "meet-greet", label: "Meet & Greet", description: "Post-show photo with comedian", price: "$50" },
  ];

  return (
    <div className="space-y-6">
      {/* Seating Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Seating Preference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.seatingType || "theater"}
            onValueChange={(value) => setFormData({ ...formData, seatingType: value })}
            className="space-y-3"
          >
            {seatingTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={type.value} id={`seating-${type.value}`} />
                <Label htmlFor={`seating-${type.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    <Badge variant="outline">{type.price}</Badge>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Table Size (if table selected) */}
      {(formData.seatingType === "vip-table" || formData.seatingType === "standard-table") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Table Size</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.tableSize || "2"}
              onValueChange={(value) => setFormData({ ...formData, tableSize: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select table size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 People</SelectItem>
                <SelectItem value="3">3 People</SelectItem>
                <SelectItem value="4">4 People</SelectItem>
                <SelectItem value="6">6 People (VIP only)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Drink Package */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wine className="h-4 w-4" />
            Drink Package
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.drinkPackage || "none"}
            onValueChange={(value) => setFormData({ ...formData, drinkPackage: value })}
            className="space-y-3"
          >
            {drinkPackages.map((pkg) => (
              <div key={pkg.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={pkg.value} id={`drink-${pkg.value}`} />
                <Label htmlFor={`drink-${pkg.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{pkg.label}</p>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>
                      )}
                    </div>
                    {pkg.price && <Badge variant="secondary">{pkg.price}</Badge>}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Food Pre-Order */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pre-Order Food (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {foodOptions.map((food) => (
            <div key={food.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={food.id}
                checked={formData.foodOrders?.includes(food.id)}
                onCheckedChange={(checked) => {
                  const currentOrders = formData.foodOrders || [];
                  setFormData({
                    ...formData,
                    foodOrders: checked
                      ? [...currentOrders, food.id]
                      : currentOrders.filter((id: string) => id !== food.id),
                  });
                }}
              />
              <Label htmlFor={food.id} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span>{food.label}</span>
                  <Badge variant="outline">{food.price}</Badge>
                </div>
              </Label>
            </div>
          ))}
          <p className="text-sm text-muted-foreground">
            Pre-ordered food will be served at your table
          </p>
        </CardContent>
      </Card>

      {/* Special Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4" />
            Special Occasion?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.specialPackage || "none"}
            onValueChange={(value) => setFormData({ ...formData, specialPackage: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a package" />
            </SelectTrigger>
            <SelectContent>
              {specialPackages.map((pkg) => (
                <SelectItem key={pkg.value} value={pkg.value}>
                  <div className="flex items-center gap-2">
                    <span>{pkg.label}</span>
                    {pkg.price && <span className="text-muted-foreground">- {pkg.price}</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.specialPackage && formData.specialPackage !== "none" && (
            <p className="text-sm text-muted-foreground mt-2">
              {specialPackages.find(p => p.value === formData.specialPackage)?.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Birthday Name */}
      {formData.specialPackage === "birthday" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Birthday Celebration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="birthday-name">Birthday Person's Name</Label>
              <Input
                id="birthday-name"
                value={formData.birthdayName || ""}
                onChange={(e) => setFormData({ ...formData, birthdayName: e.target.value })}
                placeholder="Name for the shoutout"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cake-flavor">Cake Flavor Preference</Label>
              <Select
                value={formData.cakeFlavor || "chocolate"}
                onValueChange={(value) => setFormData({ ...formData, cakeFlavor: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chocolate">Chocolate</SelectItem>
                  <SelectItem value="vanilla">Vanilla</SelectItem>
                  <SelectItem value="red-velvet">Red Velvet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Age Confirmation */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="age-confirm"
              checked={formData.ageConfirmed}
              onCheckedChange={(checked) => setFormData({ ...formData, ageConfirmed: checked })}
            />
            <Label htmlFor="age-confirm" className="cursor-pointer">
              <p className="font-medium">I confirm all attendees are 18+ years old</p>
              <p className="text-sm text-muted-foreground">
                Valid ID required at entry. This show contains adult content.
              </p>
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComedyBookingForm;
