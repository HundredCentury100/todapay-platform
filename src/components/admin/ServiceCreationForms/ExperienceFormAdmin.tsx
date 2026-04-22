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

interface ExperienceFormAdminProps {
  merchantId: string;
  onSuccess: () => void;
  onCancel: () => void;
  actorType?: "admin" | "agent";
}

const EXPERIENCE_TYPES = ["safari", "tour", "adventure", "cultural", "culinary", "wellness", "workshop", "nightlife", "water_sports", "other"];

const ExperienceFormAdmin = ({ merchantId, onSuccess, onCancel, actorType = "admin" }: ExperienceFormAdminProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "", description: "", experience_type: "", duration_hours: "", price_per_person: "",
    max_participants: "", location: "", city: "", country: "Zimbabwe", what_included: "", image_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: experience, error } = await supabase.from("experiences").insert({
        merchant_profile_id: merchantId, name: formData.name, description: formData.description || null,
        experience_type: formData.experience_type,
        duration_hours: parseFloat(formData.duration_hours),
        price_per_person: parseFloat(formData.price_per_person),
        max_participants: parseInt(formData.max_participants) || 10,
        location: formData.location, city: formData.city, country: formData.country,
        what_included: formData.what_included ? formData.what_included.split(",").map(s => s.trim()) : null,
        image_url: formData.image_url || images[0] || null,
        images: images.length ? images : null,
        created_by_admin_id: user?.id,
      } as any).select().single();
      if (error) throw error;

      await supabase.from("admin_service_actions").insert({
        admin_id: user?.id, merchant_profile_id: merchantId,
        service_type: "experience", service_id: experience.id, action_type: "create",
        action_reason: `Created via ${actorType} service management`, new_data: experience,
      });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create experience", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const update = (field: string, value: string) => setFormData(p => ({ ...p, [field]: value }));

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
          <CardTitle className="text-base">Create Experience</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2"><Label>Experience Name *</Label><Input placeholder="e.g., Victoria Falls Sunset Cruise" value={formData.name} onChange={e => update("name", e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={formData.experience_type} onValueChange={v => update("experience_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{EXPERIENCE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Duration (hours) *</Label><Input type="number" step="0.5" placeholder="e.g., 3" value={formData.duration_hours} onChange={e => update("duration_hours", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Price Per Person (USD) *</Label><Input type="number" step="0.01" placeholder="e.g., 45.00" value={formData.price_per_person} onChange={e => update("price_per_person", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Max Participants</Label><Input type="number" placeholder="e.g., 20" value={formData.max_participants} onChange={e => update("max_participants", e.target.value)} /></div>
            <div className="space-y-2"><Label>Location *</Label><Input placeholder="e.g., Zambezi River" value={formData.location} onChange={e => update("location", e.target.value)} required /></div>
            <div className="space-y-2"><Label>City *</Label><Input placeholder="e.g., Victoria Falls" value={formData.city} onChange={e => update("city", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Country</Label><Input value={formData.country} onChange={e => update("country", e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>What's Included (comma-separated)</Label><Input placeholder="e.g., Drinks, Snacks, Guide, Transport" value={formData.what_included} onChange={e => update("what_included", e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2">
              <ServiceImageUpload label="Experience Images" value={formData.image_url} onChange={url => update("image_url", url)} folder="experiences" multiple values={images} onMultiChange={setImages} />
            </div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe the experience..." value={formData.description} onChange={e => update("description", e.target.value)} rows={3} /></div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={loading || !formData.experience_type}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Experience</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExperienceFormAdmin;
