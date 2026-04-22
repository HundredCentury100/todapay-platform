import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Laptop, Monitor, Wifi, Coffee } from "lucide-react";

interface WorkspaceCategoryFormProps {
  workspaceType?: string;
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const WorkspaceCategoryForm = ({ workspaceType, data, onChange }: WorkspaceCategoryFormProps) => {
  const update = (field: string, value: any) => onChange({ ...data, [field]: value });
  const type = data.workspaceType || workspaceType || "";

  const renderMeetingRoomFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Meeting Type</Label>
          <Select value={data.meetingType || ""} onValueChange={v => update("meetingType", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">Internal Team Meeting</SelectItem>
              <SelectItem value="client">Client Presentation</SelectItem>
              <SelectItem value="interview">Interviews</SelectItem>
              <SelectItem value="brainstorm">Brainstorming Session</SelectItem>
              <SelectItem value="training">Training Session</SelectItem>
              <SelectItem value="board">Board Meeting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Layout Preference</Label>
          <Select value={data.layoutPreference || ""} onValueChange={v => update("layoutPreference", v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select layout" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="boardroom">Boardroom</SelectItem>
              <SelectItem value="u-shape">U-Shape</SelectItem>
              <SelectItem value="classroom">Classroom</SelectItem>
              <SelectItem value="theater">Theater</SelectItem>
              <SelectItem value="open">Open / Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {[
          { id: "video-conf-setup", label: "Video Conferencing" },
          { id: "whiteboard-ws", label: "Whiteboard/Flipchart" },
          { id: "screen-sharing", label: "Screen Sharing" },
          { id: "recording-ws", label: "Session Recording" },
        ].map(opt => (
          <div key={opt.id} className="flex items-center space-x-2">
            <Checkbox id={`ws-${opt.id}`} checked={!!data[opt.id]} onCheckedChange={v => update(opt.id, !!v)} />
            <label htmlFor={`ws-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHotDeskFields = () => (
    <div className="space-y-3">
      <div className="space-y-1"><Label className="text-xs">Desk Preference</Label>
        <Select value={data.deskPreference || ""} onValueChange={v => update("deskPreference", v)}>
          <SelectTrigger className="text-sm"><SelectValue placeholder="Select preference" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="quiet-zone">Quiet Zone</SelectItem>
            <SelectItem value="collaborative">Collaborative Area</SelectItem>
            <SelectItem value="window">Window Seat</SelectItem>
            <SelectItem value="standing">Standing Desk</SelectItem>
            <SelectItem value="any">No Preference</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-3">
        {[
          { id: "external-monitor", label: "🖥️ External Monitor" },
          { id: "ergonomic-chair", label: "🪑 Ergonomic Chair" },
          { id: "power-strip", label: "🔌 Extra Power Outlets" },
          { id: "locker", label: "🔐 Personal Locker" },
        ].map(opt => (
          <div key={opt.id} className="flex items-center space-x-2">
            <Checkbox id={`ws-${opt.id}`} checked={!!data[opt.id]} onCheckedChange={v => update(opt.id, !!v)} />
            <label htmlFor={`ws-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Laptop className="h-4 w-4 text-primary" />
          Workspace Preferences
          {type && <Badge variant="secondary" className="text-[10px] h-5">{type.replace(/_/g, " ")}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(type === "meeting_room" || type === "conference_room") && renderMeetingRoomFields()}
        {(type === "hot_desk" || type === "dedicated_desk") && renderHotDeskFields()}
        
        {/* Common workspace preferences */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Amenities Needed</Label>
          <div className="flex flex-wrap gap-3">
            {[
              { id: "high-speed-wifi", label: "High-Speed WiFi", icon: Wifi },
              { id: "printing", label: "Printing/Scanning" },
              { id: "coffee-tea", label: "☕ Coffee & Tea" },
              { id: "phone-booth", label: "📞 Phone Booth" },
              { id: "mail-handling", label: "📬 Mail Handling" },
            ].map(opt => (
              <div key={opt.id} className="flex items-center space-x-2">
                <Checkbox id={`ws-${opt.id}`} checked={!!data[opt.id]} onCheckedChange={v => update(opt.id, !!v)} />
                <label htmlFor={`ws-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Additional requirements</Label>
          <Textarea value={data.workspaceNotes || ""} onChange={e => update("workspaceNotes", e.target.value)}
            placeholder="Any specific workspace requirements..." rows={2} className="text-sm" />
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkspaceCategoryForm;
