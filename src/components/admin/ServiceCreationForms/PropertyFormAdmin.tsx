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

interface PropertyFormAdminProps {
  merchantId: string;
  onSuccess: () => void;
  onCancel: () => void;
  actorType?: "admin" | "agent";
}

const PROPERTY_TYPES = ["hotel", "lodge", "guest_house", "resort", "apartment", "villa", "hostel", "bnb", "other"];

const PropertyFormAdmin = ({ merchantId, onSuccess, onCancel, actorType = "admin" }: PropertyFormAdminProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "", description: "", property_type: "", address: "", city: "", country: "Zimbabwe",
    star_rating: "", amenities: "", check_in_time: "14:00", check_out_time: "10:00", image_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: property, error } = await supabase.from("properties").insert({
        merchant_profile_id: merchantId, name: formData.name, description: formData.description || null,
        property_type: formData.property_type, address: formData.address, city: formData.city, country: formData.country,
        star_rating: formData.star_rating ? parseInt(formData.star_rating) : null,
        amenities: formData.amenities ? formData.amenities.split(",").map(s => s.trim()) : null,
        check_in_time: formData.check_in_time, check_out_time: formData.check_out_time,
        image_url: formData.image_url || images[0] || null,
        images: images.length ? images : null,
        created_by_admin_id: user?.id,
      } as any).select().single();
      if (error) throw error;

      await supabase.from("admin_service_actions").insert({
        admin_id: user?.id, merchant_profile_id: merchantId,
        service_type: "property", service_id: property.id, action_type: "create",
        action_reason: `Created via ${actorType} service management`, new_data: property,
      });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create property", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const update = (field: string, value: string) => setFormData(p => ({ ...p, [field]: value }));

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
          <CardTitle className="text-base">Create Property</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2"><Label>Property Name *</Label><Input placeholder="e.g., Meikles Hotel" value={formData.name} onChange={e => update("name", e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Property Type *</Label>
              <Select value={formData.property_type} onValueChange={v => update("property_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Star Rating</Label><Select value={formData.star_rating} onValueChange={v => update("star_rating", v)}><SelectTrigger><SelectValue placeholder="Rating" /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(r => <SelectItem key={r} value={String(r)}>{r} Star{r > 1 ? "s" : ""}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>City *</Label><Input placeholder="e.g., Victoria Falls" value={formData.city} onChange={e => update("city", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Country</Label><Input value={formData.country} onChange={e => update("country", e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Address *</Label><Input placeholder="Full address" value={formData.address} onChange={e => update("address", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Check-in Time</Label><Input type="time" value={formData.check_in_time} onChange={e => update("check_in_time", e.target.value)} /></div>
            <div className="space-y-2"><Label>Check-out Time</Label><Input type="time" value={formData.check_out_time} onChange={e => update("check_out_time", e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Amenities (comma-separated)</Label><Input placeholder="e.g., Pool, WiFi, Gym, Restaurant" value={formData.amenities} onChange={e => update("amenities", e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2">
              <ServiceImageUpload label="Property Images" value={formData.image_url} onChange={url => update("image_url", url)} folder="properties" multiple values={images} onMultiChange={setImages} />
            </div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe the property..." value={formData.description} onChange={e => update("description", e.target.value)} rows={3} /></div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={loading || !formData.property_type}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Property</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PropertyFormAdmin;
