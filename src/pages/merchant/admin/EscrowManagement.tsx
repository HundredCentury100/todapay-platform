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
  Lock,
  Unlock,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Building2,
  Calendar,
  Shield,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { EscrowHold, EscrowStatus } from "@/types/fundCollection";

const EscrowManagement = () => {
  const { toast } = useToast();
  const { convertPrice } = useCurrency();
  const [escrowHolds, setEscrowHolds] = useState<EscrowHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<EscrowStatus | "all" | "ready">("pending");
  const [selectedHold, setSelectedHold] = useState<EscrowHold | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"release" | "dispute" | "refund" | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalHeld: 0,
    readyToRelease: 0,
    disputed: 0,
    releasedToday: 0,
  });

  useEffect(() => {
    loadEscrowHolds();
    loadStats();
  }, [activeTab]);

  const loadEscrowHolds = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("escrow_holds")
        .select(`
          *,
          merchant_profile:merchant_profiles(business_name, business_email),
          booking:bookings(booking_reference, item_name)
        `)
        .order("created_at", { ascending: false });

      if (activeTab === "ready") {
        query = query.eq("status", "pending").lte("hold_until", new Date().toISOString());
      } else if (activeTab !== "all") {
        query = query.eq("status", activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEscrowHolds(data || []);
    } catch (error) {
      console.error("Error loading escrow holds:", error);
      toast({
        title: "Error",
        description: "Failed to load escrow holds",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [pending, ready, disputed, releasedToday] = await Promise.all([
        supabase
          .from("escrow_holds")
          .select("amount")
          .eq("status", "pending"),
        supabase
          .from("escrow_holds")
          .select("amount")
          .eq("status", "pending")
          .lte("hold_until", new Date().toISOString()),
        supabase
          .from("escrow_holds")
          .select("amount")
          .eq("status", "disputed"),
        supabase
          .from("escrow_holds")
          .select("merchant_amount")
          .eq("status", "released")
          .gte("released_at", today.toISOString()),
      ]);

      setStats({
        totalHeld: pending.data?.reduce((sum, h) => sum + (h.amount || 0), 0) || 0,
        readyToRelease: ready.data?.reduce((sum, h) => sum + (h.amount || 0), 0) || 0,
        disputed: disputed.data?.reduce((sum, h) => sum + (h.amount || 0), 0) || 0,
        releasedToday: releasedToday.data?.reduce((sum, h) => sum + (h.merchant_amount || 0), 0) || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleAction = async () => {
    if (!selectedHold || !actionType) return;

    setIsProcessing(true);
    try {
      let updateData: any = {
        updated_at: new Date().toISOString(),
      };

      switch (actionType) {
        case "release":
          updateData.status = "released";
          updateData.released_at = new Date().toISOString();
          updateData.release_notes = actionNotes || null;
          break;
        case "dispute":
          updateData.status = "disputed";
          updateData.disputed_at = new Date().toISOString();
          updateData.dispute_reason = actionNotes;
          break;
        case "refund":
          const refundAmt = parseFloat(refundAmount);
          if (isNaN(refundAmt) || refundAmt <= 0 || refundAmt > selectedHold.amount) {
            toast({
              title: "Invalid Amount",
              description: "Please enter a valid refund amount",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }
          updateData.status = "refunded";
          updateData.refunded_at = new Date().toISOString();
          updateData.refund_amount = refundAmt;
          updateData.release_notes = actionNotes || null;
          break;
      }

      const { error } = await supabase
        .from("escrow_holds")
        .update(updateData)
        .eq("id", selectedHold.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Escrow hold ${actionType}d successfully`,
      });

      setActionDialogOpen(false);
      setSelectedHold(null);
      setActionNotes("");
      setRefundAmount("");
      loadEscrowHolds();
      loadStats();
    } catch (error) {
      console.error("Error processing action:", error);
      toast({
        title: "Error",
        description: `Failed to ${actionType} escrow hold`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const releaseAllReady = async () => {
    const readyHolds = escrowHolds.filter(
      (h) => h.status === "pending" && isPast(new Date(h.hold_until))
    );

    if (readyHolds.length === 0) {
      toast({ title: "No holds ready to release" });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("escrow_holds")
        .update({
          status: "released",
          released_at: new Date().toISOString(),
          release_notes: "Batch release - hold period expired",
          updated_at: new Date().toISOString(),
        })
        .in("id", readyHolds.map((h) => h.id));

      if (error) throw error;

      toast({
        title: "Success",
        description: `Released ${readyHolds.length} escrow holds`,
      });

      loadEscrowHolds();
      loadStats();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to release holds",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (hold: EscrowHold) => {
    const isReady = hold.status === "pending" && isPast(new Date(hold.hold_until));

    if (isReady) {
      return (
        <Badge className="bg-green-100 text-green-800 gap-1">
          <Unlock className="h-3 w-3" />
          Ready to Release
        </Badge>
      );
    }

    const config = {
      pending: { color: "bg-amber-100 text-amber-800", icon: Lock },
      released: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      disputed: { color: "bg-red-100 text-red-800", icon: AlertTriangle },
      refunded: { color: "bg-blue-100 text-blue-800", icon: RefreshCw },
    };

    const { color, icon: Icon } = config[hold.status];
    return (
      <Badge className={cn("gap-1", color)}>
        <Icon className="h-3 w-3" />
        {hold.status.charAt(0).toUpperCase() + hold.status.slice(1)}
      </Badge>
    );
  };

  const filteredHolds = escrowHolds.filter(
    (h) =>
      h.merchant_profile?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.booking?.booking_reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && escrowHolds.length === 0) {
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
        <h1 className="text-xl font-semibold">Escrow Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage held funds and release payments to merchants
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Held"
          value={convertPrice(stats.totalHeld)}
          icon={Lock}
          description="Funds in escrow"
          variant="default"
        />
        <StatCard
          title="Ready to Release"
          value={convertPrice(stats.readyToRelease)}
          icon={Unlock}
          description="Hold period expired"
          variant="success"
        />
        <StatCard
          title="Disputed"
          value={convertPrice(stats.disputed)}
          icon={AlertTriangle}
          description="Requires review"
          variant="warning"
        />
        <StatCard
          title="Released Today"
          value={convertPrice(stats.releasedToday)}
          icon={CheckCircle}
          description="Disbursed to merchants"
          variant="info"
        />
      </div>

      {/* Escrow Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base">Escrow Holds</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search holds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={releaseAllReady}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Unlock className="h-4 w-4 mr-2" />
                )}
                Release All Ready
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EscrowStatus | "all" | "ready")}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="ready">Ready to Release</TabsTrigger>
              <TabsTrigger value="released">Released</TabsTrigger>
              <TabsTrigger value="disputed">Disputed</TabsTrigger>
              <TabsTrigger value="refunded">Refunded</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredHolds.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No escrow holds found</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Booking</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Platform Fee</TableHead>
                        <TableHead>Merchant Gets</TableHead>
                        <TableHead>Release Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHolds.map((hold) => (
                        <TableRow key={hold.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-full bg-muted">
                                <Building2 className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {hold.merchant_profile?.business_name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {hold.merchant_profile?.business_email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {hold.booking?.booking_reference || "-"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {hold.booking?.item_name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {convertPrice(hold.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {convertPrice(hold.platform_fee_amount)}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {convertPrice(hold.merchant_amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <div>
                                <p className="text-sm">
                                  {format(new Date(hold.hold_until), "MMM dd, yyyy")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {isPast(new Date(hold.hold_until))
                                    ? "Expired"
                                    : formatDistanceToNow(new Date(hold.hold_until), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(hold)}</TableCell>
                          <TableCell className="text-right">
                            {hold.status === "pending" && (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedHold(hold);
                                    setActionType("release");
                                    setActionDialogOpen(true);
                                  }}
                                >
                                  Release
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedHold(hold);
                                    setActionType("dispute");
                                    setActionDialogOpen(true);
                                  }}
                                >
                                  Dispute
                                </Button>
                              </div>
                            )}
                            {hold.status === "disputed" && (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedHold(hold);
                                    setActionType("release");
                                    setActionDialogOpen(true);
                                  }}
                                >
                                  Release
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedHold(hold);
                                    setActionType("refund");
                                    setRefundAmount(hold.amount.toString());
                                    setActionDialogOpen(true);
                                  }}
                                >
                                  Refund
                                </Button>
                              </div>
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

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "release" && "Release Escrow Funds"}
              {actionType === "dispute" && "Dispute Escrow Hold"}
              {actionType === "refund" && "Refund to Customer"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "release" &&
                "This will release the funds to the merchant after deducting platform fees."}
              {actionType === "dispute" &&
                "Flag this escrow hold for review. Funds will remain held."}
              {actionType === "refund" &&
                "Refund the customer. Specify the amount to refund."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedHold && (
              <div className="p-3 rounded-lg bg-muted space-y-1">
                <p className="text-sm font-medium">
                  {selectedHold.merchant_profile?.business_name}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-medium">{convertPrice(selectedHold.amount)}</span>
                </div>
                {actionType === "release" && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Fee:</span>
                      <span>{convertPrice(selectedHold.platform_fee_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-green-600">
                      <span>Merchant Receives:</span>
                      <span>{convertPrice(selectedHold.merchant_amount)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {actionType === "refund" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Refund Amount *</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  max={selectedHold?.amount}
                />
                <p className="text-xs text-muted-foreground">
                  Max: {selectedHold && convertPrice(selectedHold.amount)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {actionType === "dispute" ? "Dispute Reason *" : "Notes"}
              </label>
              <Textarea
                placeholder={
                  actionType === "dispute"
                    ? "Why is this being disputed?"
                    : "Any additional notes..."
                }
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "refund" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={
                isProcessing ||
                (actionType === "dispute" && !actionNotes) ||
                (actionType === "refund" && !refundAmount)
              }
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === "release" && "Release Funds"}
              {actionType === "dispute" && "File Dispute"}
              {actionType === "refund" && "Process Refund"}
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
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
  variant?: "default" | "success" | "warning" | "info";
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
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};

export default EscrowManagement;
