import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileAppLayout from "@/components/MobileAppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/ui/loading-states";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Loader2, Building2, Users, TrendingUp, Settings,
  ChevronDown, Phone, Mail, Globe, MapPin, FileText,
  CreditCard, Shield, Star, CheckCircle, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";

const MerchantProfile = () => {
  const navigate = useNavigate();
  const { merchantProfile, loading: authLoading } = useMerchantAuth();
  const [saving, setSaving] = useState(false);
  const [businessDetailsOpen, setBusinessDetailsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    business_name: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    address: "",
  });

  if (authLoading) {
    return (
      <MobileAppLayout>
        <PageLoader message="Loading profile..." />
      </MobileAppLayout>
    );
  }

  if (!merchantProfile) {
    return (
      <MobileAppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Not a Merchant Yet</h2>
              <p className="text-muted-foreground mb-4">
                Register as a merchant to access this page.
              </p>
              <Button onClick={() => navigate('/merchant/auth')}>
                Become a Merchant
              </Button>
            </CardContent>
          </Card>
        </div>
      </MobileAppLayout>
    );
  }

  const verificationStatus = merchantProfile.verification_status;
  const isVerified = verificationStatus === 'verified';

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-6">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground px-4 pt-6 pb-16">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Building2 className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{merchantProfile.business_name}</h1>
                {isVerified && <CheckCircle className="h-5 w-5" />}
              </div>
              <p className="text-sm opacity-80 capitalize">{merchantProfile.role?.replace('_', ' ')}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {merchantProfile.id.slice(0, 8).toUpperCase()}
                </Badge>
                <Badge 
                  variant={isVerified ? "default" : "secondary"} 
                  className={isVerified ? "bg-green-500" : "bg-yellow-500"}
                >
                  {verificationStatus}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pt-6 space-y-4">
          <Tabs defaultValue="business" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="business" className="gap-1">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Business</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="business" className="space-y-4 mt-4">
              <Collapsible open={businessDetailsOpen} onOpenChange={setBusinessDetailsOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Business Information
                        </CardTitle>
                        <ChevronDown className={`h-5 w-5 transition-transform ${businessDetailsOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Business Name</p>
                            <p className="font-medium">{merchantProfile.business_name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-medium">{merchantProfile.business_email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="font-medium">{merchantProfile.business_phone || 'Not set'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Account ID</p>
                            <p className="font-medium font-mono">{merchantProfile.id.slice(0, 12).toUpperCase()}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Verification Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          isVerified ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
                        }`}>
                          {isVerified ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Shield className="h-5 w-5 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">Account Verification</p>
                          <p className="text-xs text-muted-foreground capitalize">{verificationStatus}</p>
                        </div>
                      </div>
                      {!isVerified && (
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <Users className="h-5 w-5" />
                    <span className="text-xs">View Team</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-xs">Analytics</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs">Payouts</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <FileText className="h-5 w-5" />
                    <span className="text-xs">Reports</span>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name || merchantProfile.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_email">Contact Email</Label>
                    <Input
                      id="business_email"
                      type="email"
                      value={formData.contact_email || merchantProfile.business_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_phone">Contact Phone</Label>
                    <Input
                      id="business_phone"
                      type="tel"
                      value={formData.contact_phone || merchantProfile.business_phone || ''}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <Button disabled={saving} className="w-full h-12">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                    Deactivate Account
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default MerchantProfile;
