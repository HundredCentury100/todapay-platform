import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EventAddonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  addon?: any;
  onSuccess: () => void;
}

export function EventAddonDialog({ open, onOpenChange, eventId, addon, onSuccess }: EventAddonDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'merchandise',
    price: 0,
    available_quantity: null as number | null,
  });

  useEffect(() => {
    if (addon) {
      setFormData({
        name: addon.name || '',
        description: addon.description || '',
        type: addon.type || 'merchandise',
        price: addon.price || 0,
        available_quantity: addon.available_quantity,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'merchandise',
        price: 0,
        available_quantity: null,
      });
    }
  }, [addon, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const addonData = {
        ...formData,
        event_id: eventId,
      };

      if (addon) {
        const { error } = await supabase
          .from('event_addons')
          .update(addonData)
          .eq('id', addon.id);

        if (error) throw error;
        toast.success("Add-on updated successfully");
      } else {
        const { error } = await supabase
          .from('event_addons')
          .insert([addonData]);

        if (error) throw error;
        toast.success("Add-on created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save add-on");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{addon ? 'Edit Event Add-On' : 'Create Event Add-On'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Add-On Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., T-Shirt, VIP Parking"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merchandise">Merchandise</SelectItem>
                <SelectItem value="parking">Parking</SelectItem>
                <SelectItem value="food_beverage">Food & Beverage</SelectItem>
                <SelectItem value="vip_upgrade">VIP Upgrade</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the add-on"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="available_quantity">Available Quantity (optional)</Label>
            <Input
              id="available_quantity"
              type="number"
              min="0"
              value={formData.available_quantity || ''}
              onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="Leave empty for unlimited"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : addon ? "Update Add-On" : "Create Add-On"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
