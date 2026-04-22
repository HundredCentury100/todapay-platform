import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, Percent, Save } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const VenuePricingPage = () => {
  const { user } = useAuth();
  const { convertPrice } = useCurrency();

  const { data: venues, isLoading } = useQuery({
    queryKey: ['venue-pricing', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: profile } = await supabase.from('merchant_profiles').select('id').eq('user_id', user.id).single();
      if (!profile) return [];
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, hourly_rate, half_day_rate, full_day_rate, min_hours, status')
        .eq('merchant_profile_id', profile.id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleSave = async (id: string, field: string, value: number) => {
    try {
      const { error } = await supabase.from('venues').update({ [field]: value }).eq('id', id);
      if (error) throw error;
      toast.success('Price updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Venue Pricing</h1>
        <p className="text-muted-foreground">Manage rates across all your venues</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Rate Matrix</CardTitle>
          <CardDescription>Edit rates inline</CardDescription>
        </CardHeader>
        <CardContent>
          {!venues || venues.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No venues found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Venue</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">Hourly</th>
                    <th className="text-left py-3 px-2 font-medium">Half Day</th>
                    <th className="text-left py-3 px-2 font-medium">Full Day</th>
                    <th className="text-left py-3 px-2 font-medium">Min Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {venues.map(v => (
                    <tr key={v.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{v.name}</td>
                      <td className="py-3 px-2"><Badge variant={v.status === 'active' ? 'default' : 'secondary'}>{v.status}</Badge></td>
                      <td className="py-3 px-2"><Input type="number" defaultValue={v.hourly_rate || ''} placeholder="—" className="w-24 h-8" onBlur={(e) => e.target.value && handleSave(v.id, 'hourly_rate', Number(e.target.value))} /></td>
                      <td className="py-3 px-2"><Input type="number" defaultValue={v.half_day_rate || ''} placeholder="—" className="w-24 h-8" onBlur={(e) => e.target.value && handleSave(v.id, 'half_day_rate', Number(e.target.value))} /></td>
                      <td className="py-3 px-2"><Input type="number" defaultValue={v.full_day_rate || ''} placeholder="—" className="w-24 h-8" onBlur={(e) => e.target.value && handleSave(v.id, 'full_day_rate', Number(e.target.value))} /></td>
                      <td className="py-3 px-2"><Input type="number" defaultValue={v.min_hours} className="w-20 h-8" onBlur={(e) => handleSave(v.id, 'min_hours', Number(e.target.value))} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5" /> Seasonal & Peak Pricing</CardTitle>
          <CardDescription>Surcharges for high-demand periods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Weekend Surcharge", desc: "Fri-Sun bookings", value: 20 },
            { label: "Holiday Surcharge", desc: "Public holidays", value: 30 },
            { label: "Long-term Discount", desc: "3+ consecutive days", value: -15 },
          ].map(rule => (
            <div key={rule.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">{rule.label}</p>
                <p className="text-xs text-muted-foreground">{rule.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" defaultValue={Math.abs(rule.value)} className="w-20 h-8" />
                <span className="text-sm text-muted-foreground">{rule.value > 0 ? "% surcharge" : "% off"}</span>
              </div>
            </div>
          ))}
          <Button className="mt-2 gap-2"><Save className="h-4 w-4" /> Save Rules</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VenuePricingPage;
