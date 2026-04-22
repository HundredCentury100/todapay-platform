import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Building2, User, CheckCircle, Shield, Settings, Receipt, Edit,
  Mail, Phone, MapPin, Globe, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/merchant/ImageUpload";

interface ManagedMerchant {
  id: string;
  business_name: string;
  business_email: string;
  business_phone: string | null;
  business_address: string | null;
  website_url: string | null;
  role: string;
  verification_status: string;
  created_at: string;
}

export default function AgentMerchantManagement() {
  const { toast } = useToast();
  const { merchantProfile } = useMerchantAuth();
  const queryClient = useQueryClient();
  const [selectedMerchant, setSelectedMerchant] = useState<ManagedMerchant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({ business_name: "", business_email: "", business_phone: "", business_address: "", website_url: "", logo_url: "" });
  const [activeTab, setActiveTab] = useState("overview");

  const { data: merchants = [], isLoading } = useQuery({
    queryKey: ["agent-managed-merchants", merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];
      // Agents can manage merchants they created + all verified merchants
      const { data, error } = await supabase
        .from("merchant_profiles")
        .select("id, business_name, business_email, business_phone, business_address, website_url, role, verification_status, created_at")
        .or(`created_by_agent_id.eq.${merchantProfile.id},verification_status.eq.verified`)
        .order("business_name");
      if (error) throw error;
      return data as ManagedMerchant[];
    },
    enabled: !!merchantProfile?.id,
  });

  const { data: merchantBookings = [] } = useQuery({
    queryKey: ["merchant-bookings", selectedMerchant?.id],
    queryFn: async () => {
      if (!selectedMerchant) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("id, booking_reference, item_name, status, total_price, created_at, passenger_name")
        .eq("booked_by_agent_id", merchantProfile?.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedMerchant && !!merchantProfile?.id,
  });

  const updateMerchant = useMutation({
    mutationFn: async () => {
      if (!selectedMerchant) return;
      const { error } = await supabase
        .from("merchant_profiles")
        .update({
          business_name: editData.business_name,
          business_email: editData.business_email,
          business_phone: editData.business_phone || null,
          business_address: editData.business_address || null,
          website_url: editData.website_url || null,
          logo_url: editData.logo_url || null,
        })
        .eq("id", selectedMerchant.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Merchant profile updated successfully" });
      setEditDialog(false);
      queryClient.invalidateQueries({ queryKey: ["agent-managed-merchants"] });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const filtered = merchants.filter(m =>
    m.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.business_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openEdit = () => {
    if (!selectedMerchant) return;
    setEditData({
      business_name: selectedMerchant.business_name,
      business_email: selectedMerchant.business_email,
      business_phone: selectedMerchant.business_phone || "",
      business_address: selectedMerchant.business_address || "",
      website_url: selectedMerchant.website_url || "",
      logo_url: (selectedMerchant as any).logo_url || "",
    });
    setEditDialog(true);
  };

  if (isLoading) return <div className="p-4 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[400px]" /></div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Manage Merchants</h1>
        <p className="text-sm text-muted-foreground">View, edit, and manage merchant accounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Merchant List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3"><CardTitle className="text-base">Merchants</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filtered.map(m => (
                  <button key={m.id} onClick={() => { setSelectedMerchant(m); setActiveTab("overview"); }}
                    className={cn("w-full p-3 rounded-lg border text-left transition-colors", selectedMerchant?.id === m.id ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-muted"><User className="h-4 w-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{m.business_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.business_email}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">{m.role.replace(/_/g, " ")}</Badge>
                      </div>
                      {selectedMerchant?.id === m.id && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No merchants found</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Merchant Details */}
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            {!selectedMerchant ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Merchant</h3>
                <p className="text-sm text-muted-foreground max-w-md">Choose a merchant to view and manage their account.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="font-semibold">{selectedMerchant.business_name}</h2>
                      <p className="text-xs text-muted-foreground">{selectedMerchant.role.replace(/_/g, " ")} · {selectedMerchant.verification_status}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={openEdit}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMerchant.business_email}</span>
                      </div>
                      {selectedMerchant.business_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedMerchant.business_phone}</span>
                        </div>
                      )}
                      {selectedMerchant.business_address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedMerchant.business_address}</span>
                        </div>
                      )}
                      {selectedMerchant.website_url && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a href={selectedMerchant.website_url} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-1">
                            {selectedMerchant.website_url} <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant={selectedMerchant.verification_status === "verified" ? "default" : "outline"}>
                          {selectedMerchant.verification_status}
                        </Badge>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="bookings" className="mt-4">
                    {merchantBookings.length > 0 ? (
                      <div className="space-y-2">
                        {merchantBookings.map((b: any) => (
                          <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="text-sm font-medium">{b.item_name}</p>
                              <p className="text-xs text-muted-foreground">{b.booking_reference} · {b.passenger_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">${b.total_price}</p>
                              <Badge variant="outline" className="text-xs">{b.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No bookings found</p>
                    )}
                  </TabsContent>

                  <TabsContent value="settings" className="mt-4">
                    <div className="text-sm text-muted-foreground text-center py-8">
                      <Settings className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Merchant settings can be updated via the Edit button above.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Merchant</DialogTitle>
            <DialogDescription>Update merchant business details</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); updateMerchant.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={editData.business_name} onChange={e => setEditData({ ...editData, business_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Business Email</Label>
              <Input type="email" value={editData.business_email} onChange={e => setEditData({ ...editData, business_email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={editData.business_phone} onChange={e => setEditData({ ...editData, business_phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={editData.business_address} onChange={e => setEditData({ ...editData, business_address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={editData.website_url} onChange={e => setEditData({ ...editData, website_url: e.target.value })} />
            </div>
            <ImageUpload
              currentImage={editData.logo_url}
              onImageChange={(url) => setEditData({ ...editData, logo_url: url })}
              label="Business Logo / Image"
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialog(false)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={updateMerchant.isPending} className="flex-1">
                {updateMerchant.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
