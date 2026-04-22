import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { WorkspaceType } from "@/types/workspace";
import { WORKSPACE_AMENITIES } from "@/types/workspace";
import { Filter, X } from "lucide-react";

interface WorkspaceFiltersProps {
  selectedTypes: WorkspaceType[];
  onTypesChange: (types: WorkspaceType[]) => void;
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  capacity: number;
  onCapacityChange: (capacity: number) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onReset: () => void;
}

const WORKSPACE_TYPES: { value: WorkspaceType; label: string }[] = [
  { value: "hot_desk", label: "Hot Desk" },
  { value: "dedicated_desk", label: "Dedicated Desk" },
  { value: "private_office", label: "Private Office" },
  { value: "meeting_room", label: "Meeting Room" },
  { value: "conference_room", label: "Conference Room" },
  { value: "virtual_office", label: "Virtual Office" },
  { value: "event_space", label: "Event Space" },
  { value: "podcast_studio", label: "Podcast Studio" },
  { value: "photo_studio", label: "Photo Studio" },
];

const POPULAR_AMENITIES = [
  "wifi",
  "power_outlets",
  "monitor",
  "coffee",
  "kitchen",
  "parking",
  "24_7_access",
  "standing_desk",
  "quiet_zone",
  "phone_booth",
];

export const WorkspaceFilters = ({
  selectedTypes,
  onTypesChange,
  selectedAmenities,
  onAmenitiesChange,
  capacity,
  onCapacityChange,
  priceRange,
  onPriceRangeChange,
  onReset,
}: WorkspaceFiltersProps) => {
  const handleTypeToggle = (type: WorkspaceType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      onAmenitiesChange(selectedAmenities.filter((a) => a !== amenity));
    } else {
      onAmenitiesChange([...selectedAmenities, amenity]);
    }
  };

  const hasFilters =
    selectedTypes.length > 0 ||
    selectedAmenities.length > 0 ||
    capacity > 1 ||
    priceRange[0] > 0 ||
    priceRange[1] < 1000;

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={onReset} className="h-8 px-2">
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Workspace Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Workspace Type</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {WORKSPACE_TYPES.map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${value}`}
                  checked={selectedTypes.includes(value)}
                  onCheckedChange={() => handleTypeToggle(value)}
                />
                <Label htmlFor={`type-${value}`} className="text-sm font-normal cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Capacity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Minimum Capacity</Label>
            <span className="text-sm text-muted-foreground">{capacity}+ people</span>
          </div>
          <Slider
            value={[capacity]}
            onValueChange={([value]) => onCapacityChange(value)}
            min={1}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Price Range */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Price Range (per hour)</Label>
            <span className="text-sm text-muted-foreground">
              ${priceRange[0]} - ${priceRange[1]}+
            </span>
          </div>
          <Slider
            value={priceRange}
            onValueChange={(value) => onPriceRangeChange(value as [number, number])}
            min={0}
            max={1000}
            step={10}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Amenities */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Amenities</Label>
          <div className="grid grid-cols-2 gap-2">
            {POPULAR_AMENITIES.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity}`}
                  checked={selectedAmenities.includes(amenity)}
                  onCheckedChange={() => handleAmenityToggle(amenity)}
                />
                <Label
                  htmlFor={`amenity-${amenity}`}
                  className="text-xs font-normal cursor-pointer capitalize"
                >
                  {amenity.replace(/_/g, " ")}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkspaceFilters;
