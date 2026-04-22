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
import { Card, CardContent } from "@/components/ui/card";
import { X, Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MultiImageUpload } from "../MultiImageUpload";
import { VENUE_AMENITIES, VenueType, CateringOption, VenueEquipment } from "@/types/venue";

const VENUE_TYPES: { value: VenueType; label: string }[] = [
  { value: 'conference_center', label: 'Conference Center' },
  { value: 'banquet_hall', label: 'Banquet Hall' },
  { value: 'rooftop', label: 'Rooftop' },
  { value: 'garden', label: 'Garden' },
  { value: 'beach', label: 'Beach' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel_ballroom', label: 'Hotel Ballroom' },
  { value: 'theater', label: 'Theater' },
  { value: 'museum', label: 'Museum' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'studio', label: 'Studio' },
  { value: 'outdoor', label: 'Outdoor' },
];

interface VenueFormData {
  id?: string;
  name: string;
  description: string;
  venue_type: VenueType;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  size_sqm?: number;
  capacity_standing?: number;
  capacity_seated?: number;
  capacity_theater?: number;
  capacity_banquet?: number;
  hourly_rate?: number;
  half_day_rate?: number;
  full_day_rate?: number;
  min_hours: number;
  amenities: string[];
  catering_options: CateringOption[];
  equipment_available: VenueEquipment[];
  images: string[];
  status: 'active' | 'inactive';
}

interface VenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venue?: VenueFormData | null;
  onSave: (data: VenueFormData) => Promise<void>;
}

const DEFAULT_CATERING: CateringOption = {
  id: '',
  name: '',
  description: '',
  price_per_person: 0,
  min_guests: 10,
  menu_items: [],
};

const DEFAULT_EQUIPMENT: VenueEquipment = {
  id: '',
  name: '',
  description: '',
  price: 0,
  quantity_available: 1,
};

export const VenueDialog = ({ open, onOpenChange, venue, onSave }: VenueDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    description: '',
    venue_type: 'conference_center',
    address: '',
    city: '',
    country: '',
    size_sqm: undefined,
    capacity_standing: undefined,
    capacity_seated: undefined,
    capacity_theater: undefined,
    capacity_banquet: undefined,
    hourly_rate: undefined,
    half_day_rate: undefined,
    full_day_rate: undefined,
    min_hours: 2,
    amenities: [],
    catering_options: [],
    equipment_available: [],
    images: [],
    status: 'active',
  });

  useEffect(() => {
    if (venue) {
      setFormData({
        ...venue,
        catering_options: venue.catering_options || [],
        equipment_available: venue.equipment_available || [],
        amenities: venue.amenities || [],
        images: venue.images || [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        venue_type: 'conference_center',
        address: '',
        city: '',
        country: '',
        size_sqm: undefined,
        capacity_standing: undefined,
        capacity_seated: undefined,
        capacity_theater: undefined,
        capacity_banquet: undefined,
        hourly_rate: undefined,
        half_day_rate: undefined,
        full_day_rate: undefined,
        min_hours: 2,
        amenities: [],
        catering_options: [],
        equipment_available: [],
        images: [],
        status: 'active',
      });
    }
  }, [venue, open]);

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const addCateringOption = () => {
    const newOption: CateringOption = {
      ...DEFAULT_CATERING,
      id: `temp-${Date.now()}`,
    };
    setFormData(prev => ({
      ...prev,
      catering_options: [...prev.catering_options, newOption],
    }));
  };

  const updateCateringOption = (index: number, field: keyof CateringOption, value: any) => {
    setFormData(prev => ({
      ...prev,
      catering_options: prev.catering_options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const removeCateringOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      catering_options: prev.catering_options.filter((_, i) => i !== index),
    }));
  };

  const addEquipment = () => {
    const newEquipment: VenueEquipment = {
      ...DEFAULT_EQUIPMENT,
      id: `temp-${Date.now()}`,
    };
    setFormData(prev => ({
      ...prev,
      equipment_available: [...prev.equipment_available, newEquipment],
    }));
  };

  const updateEquipment = (index: number, field: keyof VenueEquipment, value: any) => {
    setFormData(prev => ({
      ...prev,
      equipment_available: prev.equipment_available.map((eq, i) =>
        i === index ? { ...eq, [field]: value } : eq
      ),
    }));
  };

  const removeEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipment_available: prev.equipment_available.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.city || !formData.country) {
      toast.error("Please fill in required fields (Name, City, Country)");
      return;
    }

    if (!formData.hourly_rate && !formData.half_day_rate && !formData.full_day_rate) {
      toast.error("Please set at least one pricing option");
      return;
    }

    // Validate catering options
    for (const opt of formData.catering_options) {
      if (!opt.name || opt.price_per_person <= 0) {
        toast.error("Each catering option needs a name and valid price");
        return;
      }
    }

    // Validate equipment
    for (const eq of formData.equipment_available) {
      if (!eq.name || eq.price < 0) {
        toast.error("Each equipment item needs a name and valid price");
        return;
      }
    }

    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving venue:', error);
      toast.error('Failed to save venue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{venue?.id ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-7 gap-1">
              <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
              <TabsTrigger value="capacity" className="text-xs">Capacity</TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs">Pricing</TabsTrigger>
              <TabsTrigger value="amenities" className="text-xs">Amenities</TabsTrigger>
              <TabsTrigger value="catering" className="text-xs">Catering</TabsTrigger>
              <TabsTrigger value="equipment" className="text-xs">Equipment</TabsTrigger>
              <TabsTrigger value="images" className="text-xs">Images</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Venue Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Grand Ballroom at The Plaza"
                  />
                </div>

                <div>
                  <Label>Venue Type *</Label>
                  <Select
                    value={formData.venue_type}
                    onValueChange={(v: VenueType) => setFormData(prev => ({ ...prev, venue_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VENUE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Size (sqm)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.size_sqm || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, size_sqm: parseInt(e.target.value) || undefined }))}
                    placeholder="e.g., 500"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your venue, its ambiance, and what makes it special..."
                    rows={4}
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

                <div>
                  <Label>Latitude (optional)</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || undefined }))}
                    placeholder="e.g., -33.9249"
                  />
                </div>

                <div>
                  <Label>Longitude (optional)</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || undefined }))}
                    placeholder="e.g., 18.4241"
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

            {/* Capacity Tab */}
            <TabsContent value="capacity" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Set the maximum capacity for different event setups. This helps customers find venues that fit their needs.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Standing Capacity</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.capacity_standing || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity_standing: parseInt(e.target.value) || undefined }))}
                    placeholder="e.g., 500"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Cocktail style / standing room</p>
                </div>

                <div>
                  <Label>Seated Capacity</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.capacity_seated || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity_seated: parseInt(e.target.value) || undefined }))}
                    placeholder="e.g., 300"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Seated dining arrangement</p>
                </div>

                <div>
                  <Label>Theater Capacity</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.capacity_theater || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity_theater: parseInt(e.target.value) || undefined }))}
                    placeholder="e.g., 400"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Rows of chairs facing stage</p>
                </div>

                <div>
                  <Label>Banquet Capacity</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.capacity_banquet || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity_banquet: parseInt(e.target.value) || undefined }))}
                    placeholder="e.g., 250"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Round tables with chairs</p>
                </div>
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Set at least one pricing option for your venue. Prices are in local currency.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hourly Rate</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourly_rate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || undefined }))}
                    placeholder="e.g., 500"
                  />
                </div>

                <div>
                  <Label>Half-Day Rate (4 hours)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.half_day_rate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, half_day_rate: parseFloat(e.target.value) || undefined }))}
                    placeholder="e.g., 1500"
                  />
                </div>

                <div>
                  <Label>Full-Day Rate (8 hours)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.full_day_rate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_day_rate: parseFloat(e.target.value) || undefined }))}
                    placeholder="e.g., 2500"
                  />
                </div>

                <div>
                  <Label>Minimum Hours</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.min_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_hours: parseInt(e.target.value) || 2 }))}
                    placeholder="e.g., 2"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Amenities Tab */}
            <TabsContent value="amenities" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Select the amenities available at your venue.
              </p>
              
              <div className="flex flex-wrap gap-2">
                {VENUE_AMENITIES.map(amenity => (
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

            {/* Catering Tab */}
            <TabsContent value="catering" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Add catering packages that customers can select when booking.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={addCateringOption}>
                  <Plus className="h-4 w-4 mr-1" /> Add Package
                </Button>
              </div>
              
              {formData.catering_options.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No catering packages added yet. Click "Add Package" to create one.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.catering_options.map((option, index) => (
                    <Card key={option.id || index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Package Name *</Label>
                            <Input
                              value={option.name}
                              onChange={(e) => updateCateringOption(index, 'name', e.target.value)}
                              placeholder="e.g., Premium Buffet"
                            />
                          </div>
                          <div>
                            <Label>Price per Person *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={option.price_per_person || ''}
                              onChange={(e) => updateCateringOption(index, 'price_per_person', parseFloat(e.target.value) || 0)}
                              placeholder="e.g., 75"
                            />
                          </div>
                          <div>
                            <Label>Minimum Guests</Label>
                            <Input
                              type="number"
                              min="1"
                              value={option.min_guests || ''}
                              onChange={(e) => updateCateringOption(index, 'min_guests', parseInt(e.target.value) || undefined)}
                              placeholder="e.g., 20"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeCateringOption(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Remove
                            </Button>
                          </div>
                          <div className="col-span-2">
                            <Label>Description</Label>
                            <Textarea
                              value={option.description || ''}
                              onChange={(e) => updateCateringOption(index, 'description', e.target.value)}
                              placeholder="Describe what's included..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Equipment Tab */}
            <TabsContent value="equipment" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Add equipment that customers can rent with their venue booking.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={addEquipment}>
                  <Plus className="h-4 w-4 mr-1" /> Add Equipment
                </Button>
              </div>
              
              {formData.equipment_available.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No equipment added yet. Click "Add Equipment" to create one.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.equipment_available.map((equipment, index) => (
                    <Card key={equipment.id || index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <Label>Equipment Name *</Label>
                            <Input
                              value={equipment.name}
                              onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                              placeholder="e.g., Projector"
                            />
                          </div>
                          <div>
                            <Label>Price (per rental)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={equipment.price || ''}
                              onChange={(e) => updateEquipment(index, 'price', parseFloat(e.target.value) || 0)}
                              placeholder="e.g., 150"
                            />
                          </div>
                          <div>
                            <Label>Quantity Available</Label>
                            <Input
                              type="number"
                              min="1"
                              value={equipment.quantity_available}
                              onChange={(e) => updateEquipment(index, 'quantity_available', parseInt(e.target.value) || 1)}
                              placeholder="e.g., 2"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Description</Label>
                            <Input
                              value={equipment.description || ''}
                              onChange={(e) => updateEquipment(index, 'description', e.target.value)}
                              placeholder="e.g., 4K projector with HDMI"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeEquipment(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Upload photos of your venue. The first image will be used as the primary image.
              </p>
              
              <MultiImageUpload
                images={formData.images}
                onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                maxImages={15}
                label="Venue Images (up to 15)"
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {venue?.id ? 'Update Venue' : 'Create Venue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VenueDialog;
