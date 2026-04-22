import { useState } from "react";
import { ShieldOff, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Inline functions to replace deleted service
async function getAllMerchantStatuses() {
  const { data, error } = await supabase
    .from('merchant_profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function suspendMerchantAccount(merchantProfileId: string, reason: string, durationDays?: number) {
  const { data, error } = await supabase
    .from('merchant_profiles')
    .update({ 
      verification_status: 'suspended',
      updated_at: new Date().toISOString()
    })
    .eq('id', merchantProfileId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function reactivateMerchantAccount(merchantProfileId: string) {
  const { data, error } = await supabase
    .from('merchant_profiles')
    .update({ 
      verification_status: 'verified',
      updated_at: new Date().toISOString()
    })
    .eq('id', merchantProfileId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

const MerchantSuspension = () => {
  const { isAdminUser, loading: adminLoading } = useAdmin();
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [actionType, setActionType] = useState<'suspend' | 'reactivate' | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionDuration, setSuspensionDuration] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: merchants, loading, refetch } = useDataFetching<any[]>({
    fetchFn: getAllMerchantStatuses,
    errorMessage: "Failed to load merchants",
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdminUser) {
    return <Navigate to="/merchant/admin/auth" replace />;
  }

  const filteredMerchants = merchants?.filter(m => {
    if (statusFilter === "all") return true;
    return m.account_status === statusFilter;
  });

  const handleSuspend = async () => {
    if (!selectedMerchant || !suspensionReason) {
      toast.error("Please provide a suspension reason");
      return;
    }

    try {
      const durationDays = suspensionDuration ? parseInt(suspensionDuration) : undefined;
      await suspendMerchantAccount(
        selectedMerchant.merchant_profile_id,
        suspensionReason,
        durationDays
      );
      
      toast.success("Merchant account suspended");
      setSelectedMerchant(null);
      setActionType(null);
      setSuspensionReason("");
      setSuspensionDuration("");
      await refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to suspend account");
    }
  };

  const handleReactivate = async () => {
    if (!selectedMerchant) return;

    try {
      await reactivateMerchantAccount(selectedMerchant.merchant_profile_id);
      toast.success("Merchant account reactivated");
      setSelectedMerchant(null);
      setActionType(null);
      await refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to reactivate account");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; icon: any }> = {
      active: { variant: "default", icon: ShieldCheck },
      suspended: { variant: "destructive", icon: ShieldOff },
      warning: { variant: "secondary", icon: AlertTriangle },
    };
    
    const config = variants[status] || variants.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldOff className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Merchant Suspension Management</h1>
              <p className="text-muted-foreground">Manage merchant account suspensions and reactivations</p>
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {merchants?.filter(m => m.account_status === 'active').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <ShieldOff className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {merchants?.filter(m => m.account_status === 'suspended').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warning</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {merchants?.filter(m => m.account_status === 'warning').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {merchants?.filter(m => 
                  m.suspended_until && new Date(m.suspended_until) > new Date()
                ).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Merchant Accounts</CardTitle>
            <CardDescription>Manage merchant account status and suspensions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Outstanding Balance</TableHead>
                    <TableHead>Suspension Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants?.map((merchant) => (
                    <TableRow key={merchant.merchant_profile_id}>
                      <TableCell className="font-medium">{merchant.business_name}</TableCell>
                      <TableCell>{merchant.business_email}</TableCell>
                      <TableCell>{getStatusBadge(merchant.account_status)}</TableCell>
                      <TableCell>
                        ${merchant.outstanding_balance?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        {merchant.suspension_reason && (
                          <div className="text-sm">
                            <p className="font-medium text-muted-foreground">
                              {merchant.suspension_reason}
                            </p>
                            {merchant.suspended_until && (
                              <p className="text-xs text-muted-foreground">
                                Until: {new Date(merchant.suspended_until).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {merchant.account_status === 'suspended' ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedMerchant(merchant);
                              setActionType('reactivate');
                            }}
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedMerchant(merchant);
                              setActionType('suspend');
                            }}
                          >
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Suspend
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMerchants?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No merchants found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suspend Dialog */}
      <Dialog open={actionType === 'suspend'} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Merchant Account</DialogTitle>
            <DialogDescription>
              Suspend {selectedMerchant?.business_name}'s account. They will be notified and unable to access their merchant portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Suspension Reason *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Non-payment of platform fees, Terms of service violation..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Suspension Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="Leave empty for indefinite suspension"
                value={suspensionDuration}
                onChange={(e) => setSuspensionDuration(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If specified, the account will automatically reactivate after this period
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend}>
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Dialog */}
      <Dialog open={actionType === 'reactivate'} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Merchant Account</DialogTitle>
            <DialogDescription>
              Reactivate {selectedMerchant?.business_name}'s account. They will regain full access to their merchant portal.
            </DialogDescription>
          </DialogHeader>
          {selectedMerchant?.suspension_reason && (
            <div className="py-4 space-y-2">
              <p className="text-sm font-medium">Previous Suspension Reason:</p>
              <p className="text-sm text-muted-foreground">{selectedMerchant.suspension_reason}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Cancel
            </Button>
            <Button onClick={handleReactivate}>
              Reactivate Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MerchantSuspension;