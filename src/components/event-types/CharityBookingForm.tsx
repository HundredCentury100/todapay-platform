import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, DollarSign, Users, Award, FileText } from "lucide-react";

interface CharityBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const CharityBookingForm = ({ formData, setFormData }: CharityBookingFormProps) => {
  const eventTypes = [
    { value: "gala-dinner", label: "Charity Gala Dinner" },
    { value: "fun-run", label: "Charity Fun Run / Walk" },
    { value: "auction", label: "Charity Auction" },
    { value: "concert", label: "Charity Concert" },
    { value: "golf-day", label: "Charity Golf Day" },
    { value: "community-drive", label: "Community Drive / Clean-up" },
    { value: "other", label: "Other Fundraiser" },
  ];

  const donationTiers = [
    { value: "supporter", label: "Supporter", description: "Standard entry + certificate", price: "$20" },
    { value: "champion", label: "Champion", description: "Entry + branded merch + recognition", price: "$50" },
    { value: "patron", label: "Patron", description: "Entry + table seating + mention in program", price: "$100" },
    { value: "benefactor", label: "Benefactor", description: "Premium table + sponsor recognition + gift bag", price: "$250" },
    { value: "custom", label: "Custom Donation", description: "Choose your own amount", price: "Flexible" },
  ];

  const causeCategories = [
    { id: "education", label: "Education & Scholarships" },
    { id: "health", label: "Healthcare & Medical" },
    { id: "orphanage", label: "Children & Orphanages" },
    { id: "environment", label: "Environment & Conservation" },
    { id: "food-security", label: "Food Security & Hunger" },
    { id: "women", label: "Women Empowerment" },
    { id: "disability", label: "Disability Support" },
    { id: "general", label: "General Fund" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4" />
            Fundraiser Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.charityEventType || ""}
            onValueChange={(value) => setFormData({ ...formData, charityEventType: value })}
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
            <DollarSign className="h-4 w-4" />
            Donation Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.donationTier || ""}
            onValueChange={(value) => setFormData({ ...formData, donationTier: value })}
            className="space-y-3"
          >
            {donationTiers.map((tier) => (
              <div key={tier.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={tier.value} id={`donation-${tier.value}`} />
                <Label htmlFor={`donation-${tier.value}`} className="flex-1 cursor-pointer">
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
          {formData.donationTier === "custom" && (
            <div className="mt-3">
              <Label>Custom Donation Amount ($)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Enter amount"
                value={formData.customDonation || ""}
                onChange={(e) => setFormData({ ...formData, customDonation: e.target.value })}
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4" />
            Cause Allocation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-sm text-muted-foreground">Direct your donation to a specific cause:</Label>
          <RadioGroup
            value={formData.causeCategory || "general"}
            onValueChange={(value) => setFormData({ ...formData, causeCategory: value })}
            className="grid grid-cols-2 gap-2"
          >
            {causeCategories.map((cause) => (
              <div key={cause.id} className="flex items-center space-x-2">
                <RadioGroupItem value={cause.id} id={`cause-${cause.id}`} />
                <Label htmlFor={`cause-${cause.id}`} className="text-sm">{cause.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Pledge & Recognition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="monthly-pledge"
              checked={formData.monthlyPledge || false}
              onCheckedChange={(checked) => setFormData({ ...formData, monthlyPledge: checked })}
            />
            <Label htmlFor="monthly-pledge" className="text-sm">
              Set up monthly recurring donation
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tax-receipt"
              checked={formData.taxReceipt || false}
              onCheckedChange={(checked) => setFormData({ ...formData, taxReceipt: checked })}
            />
            <Label htmlFor="tax-receipt" className="text-sm">
              I need a tax-deductible receipt
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous-donor"
              checked={formData.anonymousDonor || false}
              onCheckedChange={(checked) => setFormData({ ...formData, anonymousDonor: checked })}
            />
            <Label htmlFor="anonymous-donor" className="text-sm">
              Donate anonymously (no public recognition)
            </Label>
          </div>
          {!formData.anonymousDonor && (
            <div>
              <Label>Display Name (for donor wall)</Label>
              <Input
                placeholder="Name as you'd like it displayed"
                value={formData.displayName || ""}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Corporate Sponsorship
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="corporate-sponsor"
              checked={formData.isCorporateSponsor || false}
              onCheckedChange={(checked) => setFormData({ ...formData, isCorporateSponsor: checked })}
            />
            <Label htmlFor="corporate-sponsor" className="text-sm">
              This is a corporate / company sponsorship
            </Label>
          </div>
          {formData.isCorporateSponsor && (
            <div>
              <Label>Company Name</Label>
              <Input
                placeholder="Company name for branding"
                value={formData.sponsorCompany || ""}
                onChange={(e) => setFormData({ ...formData, sponsorCompany: e.target.value })}
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CharityBookingForm;
