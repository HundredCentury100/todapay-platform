import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createMerchantProfile, addOperatorAssociation } from "@/services/merchantService";
import { uploadKYCDocument } from "@/services/kycService";
import { MerchantRole } from "@/types/merchant";
import { merchantRegistrationSchema } from "@/lib/validationSchemas";
import { Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface InPortalRegistrationDialogProps {
  open: boolean;
  onClose: () => void;
  role: MerchantRole;
  onSuccess: () => void;
}

const InPortalRegistrationDialog = ({ open, onClose, role, onSuccess }: InPortalRegistrationDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_email: user?.email || '',
    business_phone: '',
    business_address: '',
    operator_name: '',
    agent_license_number: ''
  });
  const [kycFiles, setKycFiles] = useState<{ type: string; file: File }[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = merchantRegistrationSchema.parse({
        ...formData,
        role,
      });

      const profile = await createMerchantProfile({
        role: validated.role,
        business_name: validated.business_name,
        business_email: validated.business_email,
        business_phone: validated.business_phone || '',
        business_address: validated.business_address || '',
        ...(role === 'travel_agent' || role === 'booking_agent' ? {
          agent_license_number: formData.agent_license_number
        } : {})
      });

      if (validated.operator_name) {
        await addOperatorAssociation(profile.id, validated.operator_name);
      }

      if (kycFiles.length > 0) {
        await Promise.all(
          kycFiles.map(({ type, file }) => uploadKYCDocument(profile.id, type, file))
        );
      }

      toast.success("Profile created! Pending admin approval.");
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.errors) {
        toast.error(error.errors[0]?.message || "Please check your input");
      } else {
        toast.error(error.message || "Failed to create profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setKycFiles(prev => [...prev.filter(f => f.type !== docType), { type: docType, file }]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Register as {role === 'bus_operator' ? 'Bus Operator' : 
                       role === 'event_organizer' ? 'Event Organizer' :
                       role === 'travel_agent' ? 'Travel Agent' : 'Booking Agent'}
          </DialogTitle>
          <DialogDescription>
            Complete your business information to get started
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name *</Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_email">Business Email *</Label>
            <Input
              id="business_email"
              type="email"
              value={formData.business_email}
              onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_phone">Business Phone</Label>
            <Input
              id="business_phone"
              type="tel"
              value={formData.business_phone}
              onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_address">Business Address</Label>
            <Input
              id="business_address"
              value={formData.business_address}
              onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operator_name">
              {role === 'bus_operator' ? 'Operator Name *' :
               role === 'event_organizer' ? 'Organizer Name *' :
               role === 'travel_agent' ? 'Agency Name *' : 'Agency/Company Name *'}
            </Label>
            <Input
              id="operator_name"
              value={formData.operator_name}
              onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
              required
              placeholder={role === 'bus_operator' ? 'e.g., ABC Transport' :
                         role === 'event_organizer' ? 'e.g., XYZ Events' :
                         'e.g., Travel Solutions Inc'}
            />
          </div>

          {(role === 'travel_agent' || role === 'booking_agent') && (
            <div className="space-y-2">
              <Label htmlFor="agent_license_number">Agent License Number (if applicable)</Label>
              <Input
                id="agent_license_number"
                value={formData.agent_license_number}
                onChange={(e) => setFormData({ ...formData, agent_license_number: e.target.value })}
                placeholder="e.g., TRV-2024-12345"
              />
            </div>
          )}

          <div className="space-y-4">
            <Label>KYC Documents (Optional)</Label>
            
            <div className="space-y-2">
              <Label htmlFor="business_license" className="text-sm">Business License</Label>
              <div className="flex gap-2">
                <Input
                  id="business_license"
                  type="file"
                  onChange={(e) => handleFileChange(e, 'business_license')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-muted-foreground mt-2" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id" className="text-sm">Tax ID Document</Label>
              <div className="flex gap-2">
                <Input
                  id="tax_id"
                  type="file"
                  onChange={(e) => handleFileChange(e, 'tax_id')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-muted-foreground mt-2" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Submitting..." : "Submit for Approval"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InPortalRegistrationDialog;
