import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Theater, Utensils, Star, ShoppingBag } from "lucide-react";

interface TheaterBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const TheaterBookingForm = ({ formData, setFormData }: TheaterBookingFormProps) => {
  const seatingPreferences = [
    { value: "orchestra", label: "Orchestra", description: "Best view, closest to stage", price: "+$30" },
    { value: "mezzanine", label: "Mezzanine", description: "Elevated view, great acoustics", price: "+$15" },
    { value: "balcony", label: "Balcony", description: "Full panoramic view", price: "Included" },
  ];

  const dinnerPackages = [
    { value: "none", label: "No dinner package", price: "" },
    { value: "pre-show", label: "Pre-Show Dinner", description: "3-course meal before the show", price: "+$65" },
    { value: "post-show", label: "Post-Show Supper", description: "Light supper after the show", price: "+$45" },
    { value: "full", label: "Full Experience", description: "Pre-show dinner + intermission drinks", price: "+$85" },
  ];

  const addOns = [
    { id: "backstage", label: "Backstage Tour", description: "30-min tour after the show", price: "$25" },
    { id: "program", label: "Souvenir Program", description: "Commemorative show program", price: "$15" },
    { id: "meet-greet", label: "Cast Meet & Greet", description: "Photo opportunity with cast", price: "$50" },
    { id: "champagne", label: "Intermission Champagne", description: "Glass of champagne at intermission", price: "$18" },
  ];

  return (
    <div className="space-y-6">
      {/* Seating Section Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Theater className="h-4 w-4" />
            Seating Section
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.seatingSection || "balcony"}
            onValueChange={(value) => setFormData({ ...formData, seatingSection: value })}
            className="space-y-3"
          >
            {seatingPreferences.map((pref) => (
              <div key={pref.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={pref.value} id={`section-${pref.value}`} />
                <Label htmlFor={`section-${pref.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{pref.label}</p>
                      <p className="text-sm text-muted-foreground">{pref.description}</p>
                    </div>
                    <Badge variant="outline">{pref.price}</Badge>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Dinner Package */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils className="h-4 w-4" />
            Dinner & Show Package
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.dinnerPackage || "none"}
            onValueChange={(value) => setFormData({ ...formData, dinnerPackage: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select dinner package" />
            </SelectTrigger>
            <SelectContent>
              {dinnerPackages.map((pkg) => (
                <SelectItem key={pkg.value} value={pkg.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{pkg.label}</span>
                    {pkg.price && <span className="text-muted-foreground ml-2">{pkg.price}</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.dinnerPackage && formData.dinnerPackage !== "none" && (
            <p className="text-sm text-muted-foreground mt-2">
              {dinnerPackages.find(p => p.value === formData.dinnerPackage)?.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4" />
            Enhance Your Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {addOns.map((addon) => (
            <div key={addon.id} className="flex items-start space-x-3 p-3 border rounded-lg">
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

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accessibility Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="wheelchair"
              checked={formData.wheelchairAccess}
              onCheckedChange={(checked) => setFormData({ ...formData, wheelchairAccess: checked })}
            />
            <Label htmlFor="wheelchair">Wheelchair accessible seating</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hearing"
              checked={formData.hearingLoop}
              onCheckedChange={(checked) => setFormData({ ...formData, hearingLoop: checked })}
            />
            <Label htmlFor="hearing">Hearing loop required</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="audioDesc"
              checked={formData.audioDescription}
              onCheckedChange={(checked) => setFormData({ ...formData, audioDescription: checked })}
            />
            <Label htmlFor="audioDesc">Audio description headset</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TheaterBookingForm;
