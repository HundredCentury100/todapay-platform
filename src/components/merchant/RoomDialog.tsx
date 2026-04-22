import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiImageUpload } from "@/components/merchant/MultiImageUpload";
import { Room, RoomType, BedConfiguration, ROOM_AMENITIES } from "@/types/stay";
import { toast } from "sonner";

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;
  propertyId: string;
  onSave: (data: Partial<Room>) => Promise<void>;
}

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'single', label: 'Single Room' },
  { value: 'double', label: 'Double Room' },
  { value: 'twin', label: 'Twin Room' },
  { value: 'suite', label: 'Suite' },
  { value: 'family', label: 'Family Room' },
  { value: 'dormitory', label: 'Dormitory' },
  { value: 'studio', label: 'Studio' },
  { value: 'penthouse', label: 'Penthouse' },
];

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  tv: 'TV',
  air_conditioning: 'Air Conditioning',
  heating: 'Heating',
  minibar: 'Minibar',
  safe: 'Safe',
  desk: 'Work Desk',
  iron: 'Iron',
  hairdryer: 'Hairdryer',
  tea_coffee: 'Tea/Coffee Maker',
  bathtub: 'Bathtub',
  shower: 'Shower',
  balcony: 'Balcony',
  sea_view: 'Sea View',
  city_view: 'City View',
  garden_view: 'Garden View',
  pool_view: 'Pool View',
  wheelchair_accessible: 'Wheelchair Accessible',
  connecting_rooms: 'Connecting Rooms',
  kitchenette: 'Kitchenette',
};

export function RoomDialog({ open, onOpenChange, room, propertyId, onSave }: RoomDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    room_type: 'double' as RoomType,
    max_guests: 2,
    base_price: 0,
    size_sqm: 0,
    quantity: 1,
    amenities: [] as string[],
    images: [] as string[],
    bed_configuration: {
      single_beds: 0,
      double_beds: 0,
      queen_beds: 0,
      king_beds: 0,
      sofa_beds: 0,
      bunk_beds: 0,
    } as BedConfiguration,
  });

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        description: room.description || '',
        room_type: room.room_type || 'double',
        max_guests: room.max_guests || 2,
        base_price: room.base_price || 0,
        size_sqm: room.size_sqm || 0,
        quantity: room.quantity || 1,
        amenities: room.amenities || [],
        images: room.images || [],
        bed_configuration: {
          single_beds: room.bed_configuration?.single_beds || 0,
          double_beds: room.bed_configuration?.double_beds || 0,
          queen_beds: room.bed_configuration?.queen_beds || 0,
          king_beds: room.bed_configuration?.king_beds || 0,
          sofa_beds: room.bed_configuration?.sofa_beds || 0,
          bunk_beds: room.bed_configuration?.bunk_beds || 0,
        },
      });
    } else {
      setFormData({
        name: '',
        description: '',
        room_type: 'double',
        max_guests: 2,
        base_price: 0,
        size_sqm: 0,
        quantity: 1,
        amenities: [],
        images: [],
        bed_configuration: {
          single_beds: 0,
          double_beds: 0,
          queen_beds: 0,
          king_beds: 0,
          sofa_beds: 0,
          bunk_beds: 0,
        },
      });
    }
  }, [room, open]);

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleBedChange = (bedType: keyof BedConfiguration, value: number) => {
    setFormData(prev => ({
      ...prev,
      bed_configuration: {
        ...prev.bed_configuration,
        [bedType]: Math.max(0, value),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.base_price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        property_id: propertyId,
      });
      onOpenChange(false);
      toast.success(room ? 'Room updated successfully' : 'Room created successfully');
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error('Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{room ? 'Edit Room Type' : 'Add New Room Type'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Room Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Deluxe Ocean View"
                  required
                />
              </div>

              <div>
                <Label htmlFor="room_type">Room Type *</Label>
                <Select
                  value={formData.room_type}
                  onValueChange={(value: RoomType) => setFormData(prev => ({ ...prev, room_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max_guests">Max Guests</Label>
                <Input
                  id="max_guests"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.max_guests}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_guests: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this room type..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="base_price">Price per Night (R) *</Label>
                <Input
                  id="base_price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.base_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="size_sqm">Size (m²)</Label>
                <Input
                  id="size_sqm"
                  type="number"
                  min={0}
                  value={formData.size_sqm}
                  onChange={(e) => setFormData(prev => ({ ...prev, size_sqm: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="quantity">Number of Rooms</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
          </div>

          {/* Bed Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold">Bed Configuration</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="single_beds">Single Beds</Label>
                <Input
                  id="single_beds"
                  type="number"
                  min={0}
                  value={formData.bed_configuration.single_beds || 0}
                  onChange={(e) => handleBedChange('single_beds', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="double_beds">Double Beds</Label>
                <Input
                  id="double_beds"
                  type="number"
                  min={0}
                  value={formData.bed_configuration.double_beds || 0}
                  onChange={(e) => handleBedChange('double_beds', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="queen_beds">Queen Beds</Label>
                <Input
                  id="queen_beds"
                  type="number"
                  min={0}
                  value={formData.bed_configuration.queen_beds || 0}
                  onChange={(e) => handleBedChange('queen_beds', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="king_beds">King Beds</Label>
                <Input
                  id="king_beds"
                  type="number"
                  min={0}
                  value={formData.bed_configuration.king_beds || 0}
                  onChange={(e) => handleBedChange('king_beds', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="sofa_beds">Sofa Beds</Label>
                <Input
                  id="sofa_beds"
                  type="number"
                  min={0}
                  value={formData.bed_configuration.sofa_beds || 0}
                  onChange={(e) => handleBedChange('sofa_beds', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="bunk_beds">Bunk Beds</Label>
                <Input
                  id="bunk_beds"
                  type="number"
                  min={0}
                  value={formData.bed_configuration.bunk_beds || 0}
                  onChange={(e) => handleBedChange('bunk_beds', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="font-semibold">Room Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROOM_AMENITIES.map(amenity => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`room-amenity-${amenity}`}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => handleAmenityToggle(amenity)}
                  />
                  <Label htmlFor={`room-amenity-${amenity}`} className="text-sm cursor-pointer">
                    {AMENITY_LABELS[amenity] || amenity}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="font-semibold">Room Images</h3>
            <MultiImageUpload
              images={formData.images}
              onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
              maxImages={8}
              label="Room Images (up to 8)"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : room ? 'Update Room' : 'Create Room'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}