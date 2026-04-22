import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { 
  UserPlus, Bus, Users, Car, Building2, Ticket, Tent, Plane, 
  Briefcase, Wrench, MapPin, Eye, EyeOff, Copy, Check, Loader2,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

type AccountType = "merchant" | "agent" | "driver" | "corporate";

interface MerchantRole {
  value: string;
  label: string;
  icon: React.ElementType;
}

const merchantRoles: MerchantRole[] = [
  { value: "bus_operator", label: "Bus Operator", icon: Bus },
  { value: "event_organizer", label: "Event Organizer", icon: Ticket },
  { value: "venue_owner", label: "Venue Owner", icon: MapPin },
  { value: "property_owner", label: "Property Owner", icon: Building2 },
  { value: "car_rental_company", label: "Car Rental", icon: Car },
  { value: "transfer_provider", label: "Transfer Provider", icon: Car },
  { value: "workspace_provider", label: "Workspace Provider", icon: Briefcase },
  { value: "experience_host", label: "Experience Host", icon: Tent },
  { value: "airline_partner", label: "Airline Partner", icon: Plane },
];

const agentRoles: MerchantRole[] = [
  { value: "travel_agent", label: "Travel Agent (Internal)", icon: Users },
  { value: "booking_agent", label: "Booking Agent (External)", icon: Users },
];

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
};

const CredentialProvisioning = () => {
  const { isAdminUser, loading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<AccountType>("merchant");
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [businessName, setBusinessName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Created credentials
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    role: string;
    accountNumber?: string;
  } | null>(null);

  if (adminLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdminUser) {
    return <Navigate to="/merchant/admin" replace />;
  }

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setPassword(generatePassword());
    setBusinessName("");
    setSelectedRole("");
    setCompanyName("");
    setCreatedCredentials(null);
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = async () => {
    if (!fullName || !email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (activeTab === "merchant" && (!selectedRole || !businessName)) {
      toast.error("Please select a role and enter business name");
      return;
    }

    if (activeTab === "agent" && !selectedRole) {
      toast.error("Please select an agent type");
      return;
    }

    if (activeTab === "corporate" && !companyName) {
      toast.error("Please enter company name");
      return;
    }

    setCreating(true);
    try {
      // 1. Create the user via edge function or admin API
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      const userId = signUpData.user?.id;
      if (!userId) throw new Error("Failed to create user");

      let accountNumber: string | undefined;

      if (activeTab === "merchant" || activeTab === "agent") {
        const role = selectedRole;
        const { data: profileData, error: profileError } = await supabase
          .from("merchant_profiles")
          .insert({
            user_id: userId,
            role: role as any,
            business_name: activeTab === "merchant" ? businessName : `${fullName} - Agent`,
            business_email: email,
            business_phone: phone || null,
            verification_status: "verified",
            country_code: "ZW",
          })
          .select("account_number")
          .single();

        if (profileError) throw profileError;
        accountNumber = profileData?.account_number;
      }

      if (activeTab === "driver") {
        const { error: driverError } = await supabase
          .from("drivers")
          .insert({
            user_id: userId,
            full_name: fullName,
            email,
            phone: phone || "",
            status: "pending",
            license_plate: "PENDING",
          });

        if (driverError) throw driverError;
      }

      if (activeTab === "corporate") {
        const { data: corpData, error: corpError } = await supabase
          .from("corporate_accounts")
          .insert({
            company_name: companyName,
            company_email: email,
            company_phone: phone || null,
            primary_contact_name: fullName,
            primary_contact_email: email,
            account_status: "active",
          })
          .select("account_number")
          .single();

        if (corpError) throw corpError;
        accountNumber = corpData?.account_number;
      }

      setCreatedCredentials({
        email,
        password,
        role: activeTab === "merchant" || activeTab === "agent" ? selectedRole : activeTab,
        accountNumber,
      });

      toast.success("Account created successfully!");
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  const getRoleLabel = (value: string) => {
    const all = [...merchantRoles, ...agentRoles];
    return all.find((r) => r.value === value)?.label || value;
  };

  const tabConfig = [
    { value: "merchant", label: "Merchant", icon: Building2 },
    { value: "agent", label: "Agent", icon: Users },
    { value: "driver", label: "Driver", icon: Car },
    { value: "corporate", label: "Corporate", icon: Briefcase },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" />
          Credential Provisioning
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create login credentials for merchants, agents, drivers, and corporate accounts
        </p>
      </div>

      {/* Created Credentials Card */}
      {createdCredentials && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
              <Check className="h-5 w-5" />
              Account Created Successfully
            </CardTitle>
            <CardDescription>
              Share these credentials securely with the account holder. They must change their password on first login.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-card border rounded-lg px-3 py-2 font-mono">
                    {createdCredentials.email}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 shrink-0"
                    onClick={() => copyToClipboard(createdCredentials.email, "email")}
                  >
                    {copied === "email" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Password</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-card border rounded-lg px-3 py-2 font-mono">
                    {createdCredentials.password}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 shrink-0"
                    onClick={() => copyToClipboard(createdCredentials.password, "pwd")}
                  >
                    {copied === "pwd" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary">{getRoleLabel(createdCredentials.role)}</Badge>
              {createdCredentials.accountNumber && (
                <Badge variant="outline" className="font-mono">{createdCredentials.accountNumber}</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={resetForm} className="mt-2">
              Create Another Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Creation Form */}
      {!createdCredentials && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">New Account</CardTitle>
            <CardDescription>
              Select account type and fill in the details. Credentials will be generated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Type Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as AccountType); setSelectedRole(""); }}>
              <TabsList className="grid grid-cols-4 w-full">
                {tabConfig.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
                    <tab.icon className="h-4 w-4 hidden sm:block" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Merchant */}
              <TabsContent value="merchant" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Merchant Role <span className="text-destructive">*</span></Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select merchant type" />
                    </SelectTrigger>
                    <SelectContent>
                      {merchantRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <span className="flex items-center gap-2">
                            <role.icon className="h-4 w-4" />
                            {role.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Business Name <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="e.g. Intercity Xpress"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="text-[16px]"
                  />
                </div>
              </TabsContent>

              {/* Agent */}
              <TabsContent value="agent" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Agent Type <span className="text-destructive">*</span></Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent type" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                  <strong>Internal Agents (00-)</strong>: Full portal access. <br />
                  <strong>External Agents (10-)</strong>: Bus/Event tickets, Bill Payments, InnBucks Tools only.
                </div>
              </TabsContent>

              {/* Driver */}
              <TabsContent value="driver" className="mt-4">
                <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                  Driver account will be created with <strong>pending</strong> status. Complete vehicle verification separately.
                </div>
              </TabsContent>

              {/* Corporate */}
              <TabsContent value="corporate" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Company Name <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="e.g. Delta Beverages"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="text-[16px]"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Common Fields */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-sm font-medium text-muted-foreground">Account Holder Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="John Moyo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-[16px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address <span className="text-destructive">*</span></Label>
                  <Input
                    type="email"
                    placeholder="john@company.co.zw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-[16px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="+263 77 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-[16px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temporary Password <span className="text-destructive">*</span></Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 font-mono text-[16px]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPassword(generatePassword())}
                      className="shrink-0"
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms Notice */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
              <Shield className="h-4 w-4 inline mr-1.5" />
              By creating this account, you confirm the holder has agreed to the platform's{" "}
              <a href="/terms" target="_blank" className="underline font-medium">Terms & Conditions</a> and{" "}
              <a href="/privacy" target="_blank" className="underline font-medium">Privacy Policy</a>.
            </div>

            {/* Submit */}
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="w-full sm:w-auto gap-2"
              size="lg"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CredentialProvisioning;
