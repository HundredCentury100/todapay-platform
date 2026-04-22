import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Car, Camera, Loader2, CheckCircle, AlertCircle, Upload, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { VEHICLE_TYPES } from "@/types/ride";

interface VehicleData {
  make: string;
  model: string;
  year: string;
  color: string;
  license_plate: string;
  vehicle_type: string;
  photo_url: string | null;
}

const DriverVehiclePage = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vehicle, setVehicle] = useState<VehicleData>({
    make: "",
    model: "",
    year: "",
    color: "",
    license_plate: "",
    vehicle_type: "sedan",
    photo_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [verified, setVerified] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<VehicleData | null>(null);

  useEffect(() => {
    if (user) loadVehicle();
  }, [user]);

  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(vehicle) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [vehicle, originalData]);

  const loadVehicle = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("vehicle_make, vehicle_model, vehicle_year, vehicle_color, license_plate, vehicle_type, vehicle_photo_url, status")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        const vehicleData: VehicleData = {
          make: data.vehicle_make || "",
          model: data.vehicle_model || "",
          year: data.vehicle_year?.toString() || "",
          color: data.vehicle_color || "",
          license_plate: data.license_plate || "",
          vehicle_type: data.vehicle_type || "sedan",
          photo_url: (data as any).vehicle_photo_url || null,
        };
        setVehicle(vehicleData);
        setOriginalData(vehicleData);
        setVerified(data.status === "active");
      }
    } catch (error) {
      console.error("Error loading vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/vehicle.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: signedData, error: signedError } = await supabase.storage
        .from('driver-documents')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (signedError) throw signedError;

      setVehicle(prev => ({ ...prev, photo_url: signedData.signedUrl }));

      // Also save immediately
      await supabase
        .from('drivers')
        .update({ vehicle_photo_url: signedData.signedUrl, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      toast.success('Vehicle photo uploaded');
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("drivers")
        .update({
          vehicle_make: vehicle.make,
          vehicle_model: vehicle.model,
          vehicle_year: vehicle.year ? parseInt(vehicle.year) : null,
          vehicle_color: vehicle.color,
          license_plate: vehicle.license_plate,
          vehicle_type: vehicle.vehicle_type,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
      setOriginalData({ ...vehicle });
      setHasChanges(false);
      toast.success("Vehicle information updated");
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error("Failed to save vehicle information");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vehicle Information</h1>
          <p className="text-sm text-muted-foreground">Manage your vehicle details</p>
        </div>
        <Badge variant={verified ? "default" : "secondary"}>
          {verified ? (
            <><CheckCircle className="h-3 w-3 mr-1" /> Verified</>
          ) : (
            <><AlertCircle className="h-3 w-3 mr-1" /> Pending</>
          )}
        </Badge>
      </div>

      {/* Vehicle Photo */}
      <Card>
        <CardContent className="pt-6">
          <Label className="mb-3 block">Vehicle Photo</Label>
          {vehicle.photo_url ? (
            <div className="relative rounded-xl overflow-hidden border">
              <img src={vehicle.photo_url} alt="Vehicle" className="w-full h-48 object-cover" />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingPhoto ? (
                <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Tap to upload a photo of your vehicle
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
                </>
              )}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-5 w-5" />
            Vehicle Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vehicle Type */}
          <div className="space-y-2">
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select
              value={vehicle.vehicle_type}
              onValueChange={(v) => setVehicle(prev => ({ ...prev, vehicle_type: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((vt) => (
                  <SelectItem key={vt.id} value={vt.id}>
                    {vt.name} — {vt.capacity} seats
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={vehicle.make}
                onChange={(e) => setVehicle(prev => ({ ...prev, make: e.target.value }))}
                placeholder="Toyota"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={vehicle.model}
                onChange={(e) => setVehicle(prev => ({ ...prev, model: e.target.value }))}
                placeholder="Corolla"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={vehicle.year}
                onChange={(e) => setVehicle(prev => ({ ...prev, year: e.target.value }))}
                placeholder="2020"
                min="1990"
                max={new Date().getFullYear() + 1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={vehicle.color}
                onChange={(e) => setVehicle(prev => ({ ...prev, color: e.target.value }))}
                placeholder="White"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_plate">License Plate</Label>
            <Input
              id="license_plate"
              value={vehicle.license_plate}
              onChange={(e) => setVehicle(prev => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
              placeholder="ABC 1234"
              className="font-mono uppercase"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              "Save Vehicle Info"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverVehiclePage;
