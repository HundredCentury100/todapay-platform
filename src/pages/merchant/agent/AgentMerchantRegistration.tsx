import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { useQuery } from "@tanstack/react-query";
import { uploadKYCDocument } from "@/services/kycService";
import {
  Building2, UserPlus, Upload, CheckCircle, Clock, XCircle, Eye,
  Bus, Calendar, Hotel, Laptop, Compass, Car, CarTaxiFront, Plane, MapPin,
} from "lucide-react";
import { ImageUpload } from "@/components/merchant/ImageUpload";

const MERCHANT_ROLES = [
  { value: "bus_operator", label: "Bus Operator", icon: Bus },
  { value: "event_organizer", label: "Event Organizer", icon: Calendar },
  { value: "venue_owner", label: "Venue Owner", icon: MapPin },
  { value: "property_owner", label: "Property Owner", icon: Hotel },
  { value: "workspace_provider", label: "Workspace Provider", icon: Laptop },
  { value: "experience_host", label: "Experience Host", icon: Compass },
  { value: "car_rental_company", label: "Car Rental Company", icon: Car },
  { value: "transfer_provider", label: "Transfer Provider", icon: CarTaxiFront },
  { value: "airline_partner", label: "Airline Partner", icon: Plane },
];

interface AgentCreatedMerchant {
  id: string;
  business_name: string;
  business_email: string;
  role: string;
  verification_status: string;
  created_at: string;
}

export default function AgentMerchantRegistration() {
  const { toast } = useToast();
  const { merchantProfile } = useMerchantAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: "",
    business_name: "",
    business_email: "",
    business_phone: "",
    business_address: "",
    operator_name: "",
    notes: "",
  });
  const [kycFiles, setKycFiles] = useState<{ type: string; file: File }[]>([]);
  const [logoUrl, setLogoUrl] = useState("");

  const { data: agentMerchants, isLoading, refetch } = useQuery({
    queryKey: ["agent-created-merchants", merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];
      const { data, error } = await (supabase
        .from("merchant_profiles")
        .select("id, business_name, business_email, role, verification_status, created_at") as any)
        .eq("created_by_agent_id", merchantProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as AgentCreatedMerchant[];
    },
    enabled: !!merchantProfile?.id,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantProfile?.id) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const insertData: Record<string, any> = {
        user_id: user.id,
        role: formData.role,
        business_name: formData.business_name,
        business_email: formData.business_email,
        business_phone: formData.business_phone || null,
        business_address: formData.business_address || null,
        verification_status: "pending",
        created_by_agent_id: merchantProfile.id,
        logo_url: logoUrl || null,
      };

      const { data: profile, error } = await supabase
        .from("merchant_profiles")
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      // Add operator association
      if (formData.operator_name) {
        await supabase.from("operator_associations").insert({
          merchant_profile_id: profile.id,
          operator_name: formData.operator_name,
        });
      }

      // Upload KYC docs
      if (kycFiles.length > 0) {
        await Promise.all(
          kycFiles.map(({ type, file }) => uploadKYCDocument(profile.id, type, file))
        );
      }

      toast({ title: "Merchant Registered", description: `${formData.business_name} has been submitted for approval.` });
      setFormData({ role: "", business_name: "", business_email: "", business_phone: "", business_address: "", operator_name: "", notes: "" });
      setKycFiles([]);
      setLogoUrl("");
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to register merchant", variant: "destructive" });
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

  const statusIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircle className="h-4 w-4 text-primary" />;
      case "rejected": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Register Merchant</h1>
        <p className="text-sm text-muted-foreground">Register new merchants on the platform on their behalf</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> New Merchant Registration
            </CardTitle>
            <CardDescription>Fill in the merchant's business details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Category *</Label>
                  <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {MERCHANT_ROLES.map(r => (
                        <SelectItem key={r.value} value={r.value}>
                          <span className="flex items-center gap-2">
                            <r.icon className="h-4 w-4" /> {r.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Business Name *</Label>
                  <Input value={formData.business_name} onChange={e => setFormData({ ...formData, business_name: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label>Business Email *</Label>
                  <Input type="email" value={formData.business_email} onChange={e => setFormData({ ...formData, business_email: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label>Business Phone</Label>
                  <Input type="tel" value={formData.business_phone} onChange={e => setFormData({ ...formData, business_phone: e.target.value })} />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Business Address</Label>
                  <Input value={formData.business_address} onChange={e => setFormData({ ...formData, business_address: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Operator / Trading Name</Label>
                  <Input value={formData.operator_name} onChange={e => setFormData({ ...formData, operator_name: e.target.value })} placeholder="e.g., ABC Transport" />
                </div>
              </div>

              <ImageUpload
                currentImage={logoUrl}
                onImageChange={setLogoUrl}
                label="Business Logo / Image"
              />

              <div className="space-y-3">
                <Label>KYC Documents (Optional)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Business License</Label>
                    <div className="flex gap-2">
                      <Input type="file" onChange={e => handleFileChange(e, "business_license")} accept=".pdf,.jpg,.jpeg,.png" className="flex-1 text-xs" />
                      <Upload className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tax ID Document</Label>
                    <div className="flex gap-2">
                      <Input type="file" onChange={e => handleFileChange(e, "tax_id")} accept=".pdf,.jpg,.jpeg,.png" className="flex-1 text-xs" />
                      <Upload className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Any additional info about this merchant..." rows={2} />
              </div>

              <Button type="submit" disabled={loading || !formData.role || !formData.business_name || !formData.business_email} className="w-full">
                {loading ? "Submitting..." : "Register Merchant"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Registered Merchants List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Your Merchants
            </CardTitle>
            <CardDescription>{agentMerchants?.length || 0} registered</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : agentMerchants && agentMerchants.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {agentMerchants.map(m => (
                  <div key={m.id} className="p-3 rounded-lg border space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{m.business_name}</p>
                      {statusIcon(m.verification_status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.business_email}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{m.role.replace(/_/g, " ")}</Badge>
                      <Badge variant={m.verification_status === "verified" ? "default" : "outline"} className="text-xs">
                        {m.verification_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No merchants registered yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
