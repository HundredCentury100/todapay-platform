import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Building2, Music, Camera, Mic2, Flower, Cake } from "lucide-react";

interface VenueCategoryFormProps {
  eventType?: string;
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const VenueCategoryForm = ({ eventType, data, onChange }: VenueCategoryFormProps) => {
  const update = (field: string, value: any) => onChange({ ...data, [field]: value });
  const type = data.eventType || eventType || "";

  const renderWeddingFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Ceremony Style</Label>
          <Select value={data.ceremonyStyle || ""} onValueChange={v => update("ceremonyStyle", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select style" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="traditional">Traditional</SelectItem>
              <SelectItem value="modern">Modern/Contemporary</SelectItem>
              <SelectItem value="outdoor">Outdoor Garden</SelectItem>
              <SelectItem value="religious">Religious Ceremony</SelectItem>
              <SelectItem value="civil">Civil Ceremony</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Reception Style</Label>
          <Select value={data.receptionStyle || ""} onValueChange={v => update("receptionStyle", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select style" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sit-down">Sit-Down Dinner</SelectItem>
              <SelectItem value="buffet">Buffet</SelectItem>
              <SelectItem value="cocktail">Cocktail Party</SelectItem>
              <SelectItem value="braai">Braai/BBQ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {[
          { id: "bridal-suite", label: "Bridal Suite", icon: "💍" },
          { id: "dancefloor", label: "Dance Floor", icon: "💃" },
          { id: "floral-decor", label: "Floral Décor", icon: "🌸" },
          { id: "wedding-cake", label: "Wedding Cake Service", icon: "🎂" },
          { id: "photographer", label: "Photographer", icon: "📸" },
          { id: "live-band", label: "Live Band/DJ", icon: "🎵" },
        ].map(opt => (
          <div key={opt.id} className="flex items-center space-x-2">
            <Checkbox id={`venue-${opt.id}`} checked={!!data[opt.id]} onCheckedChange={v => update(opt.id, !!v)} />
            <label htmlFor={`venue-${opt.id}`} className="text-xs cursor-pointer">{opt.icon} {opt.label}</label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCorporateFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Event Format</Label>
          <Select value={data.corporateFormat || ""} onValueChange={v => update("corporateFormat", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select format" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="conference">Conference</SelectItem>
              <SelectItem value="seminar">Seminar</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="agm">AGM/Board Meeting</SelectItem>
              <SelectItem value="product-launch">Product Launch</SelectItem>
              <SelectItem value="team-building">Team Building</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Seating Layout</Label>
          <Select value={data.seatingLayout || ""} onValueChange={v => update("seatingLayout", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select layout" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="theater">Theater Style</SelectItem>
              <SelectItem value="classroom">Classroom</SelectItem>
              <SelectItem value="boardroom">Boardroom</SelectItem>
              <SelectItem value="u-shape">U-Shape</SelectItem>
              <SelectItem value="banquet">Banquet</SelectItem>
              <SelectItem value="cabaret">Cabaret</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {[
          { id: "projector", label: "Projector & Screen" },
          { id: "microphone", label: "Microphone System" },
          { id: "video-conf", label: "Video Conferencing" },
          { id: "whiteboard", label: "Whiteboards" },
          { id: "recording", label: "Session Recording" },
          { id: "name-badges", label: "Name Badges" },
        ].map(opt => (
          <div key={opt.id} className="flex items-center space-x-2">
            <Checkbox id={`venue-${opt.id}`} checked={!!data[opt.id]} onCheckedChange={v => update(opt.id, !!v)} />
            <label htmlFor={`venue-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBirthdayFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Birthday Person's Name</Label>
          <Input value={data.birthdayName || ""} onChange={e => update("birthdayName", e.target.value)} className="text-sm" placeholder="Who's celebrating?" />
        </div>
        <div className="space-y-1"><Label className="text-xs">Age/Milestone</Label>
          <Input value={data.birthdayAge || ""} onChange={e => update("birthdayAge", e.target.value)} className="text-sm" placeholder="e.g., 30th, Sweet 16" />
        </div>
      </div>
      <div className="space-y-1"><Label className="text-xs">Theme</Label>
        <Input value={data.partyTheme || ""} onChange={e => update("partyTheme", e.target.value)} className="text-sm" placeholder="e.g., Gatsby, Tropical, 80s" />
      </div>
      <div className="flex flex-wrap gap-3">
        {[
          { id: "birthday-cake", label: "🎂 Birthday Cake" },
          { id: "balloons", label: "🎈 Balloons & Décor" },
          { id: "party-favors", label: "🎁 Party Favors" },
          { id: "photo-booth", label: "📸 Photo Booth" },
          { id: "entertainment", label: "🎭 Entertainment" },
        ].map(opt => (
          <div key={opt.id} className="flex items-center space-x-2">
            <Checkbox id={`venue-${opt.id}`} checked={!!data[opt.id]} onCheckedChange={v => update(opt.id, !!v)} />
            <label htmlFor={`venue-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Event Setup Details
          {type && <Badge variant="secondary" className="text-[10px] h-5">{type.replace(/_/g, " ")}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {type === "wedding" && renderWeddingFields()}
        {(type === "corporate_event" || type === "conference") && renderCorporateFields()}
        {type === "birthday" && renderBirthdayFields()}
        
        {/* Generic fields for all types */}
        <div className="space-y-1.5">
          <Label className="text-xs">Setup / Décor Notes</Label>
          <Textarea value={data.setupNotes || ""} onChange={e => update("setupNotes", e.target.value)}
            placeholder="Describe any specific setup requirements, color schemes, or decoration preferences..." rows={2} className="text-sm" />
        </div>
      </CardContent>
    </Card>
  );
};

export default VenueCategoryForm;
