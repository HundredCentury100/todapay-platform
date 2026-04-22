import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  Phone, 
  Shield, 
  Share2, 
  Users,
  MapPin,
  Loader2
} from "lucide-react";
import { getEmergencyContacts, type EmergencyContact } from "@/services/emergencyContactsService";
import { toast } from "sonner";
import { useEffect } from "react";

interface EmergencyActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  shareCode?: string;
  driverName?: string;
  driverPhone?: string;
}

export const EmergencyActionsModal = ({
  open,
  onOpenChange,
  rideId,
  shareCode,
  driverName,
  driverPhone,
}: EmergencyActionsModalProps) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    if (open) {
      loadContacts();
    }
  }, [open]);

  const loadContacts = async () => {
    const data = await getEmergencyContacts();
    setContacts(data);
    setLoading(false);
  };

  const handleCallEmergency = () => {
    // In production, this would trigger actual emergency services
    window.location.href = 'tel:10111'; // South Africa emergency number
  };

  const handleShareLocation = async () => {
    if (!shareCode) {
      toast.error("Share code not available");
      return;
    }

    const shareUrl = `${window.location.origin}/ride/track/${shareCode}`;
    const shareText = `I'm in a ride. Track my location here: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Track my ride',
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Share link copied to clipboard");
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleNotifyContacts = async () => {
    if (contacts.length === 0) {
      toast.error("No emergency contacts set up");
      return;
    }

    const shareUrl = `${window.location.origin}/ride/track/${shareCode}`;
    
    // In production, this would send SMS/notifications
    const contactsToNotify = contacts.filter(c => c.notify_on_ride);
    
    if (contactsToNotify.length > 0) {
      toast.success(`Notifying ${contactsToNotify.length} emergency contact(s)`);
    } else {
      toast.info("No contacts have 'notify on ride' enabled");
    }
  };

  const handleCallContact = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Safety & Emergency
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Emergency Call */}
          <Button 
            variant="destructive" 
            className="w-full h-14 text-lg"
            onClick={handleCallEmergency}
          >
            <Phone className="h-5 w-5 mr-2" />
            Call Emergency Services (10111)
          </Button>

          <Separator />

          {/* Share Location */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share Your Ride
            </h4>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleShareLocation}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Share Live Location
            </Button>
          </div>

          <Separator />

          {/* Emergency Contacts */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Emergency Contacts
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No emergency contacts set up.
                <br />
                Add contacts in your profile settings.
              </p>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div 
                    key={contact.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {contact.relationship || 'Contact'}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCallContact(contact.phone)}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                  </div>
                ))}

                <Button 
                  variant="secondary" 
                  className="w-full mt-2"
                  onClick={handleNotifyContacts}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Notify All Contacts
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Driver Info */}
          {driverName && (
            <div className="space-y-2">
              <h4 className="font-medium">Driver Information</h4>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{driverName}</p>
                {driverPhone && (
                  <Button 
                    size="sm" 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => handleCallContact(driverPhone)}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    {driverPhone}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyActionsModal;
