import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Accessibility, Utensils, Shield, Heart, ChevronDown, AlertTriangle, 
  Baby, Dog, Pill, Phone
} from "lucide-react";
import { useState } from "react";

export type BookingVerticalType = 
  | "bus" | "event" | "venue" | "workspace" | "transfer" 
  | "vehicle" | "property" | "experience";

interface BookingSpecialtyAddOnsProps {
  vertical: BookingVerticalType;
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const CheckboxOption = ({ id, checked, onChange, label, description }: {
  id: string; checked: boolean; onChange: (v: boolean) => void; label: string; description: string;
}) => (
  <div className="flex items-start space-x-3">
    <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(!!v)} />
    <div className="grid gap-1 leading-none">
      <label htmlFor={id} className="text-sm font-medium leading-none cursor-pointer">{label}</label>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

const BookingSpecialtyAddOns = ({ vertical, data, onChange }: BookingSpecialtyAddOnsProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const update = (field: string, value: any) => onChange({ ...data, [field]: value });
  const toggle = (section: string) => setOpenSections(p => ({ ...p, [section]: !p[section] }));

  const showAccessibility = true;
  const showDietary = ["event", "venue", "experience", "property", "workspace"].includes(vertical);
  const showInsurance = ["bus", "transfer", "vehicle", "property", "experience"].includes(vertical);
  const showChildcare = ["event", "venue", "experience", "property"].includes(vertical);
  const showPetFriendly = ["property", "vehicle", "transfer"].includes(vertical);
  const showMedical = ["bus", "transfer", "experience"].includes(vertical);

  return (
    <div className="space-y-3">
      {/* Accessibility */}
      <Collapsible open={openSections.accessibility} onOpenChange={() => toggle("accessibility")}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Accessibility className="h-4 w-4 text-primary" />
                  Accessibility & Special Needs
                  {(data.wheelchair || data.mobilityAid || data.visualAssistance || data.hearingAssistance) && (
                    <Badge variant="secondary" className="text-[10px] h-5">Selected</Badge>
                  )}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.accessibility ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              <CheckboxOption id="addon-wheelchair" checked={!!data.wheelchair} onChange={v => update("wheelchair", v)}
                label="Wheelchair Access Required" description="Accessible seating/rooms with proper access routes" />
              <CheckboxOption id="addon-mobility" checked={!!data.mobilityAid} onChange={v => update("mobilityAid", v)}
                label="Mobility Aid Support" description="Walking frame, crutches, or mobility scooter accommodation" />
              <CheckboxOption id="addon-visual" checked={!!data.visualAssistance} onChange={v => update("visualAssistance", v)}
                label="Visual Assistance" description="Large print materials, braille, or audio guides" />
              <CheckboxOption id="addon-hearing" checked={!!data.hearingAssistance} onChange={v => update("hearingAssistance", v)}
                label="Hearing Assistance" description="Sign language, hearing loop, or captioning services" />
              <CheckboxOption id="addon-service-animal" checked={!!data.serviceAnimal} onChange={v => update("serviceAnimal", v)}
                label="Service Animal" description="Accommodation for certified service animals" />
              <div className="space-y-1.5">
                <Label className="text-xs">Additional accessibility requirements</Label>
                <Textarea placeholder="Describe any other needs..." value={data.accessibilityNotes || ""} 
                  onChange={e => update("accessibilityNotes", e.target.value)} rows={2} className="text-sm" />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Dietary Requirements */}
      {showDietary && (
        <Collapsible open={openSections.dietary} onOpenChange={() => toggle("dietary")}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-primary" />
                    Dietary Requirements
                    {data.dietaryType && <Badge variant="secondary" className="text-[10px] h-5">{data.dietaryType}</Badge>}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.dietary ? "rotate-180" : ""}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Dietary Preference</Label>
                  <Select value={data.dietaryType || ""} onValueChange={v => update("dietaryType", v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Select dietary preference" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No special requirements</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="halal">Halal</SelectItem>
                      <SelectItem value="kosher">Kosher</SelectItem>
                      <SelectItem value="gluten-free">Gluten Free</SelectItem>
                      <SelectItem value="dairy-free">Dairy Free</SelectItem>
                      <SelectItem value="nut-free">Nut Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CheckboxOption id="addon-food-allergy" checked={!!data.hasFoodAllergy} onChange={v => update("hasFoodAllergy", v)}
                  label="Food Allergies" description="Severe allergies requiring special preparation" />
                {data.hasFoodAllergy && (
                  <Input placeholder="List specific allergies..." value={data.allergyDetails || ""} 
                    onChange={e => update("allergyDetails", e.target.value)} className="text-sm" />
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Other dietary notes</Label>
                  <Textarea placeholder="Any additional dietary requirements..." value={data.dietaryNotes || ""} 
                    onChange={e => update("dietaryNotes", e.target.value)} rows={2} className="text-sm" />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Insurance */}
      {showInsurance && (
        <Collapsible open={openSections.insurance} onOpenChange={() => toggle("insurance")}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Travel Insurance & Protection
                    {data.insuranceType && <Badge variant="secondary" className="text-[10px] h-5">{data.insuranceType}</Badge>}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.insurance ? "rotate-180" : ""}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Insurance Coverage</Label>
                  <Select value={data.insuranceType || ""} onValueChange={v => update("insuranceType", v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Select insurance option" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No insurance</SelectItem>
                      <SelectItem value="basic">Basic Coverage — cancellation & delays</SelectItem>
                      <SelectItem value="standard">Standard — includes medical & baggage</SelectItem>
                      <SelectItem value="premium">Premium — comprehensive all-risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {vertical === "vehicle" && (
                  <>
                    <CheckboxOption id="addon-cdw" checked={!!data.collisionWaiver} onChange={v => update("collisionWaiver", v)}
                      label="Collision Damage Waiver (CDW)" description="Reduces liability for vehicle damage" />
                    <CheckboxOption id="addon-theft" checked={!!data.theftProtection} onChange={v => update("theftProtection", v)}
                      label="Theft Protection" description="Coverage against vehicle theft" />
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Childcare */}
      {showChildcare && (
        <Collapsible open={openSections.childcare} onOpenChange={() => toggle("childcare")}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Baby className="h-4 w-4 text-primary" />
                    Children & Family
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.childcare ? "rotate-180" : ""}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                <CheckboxOption id="addon-childcare" checked={!!data.childcareNeeded} onChange={v => update("childcareNeeded", v)}
                  label="Childcare Services" description="On-site childminding during the event/stay" />
                <CheckboxOption id="addon-highchair" checked={!!data.highChair} onChange={v => update("highChair", v)}
                  label="High Chair / Booster Seat" description="For dining arrangements" />
                <CheckboxOption id="addon-crib" checked={!!data.cribNeeded} onChange={v => update("cribNeeded", v)}
                  label="Baby Crib / Cot" description="In-room baby sleeping arrangements" />
                {data.childcareNeeded && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Number of children & ages</Label>
                    <Input placeholder="e.g., 2 children, ages 3 and 5" value={data.childrenDetails || ""} 
                      onChange={e => update("childrenDetails", e.target.value)} className="text-sm" />
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Pet Friendly */}
      {showPetFriendly && (
        <Collapsible open={openSections.pets} onOpenChange={() => toggle("pets")}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Dog className="h-4 w-4 text-primary" />
                    Pets
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.pets ? "rotate-180" : ""}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                <CheckboxOption id="addon-pet" checked={!!data.bringingPet} onChange={v => update("bringingPet", v)}
                  label="Bringing a Pet" description="Additional fees may apply based on provider policy" />
                {data.bringingPet && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Pet type & breed</Label>
                      <Input placeholder="e.g., Dog - Labrador" value={data.petDetails || ""} 
                        onChange={e => update("petDetails", e.target.value)} className="text-sm" />
                    </div>
                    <Select value={data.petSize || ""} onValueChange={v => update("petSize", v)}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Pet size" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (under 10kg)</SelectItem>
                        <SelectItem value="medium">Medium (10-25kg)</SelectItem>
                        <SelectItem value="large">Large (over 25kg)</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Medical / Health */}
      {showMedical && (
        <Collapsible open={openSections.medical} onOpenChange={() => toggle("medical")}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    Health & Medical
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.medical ? "rotate-180" : ""}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                <CheckboxOption id="addon-medical" checked={!!data.hasMedicalCondition} onChange={v => update("hasMedicalCondition", v)}
                  label="Medical Condition" description="Conditions that staff should be aware of" />
                {data.hasMedicalCondition && (
                  <Textarea placeholder="Describe condition and any required medication..." value={data.medicalDetails || ""} 
                    onChange={e => update("medicalDetails", e.target.value)} rows={2} className="text-sm" />
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Emergency Contact</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Contact name" value={data.emergencyContactName || ""} 
                      onChange={e => update("emergencyContactName", e.target.value)} className="text-sm" />
                    <Input placeholder="Contact phone" value={data.emergencyContactPhone || ""} 
                      onChange={e => update("emergencyContactPhone", e.target.value)} className="text-sm" />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Special Requests - always shown */}
      <Collapsible open={openSections.special} onOpenChange={() => toggle("special")}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  Special Requests
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.special ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {vertical === "property" && (
                <>
                  <CheckboxOption id="addon-early-checkin" checked={!!data.earlyCheckIn} onChange={v => update("earlyCheckIn", v)}
                    label="Early Check-In" description="Request check-in before standard time (subject to availability)" />
                  <CheckboxOption id="addon-late-checkout" checked={!!data.lateCheckOut} onChange={v => update("lateCheckOut", v)}
                    label="Late Check-Out" description="Request check-out after standard time (fees may apply)" />
                  <CheckboxOption id="addon-airport-shuttle" checked={!!data.airportShuttle} onChange={v => update("airportShuttle", v)}
                    label="Airport Shuttle" description="Arrange transfer from/to airport" />
                </>
              )}
              {vertical === "bus" && (
                <>
                  <CheckboxOption id="addon-front-seat" checked={!!data.preferFrontSeat} onChange={v => update("preferFrontSeat", v)}
                    label="Front Seat Preference" description="Request seating near the front of the bus" />
                  <CheckboxOption id="addon-extra-legroom" checked={!!data.extraLegroom} onChange={v => update("extraLegroom", v)}
                    label="Extra Legroom" description="Priority for seats with extra leg space" />
                </>
              )}
              {vertical === "transfer" && (
                <>
                  <CheckboxOption id="addon-child-seat" checked={!!data.childSeat} onChange={v => update("childSeat", v)}
                    label="Child Car Seat" description="Infant or booster seat provided by driver" />
                  <CheckboxOption id="addon-meet-greet" checked={!!data.meetAndGreet} onChange={v => update("meetAndGreet", v)}
                    label="Meet & Greet" description="Driver meets you with name board at arrivals" />
                </>
              )}
              {(vertical === "event" || vertical === "venue") && (
                <CheckboxOption id="addon-celebration" checked={!!data.isCelebration} onChange={v => update("isCelebration", v)}
                  label="Special Celebration" description="Birthday, anniversary, or special occasion setup" />
              )}
              {data.isCelebration && (
                <Input placeholder="What's the occasion?" value={data.celebrationDetails || ""} 
                  onChange={e => update("celebrationDetails", e.target.value)} className="text-sm" />
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Other special requests</Label>
                <Textarea placeholder="Any additional requests or preferences..." value={data.specialRequests || ""} 
                  onChange={e => update("specialRequests", e.target.value)} rows={2} className="text-sm" />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default BookingSpecialtyAddOns;
