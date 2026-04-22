import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Bus, Luggage, Utensils, Wifi, Armchair } from "lucide-react";

interface BusCategoryFormProps {
  travelClass?: string;
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const TRAVEL_CLASSES = [
  { value: "standard", label: "Standard", description: "Basic comfortable seating", price: "Included" },
  { value: "premium", label: "Premium", description: "Extra legroom, USB charging, snacks", price: "+$5" },
  { value: "vip", label: "VIP", description: "Recliner seats, WiFi, meal, priority boarding", price: "+$15" },
];

const MEAL_OPTIONS = [
  { value: "none", label: "No meal" },
  { value: "light-snack", label: "Light Snack Pack" },
  { value: "full-meal", label: "Full Meal (hot)" },
  { value: "vegetarian-meal", label: "Vegetarian Meal" },
  { value: "halal-meal", label: "Halal Meal" },
];

const BusCategoryForm = ({ travelClass, data, onChange }: BusCategoryFormProps) => {
  const update = (field: string, value: any) => onChange({ ...data, [field]: value });
  const selectedClass = data.travelClass || travelClass || "standard";

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bus className="h-4 w-4 text-primary" />
          Travel Class & Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Travel Class Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Travel Class</Label>
          <RadioGroup value={selectedClass} onValueChange={v => update("travelClass", v)} className="space-y-2">
            {TRAVEL_CLASSES.map(cls => (
              <label key={cls.value} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedClass === cls.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={cls.value} />
                  <div>
                    <p className="text-sm font-medium">{cls.label}</p>
                    <p className="text-xs text-muted-foreground">{cls.description}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{cls.price}</Badge>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Luggage */}
        <div className="space-y-2">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <Luggage className="h-3.5 w-3.5" /> Luggage
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Cabin bags</Label>
              <Select value={String(data.cabinBags || "1")} onValueChange={v => update("cabinBags", parseInt(v))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0, 1, 2].map(n => <SelectItem key={n} value={String(n)}>{n} bag{n !== 1 ? "s" : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Checked luggage</Label>
              <Select value={String(data.checkedLuggage || "1")} onValueChange={v => update("checkedLuggage", parseInt(v))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3].map(n => <SelectItem key={n} value={String(n)}>{n} piece{n !== 1 ? "s" : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-start space-x-2 pt-1">
            <Checkbox id="bus-oversized" checked={!!data.oversizedLuggage} onCheckedChange={v => update("oversizedLuggage", !!v)} />
            <label htmlFor="bus-oversized" className="text-xs cursor-pointer">Oversized luggage (surfboard, bicycle, etc.)</label>
          </div>
        </div>

        {/* Meal Selection */}
        {(selectedClass === "premium" || selectedClass === "vip") && (
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Utensils className="h-3.5 w-3.5" /> Meal Selection
            </Label>
            <Select value={data.mealOption || "none"} onValueChange={v => update("mealOption", v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Select meal" /></SelectTrigger>
              <SelectContent>
                {MEAL_OPTIONS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Seat Preferences */}
        <div className="space-y-2">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <Armchair className="h-3.5 w-3.5" /> Seat Preference
          </Label>
          <Select value={data.seatPreference || "any"} onValueChange={v => update("seatPreference", v)}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">No preference</SelectItem>
              <SelectItem value="window">Window seat</SelectItem>
              <SelectItem value="aisle">Aisle seat</SelectItem>
              <SelectItem value="front">Front section</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* VIP extras */}
        {selectedClass === "vip" && (
          <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs font-medium text-primary">VIP Perks Included</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px]"><Wifi className="h-3 w-3 mr-1" />Free WiFi</Badge>
              <Badge variant="outline" className="text-[10px]">🔌 USB Charging</Badge>
              <Badge variant="outline" className="text-[10px]">🎧 Entertainment</Badge>
              <Badge variant="outline" className="text-[10px]">🧳 Priority Boarding</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusCategoryForm;
