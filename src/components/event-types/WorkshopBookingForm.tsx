import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Award, Wrench, Users, Package } from "lucide-react";

interface WorkshopBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const WorkshopBookingForm = ({ formData, setFormData }: WorkshopBookingFormProps) => {
  const workshopTypes = [
    { value: "cooking", label: "Cooking / Culinary" },
    { value: "photography", label: "Photography" },
    { value: "coding", label: "Coding / Tech" },
    { value: "art", label: "Art & Painting" },
    { value: "music", label: "Music / Instrument" },
    { value: "crafts", label: "Crafts & DIY" },
    { value: "writing", label: "Creative Writing" },
    { value: "business", label: "Business / Entrepreneurship" },
    { value: "wellness", label: "Wellness & Mindfulness" },
    { value: "language", label: "Language Learning" },
    { value: "other", label: "Other" },
  ];

  const skillLevels = [
    { value: "beginner", label: "Beginner – No experience needed" },
    { value: "intermediate", label: "Intermediate – Some familiarity" },
    { value: "advanced", label: "Advanced – Experienced practitioners" },
    { value: "all", label: "All Levels Welcome" },
  ];

  const materialsOptions = [
    { value: "all-included", label: "All materials included in price" },
    { value: "basic-included", label: "Basic materials included, extras available" },
    { value: "bring-own", label: "Bring your own materials (list provided)" },
    { value: "purchase-onsite", label: "Materials available for purchase on-site" },
  ];

  const addOns = [
    { id: "certificate", label: "Certificate of Completion", price: "$10" },
    { id: "recording", label: "Session Recording / Replay", price: "$15" },
    { id: "materials-kit", label: "Take-Home Materials Kit", price: "$25" },
    { id: "mentor-session", label: "1-on-1 Mentor Follow-up (30 min)", price: "$30" },
    { id: "lunch", label: "Lunch Included", price: "$8" },
    { id: "workbook", label: "Printed Workbook / Guide", price: "$12" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Workshop Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.workshopType || ""}
            onValueChange={(value) => setFormData({ ...formData, workshopType: value })}
          >
            <SelectTrigger><SelectValue placeholder="Select workshop type" /></SelectTrigger>
            <SelectContent>
              {workshopTypes.map((wt) => (
                <SelectItem key={wt.value} value={wt.value}>{wt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4" />
            Skill Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.skillLevel || "all"}
            onValueChange={(value) => setFormData({ ...formData, skillLevel: value })}
            className="space-y-2"
          >
            {skillLevels.map((sl) => (
              <div key={sl.value} className="flex items-center space-x-2">
                <RadioGroupItem value={sl.value} id={`skill-${sl.value}`} />
                <Label htmlFor={`skill-${sl.value}`}>{sl.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4" />
            Materials & Equipment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup
            value={formData.materialsOption || "all-included"}
            onValueChange={(value) => setFormData({ ...formData, materialsOption: value })}
            className="space-y-2"
          >
            {materialsOptions.map((mo) => (
              <div key={mo.value} className="flex items-center space-x-2">
                <RadioGroupItem value={mo.value} id={`materials-${mo.value}`} />
                <Label htmlFor={`materials-${mo.value}`} className="text-sm">{mo.label}</Label>
              </div>
            ))}
          </RadioGroup>
          <div>
            <Label>Equipment You'll Bring (if applicable)</Label>
            <Textarea
              placeholder="e.g. laptop, camera, apron..."
              value={formData.ownEquipment || ""}
              onChange={(e) => setFormData({ ...formData, ownEquipment: e.target.value })}
              className="mt-1"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={formData.participants || "1"}
            onValueChange={(value) => setFormData({ ...formData, participants: value })}
          >
            <SelectTrigger><SelectValue placeholder="Number of participants" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 person</SelectItem>
              <SelectItem value="2">2 people (pair discount)</SelectItem>
              <SelectItem value="3-5">3-5 people (group)</SelectItem>
              <SelectItem value="6-10">6-10 people (team)</SelectItem>
              <SelectItem value="private">Private Session (custom)</SelectItem>
            </SelectContent>
          </Select>
          <div>
            <Label>Any Learning Goals?</Label>
            <Textarea
              placeholder="What do you hope to learn or achieve?"
              value={formData.learningGoals || ""}
              onChange={(e) => setFormData({ ...formData, learningGoals: e.target.value })}
              className="mt-1"
              rows={2}
            />
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
                id={`workshop-${addon.id}`}
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
              <Label htmlFor={`workshop-${addon.id}`} className="flex-1 cursor-pointer">
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

export default WorkshopBookingForm;
