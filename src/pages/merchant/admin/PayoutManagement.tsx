import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Building2,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MerchantPayout, PayoutStatus } from "@/types/fundCollection";

const PayoutManagement = () => {
  const { toast } = useToast();
  const { convertPrice } = useCurrency();
  const [payouts, setPayouts] = useState<MerchantPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<PayoutStatus | "all">("pending");
  const [selectedPayout, setSelectedPayout] = useState<MerchantPayout | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState<"complete" | "fail" | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [actionReference, setActionReference] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    pendingAmount: 0,
    processingAmount: 0,
    completedThisMonth: 0,
    totalMerchants: 0,
  });

  useEffect(() => {
    loadPayouts();
    loadStats();
  }, [activeTab]);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("merchant_payouts")
        .select(`
          *,
          merchant_profile:merchant_profiles(business_name, business_email)
        `)
        .order("created_at", { ascending: false });

      if (activeTab !== "all") {
        query = query.eq("status", activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPayouts((data as any) || []);
    } catch (error) {
      console.error("Error loading payouts:", error);
      toast({
        title: "Error",
        description: "Failed to load payouts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [pending, processing, completed, merchants] = await Promise.all([
        supabase
          .from("merchant_payouts")
          .select("amount")
          .eq("status", "pending"),
        supabase
          .from("merchant_payouts")
          .select("amount")
          .eq("status", "processing"),
        supabase
          .from("merchant_payouts")
          .select("amount")
          .eq("status", "completed")
          .gte("processed_at", startOfMonth.toISOString()),
        supabase
          .from("merchant_payouts")
          .select("merchant_profile_id")
          .eq("status", "pending"),
      ]);

      setStats({
        pendingAmount: pending.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        processingAmount: processing.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        completedThisMonth: completed.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        totalMerchants: new Set(merchants.data?.map((m) => m.merchant_profile_id)).size,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleProcessPayout = async () => {
    if (!selectedPayout || !processingAction) return;

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        processed_by: user?.id,
        processed_at: new Date().toISOString(),
        notes: actionNotes || null,
        updated_at: new Date().toISOString(),
      };

      if (processingAction === "complete") {
        updateData.status = "completed";
        updateData.payout_reference = actionReference;
      } else {
        updateData.status = "failed";
        updateData.failure_reason = actionNotes;
      }

      const { error } = await supabase
        .from("merchant_payouts")
        .update(updateData)
        .eq("id", selectedPayout.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Payout ${processingAction === "complete" ? "completed" : "marked as failed"}`,
      });

      setProcessDialogOpen(false);
      setSelectedPayout(null);
      setActionNotes("");
      setActionReference("");
      loadPayouts();
      loadStats();
    } catch (error) {
      console.error("Error processing payout:", error);
      toast({
        title: "Error",
        description: "Failed to process payout",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startProcessing = async (payout: MerchantPayout) => {
    try {
      const { error } = await supabase
        .from("merchant_payouts")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", payout.id);

      if (error) throw error;

      toast({ title: "Payout moved to processing" });
      loadPayouts();
      loadStats();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to update payout status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: PayoutStatus) => {
    const config = {
      pending: { color: "bg-amber-100 text-amber-800", icon: Clock },
      processing: { color: "bg-blue-100 text-blue-800", icon: Loader2 },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const { color, icon: Icon } = config[status];
    return (
      <Badge className={cn("gap-1", color)}>
        <Icon className={cn("h-3 w-3", status === "processing" && "animate-spin")} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredPayouts = payouts.filter(
    (p) =>
      p.merchant_profile?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.payout_reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && payouts.length === 0) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Payout Management</h1>
        <p className="text-sm text-muted-foreground">
          Process and track merchant payouts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Payouts"
          value={convertPrice(stats.pendingAmount)}
          icon={Clock}
          description={`${stats.totalMerchants} merchants waiting`}
          variant="warning"
        />
        <StatCard
          title="Processing"
          value={convertPrice(stats.processingAmount)}
          icon={Loader2}
          description="Currently being processed"
          variant="info"
        />
        <StatCard
          title="Completed (This Month)"
          value={convertPrice(stats.completedThisMonth)}
          icon={CheckCircle}
          description="Successfully disbursed"
          variant="success"
        />
        <StatCard
          title="Quick Actions"
          value=""
          icon={ArrowUpRight}
          variant="default"
        >
          <Button size="sm" className="w-full mt-2" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </StatCard>
      </div>

      {/* Payouts Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base">Payout Queue</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payouts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PayoutStatus | "all")}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredPayouts.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No payouts found</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Fee Deducted</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-full bg-muted">
                                <Building2 className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {payout.merchant_profile?.business_name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {payout.merchant_profile?.business_email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {convertPrice(payout.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {convertPrice(payout.fee_deducted)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {payout.payout_method}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(payout.status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(payout.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            {payout.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startProcessing(payout)}
                              >
                                Start Processing
                              </Button>
                            )}
                            {payout.status === "processing" && (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedPayout(payout);
                                    setProcessingAction("complete");
                                    setProcessDialogOpen(true);
                                  }}
                                >
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedPayout(payout);
                                    setProcessingAction("fail");
                                    setProcessDialogOpen(true);
                                  }}
                                >
                                  Fail
                                </Button>
                              </div>
                            )}
                            {payout.status === "completed" && payout.payout_reference && (
                              <span className="text-xs text-muted-foreground">
                                Ref: {payout.payout_reference}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Process Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processingAction === "complete" ? "Complete Payout" : "Mark Payout as Failed"}
            </DialogTitle>
            <DialogDescription>
              {processingAction === "complete"
                ? "Enter the payment reference to confirm this payout."
                : "Provide a reason for the failed payout."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedPayout && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium">
                  {selectedPayout.merchant_profile?.business_name}
                </p>
                <p className="text-lg font-bold">{convertPrice(selectedPayout.amount)}</p>
              </div>
            )}

            {processingAction === "complete" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Reference *</label>
                <Input
                  placeholder="e.g., TXN123456789"
                  value={actionReference}
                  onChange={(e) => setActionReference(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {processingAction === "complete" ? "Notes (optional)" : "Failure Reason *"}
              </label>
              <Textarea
                placeholder={
                  processingAction === "complete"
                    ? "Any additional notes..."
                    : "Why did this payout fail?"
                }
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProcessDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={processingAction === "complete" ? "default" : "destructive"}
              onClick={handleProcessPayout}
              disabled={
                isProcessing ||
                (processingAction === "complete" && !actionReference) ||
                (processingAction === "fail" && !actionNotes)
              }
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {processingAction === "complete" ? "Confirm Completion" : "Mark as Failed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Stat Card Component
const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
  children,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
  variant?: "default" | "success" | "warning" | "info";
  children?: React.ReactNode;
}) => {
  const variantStyles = {
    default: "text-muted-foreground",
    success: "text-green-600",
    warning: "text-amber-600",
    info: "text-blue-600",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{title}</span>
          <Icon className={cn("h-4 w-4", variantStyles[variant])} />
        </div>
        {value && <p className="text-xl font-bold">{value}</p>}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {children}
      </CardContent>
    </Card>
  );
};

export default PayoutManagement;
