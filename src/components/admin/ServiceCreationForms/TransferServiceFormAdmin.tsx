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

interface TransferServiceFormAdminProps {
  merchantId: string;
  onSuccess: () => void;
  onCancel: () => void;
  actorType?: "admin" | "agent";
}

const SERVICE_TYPES = ["airport_pickup", "airport_dropoff", "hotel_transfer", "city_transfer", "intercity", "charter", "corporate"];
const VEHICLE_CATEGORIES = ["sedan", "suv", "van", "minibus", "luxury", "bus"];

const TransferServiceFormAdmin = ({ merchantId, onSuccess, onCancel, actorType = "admin" }: TransferServiceFormAdminProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "", description: "", service_type: "", vehicle_type: "", max_passengers: "4",
    base_price: "", price_per_km: "", city: "", coverage_area: "", image_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: service, error } = await supabase.from("transfer_services").insert({
        merchant_profile_id: merchantId, name: formData.name, description: formData.description || null,
        service_type: formData.service_type, vehicle_type: formData.vehicle_type,
        max_passengers: parseInt(formData.max_passengers),
        base_price: parseFloat(formData.base_price),
        price_per_km: formData.price_per_km ? parseFloat(formData.price_per_km) : null,
        city: formData.city, coverage_area: formData.coverage_area || null,
        image_url: formData.image_url || null,
        created_by_admin_id: user?.id, is_active: true,
      } as any).select().single();
      if (error) throw error;

      await supabase.from("admin_service_actions").insert({
        admin_id: user?.id, merchant_profile_id: merchantId,
        service_type: "transfer_service", service_id: service.id, action_type: "create",
        action_reason: `Created via ${actorType} service management`, new_data: service,
      });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create transfer service", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const update = (field: string, value: string) => setFormData(p => ({ ...p, [field]: value }));

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
          <CardTitle className="text-base">Create Transfer Service</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2"><Label>Service Name *</Label><Input placeholder="e.g., Airport Shuttle Harare" value={formData.name} onChange={e => update("name", e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Select value={formData.service_type} onValueChange={v => update("service_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{SERVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Category *</Label>
              <Select value={formData.vehicle_type} onValueChange={v => update("vehicle_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>{VEHICLE_CATEGORIES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Max Passengers</Label><Input type="number" value={formData.max_passengers} onChange={e => update("max_passengers", e.target.value)} /></div>
            <div className="space-y-2"><Label>Base Price (USD) *</Label><Input type="number" step="0.01" placeholder="e.g., 30.00" value={formData.base_price} onChange={e => update("base_price", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Price Per KM (USD)</Label><Input type="number" step="0.01" placeholder="e.g., 1.50" value={formData.price_per_km} onChange={e => update("price_per_km", e.target.value)} /></div>
            <div className="space-y-2"><Label>City *</Label><Input placeholder="e.g., Harare" value={formData.city} onChange={e => update("city", e.target.value)} required /></div>
            <div className="space-y-2 md:col-span-2"><Label>Coverage Area</Label><Input placeholder="e.g., Greater Harare, Airport to CBD" value={formData.coverage_area} onChange={e => update("coverage_area", e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2">
              <ServiceImageUpload label="Service Image" value={formData.image_url} onChange={url => update("image_url", url)} folder="transfers" />
            </div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe the transfer service..." value={formData.description} onChange={e => update("description", e.target.value)} rows={3} /></div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={loading || !formData.service_type || !formData.vehicle_type}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Transfer Service</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransferServiceFormAdmin;
