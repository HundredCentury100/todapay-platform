import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Store, Users, Calendar, Briefcase, Package } from "lucide-react";

interface ExhibitionBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const ExhibitionBookingForm = ({ formData, setFormData }: ExhibitionBookingFormProps) => {
  const attendeeTypes = [
    { value: "visitor", label: "Visitor / General Public", price: "$10" },
    { value: "exhibitor-standard", label: "Exhibitor – Standard Booth (3x3m)", price: "$250" },
    { value: "exhibitor-premium", label: "Exhibitor – Premium Booth (6x3m)", price: "$500" },
    { value: "exhibitor-corner", label: "Exhibitor – Corner Booth (3x3m)", price: "$350" },
    { value: "media", label: "Media / Press Pass", price: "Free" },
    { value: "vip-buyer", label: "VIP Buyer (hosted)", price: "$30" },
  ];

  const visitorInterests = [
    { id: "technology", label: "Technology & Innovation" },
    { id: "agriculture", label: "Agriculture & Farming" },
    { id: "manufacturing", label: "Manufacturing & Engineering" },
    { id: "fashion", label: "Fashion & Textiles" },
    { id: "food-bev", label: "Food & Beverages" },
    { id: "art", label: "Art & Crafts" },
    { id: "mining", label: "Mining & Resources" },
    { id: "finance", label: "Finance & Banking" },
  ];

  const exhibitorAddOns = [
    { id: "electricity", label: "Power Supply (13A socket)", price: "$40" },
    { id: "wifi", label: "Dedicated WiFi", price: "$25" },
    { id: "furniture", label: "Table + 2 Chairs", price: "$15" },
    { id: "signage", label: "Custom Fascia Board", price: "$30" },
    { id: "catalogue", label: "Listing in Official Catalogue", price: "$20" },
    { id: "lead-scanner", label: "Lead Scanner App", price: "$50" },
    { id: "extra-passes", label: "Extra Staff Passes (x2)", price: "$10" },
  ];

  const isExhibitor = formData.attendeeType?.startsWith("exhibitor");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4" />
            Registration Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.attendeeType || ""}
            onValueChange={(value) => setFormData({ ...formData, attendeeType: value })}
            className="space-y-3"
          >
            {attendeeTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={type.value} id={`expo-${type.value}`} />
                <Label htmlFor={`expo-${type.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{type.label}</p>
                    <Badge variant="outline">{type.price}</Badge>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {isExhibitor && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4" />
                Company Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Company / Brand Name</Label>
                <Input
                  placeholder="Your company name"
                  value={formData.companyName || ""}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Industry / Sector</Label>
                <Select
                  value={formData.industrySector || ""}
                  onValueChange={(value) => setFormData({ ...formData, industrySector: value })}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {visitorInterests.map((vi) => (
                      <SelectItem key={vi.id} value={vi.id}>{vi.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Product / Service Description</Label>
                <Textarea
                  placeholder="Brief description for the catalogue..."
                  value={formData.productDescription || ""}
                  onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label>Number of Staff Attending</Label>
                <Select
                  value={formData.staffCount || "1"}
                  onValueChange={(value) => setFormData({ ...formData, staffCount: value })}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["1", "2", "3", "4", "5+"].map((n) => (
                      <SelectItem key={n} value={n}>{n} staff</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Booth Add-ons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {exhibitorAddOns.map((addon) => (
                <div key={addon.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`expo-addon-${addon.id}`}
                    checked={formData.boothAddOns?.includes(addon.id)}
                    onCheckedChange={(checked) => {
                      const current = formData.boothAddOns || [];
                      setFormData({
                        ...formData,
                        boothAddOns: checked
                          ? [...current, addon.id]
                          : current.filter((id: string) => id !== addon.id),
                      });
                    }}
                  />
                  <Label htmlFor={`expo-addon-${addon.id}`} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{addon.label}</p>
                      <Badge variant="secondary">{addon.price}</Badge>
                    </div>
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {!isExhibitor && formData.attendeeType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Interests & Meetings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Which sectors interest you?</Label>
            <div className="grid grid-cols-2 gap-2">
              {visitorInterests.map((interest) => (
                <div key={interest.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`interest-${interest.id}`}
                    checked={formData.interests?.includes(interest.id)}
                    onCheckedChange={(checked) => {
                      const current = formData.interests || [];
                      setFormData({
                        ...formData,
                        interests: checked
                          ? [...current, interest.id]
                          : current.filter((id: string) => id !== interest.id),
                      });
                    }}
                  />
                  <Label htmlFor={`interest-${interest.id}`} className="text-sm">{interest.label}</Label>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="b2b-meeting"
                checked={formData.wantsB2BMeetings || false}
                onCheckedChange={(checked) => setFormData({ ...formData, wantsB2BMeetings: checked })}
              />
              <Label htmlFor="b2b-meeting" className="text-sm">
                I'd like to schedule B2B meetings with exhibitors
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Attendance Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.attendanceDays || "all"}
            onValueChange={(value) => setFormData({ ...formData, attendanceDays: value })}
          >
            <SelectTrigger><SelectValue placeholder="Select days" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days (Full Pass)</SelectItem>
              <SelectItem value="day-1">Day 1 Only</SelectItem>
              <SelectItem value="day-2">Day 2 Only</SelectItem>
              <SelectItem value="day-3">Day 3 Only</SelectItem>
              <SelectItem value="weekend">Weekend Only</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExhibitionBookingForm;
