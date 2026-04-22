import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TicketTierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  tier?: any;
  onSuccess: () => void;
}

export function TicketTierDialog({ open, onOpenChange, eventId, tier, onSuccess }: TicketTierDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    total_tickets: 0,
    available_tickets: 0,
  });

  useEffect(() => {
    if (tier) {
      setFormData({
        name: tier.name || '',
        description: tier.description || '',
        price: tier.price || 0,
        total_tickets: tier.total_tickets || 0,
        available_tickets: tier.available_tickets || 0,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        total_tickets: 0,
        available_tickets: 0,
      });
    }
  }, [tier, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tierData = {
        ...formData,
        event_id: eventId,
      };

      if (tier) {
        const { error } = await supabase
          .from('event_ticket_tiers')
          .update(tierData)
          .eq('id', tier.id);

        if (error) throw error;
        toast.success("Ticket tier updated successfully");
      } else {
        tierData.available_tickets = tierData.total_tickets;
        
        const { error } = await supabase
          .from('event_ticket_tiers')
          .insert([tierData]);

        if (error) throw error;
        toast.success("Ticket tier created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save ticket tier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tier ? 'Edit Ticket Tier' : 'Create Ticket Tier'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tier Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., VIP, General Admission"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what's included in this tier"
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
            <Label htmlFor="total_tickets">Total Tickets</Label>
            <Input
              id="total_tickets"
              type="number"
              min="1"
              value={formData.total_tickets}
              onChange={(e) => {
                const total = parseInt(e.target.value);
                setFormData({ 
                  ...formData, 
                  total_tickets: total,
                  available_tickets: tier ? formData.available_tickets : total
                });
              }}
              required
            />
          </div>

          {tier && (
            <div>
              <Label htmlFor="available_tickets">Available Tickets</Label>
              <Input
                id="available_tickets"
                type="number"
                min="0"
                max={formData.total_tickets}
                value={formData.available_tickets}
                onChange={(e) => setFormData({ ...formData, available_tickets: parseInt(e.target.value) })}
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : tier ? "Update Tier" : "Create Tier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
