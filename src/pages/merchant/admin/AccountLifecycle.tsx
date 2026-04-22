import { useState } from "react";
import { UserX, ShieldOff, ShieldCheck, Trash2, Users, Building2, Car, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type EntityType = "user" | "merchant" | "driver" | "corporate";

interface AccountEntity {
  id: string;
  name: string;
  email: string;
  type: EntityType;
  status: string;
  last_active_at: string | null;
  created_at: string;
  dormant_days: number;
  extra?: string;
}

const fetchAllAccounts = async (): Promise<AccountEntity[]> => {
  const now = new Date();
  const entities: AccountEntity[] = [];

  const [profilesRes, merchantsRes, driversRes, corporatesRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, account_status, last_active_at, created_at").order("created_at", { ascending: false }),
    supabase.from("merchant_profiles").select("id, business_name, business_email, account_status, last_active_at, created_at, role, verification_status").order("created_at", { ascending: false }),
    supabase.from("drivers").select("id, full_name, email, account_status, last_active_at, created_at, status").order("created_at", { ascending: false }),
    supabase.from("corporate_accounts").select("id, company_name, company_email, account_status, last_active_at, created_at").order("created_at", { ascending: false }),
  ]);

  if (profilesRes.data) {
    for (const p of profilesRes.data) {
      const lastActive = p.last_active_at ? new Date(p.last_active_at) : new Date(p.created_at || now);
      const days = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      entities.push({
        id: p.id, name: p.full_name || "N/A", email: p.email,
        type: "user", status: (p as any).account_status || "active",
        last_active_at: p.last_active_at, created_at: p.created_at || "",
        dormant_days: days,
      });
    }
  }

  if (merchantsRes.data) {
    for (const m of merchantsRes.data) {
      const lastActive = m.last_active_at ? new Date(m.last_active_at) : new Date(m.created_at);
      const days = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      entities.push({
        id: m.id, name: m.business_name, email: m.business_email,
        type: "merchant", status: (m as any).account_status || "active",
        last_active_at: m.last_active_at, created_at: m.created_at,
        dormant_days: days, extra: m.role,
      });
    }
  }

  if (driversRes.data) {
    for (const d of driversRes.data) {
      const lastActive = d.last_active_at ? new Date(d.last_active_at) : new Date(d.created_at);
      const days = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      entities.push({
        id: d.id, name: d.full_name, email: d.email,
        type: "driver", status: (d as any).account_status || "active",
        last_active_at: d.last_active_at, created_at: d.created_at,
        dormant_days: days,
      });
    }
  }

  if (corporatesRes.data) {
    for (const c of corporatesRes.data) {
      const lastActive = c.last_active_at ? new Date(c.last_active_at) : new Date(c.created_at);
      const days = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      entities.push({
        id: c.id, name: c.company_name, email: c.company_email,
        type: "corporate", status: c.account_status,
        last_active_at: c.last_active_at, created_at: c.created_at,
        dormant_days: days,
      });
    }
  }

  return entities;
};

const suspendAccount = async (entity: AccountEntity, reason: string) => {
  const table = entity.type === "user" ? "profiles" : entity.type === "merchant" ? "merchant_profiles" : entity.type === "driver" ? "drivers" : "corporate_accounts";
  const { error } = await supabase.from(table).update({ account_status: "suspended" } as any).eq("id", entity.id);
  if (error) throw error;

  await supabase.from("account_lifecycle_log" as any).insert({
    target_user_id: entity.type === "user" ? entity.id : null,
    target_type: entity.type,
    target_entity_id: entity.id,
    action: "suspended",
    reason,
  } as any);
};

const reactivateAccount = async (entity: AccountEntity) => {
  const table = entity.type === "user" ? "profiles" : entity.type === "merchant" ? "merchant_profiles" : entity.type === "driver" ? "drivers" : "corporate_accounts";
  const { error } = await supabase.from(table).update({ account_status: "active" } as any).eq("id", entity.id);
  if (error) throw error;

  await supabase.from("account_lifecycle_log" as any).insert({
    target_type: entity.type,
    target_entity_id: entity.id,
    action: "reactivated",
    reason: "Manual reactivation by admin",
  } as any);
};

const deleteAccount = async (entity: AccountEntity, reason: string) => {
  const table = entity.type === "user" ? "profiles" : entity.type === "merchant" ? "merchant_profiles" : entity.type === "driver" ? "drivers" : "corporate_accounts";
  const { error } = await supabase.from(table).update({ account_status: "deleted" } as any).eq("id", entity.id);
  if (error) throw error;

  await supabase.from("account_lifecycle_log" as any).insert({
    target_type: entity.type,
    target_entity_id: entity.id,
    action: "deleted",
    reason,
  } as any);
};

const AccountLifecycle = () => {
  const { isAdminUser, loading: adminLoading } = useAdmin();
  const queryClient = useQueryClient();
  const [selectedEntity, setSelectedEntity] = useState<AccountEntity | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "reactivate" | "delete" | null>(null);
  const [reason, setReason] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["account-lifecycle"],
    queryFn: fetchAllAccounts,
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdminUser) return <Navigate to="/merchant/admin/auth" replace />;

  const filtered = accounts.filter(a => {
    if (activeTab === "all") return true;
    if (activeTab === "dormant") return a.dormant_days >= 60 && a.status === "active";
    return a.type === activeTab;
  });

  const dormantCount = accounts.filter(a => a.dormant_days >= 90 && a.status === "active").length;
  const suspendedCount = accounts.filter(a => a.status === "suspended").length;

  const handleAction = async () => {
    if (!selectedEntity || !actionType) return;
    try {
      if (actionType === "suspend") {
        if (!reason) { toast.error("Please provide a reason"); return; }
        await suspendAccount(selectedEntity, reason);
        toast.success(`${selectedEntity.name} suspended`);
      } else if (actionType === "reactivate") {
        await reactivateAccount(selectedEntity);
        toast.success(`${selectedEntity.name} reactivated`);
      } else if (actionType === "delete") {
        if (!reason) { toast.error("Please provide a reason"); return; }
        await deleteAccount(selectedEntity, reason);
        toast.success(`${selectedEntity.name} marked for deletion`);
      }
      queryClient.invalidateQueries({ queryKey: ["account-lifecycle"] });
    } catch (error: any) {
      toast.error(error.message || "Action failed");
    } finally {
      setSelectedEntity(null);
      setActionType(null);
      setReason("");
    }
  };

  const getStatusBadge = (status: string, dormantDays: number) => {
    if (status === "deleted") return <Badge variant="destructive">Deleted</Badge>;
    if (status === "suspended") return <Badge variant="destructive" className="gap-1"><ShieldOff className="h-3 w-3" />Suspended</Badge>;
    if (dormantDays >= 90) return <Badge variant="outline" className="border-amber-500 text-amber-600 gap-1"><UserX className="h-3 w-3" />Dormant ({dormantDays}d)</Badge>;
    return <Badge variant="default" className="gap-1"><ShieldCheck className="h-3 w-3" />Active</Badge>;
  };

  const getTypeIcon = (type: EntityType) => {
    switch (type) {
      case "user": return <Users className="h-4 w-4" />;
      case "merchant": return <Building2 className="h-4 w-4" />;
      case "driver": return <Car className="h-4 w-4" />;
      case "corporate": return <Briefcase className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Account Lifecycle Management</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Suspend, delete, and manage dormant accounts across all user types</p>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Total Accounts</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{accounts.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Active</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{accounts.filter(a => a.status === "active").length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-600">Dormant (90d+)</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-amber-600">{dormantCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-destructive">Suspended</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-destructive">{suspendedCount}</div></CardContent>
          </Card>
        </div>

        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>Auto-lifecycle policy:</strong> Accounts dormant for 90+ days are auto-suspended. After 120+ days of inactivity, accounts are auto-deleted. A scheduled job runs daily to enforce this.
            </p>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="user">Users</TabsTrigger>
            <TabsTrigger value="merchant">Merchants</TabsTrigger>
            <TabsTrigger value="driver">Drivers</TabsTrigger>
            <TabsTrigger value="corporate">Corporates</TabsTrigger>
            <TabsTrigger value="dormant" className="text-amber-600">Dormant</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Accounts ({filtered.length})</CardTitle>
                <CardDescription>Manage account status across users, merchants, drivers, and corporates</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead>Dormant</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((entity) => (
                          <TableRow key={`${entity.type}-${entity.id}`} className={entity.status === "deleted" ? "opacity-50" : ""}>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {getTypeIcon(entity.type)}
                                <span className="capitalize text-xs">{entity.type}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{entity.name}</TableCell>
                            <TableCell className="text-sm">{entity.email}</TableCell>
                            <TableCell>{getStatusBadge(entity.status, entity.dormant_days)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entity.last_active_at
                                ? new Date(entity.last_active_at).toLocaleDateString()
                                : "Never"
                              }
                            </TableCell>
                            <TableCell>
                              <span className={entity.dormant_days >= 90 ? "text-amber-600 font-semibold" : ""}>
                                {entity.dormant_days}d
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                {entity.status === "active" && (
                                  <Button size="sm" variant="outline" className="gap-1 text-amber-600"
                                    onClick={() => { setSelectedEntity(entity); setActionType("suspend"); }}>
                                    <ShieldOff className="h-3.5 w-3.5" /> Suspend
                                  </Button>
                                )}
                                {entity.status === "suspended" && (
                                  <Button size="sm" variant="outline" className="gap-1 text-green-600"
                                    onClick={() => { setSelectedEntity(entity); setActionType("reactivate"); }}>
                                    <ShieldCheck className="h-3.5 w-3.5" /> Reactivate
                                  </Button>
                                )}
                                {entity.status !== "deleted" && (
                                  <Button size="sm" variant="destructive" className="gap-1"
                                    onClick={() => { setSelectedEntity(entity); setActionType("delete"); }}>
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filtered.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              No accounts found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Suspend Dialog */}
      <Dialog open={actionType === "suspend"} onOpenChange={() => { setActionType(null); setReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Account</DialogTitle>
            <DialogDescription>
              Suspend <strong>{selectedEntity?.name}</strong> ({selectedEntity?.type}). They will lose access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Reason *</Label>
            <Textarea placeholder="e.g., Dormant account, policy violation..." value={reason}
              onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleAction}>Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Dialog */}
      <AlertDialog open={actionType === "reactivate"} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Account</AlertDialogTitle>
            <AlertDialogDescription>
              Reactivate <strong>{selectedEntity?.name}</strong> ({selectedEntity?.type})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>Reactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <Dialog open={actionType === "delete"} onOpenChange={() => { setActionType(null); setReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently mark <strong>{selectedEntity?.name}</strong> ({selectedEntity?.type}) as deleted. This action cannot be easily undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Reason *</Label>
            <Textarea placeholder="e.g., Account inactive for 120+ days..." value={reason}
              onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleAction}>Delete Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountLifecycle;
