import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import {
  Search, Building2, Bus, Calendar, Hotel, Laptop, Compass, Car, CarTaxiFront,
  Plus, CheckCircle, User, Shield, Package, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceType, SERVICE_TYPE_LABELS } from "@/types/fundCollection";
import BusScheduleFormAdmin from "@/components/admin/ServiceCreationForms/BusScheduleFormAdmin";
import EventFormAdmin from "@/components/admin/ServiceCreationForms/EventFormAdmin";
import VenueFormAdmin from "@/components/admin/ServiceCreationForms/VenueFormAdmin";
import PropertyFormAdmin from "@/components/admin/ServiceCreationForms/PropertyFormAdmin";
import WorkspaceFormAdmin from "@/components/admin/ServiceCreationForms/WorkspaceFormAdmin";
import ExperienceFormAdmin from "@/components/admin/ServiceCreationForms/ExperienceFormAdmin";
import VehicleFormAdmin from "@/components/admin/ServiceCreationForms/VehicleFormAdmin";
import TransferServiceFormAdmin from "@/components/admin/ServiceCreationForms/TransferServiceFormAdmin";

interface MerchantProfile {
  id: string;
  business_name: string;
  business_email: string;
  role: string;
  verification_status: string;
}

const SERVICE_TABS = [
  { value: "bus_schedule", label: "Bus", icon: Bus, table: "bus_schedules" },
  { value: "event", label: "Events", icon: Calendar, table: "events" },
  { value: "venue", label: "Venues", icon: Building2, table: "venues" },
  { value: "property", label: "Stays", icon: Hotel, table: "properties" },
  { value: "workspace", label: "Workspaces", icon: Laptop, table: "workspaces" },
  { value: "experience", label: "Experiences", icon: Compass, table: "experiences" },
  { value: "vehicle", label: "Vehicles", icon: Car, table: "vehicles" },
  { value: "transfer_service", label: "Transfers", icon: CarTaxiFront, table: "transfer_services" },
];

export default function AgentServiceManagement() {
  const { toast } = useToast();
  const { merchantProfile } = useMerchantAuth();
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ServiceType>("bus_schedule");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({});

  useEffect(() => { loadMerchants(); }, []);

  useEffect(() => {
    if (selectedMerchant) loadServiceCounts(selectedMerchant.id);
  }, [selectedMerchant]);

  const loadMerchants = async () => {
    try {
      const { data, error } = await supabase
        .from("merchant_profiles")
        .select("id, business_name, business_email, role, verification_status")
        .eq("verification_status", "verified")
        .order("business_name");
      if (error) throw error;
      setMerchants(data || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load merchants", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const loadServiceCounts = async (merchantId: string) => {
    const counts: Record<string, number> = {};
    const queries = SERVICE_TABS.map(async (tab) => {
      try {
        const { count } = await supabase
          .from(tab.table as any)
          .select("*", { count: "exact", head: true })
          .eq("merchant_profile_id", merchantId);
        counts[tab.value] = count || 0;
      } catch {
        counts[tab.value] = 0;
      }
    });
    await Promise.all(queries);
    setServiceCounts(counts);
  };

  const filteredMerchants = merchants.filter(m =>
    m.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.business_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    if (selectedMerchant) loadServiceCounts(selectedMerchant.id);
    toast({ title: "Success", description: "Service created successfully for merchant" });
  };

  const renderForm = () => {
    if (!selectedMerchant) return null;
    const props = { merchantId: selectedMerchant.id, onSuccess: handleFormSuccess, onCancel: () => setShowCreateForm(false), actorType: "agent" as const };
    switch (activeTab) {
      case "bus_schedule": return <BusScheduleFormAdmin {...props} />;
      case "event": return <EventFormAdmin {...props} />;
      case "venue": return <VenueFormAdmin {...props} />;
      case "property": return <PropertyFormAdmin {...props} />;
      case "workspace": return <WorkspaceFormAdmin {...props} />;
      case "experience": return <ExperienceFormAdmin {...props} />;
      case "vehicle": return <VehicleFormAdmin {...props} />;
      case "transfer_service": return <TransferServiceFormAdmin {...props} />;
      default: return null;
    }
  };

  const totalServices = Object.values(serviceCounts).reduce((a, b) => a + b, 0);

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Skeleton className="h-[450px]" />
        <Skeleton className="h-[450px] lg:col-span-3" />
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Manage Merchant Services</h1>
        <p className="text-sm text-muted-foreground">Create and manage services on behalf of merchants</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Merchant list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Merchant</CardTitle>
            <p className="text-xs text-muted-foreground">{merchants.length} verified merchants</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search merchants..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <ScrollArea className="h-[380px]">
              <div className="space-y-1.5 pr-2">
                {filteredMerchants.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMerchant(m); setShowCreateForm(false); }}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-all",
                      selectedMerchant?.id === m.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-transparent hover:bg-muted/50 hover:border-border"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-full shrink-0",
                        selectedMerchant?.id === m.id ? "bg-primary/10" : "bg-muted"
                      )}>
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{m.business_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.business_email}</p>
                        <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">
                          {m.role.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {selectedMerchant?.id === m.id && (
                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                ))}
                {filteredMerchants.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No merchants found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Service management area */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {selectedMerchant ? (
                  <>
                    <Building2 className="h-4 w-4 text-primary" />
                    {selectedMerchant.business_name}
                    {totalServices > 0 && (
                      <Badge variant="secondary" className="text-[10px] ml-1">
                        {totalServices} service{totalServices !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </>
                ) : "Select a Merchant"}
              </CardTitle>
              {showCreateForm && selectedMerchant && (
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedMerchant ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Shield className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-medium mb-1">Select a Merchant</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Choose a verified merchant from the list to create and manage services on their behalf.
                </p>
              </div>
            ) : showCreateForm ? (
              renderForm()
            ) : (
              <div className="space-y-4">
                <Tabs value={activeTab} onValueChange={v => { setActiveTab(v as ServiceType); setShowCreateForm(false); }}>
                  <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                    {SERVICE_TABS.map(tab => {
                      const Icon = tab.icon;
                      const count = serviceCounts[tab.value] || 0;
                      return (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 data-[state=active]:shadow-sm"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {tab.label}
                          {count > 0 && (
                            <span className="ml-0.5 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0 font-medium">
                              {count}
                            </span>
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div>
                    <p className="text-sm font-medium">{SERVICE_TYPE_LABELS[activeTab]}</p>
                    <p className="text-xs text-muted-foreground">
                      {serviceCounts[activeTab] || 0} existing · {selectedMerchant.business_name}
                    </p>
                  </div>
                  <Button onClick={() => setShowCreateForm(true)} size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create {SERVICE_TYPE_LABELS[activeTab]}
                  </Button>
                </div>

                {(serviceCounts[activeTab] || 0) === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-3 rounded-full bg-muted mb-3">
                      <Package className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium mb-1">No {SERVICE_TYPE_LABELS[activeTab]} yet</p>
                    <p className="text-xs text-muted-foreground max-w-xs mb-4">
                      Create the first {SERVICE_TYPE_LABELS[activeTab].toLowerCase()} for {selectedMerchant.business_name}.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Create Now
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
