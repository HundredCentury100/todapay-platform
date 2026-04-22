import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMerchantOperatorNames } from "@/services/merchantService";
import { MultiImageUpload } from "./MultiImageUpload";
import { CalendarDays, Repeat, Ticket } from "lucide-react";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: any;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function EventDialog({ open, onOpenChange, event, onSuccess }: EventDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'concert',
    event_date: '',
    event_time: '',
    venue: '',
    location: '',
    status: 'active',
    image: '',
    images: [] as string[],
    is_free: false,
    is_recurring: false,
    recurrence_pattern: '',
    recurrence_days: [] as number[],
    recurrence_end_date: '',
    season_name: '',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        type: event.type || 'concert',
        event_date: event.event_date || '',
        event_time: event.event_time || '',
        venue: event.venue || '',
        location: event.location || '',
        status: event.status || 'active',
        image: event.image || '',
        images: (event.images as string[]) || [],
        is_free: false,
        is_recurring: event.is_recurring || false,
        recurrence_pattern: event.recurrence_pattern || '',
        recurrence_days: event.recurrence_days || [],
        recurrence_end_date: event.recurrence_end_date || '',
        season_name: event.season_name || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'concert',
        event_date: '',
        event_time: '',
        venue: '',
        location: '',
        status: 'active',
        image: '',
        images: [],
        is_free: false,
        is_recurring: false,
        recurrence_pattern: '',
        recurrence_days: [],
        recurrence_end_date: '',
        season_name: '',
      });
    }
  }, [event, open]);

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      recurrence_days: prev.recurrence_days.includes(day)
        ? prev.recurrence_days.filter(d => d !== day)
        : [...prev.recurrence_days, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const organizers = await getMerchantOperatorNames();
      if (organizers.length === 0) {
        throw new Error("No merchant operator found");
      }

      // Use first image from gallery as primary image
      const primaryImage = formData.images.length > 0 ? formData.images[0] : formData.image || null;

      const eventData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        event_date: formData.event_date,
        event_time: formData.event_time,
        venue: formData.venue,
        location: formData.location,
        status: formData.status,
        image: primaryImage,
        images: formData.images,
        organizer: organizers[0],
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
        recurrence_days: formData.is_recurring && formData.recurrence_pattern === 'weekly' ? formData.recurrence_days : null,
        recurrence_end_date: formData.is_recurring ? formData.recurrence_end_date : null,
        season_name: formData.season_name || null,
      };

      if (event) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id);

        if (error) throw error;
        toast.success("Event updated successfully");
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventData]);

        if (error) throw error;
        toast.success("Event created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Create Event'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Event Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concert">Concert</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="theater">Theater</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="comedy">Comedy</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                  <SelectItem value="tour">Tour</SelectItem>
                  <SelectItem value="tasting">Tasting</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="sold_out">Sold Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event_date">Event Date</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="event_time">Event Time</Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="venue">Venue Name</Label>
            <Input
              id="venue"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="e.g., FNB Stadium"
              required
            />
          </div>

          <div>
            <Label htmlFor="location">Location/City</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Johannesburg, South Africa"
              required
            />
          </div>

          {/* Season Name */}
          <div>
            <Label htmlFor="season_name">Season/Series Name (optional)</Label>
            <Input
              id="season_name"
              value={formData.season_name}
              onChange={(e) => setFormData({ ...formData, season_name: e.target.value })}
              placeholder="e.g., PSL 2025/26 Season, Summer Jazz Series"
            />
          </div>

          {/* Free Event Toggle */}
          <div className="border rounded-lg p-4 bg-green-500/10 border-green-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-green-600" />
                <div>
                  <Label htmlFor="is_free" className="font-medium">Free Event</Label>
                  <p className="text-xs text-muted-foreground">Enable this for events with no entry fee</p>
                </div>
              </div>
              <Switch
                id="is_free"
                checked={formData.is_free}
                onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
              />
            </div>
            {formData.is_free && (
              <p className="text-sm text-green-600 mt-2">
                ✓ This event will be marked as FREE. You can still create ticket tiers with $0 price for different categories.
              </p>
            )}
          </div>

          {/* Recurring Event Toggle */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="is_recurring" className="font-medium">Recurring Event</Label>
              </div>
              <Switch
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
              />
            </div>

            {formData.is_recurring && (
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Recurrence Pattern</Label>
                  <Select 
                    value={formData.recurrence_pattern} 
                    onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recurrence_pattern === 'weekly' && (
                  <div>
                    <Label className="mb-2 block">Repeat on Days</Label>
                    <div className="flex gap-2 flex-wrap">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day.value} className="flex items-center gap-1">
                          <Checkbox
                            id={`day-${day.value}`}
                            checked={formData.recurrence_days.includes(day.value)}
                            onCheckedChange={() => handleDayToggle(day.value)}
                          />
                          <Label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="recurrence_end_date">
                    <CalendarDays className="h-4 w-4 inline mr-1" />
                    Series End Date
                  </Label>
                  <Input
                    id="recurrence_end_date"
                    type="date"
                    value={formData.recurrence_end_date}
                    onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <MultiImageUpload
            images={formData.images}
            onImagesChange={(urls) => setFormData({ ...formData, images: urls })}
            label="Event Images (up to 5 - for flyers, promos, etc.)"
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : event ? "Update Event" : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}