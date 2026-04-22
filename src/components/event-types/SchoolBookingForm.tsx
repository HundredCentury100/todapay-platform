import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Users, Shield, FileText, Clock, Phone } from "lucide-react";

interface SchoolBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const SchoolBookingForm = ({ formData, setFormData }: SchoolBookingFormProps) => {
  const eventTypes = [
    { value: "sports-day", label: "Sports Day" },
    { value: "prize-giving", label: "Prize Giving / Awards" },
    { value: "field-trip", label: "Field Trip / Excursion" },
    { value: "concert", label: "School Concert / Play" },
    { value: "open-day", label: "Open Day" },
    { value: "fundraiser", label: "School Fundraiser" },
    { value: "graduation", label: "Graduation Ceremony" },
    { value: "inter-school", label: "Inter-School Competition" },
  ];

  const gradeGroups = [
    { value: "ecd", label: "ECD (Pre-school)" },
    { value: "grade-1-3", label: "Grade 1–3 (Infant)" },
    { value: "grade-4-7", label: "Grade 4–7 (Junior)" },
    { value: "form-1-4", label: "Form 1–4 (Secondary)" },
    { value: "form-5-6", label: "Form 5–6 (A-Level)" },
    { value: "all", label: "All Grades" },
  ];

  const attendeeTypes = [
    { value: "parent", label: "Parent / Guardian" },
    { value: "family", label: "Family Group" },
    { value: "teacher", label: "Teacher / Staff" },
    { value: "student-external", label: "External Student" },
  ];

  const transportOptions = [
    { value: "own", label: "Own transport" },
    { value: "school-bus", label: "School Bus ($5 per child)" },
    { value: "chartered", label: "Chartered Coach ($8 per person)" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4" />
            School Event Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.schoolEventType || ""}
            onValueChange={(value) => setFormData({ ...formData, schoolEventType: value })}
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
            <Users className="h-4 w-4" />
            Grade Level & Attendee
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Grade Group</Label>
            <Select
              value={formData.gradeGroup || ""}
              onValueChange={(value) => setFormData({ ...formData, gradeGroup: value })}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select grade group" /></SelectTrigger>
              <SelectContent>
                {gradeGroups.map((g) => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Attending As</Label>
            <Select
              value={formData.attendeeType || "parent"}
              onValueChange={(value) => setFormData({ ...formData, attendeeType: value })}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {attendeeTypes.map((at) => (
                  <SelectItem key={at.value} value={at.value}>{at.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Number of Children Attending</Label>
            <Select
              value={formData.childrenCount || "1"}
              onValueChange={(value) => setFormData({ ...formData, childrenCount: value })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["1", "2", "3", "4", "5+"].map((n) => (
                  <SelectItem key={n} value={n}>{n} {n === "1" ? "child" : "children"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Child's Full Name(s)</Label>
            <Input
              placeholder="Enter child name(s), comma separated"
              value={formData.childNames || ""}
              onChange={(e) => setFormData({ ...formData, childNames: e.target.value })}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Guardian & Consent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Guardian Full Name</Label>
            <Input
              placeholder="Full name"
              value={formData.guardianName || ""}
              onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Relationship to Child</Label>
            <Select
              value={formData.relationship || ""}
              onValueChange={(value) => setFormData({ ...formData, relationship: value })}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select relationship" /></SelectTrigger>
              <SelectContent>
                {["Parent", "Guardian", "Grandparent", "Sibling (18+)", "Other"].map((r) => (
                  <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Guardian ID Number</Label>
            <Input
              placeholder="National ID number"
              value={formData.guardianId || ""}
              onChange={(e) => setFormData({ ...formData, guardianId: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="permission-slip"
              checked={formData.permissionSlip || false}
              onCheckedChange={(checked) => setFormData({ ...formData, permissionSlip: checked })}
            />
            <Label htmlFor="permission-slip" className="text-sm">
              I grant permission for my child to participate in this event
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="photo-consent"
              checked={formData.photoConsent || false}
              onCheckedChange={(checked) => setFormData({ ...formData, photoConsent: checked })}
            />
            <Label htmlFor="photo-consent" className="text-sm">
              I consent to photographs/videos being taken of my child
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4" />
            Pickup Authorization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Authorized Pickup Person (if different from guardian)</Label>
            <Input
              placeholder="Full name"
              value={formData.pickupPerson || ""}
              onChange={(e) => setFormData({ ...formData, pickupPerson: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Pickup Person Phone</Label>
            <Input
              placeholder="+263..."
              value={formData.pickupPhone || ""}
              onChange={(e) => setFormData({ ...formData, pickupPhone: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Pickup Person ID Number</Label>
            <Input
              placeholder="National ID"
              value={formData.pickupId || ""}
              onChange={(e) => setFormData({ ...formData, pickupId: e.target.value })}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Medical & Dietary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Allergies / Medical Conditions</Label>
            <Textarea
              placeholder="List any allergies or conditions..."
              value={formData.medicalNotes || ""}
              onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Dietary Requirements</Label>
            <Select
              value={formData.dietaryReq || "none"}
              onValueChange={(value) => setFormData({ ...formData, dietaryReq: value })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["None", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Other"].map((d) => (
                  <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Transport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.transport || "own"}
            onValueChange={(value) => setFormData({ ...formData, transport: value })}
            className="space-y-2"
          >
            {transportOptions.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`school-transport-${opt.value}`} />
                <Label htmlFor={`school-transport-${opt.value}`}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolBookingForm;
