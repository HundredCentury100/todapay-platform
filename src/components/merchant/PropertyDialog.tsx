import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiImageUpload } from "@/components/merchant/MultiImageUpload";
import { Property, PropertyType, PROPERTY_AMENITIES } from "@/types/stay";
import { toast } from "sonner";

interface PropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
  onSave: (data: Partial<Property>) => Promise<void>;
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'lodge', label: 'Lodge' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'guesthouse', label: 'Guesthouse' },
  { value: 'resort', label: 'Resort' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'cabin', label: 'Cabin' },
  { value: 'boutique_hotel', label: 'Boutique Hotel' },
];

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  parking: 'Parking',
  pool: 'Swimming Pool',
  gym: 'Gym',
  spa: 'Spa',
  restaurant: 'Restaurant',
  bar: 'Bar',
  room_service: 'Room Service',
  laundry: 'Laundry',
  airport_shuttle: 'Airport Shuttle',
  business_center: 'Business Center',
  pet_friendly: 'Pet Friendly',
  air_conditioning: 'Air Conditioning',
  heating: 'Heating',
  kitchen: 'Kitchen',
  balcony: 'Balcony',
  garden: 'Garden',
  beach_access: 'Beach Access',
  ski_access: 'Ski Access',
  ev_charging: 'EV Charging',
};

export function PropertyDialog({ open, onOpenChange, property, onSave }: PropertyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    property_type: 'hotel' as PropertyType,
    address: '',
    city: '',
    country: '',
    star_rating: 3,
    amenities: [] as string[],
    check_in_time: '14:00',
    check_out_time: '11:00',
    images: [] as string[],
    policies: {
      cancellation: '',
      house_rules: [] as string[],
      pets_allowed: false,
      smoking_allowed: false,
      children_allowed: true,
    },
  });

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || '',
        description: property.description || '',
        property_type: property.property_type || 'hotel',
        address: property.address || '',
        city: property.city || '',
        country: property.country || '',
        star_rating: property.star_rating || 3,
        amenities: property.amenities || [],
        check_in_time: property.check_in_time || '14:00',
        check_out_time: property.check_out_time || '11:00',
        images: property.images || [],
        policies: {
          cancellation: property.policies?.cancellation || '',
          house_rules: property.policies?.house_rules || [],
          pets_allowed: property.policies?.pets_allowed || false,
          smoking_allowed: property.policies?.smoking_allowed || false,
          children_allowed: property.policies?.children_allowed ?? true,
        },
      });
    } else {
      setFormData({
        name: '',
        description: '',
        property_type: 'hotel',
        address: '',
        city: '',
        country: '',
        star_rating: 3,
        amenities: [],
        check_in_time: '14:00',
        check_out_time: '11:00',
        images: [],
        policies: {
          cancellation: '',
          house_rules: [],
          pets_allowed: false,
          smoking_allowed: false,
          children_allowed: true,
        },
      });
    }
  }, [property, open]);

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.city || !formData.country) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        policies: formData.policies,
      });
      onOpenChange(false);
      toast.success(property ? 'Property updated successfully' : 'Property created successfully');
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error('Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'Add New Property'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Rainbow Towers Harare"
                  required
                />
              </div>

              <div>
                <Label htmlFor="property_type">Property Type *</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value: PropertyType) => setFormData(prev => ({ ...prev, property_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="star_rating">Star Rating</Label>
                <Select
                  value={formData.star_rating.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, star_rating: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your property..."
                rows={3}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-semibold">Location</h3>
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="e.g., 123 Main Street"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="e.g., Harare"
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="e.g., South Africa"
                  required
                />
              </div>
            </div>
          </div>

          {/* Check-in/out Times */}
          <div className="space-y-4">
            <h3 className="font-semibold">Check-in/Check-out</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="check_in_time">Check-in Time</Label>
                <Input
                  id="check_in_time"
                  type="time"
                  value={formData.check_in_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, check_in_time: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="check_out_time">Check-out Time</Label>
                <Input
                  id="check_out_time"
                  type="time"
                  value={formData.check_out_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, check_out_time: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="font-semibold">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROPERTY_AMENITIES.map(amenity => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity}`}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => handleAmenityToggle(amenity)}
                  />
                  <Label htmlFor={`amenity-${amenity}`} className="text-sm cursor-pointer">
                    {AMENITY_LABELS[amenity] || amenity}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Policies */}
          <div className="space-y-4">
            <h3 className="font-semibold">Policies</h3>
            <div>
              <Label htmlFor="cancellation">Cancellation Policy</Label>
              <Textarea
                id="cancellation"
                value={formData.policies.cancellation}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  policies: { ...prev.policies, cancellation: e.target.value }
                }))}
                placeholder="Describe your cancellation policy..."
                rows={2}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pets_allowed"
                  checked={formData.policies.pets_allowed}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    policies: { ...prev.policies, pets_allowed: !!checked }
                  }))}
                />
                <Label htmlFor="pets_allowed">Pets Allowed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="smoking_allowed"
                  checked={formData.policies.smoking_allowed}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    policies: { ...prev.policies, smoking_allowed: !!checked }
                  }))}
                />
                <Label htmlFor="smoking_allowed">Smoking Allowed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="children_allowed"
                  checked={formData.policies.children_allowed}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    policies: { ...prev.policies, children_allowed: !!checked }
                  }))}
                />
                <Label htmlFor="children_allowed">Children Allowed</Label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="font-semibold">Property Images</h3>
            <MultiImageUpload
              images={formData.images}
              onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
              maxImages={10}
              label="Property Images (up to 10)"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : property ? 'Update Property' : 'Create Property'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}