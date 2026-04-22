import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Plus, Car, Truck, Edit, Trash2, Users, Briefcase, CheckCircle2, XCircle 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { VEHICLE_CATEGORIES, VehicleCategory } from "@/types/transfer";

interface TransferVehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  license_plate: string;
  vehicle_category: VehicleCategory;
  max_passengers: number;
  max_luggage: number | null;
  amenities: string[];
  status: 'active' | 'maintenance' | 'inactive';
  is_available: boolean;
  driver_id: string | null;
  driver?: { id: string; full_name: string } | null;
}

const TransferVehiclesPage = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<TransferVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<TransferVehicle | null>(null);
  const [drivers, setDrivers] = useState<{ id: string; full_name: string }[]>([]);

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    license_plate: '',
    vehicle_category: 'sedan' as VehicleCategory,
    max_passengers: 4,
    max_luggage: 3,
    driver_id: ''
  });

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, [user]);

  const fetchVehicles = async () => {
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
      .from('transfer_vehicles')
      .select('*, driver:drivers(id, full_name)')
      .eq('merchant_profile_id', merchantProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load vehicles");
      console.error(error);
    } else {
      setVehicles(data as unknown as TransferVehicle[]);
    }
    setLoading(false);
  };

  const fetchDrivers = async () => {
    if (!user) return;

    // Fetch drivers associated with merchant
    const { data } = await supabase
      .from('drivers')
      .select('id, full_name')
      .eq('status', 'active');

    if (data) {
      setDrivers(data);
    }
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

    const vehicleData = {
      merchant_profile_id: merchantProfile.id,
      make: formData.make,
      model: formData.model,
      year: formData.year ? parseInt(formData.year) : null,
      color: formData.color || null,
      license_plate: formData.license_plate,
      vehicle_category: formData.vehicle_category,
      max_passengers: formData.max_passengers,
      max_luggage: formData.max_luggage,
      driver_id: formData.driver_id || null,
      status: 'active',
      is_available: true
    };

    let error;
    if (editingVehicle) {
      ({ error } = await supabase
        .from('transfer_vehicles')
        .update(vehicleData)
        .eq('id', editingVehicle.id));
    } else {
      ({ error } = await supabase
        .from('transfer_vehicles')
        .insert(vehicleData));
    }

    if (error) {
      toast.error("Failed to save vehicle");
      console.error(error);
    } else {
      toast.success(editingVehicle ? "Vehicle updated" : "Vehicle added");
      setDialogOpen(false);
      resetForm();
      fetchVehicles();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    const { error } = await supabase
      .from('transfer_vehicles')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete vehicle");
    } else {
      toast.success("Vehicle deleted");
      fetchVehicles();
    }
  };

  const handleToggleAvailability = async (vehicle: TransferVehicle) => {
    const { error } = await supabase
      .from('transfer_vehicles')
      .update({ is_available: !vehicle.is_available })
      .eq('id', vehicle.id);

    if (error) {
      toast.error("Failed to update availability");
    } else {
      fetchVehicles();
    }
  };

  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: '',
      color: '',
      license_plate: '',
      vehicle_category: 'sedan',
      max_passengers: 4,
      max_luggage: 3,
      driver_id: ''
    });
    setEditingVehicle(null);
  };

  const openEditDialog = (vehicle: TransferVehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year?.toString() || '',
      color: vehicle.color || '',
      license_plate: vehicle.license_plate,
      vehicle_category: vehicle.vehicle_category,
      max_passengers: vehicle.max_passengers,
      max_luggage: vehicle.max_luggage || 0,
      driver_id: vehicle.driver_id || ''
    });
    setDialogOpen(true);
  };

  const getCategoryInfo = (category: VehicleCategory) => {
    return VEHICLE_CATEGORIES.find(c => c.id === category);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded-xl" />
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
          <h1 className="text-3xl font-bold">Fleet Management</h1>
          <p className="text-muted-foreground">Manage your transfer vehicles and assign drivers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Input
                    placeholder="Toyota"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    placeholder="Camry"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    placeholder="2023"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    placeholder="Silver"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>License Plate</Label>
                <Input
                  placeholder="ABC 123 GP"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Category</Label>
                <Select
                  value={formData.vehicle_category}
                  onValueChange={(value: VehicleCategory) => {
                    const cat = getCategoryInfo(value);
                    setFormData({
                      ...formData,
                      vehicle_category: value,
                      max_passengers: cat?.passengers || 4,
                      max_luggage: cat?.luggage || 3
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name} - {cat.passengers} pax
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Passengers</Label>
                  <Input
                    type="number"
                    value={formData.max_passengers}
                    onChange={(e) => setFormData({ ...formData, max_passengers: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Luggage</Label>
                  <Input
                    type="number"
                    value={formData.max_luggage}
                    onChange={(e) => setFormData({ ...formData, max_luggage: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign Driver (Optional)</Label>
                <Select
                  value={formData.driver_id}
                  onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No driver assigned</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formData.make || !formData.model || !formData.license_plate}>
                {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Truck className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-xl mb-2">No Vehicles Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Add your first vehicle to start managing your transfer fleet
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => {
            const catInfo = getCategoryInfo(vehicle.vehicle_category);
            return (
              <Card key={vehicle.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                        {catInfo?.icon || '🚗'}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{vehicle.make} {vehicle.model}</CardTitle>
                        <p className="text-sm text-muted-foreground">{vehicle.license_plate}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={vehicle.is_available 
                        ? "bg-green-500/10 text-green-600 border-green-200" 
                        : "bg-muted text-muted-foreground"
                      }
                    >
                      {vehicle.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{vehicle.max_passengers} pax</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{vehicle.max_luggage || 0} bags</span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {vehicle.vehicle_category.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {vehicle.driver && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Car className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{vehicle.driver.full_name}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggleAvailability(vehicle)}
                    >
                      {vehicle.is_available ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Set Unavailable
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Set Available
                        </>
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(vehicle)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(vehicle.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransferVehiclesPage;
