import { useState, useEffect } from "react";
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

interface Bus {
  id: string;
  operator: string;
  type: string;
  total_seats: number;
}

interface BusScheduleFormAdminProps {
  merchantId: string;
  onSuccess: () => void;
  onCancel: () => void;
  actorType?: "admin" | "agent";
}

const BusScheduleFormAdmin = ({ merchantId, onSuccess, onCancel, actorType = "admin" }: BusScheduleFormAdminProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loadingBuses, setLoadingBuses] = useState(true);
  const [formData, setFormData] = useState({
    bus_id: "", from_location: "", to_location: "", departure_time: "", arrival_time: "",
    available_date: "", base_price: "", duration: "", pickup_address: "", dropoff_address: "",
    stops: "", image_url: "",
  });

  useEffect(() => { loadMerchantBuses(); }, [merchantId]);

  const loadMerchantBuses = async () => {
    try {
      const { data: merchant } = await supabase.from("merchant_profiles").select("business_name").eq("id", merchantId).single();
      if (!merchant) return;
      const { data: busData, error } = await supabase.from("buses").select("id, operator, type, total_seats").ilike("operator", `%${merchant.business_name}%`);
      if (error) throw error;
      setBuses(busData || []);
    } catch (error) { console.error("Error loading buses:", error); }
    finally { setLoadingBuses(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: schedule, error } = await supabase.from("bus_schedules").insert({
        bus_id: formData.bus_id, from_location: formData.from_location, to_location: formData.to_location,
        departure_time: formData.departure_time, arrival_time: formData.arrival_time,
        available_date: formData.available_date, base_price: parseFloat(formData.base_price),
        duration: formData.duration, pickup_address: formData.pickup_address || null,
        dropoff_address: formData.dropoff_address || null,
        stops: formData.stops ? formData.stops.split(",").map(s => s.trim()) : null,
        created_by_admin_id: user?.id,
      }).select().single();
      if (error) throw error;

      await supabase.from("admin_service_actions").insert({
        admin_id: user?.id, merchant_profile_id: merchantId, service_type: "bus_schedule",
        service_id: schedule.id, action_type: "create",
        action_reason: "Created via admin service management", new_data: schedule,
      });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create bus schedule", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const update = (field: string, value: string) => setFormData(p => ({ ...p, [field]: value }));

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
          <CardTitle className="text-base">Create Bus Schedule</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bus *</Label>
              <Select value={formData.bus_id} onValueChange={v => update("bus_id", v)}>
                <SelectTrigger><SelectValue placeholder={loadingBuses ? "Loading..." : "Select a bus"} /></SelectTrigger>
                <SelectContent>{buses.map(bus => <SelectItem key={bus.id} value={bus.id}>{bus.operator} - {bus.type} ({bus.total_seats} seats)</SelectItem>)}</SelectContent>
              </Select>
              {buses.length === 0 && !loadingBuses && <p className="text-xs text-muted-foreground">No buses found for this merchant.</p>}
            </div>
            <div className="space-y-2"><Label>Travel Date *</Label><Input type="date" value={formData.available_date} onChange={e => update("available_date", e.target.value)} required /></div>
            <div className="space-y-2"><Label>From Location *</Label><Input placeholder="e.g., Harare" value={formData.from_location} onChange={e => update("from_location", e.target.value)} required /></div>
            <div className="space-y-2"><Label>To Location *</Label><Input placeholder="e.g., Bulawayo" value={formData.to_location} onChange={e => update("to_location", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Departure Time *</Label><Input type="time" value={formData.departure_time} onChange={e => update("departure_time", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Arrival Time *</Label><Input type="time" value={formData.arrival_time} onChange={e => update("arrival_time", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Duration *</Label><Input placeholder="e.g., 5h 30m" value={formData.duration} onChange={e => update("duration", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Base Price (USD) *</Label><Input type="number" step="0.01" placeholder="e.g., 25.00" value={formData.base_price} onChange={e => update("base_price", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Pickup Address</Label><Input placeholder="Full pickup address" value={formData.pickup_address} onChange={e => update("pickup_address", e.target.value)} /></div>
            <div className="space-y-2"><Label>Dropoff Address</Label><Input placeholder="Full dropoff address" value={formData.dropoff_address} onChange={e => update("dropoff_address", e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2">
              <ServiceImageUpload label="Route Image" value={formData.image_url} onChange={url => update("image_url", url)} folder="bus-schedules" />
            </div>
          </div>
          <div className="space-y-2"><Label>Stops (comma-separated)</Label><Textarea placeholder="e.g., Kwekwe, Gweru, Shangani" value={formData.stops} onChange={e => update("stops", e.target.value)} /></div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={loading || !formData.bus_id}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Schedule</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BusScheduleFormAdmin;
