import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Stop {
  name: string;
  address: string;
  order: number;
}

interface RouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route?: any;
  onSuccess: () => void;
}

export function RouteDialog({ open, onOpenChange, route, onSuccess }: RouteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from: route?.from || "",
    to: route?.to || "",
    from_address: route?.from_address || "",
    to_address: route?.to_address || "",
    stops: route?.stops || [],
  });

  const [stops, setStops] = useState<Stop[]>(
    route?.intermediate_stops || [{ name: "", address: "", order: 0 }]
  );

  const addStop = () => {
    setStops([...stops, { name: "", address: "", order: stops.length }]);
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const updateStop = (index: number, field: keyof Stop, value: string) => {
    const updated = [...stops];
    updated[index] = { ...updated[index], [field]: value };
    setStops(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, this would save to a routes table
      toast.success(route ? "Route updated successfully" : "Route created successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving route:", error);
      toast.error("Failed to save route");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>{route ? "Edit Route" : "Create Route"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from">Origin City</Label>
              <Input
                id="from"
                value={formData.from}
                onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="to">Destination City</Label>
              <Input
                id="to"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="from_address">Origin Address</Label>
            <Textarea
              id="from_address"
              value={formData.from_address}
              onChange={(e) => setFormData({ ...formData, from_address: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="to_address">Destination Address</Label>
            <Textarea
              id="to_address"
              value={formData.to_address}
              onChange={(e) => setFormData({ ...formData, to_address: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Intermediate Stops</Label>
              <Button type="button" size="sm" onClick={addStop}>
                <Plus className="h-4 w-4 mr-1" />
                Add Stop
              </Button>
            </div>
            <div className="space-y-3">
              {stops.map((stop, index) => (
                <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Stop name (e.g., Pretoria)"
                      value={stop.name}
                      onChange={(e) => updateStop(index, "name", e.target.value)}
                    />
                    <Input
                      placeholder="Stop address"
                      value={stop.address}
                      onChange={(e) => updateStop(index, "address", e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStop(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Route"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}