import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CarTaxiFront, Plane, MapPin, Compass } from "lucide-react";

interface TransferCategoryFormProps {
  serviceType?: string;
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const TransferCategoryForm = ({ serviceType, data, onChange }: TransferCategoryFormProps) => {
  const update = (field: string, value: any) => onChange({ ...data, [field]: value });
  const type = data.serviceType || serviceType || "";

  const renderAirportFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Flight Number</Label>
          <Input value={data.flightNumber || ""} onChange={e => update("flightNumber", e.target.value)} 
            className="text-sm" placeholder="e.g., SA123" />
        </div>
        <div className="space-y-1"><Label className="text-xs">Airline</Label>
          <Input value={data.airline || ""} onChange={e => update("airline", e.target.value)} 
            className="text-sm" placeholder="e.g., Air Zimbabwe" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Terminal</Label>
          <Select value={data.terminal || ""} onValueChange={v => update("terminal", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select terminal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="domestic">Domestic</SelectItem>
              <SelectItem value="international">International</SelectItem>
              <SelectItem value="unknown">Not Sure</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Flight Status</Label>
          <Select value={data.flightType || ""} onValueChange={v => update("flightType", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Arriving/Departing" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="arriving">Arriving (Pickup)</SelectItem>
              <SelectItem value="departing">Departing (Drop-off)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {[
          { id: "meet-greet-airport", label: "Meet & Greet at Arrivals" },
          { id: "flight-monitoring", label: "Flight Delay Monitoring" },
          { id: "fast-track", label: "Fast Track Assistance" },
          { id: "porter-service", label: "Porter Service" },
        ].map(opt => (
          <div key={opt.id} className="flex items-center space-x-2">
            <Checkbox id={`tf-${opt.id}`} checked={!!data[opt.id]} onCheckedChange={v => update(opt.id, !!v)} />
            <label htmlFor={`tf-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTourFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Tour Duration</Label>
          <Select value={data.tourDuration || ""} onValueChange={v => update("tourDuration", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select duration" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="half-day">Half Day (4 hours)</SelectItem>
              <SelectItem value="full-day">Full Day (8 hours)</SelectItem>
              <SelectItem value="multi-day">Multi-Day</SelectItem>
              <SelectItem value="custom">Custom Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Tour Language</Label>
          <Select value={data.tourLanguage || ""} onValueChange={v => update("tourLanguage", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Language" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="shona">Shona</SelectItem>
              <SelectItem value="ndebele">Ndebele</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="portuguese">Portuguese</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1"><Label className="text-xs">Specific stops / interests</Label>
        <Textarea value={data.tourInterests || ""} onChange={e => update("tourInterests", e.target.value)}
          placeholder="e.g., Wildlife, historical sites, local markets..." rows={2} className="text-sm" />
      </div>
      <div className="flex flex-wrap gap-3">
        {[
          { id: "guide-included", label: "🗣️ Guide Included" },
          { id: "lunch-included", label: "🍽️ Lunch Included" },
          { id: "photo-stops", label: "📸 Photo Stops" },
          { id: "entrance-fees", label: "🎫 Entrance Fees Included" },
        ].map(opt => (
          <div key={opt.id} className="flex items-center space-x-2">
            <Checkbox id={`tf-${opt.id}`} checked={!!data[opt.id]} onCheckedChange={v => update(opt.id, !!v)} />
            <label htmlFor={`tf-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <CarTaxiFront className="h-4 w-4 text-primary" />
          Transfer Details
          {type && <Badge variant="secondary" className="text-[10px] h-5">{type.replace(/_/g, " ")}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(type === "airport_pickup" || type === "airport_transfer" || type === "airport") && renderAirportFields()}
        {(type === "tour" || type === "day_tour") && renderTourFields()}
        
        {/* Common transfer fields */}
        <div className="flex flex-wrap gap-3">
          {[
            { id: "child-seat-tf", label: "👶 Child Car Seat" },
            { id: "extra-stops", label: "📍 Extra Stops (fees apply)" },
            { id: "wifi-vehicle", label: "📶 WiFi in Vehicle" },
            { id: "water-snacks", label: "🧊 Water & Snacks" },
          ].map(opt => (
            <div key={opt.id} className="flex items-center space-x-2">
              <Checkbox id={`tf-${opt.id}`} checked={!!data[opt.id]} onCheckedChange={v => update(opt.id, !!v)} />
              <label htmlFor={`tf-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Driver instructions</Label>
          <Textarea value={data.driverInstructions || ""} onChange={e => update("driverInstructions", e.target.value)}
            placeholder="Any specific instructions for the driver..." rows={2} className="text-sm" />
        </div>
      </CardContent>
    </Card>
  );
};

export default TransferCategoryForm;
