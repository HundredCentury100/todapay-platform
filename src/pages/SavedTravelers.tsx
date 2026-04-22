import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { savedTravelersService, SavedTraveler } from "@/services/savedTravelersService";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Star } from "lucide-react";
import Navigation from "@/components/Navigation";
import BackButton from "@/components/BackButton";
import Footer from "@/components/Footer";

const SavedTravelers = () => {
  const [travelers, setTravelers] = useState<SavedTraveler[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTraveler, setEditingTraveler] = useState<SavedTraveler | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    passport_number: "",
    date_of_birth: "",
    nationality: "",
    is_primary: false
  });

  useEffect(() => {
    loadTravelers();
  }, []);

  const loadTravelers = async () => {
    const { data, error } = await savedTravelersService.getTravelers();
    if (!error && data) {
      setTravelers(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTraveler) {
      const { error } = await savedTravelersService.updateTraveler(editingTraveler.id, formData);
      if (error) {
        toast({ title: "Error", description: "Failed to update traveler", variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Traveler updated successfully" });
    } else {
      const { error } = await savedTravelersService.createTraveler(formData);
      if (error) {
        toast({ title: "Error", description: "Failed to add traveler", variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Traveler added successfully" });
    }

    setDialogOpen(false);
    resetForm();
    loadTravelers();
  };

  const handleEdit = (traveler: SavedTraveler) => {
    setEditingTraveler(traveler);
    setFormData({
      full_name: traveler.full_name,
      email: traveler.email,
      phone: traveler.phone,
      passport_number: traveler.passport_number || "",
      date_of_birth: traveler.date_of_birth || "",
      nationality: traveler.nationality || "",
      is_primary: traveler.is_primary
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this traveler?")) return;
    
    const { error } = await savedTravelersService.deleteTraveler(id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete traveler", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Traveler deleted successfully" });
    loadTravelers();
  };

  const handleSetPrimary = async (id: string) => {
    const { error } = await savedTravelersService.setPrimaryTraveler(id);
    if (error) {
      toast({ title: "Error", description: "Failed to set primary traveler", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Primary traveler updated" });
    loadTravelers();
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      passport_number: "",
      date_of_birth: "",
      nationality: "",
      is_primary: false
    });
    setEditingTraveler(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <BackButton fallbackPath="/profile" className="mb-2" />
            <h1 className="text-3xl font-bold">Saved Travelers</h1>
            <p className="text-muted-foreground">Manage your frequent travelers for faster booking</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Traveler
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTraveler ? 'Edit Traveler' : 'Add New Traveler'}</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passport_number">Passport Number</Label>
                    <Input
                      id="passport_number"
                      value={formData.passport_number}
                      onChange={(e) => setFormData({...formData, passport_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingTraveler ? 'Update' : 'Add'} Traveler
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : travelers.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No saved travelers yet</p>
            <p className="text-sm text-muted-foreground">Add travelers to speed up your booking process</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {travelers.map((traveler) => (
              <Card key={traveler.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{traveler.full_name}</h3>
                      {traveler.is_primary && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Email:</span> {traveler.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {traveler.phone}
                      </div>
                      {traveler.passport_number && (
                        <div>
                          <span className="font-medium">Passport:</span> {traveler.passport_number}
                        </div>
                      )}
                      {traveler.nationality && (
                        <div>
                          <span className="font-medium">Nationality:</span> {traveler.nationality}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!traveler.is_primary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSetPrimary(traveler.id)}
                        title="Set as primary"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(traveler)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(traveler.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SavedTravelers;
