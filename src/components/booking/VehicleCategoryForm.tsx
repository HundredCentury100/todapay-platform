import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Car, Shield, MapPin } from "lucide-react";

interface VehicleCategoryFormProps {
  rentalType?: string;
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const VehicleCategoryForm = ({ rentalType, data, onChange }: VehicleCategoryFormProps) => {
  const update = (field: string, value: any) => onChange({ ...data, [field]: value });
  const type = data.rentalType || rentalType || "self-drive";

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          Vehicle Rental Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rental Type */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Rental Type</Label>
          <RadioGroup value={type} onValueChange={v => update("rentalType", v)} className="grid grid-cols-2 gap-2">
            {[
              { value: "self-drive", label: "Self Drive", desc: "You drive the vehicle" },
              { value: "chauffeur", label: "With Chauffeur", desc: "Professional driver included" },
            ].map(opt => (
              <label key={opt.value} className={`p-3 rounded-lg border cursor-pointer transition-colors ${type === opt.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Self-drive fields */}
        {type === "self-drive" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">License Type</Label>
                <Select value={data.licenseType || ""} onValueChange={v => update("licenseType", v)}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local License</SelectItem>
                    <SelectItem value="international">International License (IDP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">License Number</Label>
                <Input value={data.licenseNumber || ""} onChange={e => update("licenseNumber", e.target.value)} 
                  className="text-sm" placeholder="Driver's license #" />
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Driving Experience</Label>
              <Select value={data.drivingExperience || ""} onValueChange={v => update("drivingExperience", v)}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Years of experience" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2">1-2 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="5+">5+ years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Chauffeur fields */}
        {type === "chauffeur" && (
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Preferred Language</Label>
              <Select value={data.chauffeurLanguage || ""} onValueChange={v => update("chauffeurLanguage", v)}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Language" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="shona">Shona</SelectItem>
                  <SelectItem value="ndebele">Ndebele</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { id: "uniformed-driver", label: "Uniformed Driver" },
                { id: "door-service", label: "Door-to-Door Service" },
                { id: "wait-return", label: "Wait & Return" },
              ].map(opt => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <Checkbox id={`veh-${opt.id}`} checked={!!data[opt.id]} onCheckedChange={v => update(opt.id, !!v)} />
                  <label htmlFor={`veh-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insurance & Protection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Insurance</Label>
          <Select value={data.vehicleInsurance || ""} onValueChange={v => update("vehicleInsurance", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select coverage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic — Third-party only</SelectItem>
              <SelectItem value="standard">Standard — CDW included</SelectItem>
              <SelectItem value="full">Full Cover — Zero excess</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add-ons */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Vehicle Add-ons</Label>
          <div className="flex flex-wrap gap-3">
            {[
              { id: "gps-nav", label: "📍 GPS Navigation" },
              { id: "child-seat-v", label: "👶 Child Seat" },
              { id: "roof-rack", label: "🧳 Roof Rack" },
              { id: "cooler-box", label: "🧊 Cooler Box" },
              { id: "fuel-prepay", label: "⛽ Prepaid Fuel" },
              { id: "cross-border", label: "🌍 Cross-Border Permit" },
            ].map(opt => (
              <div key={opt.id} className="flex items-center space-x-2">
                <Checkbox id={`veh-${opt.id}`} checked={!!data[opt.id]} onCheckedChange={v => update(opt.id, !!v)} />
                <label htmlFor={`veh-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Additional notes</Label>
          <Textarea value={data.vehicleNotes || ""} onChange={e => update("vehicleNotes", e.target.value)}
            placeholder="Any specific requirements..." rows={2} className="text-sm" />
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleCategoryForm;
