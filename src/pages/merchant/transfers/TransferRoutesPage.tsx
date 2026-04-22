import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, MapPin, Edit, Trash2, DollarSign, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { VEHICLE_CATEGORIES, TransferZoneType } from "@/types/transfer";

interface ZonePricing {
  id: string;
  from_zone_name: string;
  from_zone_type: TransferZoneType | null;
  to_zone_name: string;
  to_zone_type: TransferZoneType | null;
  economy_sedan_price: number | null;
  sedan_price: number | null;
  suv_price: number | null;
  van_price: number | null;
  minibus_price: number | null;
  luxury_sedan_price: number | null;
  luxury_suv_price: number | null;
  limousine_price: number | null;
  coach_price: number | null;
  currency: string;
  is_active: boolean;
}

const ZONE_TYPES: { id: TransferZoneType; name: string }[] = [
  { id: 'airport', name: 'Airport' },
  { id: 'city_center', name: 'City Center' },
  { id: 'suburb', name: 'Suburb' },
  { id: 'hotel', name: 'Hotel/Resort' },
  { id: 'station', name: 'Train/Bus Station' },
  { id: 'region', name: 'Region' }
];

const TransferRoutesPage = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<ZonePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<ZonePricing | null>(null);

  const [formData, setFormData] = useState({
    from_zone_name: '',
    from_zone_type: 'airport' as TransferZoneType,
    to_zone_name: '',
    to_zone_type: 'city_center' as TransferZoneType,
    economy_sedan_price: '',
    sedan_price: '',
    suv_price: '',
    van_price: '',
    minibus_price: '',
    luxury_sedan_price: '',
    luxury_suv_price: '',
    limousine_price: '',
    coach_price: '',
    currency: 'ZAR',
    is_active: true
  });

  useEffect(() => {
    fetchRoutes();
  }, [user]);

  const fetchRoutes = async () => {
    if (!user) return;

    const { data: merchantProfile } = await supabase
      .from('merchant_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchantProfile) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('transfer_zone_pricing')
      .select('*')
      .eq('merchant_profile_id', merchantProfile.id)
      .order('from_zone_name', { ascending: true });

    if (error) {
      toast.error("Failed to load routes");
      console.error(error);
    } else {
      setRoutes(data as ZonePricing[]);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;

    const { data: merchantProfile } = await supabase
      .from('merchant_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchantProfile) {
      toast.error("Merchant profile not found");
      return;
    }

    const routeData = {
      merchant_profile_id: merchantProfile.id,
      from_zone_name: formData.from_zone_name,
      from_zone_type: formData.from_zone_type,
      to_zone_name: formData.to_zone_name,
      to_zone_type: formData.to_zone_type,
      economy_sedan_price: formData.economy_sedan_price ? parseFloat(formData.economy_sedan_price) : null,
      sedan_price: formData.sedan_price ? parseFloat(formData.sedan_price) : null,
      suv_price: formData.suv_price ? parseFloat(formData.suv_price) : null,
      van_price: formData.van_price ? parseFloat(formData.van_price) : null,
      minibus_price: formData.minibus_price ? parseFloat(formData.minibus_price) : null,
      luxury_sedan_price: formData.luxury_sedan_price ? parseFloat(formData.luxury_sedan_price) : null,
      luxury_suv_price: formData.luxury_suv_price ? parseFloat(formData.luxury_suv_price) : null,
      limousine_price: formData.limousine_price ? parseFloat(formData.limousine_price) : null,
      coach_price: formData.coach_price ? parseFloat(formData.coach_price) : null,
      currency: formData.currency,
      is_active: formData.is_active
    };

    let error;
    if (editingRoute) {
      ({ error } = await supabase
        .from('transfer_zone_pricing')
        .update(routeData)
        .eq('id', editingRoute.id));
    } else {
      ({ error } = await supabase
        .from('transfer_zone_pricing')
        .insert(routeData));
    }

    if (error) {
      toast.error("Failed to save route");
      console.error(error);
    } else {
      toast.success(editingRoute ? "Route updated" : "Route added");
      setDialogOpen(false);
      resetForm();
      fetchRoutes();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return;

    const { error } = await supabase
      .from('transfer_zone_pricing')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete route");
    } else {
      toast.success("Route deleted");
      fetchRoutes();
    }
  };

  const handleToggleActive = async (route: ZonePricing) => {
    const { error } = await supabase
      .from('transfer_zone_pricing')
      .update({ is_active: !route.is_active })
      .eq('id', route.id);

    if (error) {
      toast.error("Failed to update route");
    } else {
      fetchRoutes();
    }
  };

  const resetForm = () => {
    setFormData({
      from_zone_name: '',
      from_zone_type: 'airport',
      to_zone_name: '',
      to_zone_type: 'city_center',
      economy_sedan_price: '',
      sedan_price: '',
      suv_price: '',
      van_price: '',
      minibus_price: '',
      luxury_sedan_price: '',
      luxury_suv_price: '',
      limousine_price: '',
      coach_price: '',
      currency: 'ZAR',
      is_active: true
    });
    setEditingRoute(null);
  };

  const openEditDialog = (route: ZonePricing) => {
    setEditingRoute(route);
    setFormData({
      from_zone_name: route.from_zone_name,
      from_zone_type: route.from_zone_type || 'airport',
      to_zone_name: route.to_zone_name,
      to_zone_type: route.to_zone_type || 'city_center',
      economy_sedan_price: route.economy_sedan_price?.toString() || '',
      sedan_price: route.sedan_price?.toString() || '',
      suv_price: route.suv_price?.toString() || '',
      van_price: route.van_price?.toString() || '',
      minibus_price: route.minibus_price?.toString() || '',
      luxury_sedan_price: route.luxury_sedan_price?.toString() || '',
      luxury_suv_price: route.luxury_suv_price?.toString() || '',
      limousine_price: route.limousine_price?.toString() || '',
      coach_price: route.coach_price?.toString() || '',
      currency: route.currency || 'ZAR',
      is_active: route.is_active
    });
    setDialogOpen(true);
  };

  const getPriceRange = (route: ZonePricing) => {
    const prices = [
      route.economy_sedan_price,
      route.sedan_price,
      route.suv_price,
      route.van_price,
      route.luxury_sedan_price
    ].filter(p => p !== null) as number[];
    
    if (prices.length === 0) return 'No prices set';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `R${min}` : `R${min} - R${max}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Route Pricing</h1>
          <p className="text-muted-foreground">Set fixed prices for zone-to-zone transfers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Route
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRoute ? 'Edit Route' : 'Add Route'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* From Zone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Zone Name</Label>
                  <Input
                    placeholder="OR Tambo Airport"
                    value={formData.from_zone_name}
                    onChange={(e) => setFormData({ ...formData, from_zone_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zone Type</Label>
                  <Select
                    value={formData.from_zone_type}
                    onValueChange={(value: TransferZoneType) => setFormData({ ...formData, from_zone_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONE_TYPES.map((z) => (
                        <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* To Zone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>To Zone Name</Label>
                  <Input
                    placeholder="Sandton City"
                    value={formData.to_zone_name}
                    onChange={(e) => setFormData({ ...formData, to_zone_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zone Type</Label>
                  <Select
                    value={formData.to_zone_type}
                    onValueChange={(value: TransferZoneType) => setFormData({ ...formData, to_zone_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONE_TYPES.map((z) => (
                        <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Prices */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Vehicle Prices (R)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Economy Sedan</Label>
                    <Input
                      type="number"
                      placeholder="350"
                      value={formData.economy_sedan_price}
                      onChange={(e) => setFormData({ ...formData, economy_sedan_price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sedan</Label>
                    <Input
                      type="number"
                      placeholder="450"
                      value={formData.sedan_price}
                      onChange={(e) => setFormData({ ...formData, sedan_price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">SUV</Label>
                    <Input
                      type="number"
                      placeholder="600"
                      value={formData.suv_price}
                      onChange={(e) => setFormData({ ...formData, suv_price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Van</Label>
                    <Input
                      type="number"
                      placeholder="750"
                      value={formData.van_price}
                      onChange={(e) => setFormData({ ...formData, van_price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Luxury Sedan</Label>
                    <Input
                      type="number"
                      placeholder="900"
                      value={formData.luxury_sedan_price}
                      onChange={(e) => setFormData({ ...formData, luxury_sedan_price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Luxury SUV</Label>
                    <Input
                      type="number"
                      placeholder="1100"
                      value={formData.luxury_suv_price}
                      onChange={(e) => setFormData({ ...formData, luxury_suv_price: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formData.from_zone_name || !formData.to_zone_name}>
                {editingRoute ? 'Save Changes' : 'Add Route'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {routes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-xl mb-2">No Routes Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Add zone-to-zone pricing for your transfer services
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Route
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {routes.map((route) => (
            <Card key={route.id} className={!route.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="text-center min-w-[120px]">
                        <Badge variant="outline" className="mb-1 capitalize">
                          {route.from_zone_type?.replace(/_/g, ' ')}
                        </Badge>
                        <p className="font-medium text-sm">{route.from_zone_name}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div className="text-center min-w-[120px]">
                        <Badge variant="outline" className="mb-1 capitalize">
                          {route.to_zone_type?.replace(/_/g, ' ')}
                        </Badge>
                        <p className="font-medium text-sm">{route.to_zone_name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <DollarSign className="h-4 w-4" />
                        {getPriceRange(route)}
                      </div>
                      <p className="text-xs text-muted-foreground">Per vehicle type</p>
                    </div>

                    <Badge variant={route.is_active ? "default" : "secondary"}>
                      {route.is_active ? 'Active' : 'Inactive'}
                    </Badge>

                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleToggleActive(route)}>
                        <Switch checked={route.is_active} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(route)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(route.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransferRoutesPage;
