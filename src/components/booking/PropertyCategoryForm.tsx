import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Hotel, Moon, Sunrise, Coffee, Sparkles } from "lucide-react";

interface PropertyCategoryFormProps {
  propertyType?: string;
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const PropertyCategoryForm = ({ propertyType, data, onChange }: PropertyCategoryFormProps) => {
  const update = (field: string, value: any) => onChange({ ...data, [field]: value });
  const type = data.propertyType || propertyType || "";

  const renderHotelFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Room Preference</Label>
          <Select value={data.roomPreference || ""} onValueChange={v => update("roomPreference", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="king">King Bed</SelectItem>
              <SelectItem value="twin">Twin Beds</SelectItem>
              <SelectItem value="queen">Queen Bed</SelectItem>
              <SelectItem value="suite">Suite</SelectItem>
              <SelectItem value="any">No Preference</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Floor Preference</Label>
          <Select value={data.floorPreference || ""} onValueChange={v => update("floorPreference", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Floor</SelectItem>
              <SelectItem value="high">High Floor</SelectItem>
              <SelectItem value="ground">Ground Floor</SelectItem>
              <SelectItem value="any">No Preference</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1"><Label className="text-xs">View Preference</Label>
        <Select value={data.viewPreference || ""} onValueChange={v => update("viewPreference", v)}>
          <SelectTrigger className="text-sm"><SelectValue placeholder="Select view" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">No Preference</SelectItem>
            <SelectItem value="pool">Pool View</SelectItem>
            <SelectItem value="garden">Garden View</SelectItem>
            <SelectItem value="city">City View</SelectItem>
            <SelectItem value="mountain">Mountain View</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderLodgeFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Lodge Experience</Label>
          <Select value={data.lodgeExperience || ""} onValueChange={v => update("lodgeExperience", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="safari">Safari Lodge</SelectItem>
              <SelectItem value="bush">Bush Camp</SelectItem>
              <SelectItem value="riverside">Riverside Lodge</SelectItem>
              <SelectItem value="mountain">Mountain Retreat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Board Basis</Label>
          <Select value={data.boardBasis || ""} onValueChange={v => update("boardBasis", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="room-only">Room Only</SelectItem>
              <SelectItem value="bb">Bed & Breakfast</SelectItem>
              <SelectItem value="half-board">Half Board</SelectItem>
              <SelectItem value="full-board">Full Board</SelectItem>
              <SelectItem value="all-inclusive">All Inclusive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {[
          { id: "game-drive", label: "🦁 Game Drive" },
          { id: "bush-walk", label: "🚶 Bush Walk" },
          { id: "sundowner", label: "🌅 Sundowner Experience" },
          { id: "bush-dinner", label: "🌙 Bush Dinner" },
        ].map(opt => (
          <div key={opt.id} className="flex items-center space-x-2">
            <Checkbox id={`prop-${opt.id}`} checked={!!data[opt.id]} onCheckedChange={v => update(opt.id, !!v)} />
            <label htmlFor={`prop-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Hotel className="h-4 w-4 text-primary" />
          Stay Preferences
          {type && <Badge variant="secondary" className="text-[10px] h-5">{type}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(type === "hotel" || type === "boutique_hotel") && renderHotelFields()}
        {(type === "lodge" || type === "safari_lodge" || type === "game_lodge") && renderLodgeFields()}

        {/* Common stay preferences */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Check-in Preferences</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Estimated arrival</Label>
              <Input type="time" value={data.estimatedArrival || ""} onChange={e => update("estimatedArrival", e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Purpose of stay</Label>
              <Select value={data.stayPurpose || ""} onValueChange={v => update("stayPurpose", v)}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="leisure">Leisure</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="honeymoon">Honeymoon</SelectItem>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                  <SelectItem value="family">Family Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Room Add-ons</Label>
          <div className="flex flex-wrap gap-3">
            {[
              { id: "extra-pillows", label: "🛏️ Extra Pillows" },
              { id: "minibar", label: "🍷 Minibar Stocked" },
              { id: "room-flowers", label: "💐 Flowers in Room" },
              { id: "champagne", label: "🥂 Welcome Champagne" },
              { id: "spa-access", label: "🧖 Spa Access" },
              { id: "gym-access", label: "💪 Gym Access" },
              { id: "laundry", label: "👔 Laundry Service" },
              { id: "daily-housekeeping", label: "🧹 Daily Housekeeping" },
            ].map(opt => (
              <div key={opt.id} className="flex items-center space-x-2">
                <Checkbox id={`prop-${opt.id}`} checked={!!data[opt.id]} onCheckedChange={v => update(opt.id, !!v)} />
                <label htmlFor={`prop-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Additional stay requests</Label>
          <Textarea value={data.stayNotes || ""} onChange={e => update("stayNotes", e.target.value)}
            placeholder="Any specific requirements for your stay..." rows={2} className="text-sm" />
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCategoryForm;
