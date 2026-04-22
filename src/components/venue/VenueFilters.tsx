import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { VenueType, VENUE_AMENITIES } from "@/types/venue";

interface VenueFiltersProps {
  filters: {
    venueTypes: VenueType[];
    amenities: string[];
    minCapacity: number;
    maxPrice: number;
  };
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
}

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

const AMENITY_OPTIONS = [
  { value: 'wifi', label: 'WiFi', icon: '📶' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
  { value: 'air_conditioning', label: 'Air Conditioning', icon: '❄️' },
  { value: 'stage', label: 'Stage', icon: '🎭' },
  { value: 'sound_system', label: 'Sound System', icon: '🔊' },
  { value: 'projector', label: 'Projector', icon: '📽️' },
  { value: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { value: 'bar', label: 'Bar', icon: '🍸' },
  { value: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: '♿' },
  { value: 'outdoor_area', label: 'Outdoor Area', icon: '🌳' },
];

const VenueFilters = ({ filters, onFiltersChange, onClear }: VenueFiltersProps) => {
  const handleVenueTypeChange = (type: VenueType, checked: boolean) => {
    const newTypes = checked
      ? [...filters.venueTypes, type]
      : filters.venueTypes.filter((t) => t !== type);
    onFiltersChange({ ...filters, venueTypes: newTypes });
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const newAmenities = checked
      ? [...filters.amenities, amenity]
      : filters.amenities.filter((a) => a !== amenity);
    onFiltersChange({ ...filters, amenities: newAmenities });
  };

  const hasActiveFilters = 
    filters.venueTypes.length > 0 || 
    filters.amenities.length > 0 || 
    filters.minCapacity > 0 || 
    filters.maxPrice < 50000;

  return (
    <Card className="sticky top-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Filters</CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Venue Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Venue Type</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {VENUE_TYPES.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={type.value}
                  checked={filters.venueTypes.includes(type.value)}
                  onCheckedChange={(checked) => 
                    handleVenueTypeChange(type.value, checked as boolean)
                  }
                />
                <label
                  htmlFor={type.value}
                  className="text-sm cursor-pointer"
                >
                  {type.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Capacity */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Minimum Capacity</Label>
          <Input
            type="number"
            placeholder="Min guests"
            value={filters.minCapacity || ''}
            onChange={(e) => 
              onFiltersChange({ 
                ...filters, 
                minCapacity: parseInt(e.target.value) || 0 
              })
            }
          />
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Max Hourly Rate</Label>
            <span className="text-sm text-muted-foreground">
              R{filters.maxPrice.toLocaleString()}
            </span>
          </div>
          <Slider
            value={[filters.maxPrice]}
            onValueChange={([value]) => 
              onFiltersChange({ ...filters, maxPrice: value })
            }
            max={50000}
            step={500}
            className="w-full"
          />
        </div>

        {/* Amenities */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Amenities</Label>
          <div className="grid grid-cols-2 gap-2">
            {AMENITY_OPTIONS.map((amenity) => (
              <div key={amenity.value} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.value}
                  checked={filters.amenities.includes(amenity.value)}
                  onCheckedChange={(checked) => 
                    handleAmenityChange(amenity.value, checked as boolean)
                  }
                />
                <label
                  htmlFor={amenity.value}
                  className="text-xs cursor-pointer flex items-center gap-1"
                >
                  <span>{amenity.icon}</span>
                  {amenity.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VenueFilters;
