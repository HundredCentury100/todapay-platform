import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Accessibility } from "lucide-react";

interface AccessibilityOptionsFormProps {
  data: any;
  onChange: (data: any) => void;
}

const AccessibilityOptionsForm = ({ data, onChange }: AccessibilityOptionsFormProps) => {
  const updateData = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Accessibility className="w-5 h-5" />
        Accessibility & Special Needs
      </h3>

      <div className="space-y-4">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="wheelchair"
            checked={data.wheelchair}
            onCheckedChange={(checked) => updateData("wheelchair", checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="wheelchair"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Wheelchair Accessible Seating Required
            </label>
            <p className="text-sm text-muted-foreground">
              We'll ensure you have an accessible seat with proper access
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="companion-ticket"
            checked={data.companionTicket}
            onCheckedChange={(checked) => updateData("companionTicket", checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="companion-ticket"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Free Companion Ticket
            </label>
            <p className="text-sm text-muted-foreground">
              Available for guests requiring assistance (subject to verification)
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="sign-language"
            checked={data.signLanguage}
            onCheckedChange={(checked) => updateData("signLanguage", checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="sign-language"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Sign Language Interpretation
            </label>
            <p className="text-sm text-muted-foreground">
              Request an interpreter for the event
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="audio-description"
            checked={data.audioDescription}
            onCheckedChange={(checked) => updateData("audioDescription", checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="audio-description"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Audio Description Services
            </label>
            <p className="text-sm text-muted-foreground">
              Descriptive narration for visual elements
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="sensory-friendly"
            checked={data.sensoryFriendly}
            onCheckedChange={(checked) => updateData("sensoryFriendly", checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="sensory-friendly"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Sensory-Friendly Accommodations
            </label>
            <p className="text-sm text-muted-foreground">
              Reduced lighting, lower volume, quiet space access
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="service-animal"
            checked={data.serviceAnimal}
            onCheckedChange={(checked) => updateData("serviceAnimal", checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="service-animal"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Bringing a Service Animal
            </label>
            <p className="text-sm text-muted-foreground">
              Let us know so we can accommodate your service animal
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additional-needs">Additional Accessibility Needs</Label>
          <Textarea
            id="additional-needs"
            placeholder="Please describe any other accessibility requirements..."
            value={data.additionalNeeds || ""}
            onChange={(e) => updateData("additionalNeeds", e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </Card>
  );
};

export default AccessibilityOptionsForm;
