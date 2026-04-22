import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format } from "date-fns";
import {
  Banknote,
  CreditCard,
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Receipt,
  Users,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type PaymentStatus = "pending" | "collected" | "remitted" | "verified";

interface PendingPayment {
  id: string;
  booking_id: string;
  booking_reference: string;
  passenger_name: string;
  passenger_phone: string;
  item_name: string;
  total_price: number;
  payment_status: string;
  created_at: string;
  travel_date?: string;
  event_date?: string;
}

export default function AgentPaymentsPage() {
  const { merchantProfile } = useMerchantAuth();
  const { toast } = useToast();
  const { convertPrice } = useCurrency();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "collected" | "remitted">("pending");
  const [collectDialogOpen, setCollectDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<PendingPayment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pos">("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch pending payments (bookings awaiting payment collection)
  const { data: pendingPayments = [], isLoading: loadingPending } = useQuery({
    queryKey: ["agent-pending-payments", merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select("id, booking_reference, passenger_name, passenger_phone, item_name, total_price, payment_status, created_at, travel_date, event_date")
        .eq("booked_by_agent_id", merchantProfile.id)
        .eq("payment_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((b) => ({ ...b, booking_id: b.id })) as PendingPayment[];
    },
    enabled: !!merchantProfile?.id,
  });

  // Fetch collected payments (recorded but not yet remitted)
  const { data: collectedPayments = [], isLoading: loadingCollected } = useQuery({
    queryKey: ["agent-collected-payments", merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];

      const { data, error } = await supabase
        .from("agent_payment_records")
        .select(`
          *,
          booking:bookings(booking_reference, passenger_name, item_name, total_price, travel_date, event_date)
        `)
        .eq("agent_profile_id", merchantProfile.id)
        .eq("payment_type", "client_to_agent")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  // Fetch remitted payments
  const { data: remittedPayments = [], isLoading: loadingRemitted } = useQuery({
    queryKey: ["agent-remitted-payments", merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];

      const { data, error } = await supabase
        .from("agent_payment_records")
        .select(`
          *,
          booking:bookings(booking_reference, passenger_name, item_name, total_price, travel_date, event_date)
        `)
        .eq("agent_profile_id", merchantProfile.id)
        .eq("payment_type", "agent_to_merchant")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  // Stats
  const stats = {
    pendingCollection: pendingPayments.reduce((sum, p) => sum + Number(p.total_price), 0),
    collected: collectedPayments.reduce((sum, p) => sum + Number(p.amount), 0),
    remitted: remittedPayments
      .filter((p) => p.status === "verified" || p.status === "completed")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    pendingRemittance: remittedPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + Number(p.amount), 0),
  };

  // Collect payment mutation
  const collectPaymentMutation = useMutation({
    mutationFn: async ({
      bookingId,
      amount,
      method,
      reference,
      notes,
    }: {
      bookingId: string;
      amount: number;
      method: string;
      reference: string;
      notes: string;
    }) => {
      // Create client-to-agent payment record
      const { data: paymentRecord, error: recordError } = await supabase
        .from("agent_payment_records")
        .insert({
          agent_profile_id: merchantProfile?.id,
          booking_id: bookingId,
          payment_type: "client_to_agent",
          amount,
          payment_method: method,
          payment_reference: reference || null,
          notes: notes || null,
          status: "pending",
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // Update booking payment status
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          payment_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (bookingError) throw bookingError;

      // Send notification to agent (SMS + email)
      try {
        await supabase.functions.invoke('send-agent-notification', {
          body: {
            agentProfileId: merchantProfile?.id,
            notificationType: 'new_booking',
            title: 'Payment Collected',
            body: `Payment of $${amount.toFixed(2)} collected via ${method.replace("_", " ")}. Ref: ${reference || 'N/A'}`,
            data: { bookingId, amount, method, reference },
          },
        });
      } catch (notifErr) {
        console.error("Agent payment notification error:", notifErr);
      }

      return paymentRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-pending-payments"] });
      queryClient.invalidateQueries({ queryKey: ["agent-collected-payments"] });
      toast({
        title: "Payment Collected",
        description: "Payment has been recorded successfully. Remember to remit to the merchant.",
      });
      setCollectDialogOpen(false);
      setSelectedBooking(null);
      setPaymentReference("");
      setPaymentNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const handleCollectPayment = async () => {
    if (!selectedBooking) return;

    setIsProcessing(true);
    try {
      await collectPaymentMutation.mutateAsync({
        bookingId: selectedBooking.booking_id,
        amount: selectedBooking.total_price,
        method: paymentMethod,
        reference: paymentReference,
        notes: paymentNotes,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPending = pendingPayments.filter(
    (p) =>
      p.booking_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.passenger_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loadingPending && loadingCollected && loadingRemitted) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Collection</h1>
        <p className="text-muted-foreground">
          Collect cash and POS payments from customers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Collection"
          value={convertPrice(stats.pendingCollection)}
          icon={Clock}
          description={`${pendingPayments.length} bookings`}
          variant="warning"
        />
        <StatCard
          title="Collected Today"
          value={convertPrice(stats.collected)}
          icon={Banknote}
          description="Awaiting remittance"
          variant="info"
        />
        <StatCard
          title="Pending Remittance"
          value={convertPrice(stats.pendingRemittance)}
          icon={AlertCircle}
          description="To be sent to merchants"
          variant="warning"
        />
        <StatCard
          title="Total Remitted"
          value={convertPrice(stats.remitted)}
          icon={CheckCircle}
          description="Successfully transferred"
          variant="success"
        />
      </div>

      {/* Payment Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Manage Payments</CardTitle>
              <CardDescription>
                Collect payments from customers and track remittances
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ref or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pending Collection
                {pendingPayments.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingPayments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="collected" className="gap-2">
                <Banknote className="h-4 w-4" />
                Collected
              </TabsTrigger>
              <TabsTrigger value="remitted" className="gap-2">
                <Receipt className="h-4 w-4" />
                Remittances
              </TabsTrigger>
            </TabsList>

            {/* Pending Collection Tab */}
            <TabsContent value="pending" className="mt-4">
              {filteredPending.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title="No pending payments"
                  description="All customer payments have been collected"
                />
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking Ref</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPending.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">
                            {payment.booking_reference}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.passenger_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {payment.passenger_phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {payment.item_name}
                          </TableCell>
                          <TableCell>
                            {payment.travel_date
                              ? format(new Date(payment.travel_date), "MMM dd")
                              : payment.event_date
                              ? format(new Date(payment.event_date), "MMM dd")
                              : "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {convertPrice(payment.total_price)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(payment);
                                setCollectDialogOpen(true);
                              }}
                            >
                              <Banknote className="h-4 w-4 mr-2" />
                              Collect
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Collected Tab */}
            <TabsContent value="collected" className="mt-4">
              {collectedPayments.length === 0 ? (
                <EmptyState
                  icon={Banknote}
                  title="No collected payments"
                  description="Payments you collect will appear here"
                />
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Collected</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collectedPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">
                            {payment.booking?.booking_reference}
                          </TableCell>
                          <TableCell>{payment.booking?.passenger_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              {payment.payment_method === "cash" ? (
                                <Banknote className="h-3 w-3" />
                              ) : (
                                <CreditCard className="h-3 w-3" />
                              )}
                              {payment.payment_method?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {convertPrice(payment.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(payment.created_at), "MMM dd, HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-amber-100 text-amber-800">
                              Awaiting Remittance
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Remittances Tab */}
            <TabsContent value="remitted" className="mt-4">
              {remittedPayments.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No remittances"
                  description="Your remittance history will appear here"
                />
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {remittedPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">
                            {payment.booking?.booking_reference}
                          </TableCell>
                          <TableCell className="font-medium">
                            {convertPrice(payment.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {payment.payment_reference || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(payment.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                payment.status === "verified" || payment.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : payment.status === "pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              )}
                            >
                              {payment.status}
                            </Badge>
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

      {/* Collect Payment Dialog */}
      <Dialog open={collectDialogOpen} onOpenChange={setCollectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Collect Payment</DialogTitle>
            <DialogDescription>
              Record cash or POS payment from customer
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              {/* Booking Summary */}
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Booking</span>
                  <span className="font-mono text-sm">{selectedBooking.booking_reference}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Customer</span>
                  <span className="text-sm font-medium">{selectedBooking.passenger_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-lg font-bold text-primary">
                    {convertPrice(selectedBooking.total_price)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                      paymentMethod === "cash"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <Banknote className={cn("h-6 w-6", paymentMethod === "cash" && "text-primary")} />
                    <span className="text-sm font-medium">Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pos")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                      paymentMethod === "pos"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <CreditCard className={cn("h-6 w-6", paymentMethod === "pos" && "text-primary")} />
                    <span className="text-sm font-medium">POS / Card</span>
                  </button>
                </div>
              </div>

              {/* Reference (optional for POS) */}
              {paymentMethod === "pos" && (
                <div className="space-y-2">
                  <Label>Transaction Reference</Label>
                  <Input
                    placeholder="POS transaction ID"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Any additional notes..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Commission Info */}
              <div className="p-3 rounded-lg border border-dashed">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">Your commission:</span>
                  <span className="font-medium text-green-600">
                    {convertPrice(selectedBooking.total_price * 0.1)}
                  </span>
                  <span className="text-xs text-muted-foreground">(10%)</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCollectDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleCollectPayment} disabled={isProcessing}>
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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

// Empty State Component
const EmptyState = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="text-center py-12">
    <Icon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
    <p className="font-medium">{title}</p>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);
