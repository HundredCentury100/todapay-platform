import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Users, 
  Trash2, 
  Phone, 
  Edit2,
  Bell,
  Loader2
} from "lucide-react";
import { 
  getEmergencyContacts, 
  createEmergencyContact, 
  updateEmergencyContact,
  deleteEmergencyContact,
  RELATIONSHIP_OPTIONS,
  type EmergencyContact 
} from "@/services/emergencyContactsService";
import { toast } from "sonner";
import { useEffect } from "react";

export const EmergencyContactsManager = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [notifyOnRide, setNotifyOnRide] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const data = await getEmergencyContacts();
    setContacts(data);
    setLoading(false);
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setRelationship("");
    setIsPrimary(false);
    setNotifyOnRide(false);
    setEditingContact(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone);
    setRelationship(contact.relationship || "");
    setIsPrimary(contact.is_primary);
    setNotifyOnRide(contact.notify_on_ride);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingContact) {
        await updateEmergencyContact(editingContact.id, {
          name: name.trim(),
          phone: phone.trim(),
          relationship: relationship || null,
          is_primary: isPrimary,
          notify_on_ride: notifyOnRide,
        });
        toast.success("Contact updated");
      } else {
        await createEmergencyContact({
          name: name.trim(),
          phone: phone.trim(),
          relationship: relationship || undefined,
          is_primary: isPrimary,
          notify_on_ride: notifyOnRide,
        });
        toast.success("Contact added");
      }

      setIsDialogOpen(false);
      resetForm();
      loadContacts();
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("Failed to save contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      await deleteEmergencyContact(id);
      toast.success("Contact deleted");
      loadContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Emergency Contacts
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
                {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contact name"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+27..."
                />
              </div>
              <div>
                <Label>Relationship</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map((rel) => (
                      <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Primary Contact</Label>
                  <p className="text-xs text-muted-foreground">First to be notified</p>
                </div>
                <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notify on Ride</Label>
                  <p className="text-xs text-muted-foreground">Auto-notify when I start a ride</p>
                </div>
                <Switch checked={notifyOnRide} onCheckedChange={setNotifyOnRide} />
              </div>
              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingContact ? 'Update Contact' : 'Add Contact'}
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
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No emergency contacts</p>
            <p className="text-xs">Add contacts to notify in case of emergency</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div 
                key={contact.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{contact.name}</p>
                    {contact.is_primary && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                    {contact.notify_on_ride && (
                      <Bell className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {contact.phone}
                    {contact.relationship && (
                      <span>• {contact.relationship}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => openEditDialog(contact)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => handleDelete(contact.id)}
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

export default EmergencyContactsManager;
