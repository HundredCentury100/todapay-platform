import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Car, Edit2, Check, X } from "lucide-react";
import { DriverProfile } from "@/hooks/useDriverProfile";

interface VehicleInfoCardProps {
  driver: DriverProfile;
  onUpdate?: (vehicleData: {
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_color?: string;
    license_plate?: string;
  }) => void;
  isUpdating?: boolean;
}

export function VehicleInfoCard({ driver, onUpdate, isUpdating }: VehicleInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_make: driver.vehicle_make,
    vehicle_model: driver.vehicle_model,
    vehicle_year: driver.vehicle_year,
    vehicle_color: driver.vehicle_color,
    license_plate: driver.license_plate,
  });

  const handleSave = () => {
    onUpdate?.(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      vehicle_make: driver.vehicle_make,
      vehicle_model: driver.vehicle_model,
      vehicle_year: driver.vehicle_year,
      vehicle_color: driver.vehicle_color,
      license_plate: driver.license_plate,
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-4 w-4" />
            Vehicle Information
          </CardTitle>
          {onUpdate && !isEditing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Make</Label>
                <Input
                  value={formData.vehicle_make}
                  onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                  placeholder="Toyota"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Model</Label>
                <Input
                  value={formData.vehicle_model}
                  onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                  placeholder="Corolla"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Year</Label>
                <Input
                  type="number"
                  value={formData.vehicle_year}
                  onChange={(e) => setFormData({ ...formData, vehicle_year: parseInt(e.target.value) })}
                  placeholder="2020"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Color</Label>
                <Input
                  value={formData.vehicle_color}
                  onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                  placeholder="White"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">License Plate</Label>
              <Input
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                placeholder="GP 123 ABC"
                className="font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isUpdating}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {driver.vehicle_year} {driver.vehicle_make} {driver.vehicle_model}
                </p>
                <p className="text-sm text-muted-foreground">{driver.vehicle_color}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm text-muted-foreground">License Plate</span>
              <Badge variant="outline" className="font-mono">
                {driver.license_plate}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm text-muted-foreground">Vehicle Type</span>
              <Badge className="capitalize">{driver.vehicle_type}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
