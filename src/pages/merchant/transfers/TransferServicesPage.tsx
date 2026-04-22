import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CarTaxiFront, Trash2, Edit2 } from "lucide-react";
import { PremiumPageHeader, PremiumSection, PremiumEmptyState } from "@/components/premium";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { SERVICE_TYPES, VEHICLE_CATEGORIES, type VehicleCategory } from "@/types/transfer";
import { toast } from "sonner";

const TransferServicesPage = () => {
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state for zone pricing
  const [fromZone, setFromZone] = useState("");
  const [toZone, setToZone] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>({});

  // Fetch zone pricing routes
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["transfer-zone-pricing", merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];
      const { data, error } = await supabase
        .from("transfer_zone_pricing")
        .select("*")
        .eq("merchant_profile_id", merchantProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  // Add route mutation
  const addRoute = useMutation({
    mutationFn: async () => {
      if (!merchantProfile?.id || !fromZone || !toZone) throw new Error("Missing fields");
      const priceData: any = { merchant_profile_id: merchantProfile.id, from_zone_name: fromZone, to_zone_name: toZone };
      VEHICLE_CATEGORIES.forEach((cat) => {
        const key = `${cat.id}_price`;
        if (prices[cat.id]) priceData[key] = parseFloat(prices[cat.id]);
      });
      const { error } = await supabase.from("transfer_zone_pricing").insert(priceData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Route added");
      queryClient.invalidateQueries({ queryKey: ["transfer-zone-pricing"] });
      setDialogOpen(false);
      setFromZone("");
      setToZone("");
      setPrices({});
    },
    onError: (e: any) => toast.error(e.message || "Failed to add route"),
  });

  // Toggle active mutation
  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("transfer_zone_pricing")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transfer-zone-pricing"] }),
  });

  // Delete route mutation
  const deleteRoute = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transfer_zone_pricing").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Route deleted");
      queryClient.invalidateQueries({ queryKey: ["transfer-zone-pricing"] });
    },
  });

  const getPriceColumns = (route: any): { category: string; price: number }[] => {
    return VEHICLE_CATEGORIES
      .map((cat) => ({ category: cat.name, price: route[`${cat.id}_price`] }))
      .filter((p) => p.price != null && p.price > 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <PremiumPageHeader
        title="Transfer Services"
        subtitle="Manage your transfer routes and zone pricing"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />Add Route</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Zone Pricing Route</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>From Zone</Label>
                  <Input placeholder="e.g. Airport, City Center" value={fromZone} onChange={(e) => setFromZone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>To Zone</Label>
                  <Input placeholder="e.g. Suburbs, Hotel District" value={toZone} onChange={(e) => setToZone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Prices by Vehicle Category</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {VEHICLE_CATEGORIES.slice(0, 6).map((cat) => (
                      <div key={cat.id} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{cat.name}</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={prices[cat.id] || ""}
                          onChange={(e) => setPrices({ ...prices, [cat.id]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={() => addRoute.mutate()} disabled={!fromZone || !toZone}>
                  Add Route
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <PremiumSection delay={0.1}>
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : routes.length === 0 ? (
          <PremiumEmptyState
            icon={CarTaxiFront}
            title="No Routes Yet"
            description="Add zone pricing routes to set fixed prices for common transfer routes"
            action={
              <Button className="gap-2" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />Add Your First Route
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {routes.map((route: any) => {
              const priceCols = getPriceColumns(route);
              return (
                <Card key={route.id} className="rounded-2xl border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{route.from_zone_name} → {route.to_zone_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={route.is_active}
                          onCheckedChange={(checked) => toggleActive.mutate({ id: route.id, isActive: checked })}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteRoute.mutate(route.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {priceCols.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {priceCols.map((p) => (
                          <Badge key={p.category} variant="outline" className="text-xs">
                            {p.category}: {convertPrice(p.price)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {!route.is_active && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PremiumSection>
    </div>
  );
};

export default TransferServicesPage;
