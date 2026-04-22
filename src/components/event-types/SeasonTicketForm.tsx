import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CalendarDays, Star, CreditCard, Users, Shield } from "lucide-react";

interface SeasonTicketFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const SeasonTicketForm = ({ formData, setFormData }: SeasonTicketFormProps) => {
  const passTypes = [
    { value: "full-season", label: "Full Season Pass", description: "All home matches + priority away tickets", price: "$250" },
    { value: "half-season", label: "Half Season Pass", description: "Second half of season (Jan–May)", price: "$150" },
    { value: "flexi-5", label: "Flexi 5-Match Bundle", description: "Choose any 5 home matches", price: "$80" },
    { value: "flexi-10", label: "Flexi 10-Match Bundle", description: "Choose any 10 home matches", price: "$140" },
    { value: "family-season", label: "Family Season Pass", description: "2 adults + 2 children, all home matches", price: "$450" },
  ];

  const loyaltyTiers = [
    { value: "none", label: "No loyalty membership" },
    { value: "bronze", label: "Bronze – Free signup, 5% match-day discounts" },
    { value: "silver", label: "Silver – $30/yr, 10% discounts + priority seating" },
    { value: "gold", label: "Gold – $80/yr, 15% discounts + lounge access + free parking" },
  ];

  const paymentPlans = [
    { value: "full", label: "Pay in Full" },
    { value: "monthly-3", label: "3 Monthly Installments" },
    { value: "monthly-6", label: "6 Monthly Installments" },
    { value: "layby", label: "Lay-by (pay before season starts)" },
  ];

  const seasonPerks = [
    { id: "reserved-seat", label: "Reserved Seat (same seat every match)", price: "+$40" },
    { id: "car-park", label: "Season Parking Pass", price: "+$60" },
    { id: "member-scarf", label: "Exclusive Members Scarf", price: "+$15" },
    { id: "away-priority", label: "Away Match Priority Access", price: "+$25" },
    { id: "meet-greet", label: "Pre-Season Player Meet & Greet", price: "+$35" },
    { id: "digital-program", label: "Digital Match-Day Programs (all season)", price: "+$10" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
            Season Pass Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.passType || ""}
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
                    <Badge variant="outline">{pass.price}</Badge>
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
            Holder Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Season Ticket Holder Name</Label>
            <Input
              placeholder="Full name (as on ID)"
              value={formData.holderName || ""}
              onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>ID / Passport Number</Label>
            <Input
              placeholder="For verification at gate"
              value={formData.holderId || ""}
              onChange={(e) => setFormData({ ...formData, holderId: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="photo-card"
              checked={formData.photoCard || false}
              onCheckedChange={(checked) => setFormData({ ...formData, photoCard: checked })}
            />
            <Label htmlFor="photo-card" className="text-sm">
              Add photo ID card (+$5, required for transferable passes)
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4" />
            Loyalty Membership
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.loyaltyTier || "none"}
            onValueChange={(value) => setFormData({ ...formData, loyaltyTier: value })}
          >
            <SelectTrigger><SelectValue placeholder="Select loyalty tier" /></SelectTrigger>
            <SelectContent>
              {loyaltyTiers.map((tier) => (
                <SelectItem key={tier.value} value={tier.value}>{tier.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Payment Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.paymentPlan || "full"}
            onValueChange={(value) => setFormData({ ...formData, paymentPlan: value })}
            className="space-y-2"
          >
            {paymentPlans.map((plan) => (
              <div key={plan.value} className="flex items-center space-x-2">
                <RadioGroupItem value={plan.value} id={`plan-${plan.value}`} />
                <Label htmlFor={`plan-${plan.value}`}>{plan.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Season Perks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {seasonPerks.map((perk) => (
            <div key={perk.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={`perk-${perk.id}`}
                checked={formData.perks?.includes(perk.id)}
                onCheckedChange={(checked) => {
                  const current = formData.perks || [];
                  setFormData({
                    ...formData,
                    perks: checked
                      ? [...current, perk.id]
                      : current.filter((id: string) => id !== perk.id),
                  });
                }}
              />
              <Label htmlFor={`perk-${perk.id}`} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{perk.label}</p>
                  <Badge variant="secondary">{perk.price}</Badge>
                </div>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
            Auto-Renewal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-renew"
              checked={formData.autoRenew || false}
              onCheckedChange={(checked) => setFormData({ ...formData, autoRenew: checked })}
            />
            <Label htmlFor="auto-renew" className="text-sm">
              Auto-renew next season (10% early-bird discount)
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeasonTicketForm;
