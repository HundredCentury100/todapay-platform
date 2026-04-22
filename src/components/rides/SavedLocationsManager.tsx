import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  MapPin, 
  Trash2, 
  Edit2,
  Home,
  Briefcase,
  Star,
  Loader2
} from "lucide-react";
import { 
  getSavedLocations, 
  createSavedLocation, 
  updateSavedLocation,
  deleteSavedLocation,
  LOCATION_LABELS,
  type SavedLocation 
} from "@/services/savedLocationsService";
import { toast } from "sonner";
import { useEffect } from "react";

const ICON_COMPONENTS: Record<string, React.ReactNode> = {
  home: <Home className="h-4 w-4" />,
  briefcase: <Briefcase className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  'map-pin': <MapPin className="h-4 w-4" />,
};

export const SavedLocationsManager = () => {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [label, setLabel] = useState("Other");
  const [address, setAddress] = useState("");

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    const data = await getSavedLocations();
    setLocations(data);
    setLoading(false);
  };

  const resetForm = () => {
    setName("");
    setLabel("Other");
    setAddress("");
    setEditingLocation(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (location: SavedLocation) => {
    setEditingLocation(location);
    setName(location.name);
    setLabel(location.label);
    setAddress(location.address);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !address.trim()) {
      toast.error("Name and address are required");
      return;
    }

    setIsSubmitting(true);

    // Get icon based on label
    const iconEntry = LOCATION_LABELS.find(l => l.value === label);
    const icon = iconEntry?.icon || 'map-pin';

    try {
      if (editingLocation) {
        await updateSavedLocation(editingLocation.id, {
          name: name.trim(),
          label,
          address: address.trim(),
          icon,
        });
        toast.success("Location updated");
      } else {
        await createSavedLocation({
          name: name.trim(),
          label,
          address: address.trim(),
          lat: -26.2041, // Default - in real app use geocoding
          lng: 28.0473,
          icon,
        });
        toast.success("Location saved");
      }

      setIsDialogOpen(false);
      resetForm();
      loadLocations();
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Failed to save location");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      await deleteSavedLocation(id);
      toast.success("Location deleted");
      loadLocations();
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Saved Places
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? 'Edit Location' : 'Add Saved Location'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My Home, Office"
                />
              </div>
              <div>
                <Label>Label</Label>
                <Select value={label} onValueChange={setLabel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_LABELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        <div className="flex items-center gap-2">
                          {ICON_COMPONENTS[l.icon]}
                          {l.value}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full address"
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingLocation ? 'Update Location' : 'Save Location'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No saved places</p>
            <p className="text-xs">Save your frequent destinations for quick booking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map((location) => (
              <div 
                key={location.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {ICON_COMPONENTS[location.icon] || <MapPin className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{location.name}</p>
                      {location.label !== 'Other' && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {location.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {location.address}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => openEditDialog(location)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => handleDelete(location.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedLocationsManager;
