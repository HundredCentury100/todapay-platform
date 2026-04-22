import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SeatLayoutEditor } from "./SeatLayoutEditor";
import { MultiImageUpload } from "./MultiImageUpload";

interface BusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bus?: any;
  operatorName: string;
  onSuccess: () => void;
}

const AMENITIES_OPTIONS = [
  "WiFi",
  "AC",
  "USB Charging",
  "Restroom",
  "Reclining Seats",
  "Sleeper Seats",
  "Meals",
  "Entertainment",
];

export function BusDialog({ open, onOpenChange, bus, operatorName, onSuccess }: BusDialogProps) {
  const [loading, setLoading] = useState(false);
  const [seatLayoutOpen, setSeatLayoutOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: bus?.type || "national",
    total_seats: bus?.total_seats || 40,
    amenities: bus?.amenities || [],
    image: bus?.image || "",
    images: (bus?.images as string[]) || [],
    operator_code: bus?.operator_code || "",
  });

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a: string) => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use first image from gallery as primary image
      const primaryImage = formData.images.length > 0 ? formData.images[0] : formData.image || null;

      const busData = {
        operator: operatorName,
        type: formData.type,
        total_seats: parseInt(formData.total_seats.toString()),
        amenities: formData.amenities,
        image: primaryImage,
        images: formData.images,
        operator_code: formData.operator_code.toUpperCase().slice(0, 4) || null,
      };

      if (bus?.id) {
        const { error } = await supabase
          .from("buses")
          .update(busData)
          .eq("id", bus.id);

        if (error) throw error;
        toast.success("Bus updated successfully");
      } else {
        const { error } = await supabase
          .from("buses")
          .insert([busData]);

        if (error) throw error;
        toast.success("Bus added successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving bus:", error);
      toast.error(error.message || "Failed to save bus");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bus ? "Edit Bus" : "Add Bus"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Bus Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">National</SelectItem>
                  <SelectItem value="crossborder">Cross-Border</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="economy">Economy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="operator_code">Operator Code (3-4 chars)</Label>
              <Input
                id="operator_code"
                value={formData.operator_code}
                onChange={(e) => setFormData({ ...formData, operator_code: e.target.value.toUpperCase().slice(0, 4) })}
                placeholder="e.g., INT, GRY"
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground mt-1">Used in ticket numbers</p>
            </div>
          </div>

          <div>
            <Label htmlFor="total_seats">Total Seats</Label>
            <div className="flex gap-2">
              <Input
                id="total_seats"
                type="number"
                min="1"
                max="100"
                value={formData.total_seats}
                onChange={(e) => setFormData({ ...formData, total_seats: parseInt(e.target.value) })}
                required
              />
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setSeatLayoutOpen(true)}
                disabled={!bus?.id}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure Layout
              </Button>
            </div>
            {!bus?.id && (
              <p className="text-xs text-muted-foreground mt-1">
                Save the bus first to configure seat layout
              </p>
            )}
          </div>

          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <label htmlFor={amenity} className="text-sm cursor-pointer">
                    {amenity}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <MultiImageUpload
            images={formData.images}
            onImagesChange={(urls) => setFormData({ ...formData, images: urls })}
            label="Bus Images (up to 5 - for flyers, promos, etc.)"
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Bus"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <SeatLayoutEditor
        open={seatLayoutOpen}
        onOpenChange={setSeatLayoutOpen}
        busId={bus?.id || ''}
        currentSeats={formData.total_seats}
        onSuccess={() => {
          toast.success('Seat layout updated');
          onSuccess();
        }}
      />
    </Dialog>
  );
}