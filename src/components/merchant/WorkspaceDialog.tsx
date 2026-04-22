import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MultiImageUpload } from "./MultiImageUpload";
import { WORKSPACE_AMENITIES } from "@/types/workspace";
import type { WorkspaceType } from "@/types/workspace";

interface OperatingHoursDay {
  open: string;
  close: string;
}

interface OperatingHours {
  monday?: OperatingHoursDay;
  tuesday?: OperatingHoursDay;
  wednesday?: OperatingHoursDay;
  thursday?: OperatingHoursDay;
  friday?: OperatingHoursDay;
  saturday?: OperatingHoursDay;
  sunday?: OperatingHoursDay;
}

interface WorkspaceFormData {
  id?: string;
  name: string;
  description: string;
  workspace_type: WorkspaceType;
  address: string;
  city: string;
  country: string;
  capacity: number;
  amenities: string[];
  images: string[];
  hourly_rate?: number;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  operating_hours: OperatingHours;
  status: 'active' | 'inactive';
}

interface WorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace?: WorkspaceFormData | null;
  onSave: (data: WorkspaceFormData) => Promise<void>;
}

const WORKSPACE_TYPES: { value: WorkspaceType; label: string }[] = [
  { value: 'hot_desk', label: 'Hot Desk' },
  { value: 'dedicated_desk', label: 'Dedicated Desk' },
  { value: 'private_office', label: 'Private Office' },
  { value: 'meeting_room', label: 'Meeting Room' },
  { value: 'conference_room', label: 'Conference Room' },
  { value: 'virtual_office', label: 'Virtual Office' },
  { value: 'event_space', label: 'Event Space' },
  { value: 'podcast_studio', label: 'Podcast Studio' },
  { value: 'photo_studio', label: 'Photo Studio' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const DEFAULT_HOURS: OperatingHours = {
  monday: { open: '08:00', close: '18:00' },
  tuesday: { open: '08:00', close: '18:00' },
  wednesday: { open: '08:00', close: '18:00' },
  thursday: { open: '08:00', close: '18:00' },
  friday: { open: '08:00', close: '18:00' },
};

export const WorkspaceDialog = ({ open, onOpenChange, workspace, onSave }: WorkspaceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<WorkspaceFormData>({
    name: '',
    description: '',
    workspace_type: 'hot_desk',
    address: '',
    city: '',
    country: '',
    capacity: 1,
    amenities: [],
    images: [],
    hourly_rate: undefined,
    daily_rate: undefined,
    weekly_rate: undefined,
    monthly_rate: undefined,
    operating_hours: DEFAULT_HOURS,
    status: 'active',
  });

  useEffect(() => {
    if (workspace) {
      setFormData({
        ...workspace,
        operating_hours: workspace.operating_hours || DEFAULT_HOURS,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        workspace_type: 'hot_desk',
        address: '',
        city: '',
        country: '',
        capacity: 1,
        amenities: [],
        images: [],
        hourly_rate: undefined,
        daily_rate: undefined,
        weekly_rate: undefined,
        monthly_rate: undefined,
        operating_hours: DEFAULT_HOURS,
        status: 'active',
      });
    }
  }, [workspace, open]);

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const updateOperatingHours = (day: typeof DAYS[number], field: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: {
          ...(prev.operating_hours[day] || { open: '08:00', close: '18:00' }),
          [field]: value,
        },
      },
    }));
  };

  const toggleDay = (day: typeof DAYS[number]) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: prev.operating_hours[day] ? undefined : { open: '08:00', close: '18:00' },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.city || !formData.country) {
      toast.error("Please fill in required fields");
      return;
    }

    if (!formData.hourly_rate && !formData.daily_rate && !formData.weekly_rate && !formData.monthly_rate) {
      toast.error("Please set at least one pricing option");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>{workspace?.id ? 'Edit Workspace' : 'Add New Workspace'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="basic" className="text-xs sm:text-sm">Basic</TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs sm:text-sm">Pricing</TabsTrigger>
              <TabsTrigger value="hours" className="text-xs sm:text-sm">Hours</TabsTrigger>
              <TabsTrigger value="amenities" className="text-xs sm:text-sm">Amenities</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Workspace Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Downtown Creative Hub"
                  />
                </div>

                <div>
                  <Label>Workspace Type *</Label>
                  <Select
                    value={formData.workspace_type}
                    onValueChange={(v: WorkspaceType) => setFormData(prev => ({ ...prev, workspace_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKSPACE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Capacity *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your workspace..."
                    rows={3}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <Label>City *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>

                <div>
                  <Label>Country *</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Country"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Images</Label>
                  <MultiImageUpload
                    images={formData.images}
                    onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                    maxImages={10}
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <Switch
                    checked={formData.status === 'active'}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
                  />
                  <Label>Active (visible to customers)</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Set at least one pricing option for your workspace.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hourly Rate</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourly_rate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || undefined }))}
                    placeholder="e.g., 15.00"
                  />
                </div>

                <div>
                  <Label>Daily Rate</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.daily_rate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, daily_rate: parseFloat(e.target.value) || undefined }))}
                    placeholder="e.g., 75.00"
                  />
                </div>

                <div>
                  <Label>Weekly Rate</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.weekly_rate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, weekly_rate: parseFloat(e.target.value) || undefined }))}
                    placeholder="e.g., 350.00"
                  />
                </div>

                <div>
                  <Label>Monthly Rate</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.monthly_rate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_rate: parseFloat(e.target.value) || undefined }))}
                    placeholder="e.g., 1200.00"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hours" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Set operating hours for each day. Toggle off days when closed.</p>
              
              <div className="space-y-3">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center gap-4">
                    <Switch
                      checked={!!formData.operating_hours[day]}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    <span className="w-24 capitalize font-medium">{day}</span>
                    {formData.operating_hours[day] ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={formData.operating_hours[day]?.open || '08:00'}
                          onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={formData.operating_hours[day]?.close || '18:00'}
                          onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="amenities" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Select amenities available at your workspace.</p>
              
              <div className="flex flex-wrap gap-2">
                {WORKSPACE_AMENITIES.map(amenity => (
                  <Badge
                    key={amenity}
                    variant={formData.amenities.includes(amenity) ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {amenity.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {workspace?.id ? 'Update Workspace' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkspaceDialog;
