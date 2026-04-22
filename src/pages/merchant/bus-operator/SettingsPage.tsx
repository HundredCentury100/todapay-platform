import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { updateMerchantProfile, getOperatorAssociations, addOperatorAssociation } from "@/services/merchantService";
import { Loader2, Save, Plus, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BookingPolicyManager from "@/components/merchant/BookingPolicyManager";

const SettingsPage = () => {
  const { merchantProfile } = useMerchantAuth("bus_operator");
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState<any[]>([]);
  const [newOperator, setNewOperator] = useState("");
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    business_name: "",
    business_email: "",
    business_phone: "",
    business_address: "",
    tax_id: "",
    support_email: "",
    support_phone: "",
    website_url: "",
    customer_agent_name: "",
    customer_agent_email: "",
    customer_agent_phone: "",
    whatsapp_number: "",
    social_media_links: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
    },
  });

  useEffect(() => {
    if (merchantProfile) {
      setFormData({
        business_name: merchantProfile.business_name || "",
        business_email: merchantProfile.business_email || "",
        business_phone: merchantProfile.business_phone || "",
        business_address: merchantProfile.business_address || "",
        tax_id: merchantProfile.tax_id || "",
        support_email: merchantProfile.support_email || "",
        support_phone: merchantProfile.support_phone || "",
        website_url: merchantProfile.website_url || "",
        customer_agent_name: merchantProfile.customer_agent_name || "",
        customer_agent_email: merchantProfile.customer_agent_email || "",
        customer_agent_phone: merchantProfile.customer_agent_phone || "",
        whatsapp_number: merchantProfile.whatsapp_number || "",
        social_media_links: {
          facebook: merchantProfile.social_media_links?.facebook || "",
          twitter: merchantProfile.social_media_links?.twitter || "",
          instagram: merchantProfile.social_media_links?.instagram || "",
          linkedin: merchantProfile.social_media_links?.linkedin || "",
        },
      });
      loadOperators();
    }
  }, [merchantProfile]);

  const loadOperators = async () => {
    if (!merchantProfile) return;
    try {
      const data = await getOperatorAssociations(merchantProfile.id);
      setOperators(data);
    } catch (error) {
      console.error("Error loading operators:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantProfile) return;

    setLoading(true);
    try {
      await updateMerchantProfile(merchantProfile.id, formData);
      toast({
        title: "Settings Updated",
        description: "Your business profile has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOperator = async () => {
    if (!merchantProfile || !newOperator.trim()) return;

    try {
      await addOperatorAssociation(merchantProfile.id, newOperator.trim());
      setNewOperator("");
      await loadOperators();
      toast({
        title: "Operator Added",
        description: "Bus operator association added successfully",
      });
    } catch (error) {
      console.error("Error adding operator:", error);
      toast({
        title: "Error",
        description: "Failed to add operator",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your business profile and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="contact">Contact Details</TabsTrigger>
          <TabsTrigger value="policy">Booking Policy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Business Information</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="business_email">Business Email *</Label>
                  <Input
                    id="business_email"
                    type="email"
                    value={formData.business_email}
                    onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="business_phone">Business Phone</Label>
                  <Input
                    id="business_phone"
                    type="tel"
                    value={formData.business_phone}
                    onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="tax_id">Tax ID</Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="business_address">Business Address</Label>
                  <Textarea
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Operator Associations
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Link your merchant account to bus operator names in the system
              </p>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter operator name"
                    value={newOperator}
                    onChange={(e) => setNewOperator(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddOperator()}
                  />
                  <Button onClick={handleAddOperator} disabled={!newOperator.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Associated Operators</Label>
                  <div className="flex flex-wrap gap-2">
                    {operators.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No operators associated yet</p>
                    ) : (
                      operators.map((op) => (
                        <Badge key={op.id} variant="secondary">
                          {op.operator_name}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-sm mb-2">Verification Status</h3>
                <Badge variant={merchantProfile?.verification_status === "verified" ? "default" : "secondary"}>
                  {merchantProfile?.verification_status}
                </Badge>
                {merchantProfile?.verified_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Verified on {new Date(merchantProfile.verified_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contact & Support Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    placeholder="support@company.com"
                    value={formData.support_email}
                    onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="support_phone">Support Phone</Label>
                  <Input
                    id="support_phone"
                    type="tel"
                    placeholder="+263 78 123 4567"
                    value={formData.support_phone}
                    onChange={(e) => setFormData({ ...formData, support_phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  type="url"
                  placeholder="https://www.company.com"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="whatsapp_number">WhatsApp Business Number</Label>
                <Input
                  id="whatsapp_number"
                  type="tel"
                  placeholder="+263 78 123 4567"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                />
              </div>

              <div className="space-y-3 pt-4">
                <h3 className="font-semibold">Customer Service Agent</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="customer_agent_name">Agent Name</Label>
                    <Input
                      id="customer_agent_name"
                      placeholder="John Doe"
                      value={formData.customer_agent_name}
                      onChange={(e) => setFormData({ ...formData, customer_agent_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_agent_email">Agent Email</Label>
                    <Input
                      id="customer_agent_email"
                      type="email"
                      placeholder="agent@company.com"
                      value={formData.customer_agent_email}
                      onChange={(e) => setFormData({ ...formData, customer_agent_email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_agent_phone">Agent Phone</Label>
                    <Input
                      id="customer_agent_phone"
                      type="tel"
                      placeholder="+263 78 123 4567"
                      value={formData.customer_agent_phone}
                      onChange={(e) => setFormData({ ...formData, customer_agent_phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <h3 className="font-semibold">Social Media Links</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      placeholder="https://facebook.com/yourpage"
                      value={formData.social_media_links.facebook}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        social_media_links: { ...formData.social_media_links, facebook: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      placeholder="https://twitter.com/yourhandle"
                      value={formData.social_media_links.twitter}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        social_media_links: { ...formData.social_media_links, twitter: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      placeholder="https://instagram.com/yourprofile"
                      value={formData.social_media_links.instagram}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        social_media_links: { ...formData.social_media_links, instagram: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      placeholder="https://linkedin.com/company/yourcompany"
                      value={formData.social_media_links.linkedin}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        social_media_links: { ...formData.social_media_links, linkedin: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Contact Details
                  </>
                )}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="policy">
          {merchantProfile && (
            <BookingPolicyManager policyType="bus" merchantProfileId={merchantProfile.id} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
