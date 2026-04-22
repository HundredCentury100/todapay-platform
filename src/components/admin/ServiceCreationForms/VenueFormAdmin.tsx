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

interface VenueFormAdminProps {
  merchantId: string;
  onSuccess: () => void;
  onCancel: () => void;
  actorType?: "admin" | "agent";
}

const VENUE_TYPES = ["conference_hall", "banquet_hall", "outdoor_venue", "stadium", "theater", "church", "garden", "rooftop", "other"];

const VenueFormAdmin = ({ merchantId, onSuccess, onCancel, actorType = "admin" }: VenueFormAdminProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "", description: "", venue_type: "", address: "", city: "", country: "Zimbabwe",
    capacity_standing: "", hourly_rate: "", full_day_rate: "", amenities: "", image_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: venue, error } = await supabase.from("venues").insert({
        merchant_profile_id: merchantId, name: formData.name, description: formData.description || null,
        venue_type: formData.venue_type, address: formData.address, city: formData.city, country: formData.country,
        capacity_standing: formData.capacity_standing ? parseInt(formData.capacity_standing) : null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        full_day_rate: formData.full_day_rate ? parseFloat(formData.full_day_rate) : null,
        amenities: formData.amenities ? formData.amenities.split(",").map(s => s.trim()) : null,
        image_url: formData.image_url || images[0] || null,
        images: images.length ? images : null,
        created_by_admin_id: user?.id,
      } as any).select().single();
      if (error) throw error;

      await supabase.from("admin_service_actions").insert({
        admin_id: user?.id, merchant_profile_id: merchantId,
        service_type: "venue", service_id: venue.id, action_type: "create",
        action_reason: `Created via ${actorType} service management`, new_data: venue,
      });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create venue", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const update = (field: string, value: string) => setFormData(p => ({ ...p, [field]: value }));

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
          <CardTitle className="text-base">Create Venue</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2"><Label>Venue Name *</Label><Input placeholder="e.g., Rainbow Towers" value={formData.name} onChange={e => update("name", e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Venue Type *</Label>
              <Select value={formData.venue_type} onValueChange={v => update("venue_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{VENUE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>City *</Label><Input placeholder="e.g., Harare" value={formData.city} onChange={e => update("city", e.target.value)} required /></div>
            <div className="space-y-2 md:col-span-2"><Label>Address *</Label><Input placeholder="Full address" value={formData.address} onChange={e => update("address", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Country</Label><Input value={formData.country} onChange={e => update("country", e.target.value)} /></div>
            <div className="space-y-2"><Label>Standing Capacity</Label><Input type="number" placeholder="e.g., 500" value={formData.capacity_standing} onChange={e => update("capacity_standing", e.target.value)} /></div>
            <div className="space-y-2"><Label>Hourly Rate (USD)</Label><Input type="number" step="0.01" placeholder="e.g., 100.00" value={formData.hourly_rate} onChange={e => update("hourly_rate", e.target.value)} /></div>
            <div className="space-y-2"><Label>Full Day Rate (USD)</Label><Input type="number" step="0.01" placeholder="e.g., 800.00" value={formData.full_day_rate} onChange={e => update("full_day_rate", e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Amenities (comma-separated)</Label><Input placeholder="e.g., WiFi, Parking, Catering" value={formData.amenities} onChange={e => update("amenities", e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2">
              <ServiceImageUpload label="Venue Images" value={formData.image_url} onChange={url => update("image_url", url)} folder="venues" multiple values={images} onMultiChange={setImages} />
            </div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe the venue..." value={formData.description} onChange={e => update("description", e.target.value)} rows={3} /></div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={loading || !formData.venue_type}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Venue</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VenueFormAdmin;
