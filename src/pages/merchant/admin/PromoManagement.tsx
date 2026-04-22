import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Tag, Plus, Ticket, Users, TrendingUp, Loader2,
  ToggleLeft, Copy, Gift, Clock, Percent, DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { format } from "date-fns";

const PromoManagement = () => {
  const { isAdminUser, loading: authLoading } = useAdmin();
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [promoUsage, setPromoUsage] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState({ totalPromos: 0, activePromos: 0, totalVouchers: 0, totalUsage: 0 });

  // New promo form
  const [newPromo, setNewPromo] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    max_discount_amount: "",
    min_order_amount: 0,
    max_uses: "",
    max_uses_per_user: 1,
    valid_days: 30,
    applicable_verticals: "",
    first_time_only: false,
  });

  useEffect(() => {
    if (isAdminUser) loadAll();
  }, [isAdminUser]);

  const loadAll = async () => {
    setIsLoading(true);
    await Promise.all([loadPromoCodes(), loadVouchers(), loadUsage()]);
    setIsLoading(false);
  };

  const loadPromoCodes = async () => {
    const { data, error } = await (supabase as any)
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setPromoCodes(data);
      setStats(prev => ({
        ...prev,
        totalPromos: data.length,
        activePromos: data.filter((p: any) => p.is_active).length,
      }));
    }
  };

  const loadVouchers = async () => {
    const { data, error } = await (supabase as any)
      .from("user_vouchers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) {
      setVouchers(data);
      setStats(prev => ({ ...prev, totalVouchers: data.length }));
    }
  };

  const loadUsage = async () => {
    const { data, error } = await (supabase as any)
      .from("promo_code_usage")
      .select("*, promo_codes(code, description)")
      .order("used_at", { ascending: false })
      .limit(100);
    if (!error && data) {
      setPromoUsage(data);
      setStats(prev => ({ ...prev, totalUsage: data.length }));
    }
  };

  const togglePromoActive = async (id: string, currentlyActive: boolean) => {
    const { error } = await (supabase as any)
      .from("promo_codes")
      .update({ is_active: !currentlyActive, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update promo");
    } else {
      toast.success(`Promo ${currentlyActive ? "deactivated" : "activated"}`);
      loadPromoCodes();
    }
  };

  const handleCreatePromo = async () => {
    if (!newPromo.code.trim()) {
      toast.error("Code is required");
      return;
    }
    setCreating(true);

    const verticals = newPromo.applicable_verticals
      ? newPromo.applicable_verticals.split(",").map(v => v.trim()).filter(Boolean)
      : [];

    const { error } = await (supabase as any)
      .from("promo_codes")
      .insert({
        code: newPromo.code.toUpperCase(),
        description: newPromo.description,
        discount_type: newPromo.discount_type,
        discount_value: newPromo.discount_value,
        max_discount_amount: newPromo.max_discount_amount ? Number(newPromo.max_discount_amount) : null,
        min_order_amount: newPromo.min_order_amount,
        max_uses: newPromo.max_uses ? Number(newPromo.max_uses) : null,
        max_uses_per_user: newPromo.max_uses_per_user,
        valid_until: new Date(Date.now() + newPromo.valid_days * 86400000).toISOString(),
        applicable_verticals: verticals,
        first_time_only: newPromo.first_time_only,
        is_active: true,
      });

    if (error) {
      toast.error(error.message || "Failed to create promo");
    } else {
      toast.success("Promo code created!");
      setShowCreateDialog(false);
      setNewPromo({
        code: "", description: "", discount_type: "percentage", discount_value: 10,
        max_discount_amount: "", min_order_amount: 0, max_uses: "", max_uses_per_user: 1,
        valid_days: 30, applicable_verticals: "", first_time_only: false,
      });
      loadPromoCodes();
    }
    setCreating(false);
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!isAdminUser) return <Navigate to="/merchant/admin/auth" replace />;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Promo & Voucher Management</h1>
          <p className="text-sm text-muted-foreground">Create and manage promo codes, track voucher usage</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Create Promo Code</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Promo Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Code</Label>
                  <Input value={newPromo.code} onChange={e => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SUMMER25" />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newPromo.discount_type} onValueChange={v => setNewPromo(p => ({ ...p, discount_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input value={newPromo.description} onChange={e => setNewPromo(p => ({ ...p, description: e.target.value }))} placeholder="Get 25% off summer bookings" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Discount Value</Label>
                  <Input type="number" value={newPromo.discount_value} onChange={e => setNewPromo(p => ({ ...p, discount_value: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Max Discount ($)</Label>
                  <Input type="number" value={newPromo.max_discount_amount} onChange={e => setNewPromo(p => ({ ...p, max_discount_amount: e.target.value }))} placeholder="No limit" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Min Order ($)</Label>
                  <Input type="number" value={newPromo.min_order_amount} onChange={e => setNewPromo(p => ({ ...p, min_order_amount: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Max Uses</Label>
                  <Input type="number" value={newPromo.max_uses} onChange={e => setNewPromo(p => ({ ...p, max_uses: e.target.value }))} placeholder="Unlimited" />
                </div>
                <div>
                  <Label>Per User</Label>
                  <Input type="number" value={newPromo.max_uses_per_user} onChange={e => setNewPromo(p => ({ ...p, max_uses_per_user: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valid Days</Label>
                  <Input type="number" value={newPromo.valid_days} onChange={e => setNewPromo(p => ({ ...p, valid_days: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Verticals (comma-sep)</Label>
                  <Input value={newPromo.applicable_verticals} onChange={e => setNewPromo(p => ({ ...p, applicable_verticals: e.target.value }))} placeholder="bus,event,stay" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newPromo.first_time_only} onCheckedChange={v => setNewPromo(p => ({ ...p, first_time_only: v }))} />
                <Label>First-time users only</Label>
              </div>
              <Button className="w-full" onClick={handleCreatePromo} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Promo Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Promos</p>
                <p className="text-2xl font-bold">{stats.totalPromos}</p>
              </div>
              <Tag className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Promos</p>
                <p className="text-2xl font-bold">{stats.activePromos}</p>
              </div>
              <ToggleLeft className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Vouchers Issued</p>
                <p className="text-2xl font-bold">{stats.totalVouchers}</p>
              </div>
              <Ticket className="h-5 w-5 text-pink-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Redemptions</p>
                <p className="text-2xl font-bold">{stats.totalUsage}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="promos">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="promos" className="flex-1 sm:flex-none">Promo Codes</TabsTrigger>
          <TabsTrigger value="vouchers" className="flex-1 sm:flex-none">User Vouchers</TabsTrigger>
          <TabsTrigger value="usage" className="flex-1 sm:flex-none">Usage History</TabsTrigger>
        </TabsList>

        {/* Promo Codes Tab */}
        <TabsContent value="promos" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : promoCodes.length === 0 ? (
            <Card className="p-8 text-center">
              <Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">No promo codes yet</p>
              <p className="text-sm text-muted-foreground">Create your first promo code to get started</p>
            </Card>
          ) : (
            <>
              {/* Mobile */}
              <div className="sm:hidden space-y-3">
                {promoCodes.map(promo => (
                  <Card key={promo.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-mono font-bold text-primary">{promo.code}</p>
                        <p className="text-sm text-muted-foreground">{promo.description}</p>
                      </div>
                      <Badge variant={promo.is_active ? "default" : "secondary"}>
                        {promo.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {promo.discount_type === "percentage" ? `${promo.discount_value}%` : `$${promo.discount_value}`}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {promo.current_uses}/{promo.max_uses || "∞"} used
                      </Badge>
                      {promo.first_time_only && <Badge variant="secondary" className="text-xs">New users</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => togglePromoActive(promo.id, promo.is_active)}>
                        {promo.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(promo.code); toast.success("Copied!"); }}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Verticals</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoCodes.map(promo => (
                      <TableRow key={promo.id}>
                        <TableCell><code className="font-mono font-bold text-primary">{promo.code}</code></TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{promo.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {promo.discount_type === "percentage" ? `${promo.discount_value}%` : `$${promo.discount_value}`}
                          </Badge>
                        </TableCell>
                        <TableCell>{promo.current_uses}/{promo.max_uses || "∞"}</TableCell>
                        <TableCell>
                          {promo.applicable_verticals?.length > 0
                            ? promo.applicable_verticals.join(", ")
                            : "All"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {promo.valid_until ? format(new Date(promo.valid_until), "MMM d, yyyy") : "Never"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={promo.is_active ? "default" : "secondary"}>
                            {promo.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => togglePromoActive(promo.id, promo.is_active)}>
                              {promo.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(promo.code); toast.success("Copied!"); }}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        {/* Vouchers Tab */}
        <TabsContent value="vouchers" className="mt-4">
          {vouchers.length === 0 ? (
            <Card className="p-8 text-center">
              <Ticket className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">No vouchers issued yet</p>
            </Card>
          ) : (
            <>
              <div className="sm:hidden space-y-3">
                {vouchers.map(v => (
                  <Card key={v.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-mono text-sm">{v.code}</p>
                        <p className="text-xs text-muted-foreground">{v.description || v.source}</p>
                      </div>
                      <Badge variant={v.status === "active" ? "default" : "secondary"} className="capitalize">{v.status}</Badge>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-xs">
                        {v.discount_type === "percentage" ? `${v.discount_value}%` : `$${v.discount_value}`}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">{v.source}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vouchers.map(v => (
                      <TableRow key={v.id}>
                        <TableCell><code className="font-mono text-sm">{v.code}</code></TableCell>
                        <TableCell className="text-xs">{v.user_id?.slice(0, 8)}...</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize text-xs">{v.source}</Badge></TableCell>
                        <TableCell>{v.discount_type === "percentage" ? `${v.discount_value}%` : `$${v.discount_value}`}</TableCell>
                        <TableCell><Badge variant={v.status === "active" ? "default" : "secondary"} className="capitalize">{v.status}</Badge></TableCell>
                        <TableCell className="text-xs">{format(new Date(v.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-xs">{v.expires_at ? format(new Date(v.expires_at), "MMM d, yyyy") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        {/* Usage History Tab */}
        <TabsContent value="usage" className="mt-4">
          {promoUsage.length === 0 ? (
            <Card className="p-8 text-center">
              <Gift className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">No promo usage yet</p>
            </Card>
          ) : (
            <>
              <div className="sm:hidden space-y-3">
                {promoUsage.map(u => (
                  <Card key={u.id} className="p-4">
                    <div className="flex justify-between mb-1">
                      <p className="font-mono font-medium text-sm">{u.promo_codes?.code || "—"}</p>
                      <p className="font-semibold text-primary">${Number(u.discount_applied).toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{format(new Date(u.used_at), "MMM d, yyyy HH:mm")}</p>
                  </Card>
                ))}
              </div>
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Promo Code</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Discount Applied</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoUsage.map(u => (
                      <TableRow key={u.id}>
                        <TableCell><code className="font-mono">{u.promo_codes?.code || "—"}</code></TableCell>
                        <TableCell className="text-xs">{u.user_id?.slice(0, 8)}...</TableCell>
                        <TableCell className="font-semibold">${Number(u.discount_applied).toFixed(2)}</TableCell>
                        <TableCell className="text-xs">{format(new Date(u.used_at), "MMM d, yyyy HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PromoManagement;
