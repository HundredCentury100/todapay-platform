import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import ServiceImageUpload from "@/components/admin/ServiceImageUpload";

interface VehicleFormAdminProps {
  merchantId: string;
  onSuccess: () => void;
  onCancel: () => void;
  actorType?: "admin" | "agent";
}

const VEHICLE_TYPES = ["sedan", "suv", "hatchback", "pickup", "van", "minibus", "luxury", "sports", "convertible", "other"];
const TRANSMISSIONS = ["automatic", "manual"];
const FUEL_TYPES = ["petrol", "diesel", "electric", "hybrid"];

const VehicleFormAdmin = ({ merchantId, onSuccess, onCancel, actorType = "admin" }: VehicleFormAdminProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "", description: "", make: "", model: "", year: "", vehicle_type: "", seats: "5", doors: "4",
    transmission: "automatic", fuel_type: "petrol", daily_rate: "", features: "", image_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: vehicle, error } = await supabase.from("vehicles").insert({
        merchant_profile_id: merchantId, name: formData.name, make: formData.make, model: formData.model,
        year: formData.year ? parseInt(formData.year) : null,
        vehicle_type: formData.vehicle_type, seats: parseInt(formData.seats), doors: parseInt(formData.doors),
        transmission: formData.transmission, fuel_type: formData.fuel_type,
        daily_rate: parseFloat(formData.daily_rate),
        features: formData.features ? formData.features.split(",").map(s => s.trim()) : null,
        image_url: formData.image_url || images[0] || null,
        images: images.length ? images : null,
        created_by_admin_id: user?.id,
      } as any).select().single();
      if (error) throw error;

      await supabase.from("admin_service_actions").insert({
        admin_id: user?.id, merchant_profile_id: merchantId,
        service_type: "vehicle", service_id: vehicle.id, action_type: "create",
        action_reason: `Created via ${actorType} service management`, new_data: vehicle,
      });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create vehicle", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const update = (field: string, value: string) => setFormData(p => ({ ...p, [field]: value }));

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
          <CardTitle className="text-base">Create Vehicle</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2"><Label>Vehicle Name *</Label><Input placeholder="e.g., Toyota Hilux 2024" value={formData.name} onChange={e => update("name", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Make *</Label><Input placeholder="e.g., Toyota" value={formData.make} onChange={e => update("make", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Model *</Label><Input placeholder="e.g., Hilux" value={formData.model} onChange={e => update("model", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Year</Label><Input type="number" placeholder="e.g., 2024" value={formData.year} onChange={e => update("year", e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Vehicle Type *</Label>
              <Select value={formData.vehicle_type} onValueChange={v => update("vehicle_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{VEHICLE_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Seats</Label><Input type="number" value={formData.seats} onChange={e => update("seats", e.target.value)} /></div>
            <div className="space-y-2"><Label>Doors</Label><Input type="number" value={formData.doors} onChange={e => update("doors", e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Transmission</Label>
              <Select value={formData.transmission} onValueChange={v => update("transmission", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRANSMISSIONS.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fuel Type</Label>
              <Select value={formData.fuel_type} onValueChange={v => update("fuel_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FUEL_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Daily Rate (USD) *</Label><Input type="number" step="0.01" placeholder="e.g., 75.00" value={formData.daily_rate} onChange={e => update("daily_rate", e.target.value)} required /></div>
            <div className="space-y-2 md:col-span-2"><Label>Features (comma-separated)</Label><Input placeholder="e.g., GPS, AC, Bluetooth, Roof Rack" value={formData.features} onChange={e => update("features", e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2">
              <ServiceImageUpload label="Vehicle Images" value={formData.image_url} onChange={url => update("image_url", url)} folder="vehicles" multiple values={images} onMultiChange={setImages} />
            </div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe the vehicle, condition, special features..." value={formData.description} onChange={e => update("description", e.target.value)} rows={3} /></div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={loading || !formData.vehicle_type}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Vehicle</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VehicleFormAdmin;
