import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Palette, BookOpen, Utensils, Camera, Globe, Users } from "lucide-react";

interface CulturalBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const CulturalBookingForm = ({ formData, setFormData }: CulturalBookingFormProps) => {
  const culturalTypes = [
    { value: "art-exhibition", label: "Art Exhibition" },
    { value: "dance-performance", label: "Dance Performance" },
    { value: "cultural-festival", label: "Cultural Festival" },
    { value: "heritage-tour", label: "Heritage / History Tour" },
    { value: "craft-market", label: "Craft & Artisan Market" },
    { value: "poetry-spoken-word", label: "Poetry / Spoken Word" },
    { value: "film-screening", label: "Film Screening" },
    { value: "traditional-ceremony", label: "Traditional Ceremony" },
    { value: "food-culture", label: "Food & Culture Experience" },
    { value: "museum", label: "Museum / Gallery Visit" },
  ];

  const experienceOptions = [
    { value: "self-guided", label: "Self-Guided", description: "Explore at your own pace", price: "Included" },
    { value: "guided", label: "Guided Experience", description: "Expert-led tour or commentary", price: "+$15" },
    { value: "interactive", label: "Interactive Workshop", description: "Hands-on participation in activities", price: "+$30" },
    { value: "vip-curator", label: "VIP Curator Tour", description: "Private tour with curator or artist", price: "+$75" },
  ];

  const workshopActivities = [
    { id: "pottery", label: "Pottery & Ceramics", description: "Create your own piece to take home", price: "$25" },
    { id: "beadwork", label: "Traditional Beadwork", description: "Learn Ndebele or Shona beading", price: "$20" },
    { id: "drumming", label: "Drumming Circle", description: "African percussion workshop", price: "$18" },
    { id: "painting", label: "Paint & Sip", description: "Guided painting with refreshments", price: "$30" },
    { id: "weaving", label: "Basket Weaving", description: "Traditional weaving techniques", price: "$22" },
    { id: "storytelling", label: "Storytelling Session", description: "Folklore & oral tradition session", price: "$10" },
  ];

  const foodExperiences = [
    { value: "none", label: "No food experience" },
    { value: "tasting", label: "Cultural Food Tasting", description: "Sample 5+ traditional dishes", price: "$18" },
    { value: "cooking-class", label: "Cooking Class", description: "Learn to prepare traditional meals", price: "$35" },
    { value: "feast", label: "Traditional Feast", description: "Full sit-down cultural dining experience", price: "$50" },
  ];

  const addOns = [
    { id: "photo-guide", label: "Photography Guide", description: "Tips on best photo spots & cultural etiquette", price: "$10" },
    { id: "souvenir", label: "Artisan Souvenir", description: "Handcrafted local art piece", price: "$15-$40" },
    { id: "audio-guide", label: "Audio Guide", description: "Multilingual audio commentary device", price: "$8" },
    { id: "program", label: "Commemorative Program", description: "Printed event program & artist bios", price: "$5" },
  ];

  const languages = [
    { value: "english", label: "English" },
    { value: "shona", label: "Shona" },
    { value: "ndebele", label: "Ndebele" },
    { value: "bilingual", label: "Bilingual (English + Local)" },
  ];

  return (
    <div className="space-y-6">
      {/* Cultural Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Cultural Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.culturalType || ""}
            onValueChange={(value) => setFormData({ ...formData, culturalType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cultural category" />
            </SelectTrigger>
            <SelectContent>
              {culturalTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Experience Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Experience Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.experienceStyle || "self-guided"}
            onValueChange={(value) => setFormData({ ...formData, experienceStyle: value })}
            className="space-y-3"
          >
            {experienceOptions.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={opt.value} id={`exp-${opt.value}`} />
                <Label htmlFor={`exp-${opt.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-sm text-muted-foreground">{opt.description}</p>
                    </div>
                    <Badge variant="outline">{opt.price}</Badge>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Preferred Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Preferred Language
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.preferredLanguage || "english"}
            onValueChange={(value) => setFormData({ ...formData, preferredLanguage: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <SelectItem value="1">Individual</SelectItem>
              <SelectItem value="2">Couple (2)</SelectItem>
              <SelectItem value="3-5">Small group (3-5)</SelectItem>
              <SelectItem value="6-10">Group (6-10)</SelectItem>
              <SelectItem value="school-group">School Group (10+)</SelectItem>
            </SelectContent>
          </Select>
          {formData.groupSize === "school-group" && (
            <div className="mt-3 space-y-3">
              <div>
                <Label>School Name</Label>
                <Input
                  value={formData.schoolName || ""}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder="Enter school name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Number of Students</Label>
                <Input
                  type="number"
                  value={formData.studentCount || ""}
                  onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                  placeholder="e.g., 25"
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workshop Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Workshop Activities (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {workshopActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={`cultural-${activity.id}`}
                checked={formData.workshops?.includes(activity.id)}
                onCheckedChange={(checked) => {
                  const current = formData.workshops || [];
                  setFormData({
                    ...formData,
                    workshops: checked
                      ? [...current, activity.id]
                      : current.filter((id: string) => id !== activity.id),
                  });
                }}
              />
              <Label htmlFor={`cultural-${activity.id}`} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{activity.label}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  <Badge variant="secondary">{activity.price}</Badge>
                </div>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Food Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils className="h-4 w-4" />
            Food & Dining Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.foodExperience || "none"}
            onValueChange={(value) => setFormData({ ...formData, foodExperience: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select food experience" />
            </SelectTrigger>
            <SelectContent>
              {foodExperiences.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  <div className="flex items-center gap-2">
                    <span>{f.label}</span>
                    {f.price && <span className="text-muted-foreground">- {f.price}</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.foodExperience && formData.foodExperience !== "none" && (
            <p className="text-sm text-muted-foreground mt-2">
              {foodExperiences.find(f => f.value === formData.foodExperience)?.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4" />
            Extras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {addOns.map((addon) => (
            <div key={addon.id} className="flex items-start space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={`cult-addon-${addon.id}`}
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
              <Label htmlFor={`cult-addon-${addon.id}`} className="flex-1 cursor-pointer">
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

      {/* Dietary for food events */}
      {formData.foodExperience && formData.foodExperience !== "none" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dietary Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Vegetarian", "Vegan", "Halal", "Gluten-free", "Nut allergy"].map((diet) => (
              <div key={diet} className="flex items-center space-x-2">
                <Checkbox
                  id={`diet-${diet.toLowerCase()}`}
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
                <Label htmlFor={`diet-${diet.toLowerCase()}`}>{diet}</Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CulturalBookingForm;
