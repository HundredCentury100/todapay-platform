import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { MerchantRole } from "@/types/merchant";

const MERCHANT_ROLES: { value: MerchantRole; label: string }[] = [
  { value: "bus_operator", label: "Bus Operator" },
  { value: "event_organizer", label: "Event Organizer" },
  { value: "venue_owner", label: "Venue Owner" },
  { value: "property_owner", label: "Property Owner" },
  { value: "workspace_provider", label: "Workspace Provider" },
  { value: "experience_host", label: "Experience Host" },
  { value: "car_rental_company", label: "Car Rental Company" },
  { value: "transfer_provider", label: "Transfer Provider" },
  { value: "airline_partner", label: "Airline Partner" },
  { value: "travel_agent", label: "Internal Agent (Travel)" },
  { value: "booking_agent", label: "External Agent (Booking)" },
];

interface AdminCreateMerchantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AdminCreateMerchantForm = ({
  open,
  onOpenChange,
  onSuccess,
}: AdminCreateMerchantFormProps) => {
  const [loading, setLoading] = useState(false);
  const [autoVerify, setAutoVerify] = useState(true);
  const [formData, setFormData] = useState({
    business_name: "",
    business_email: "",
    business_phone: "",
    role: "" as MerchantRole | "",
    business_address: "",
    tax_id: "",
    user_email: "",
  });

  const resetForm = () => {
    setFormData({
      business_name: "",
      business_email: "",
      business_phone: "",
      role: "",
      business_address: "",
      tax_id: "",
      user_email: "",
    });
    setAutoVerify(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role || !formData.business_name || !formData.business_email) return;

    setLoading(true);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      // Check if user with this email already exists in profiles
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", formData.user_email || formData.business_email)
        .maybeSingle();

      let userId = existingProfile?.id;

      if (!userId) {
        // Create auth user via admin invite (sends magic link)
        const { data: inviteData, error: inviteError } = await supabase.auth.admin.createUser({
          email: formData.user_email || formData.business_email,
          email_confirm: true,
          user_metadata: {
            full_name: formData.business_name,
            role: "merchant",
          },
        });

        if (inviteError) {
          // If admin API not available, try finding user by email
          // The merchant profile can be created with a placeholder user_id
          // and linked later when the user signs up
          toast.error("Cannot create user account directly. The merchant should sign up first, then you can verify them.");
          setLoading(false);
          return;
        }

        userId = inviteData.user?.id;
      }

      if (!userId) {
        toast.error("Could not determine user ID for merchant");
        setLoading(false);
        return;
      }

      // Create merchant profile
      const { data: merchantProfile, error: merchantError } = await supabase
        .from("merchant_profiles")
        .insert({
          user_id: userId,
          business_name: formData.business_name,
          business_email: formData.business_email,
          business_phone: formData.business_phone || null,
          role: formData.role as MerchantRole,
          business_address: formData.business_address || null,
          tax_id: formData.tax_id || null,
          verification_status: autoVerify ? "verified" : "pending",
          verified_at: autoVerify ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (merchantError) throw merchantError;

      // Add merchant role to user_roles
      await supabase.from("user_roles").upsert({
        user_id: userId,
        role: "merchant" as any,
      }, { onConflict: "user_id,role" });

      // Log admin action
      if (adminUser) {
        await supabase.from("admin_activity_log").insert({
          admin_user_id: adminUser.id,
          action_type: "merchant_created",
          action_description: `Created merchant account: ${formData.business_name} (${formData.role})`,
          target_resource_type: "merchant_profile",
          target_resource_id: merchantProfile.id,
          metadata: { 
            role: formData.role, 
            auto_verified: autoVerify,
            business_email: formData.business_email
          },
        });
      }

      // Send notification email if verified
      if (autoVerify) {
        try {
          await supabase.functions.invoke("send-merchant-notification", {
            body: {
              merchantId: merchantProfile.id,
              status: "verified",
              businessEmail: formData.business_email,
              businessName: formData.business_name,
            },
          });
        } catch {
          // Non-critical
        }
      }

      toast.success(`Merchant "${formData.business_name}" created successfully${autoVerify ? " and verified" : ""}`);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating merchant:", error);
      toast.error(error.message || "Failed to create merchant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Merchant Account</DialogTitle>
          <DialogDescription>
            Register a new merchant on the platform. If the user doesn't have an account, one will be created.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Business Name *</Label>
              <Input
                placeholder="e.g., Safari Tours Zimbabwe"
                value={formData.business_name}
                onChange={(e) => setFormData((p) => ({ ...p, business_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Merchant Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData((p) => ({ ...p, role: v as MerchantRole }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {MERCHANT_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Business Email *</Label>
              <Input
                type="email"
                placeholder="business@example.com"
                value={formData.business_email}
                onChange={(e) => setFormData((p) => ({ ...p, business_email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>User Login Email</Label>
              <Input
                type="email"
                placeholder="Same as business email if empty"
                value={formData.user_email}
                onChange={(e) => setFormData((p) => ({ ...p, user_email: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                The email the merchant will use to log in
              </p>
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="+263..."
                value={formData.business_phone}
                onChange={(e) => setFormData((p) => ({ ...p, business_phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Business Address</Label>
              <Input
                placeholder="Full business address"
                value={formData.business_address}
                onChange={(e) => setFormData((p) => ({ ...p, business_address: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tax ID / Registration</Label>
              <Input
                placeholder="Optional"
                value={formData.tax_id}
                onChange={(e) => setFormData((p) => ({ ...p, tax_id: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t">
            <Switch
              id="auto_verify"
              checked={autoVerify}
              onCheckedChange={setAutoVerify}
            />
            <Label htmlFor="auto_verify" className="text-sm">
              Auto-verify this merchant (skip KYC review)
            </Label>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.role || !formData.business_name}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Merchant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCreateMerchantForm;
