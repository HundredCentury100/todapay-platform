import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Moon, Wine, Users, Armchair, ShieldCheck, Car } from "lucide-react";

interface NightlifeBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const NightlifeBookingForm = ({ formData, setFormData }: NightlifeBookingFormProps) => {
  const eventTypes = [
    { value: "dj-night", label: "DJ Night / Dance Party" },
    { value: "pool-party", label: "Pool Party" },
    { value: "lounge-night", label: "Lounge / Chill Night" },
    { value: "ladies-night", label: "Ladies Night" },
    { value: "live-dj-band", label: "Live Band + DJ" },
    { value: "themed-party", label: "Themed Party" },
    { value: "new-years", label: "New Year's Eve Special" },
  ];

  const entryTiers = [
    { value: "general", label: "General Entry", description: "Standard admission", price: "$10" },
    { value: "early-bird", label: "Early Bird (before 10pm)", description: "Discounted early entry", price: "$7" },
    { value: "vip", label: "VIP Entry", description: "Fast-track entry + VIP area access", price: "$25" },
    { value: "couples", label: "Couples Package", description: "2 entries + welcome drink each", price: "$20" },
    { value: "table", label: "Table Reservation", description: "Reserved table + 1 bottle", price: "$80" },
    { value: "booth", label: "VIP Booth", description: "Private booth + 2 bottles + mixers", price: "$200" },
  ];

  const bottleService = [
    { id: "whisky", label: "Premium Whisky", price: "$60" },
    { id: "vodka", label: "Vodka", price: "$45" },
    { id: "champagne", label: "Champagne", price: "$80" },
    { id: "gin", label: "Gin & Tonic Set", price: "$40" },
    { id: "rum", label: "Premium Rum", price: "$45" },
    { id: "non-alcoholic", label: "Non-Alcoholic Package", price: "$25" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-4 w-4" />
            Event Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.nightlifeType || ""}
            onValueChange={(value) => setFormData({ ...formData, nightlifeType: value })}
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
            <Armchair className="h-4 w-4" />
            Entry & Seating
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.entryTier || ""}
            onValueChange={(value) => setFormData({ ...formData, entryTier: value })}
            className="space-y-3"
          >
            {entryTiers.map((tier) => (
              <div key={tier.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={tier.value} id={`entry-${tier.value}`} />
                <Label htmlFor={`entry-${tier.value}`} className="flex-1 cursor-pointer">
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
            Group Size
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.groupSize || "1"}
            onValueChange={(value) => setFormData({ ...formData, groupSize: value })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Solo</SelectItem>
              <SelectItem value="2">Couple (2)</SelectItem>
              <SelectItem value="3-5">Small Group (3-5)</SelectItem>
              <SelectItem value="6-10">Party (6-10)</SelectItem>
              <SelectItem value="10+">Large Group (10+)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {(formData.entryTier === "table" || formData.entryTier === "booth") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wine className="h-4 w-4" />
              Bottle Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bottleService.map((bottle) => (
              <div key={bottle.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={`bottle-${bottle.id}`}
                  checked={formData.bottles?.includes(bottle.id)}
                  onCheckedChange={(checked) => {
                    const current = formData.bottles || [];
                    setFormData({
                      ...formData,
                      bottles: checked
                        ? [...current, bottle.id]
                        : current.filter((id: string) => id !== bottle.id),
                    });
                  }}
                />
                <Label htmlFor={`bottle-${bottle.id}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{bottle.label}</p>
                    <Badge variant="secondary">{bottle.price}</Badge>
                  </div>
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            Dress Code & Age
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dress-code-ack"
              checked={formData.dressCodeAck || false}
              onCheckedChange={(checked) => setFormData({ ...formData, dressCodeAck: checked })}
            />
            <Label htmlFor="dress-code-ack" className="text-sm">
              I acknowledge the dress code (smart casual, no sportswear)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="age-verify"
              checked={formData.ageVerified || false}
              onCheckedChange={(checked) => setFormData({ ...formData, ageVerified: checked })}
            />
            <Label htmlFor="age-verify" className="text-sm">
              I confirm I am 18 years or older (ID required at entry)
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-4 w-4" />
            Transport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.transport || "own"}
            onValueChange={(value) => setFormData({ ...formData, transport: value })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="own">Own transport</SelectItem>
              <SelectItem value="vaya">Vaya Ride (pre-book return, $8)</SelectItem>
              <SelectItem value="designated-driver">Designated Driver Service ($15)</SelectItem>
              <SelectItem value="parking">Self-drive + Parking ($5)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
};

export default NightlifeBookingForm;
