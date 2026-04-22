import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isFuture, isPast } from "date-fns";
import { CarTaxiFront, Clock, CheckCircle, XCircle, MapPin, Users, Briefcase, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PremiumPageHeader, PremiumSection, PremiumTabs, PremiumTabContent, PremiumEmptyState } from "@/components/premium";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-200",
  confirmed: "bg-blue-500/10 text-blue-700 border-blue-200",
  driver_assigned: "bg-blue-500/10 text-blue-700 border-blue-200",
  driver_en_route: "bg-blue-500/10 text-blue-700 border-blue-200",
  driver_arrived: "bg-green-500/10 text-green-700 border-green-200",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-green-600/10 text-green-700 border-green-200",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const TransferBookingsPage = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();
  const queryClient = useQueryClient();
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const tabs = [
    { value: "upcoming", label: "Upcoming" },
    { value: "today", label: "Today" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // Fetch transfer requests for this merchant
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["merchant-transfers", merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];
      const { data, error } = await supabase
        .from("transfer_requests")
        .select(`
          *,
          driver:drivers(id, full_name, phone)
        `)
        .eq("merchant_profile_id", merchantProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  // Fetch available drivers for assignment
  const { data: availableDrivers = [] } = useQuery({
    queryKey: ["merchant-drivers", merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];
      const { data, error } = await supabase
        .from("drivers")
        .select("id, full_name, phone, status")
        .eq("merchant_profile_id", merchantProfile.id)
        .eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  // Assign driver mutation
  const assignDriver = useMutation({
    mutationFn: async ({ transferId, driverId }: { transferId: string; driverId: string }) => {
      const { error } = await supabase
        .from("transfer_requests")
        .update({
          assigned_driver_id: driverId,
          status: "driver_assigned",
          driver_assigned_at: new Date().toISOString(),
        })
        .eq("id", transferId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Driver assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["merchant-transfers"] });
      setAssigningId(null);
    },
    onError: () => toast.error("Failed to assign driver"),
  });

  // Filter transfers by tab
  const filterTransfers = (tab: string) => {
    return transfers.filter((t: any) => {
      const scheduledDate = t.scheduled_datetime ? new Date(t.scheduled_datetime) : new Date(t.created_at);
      switch (tab) {
        case "upcoming":
          return isFuture(scheduledDate) && !["completed", "cancelled"].includes(t.status);
        case "today":
          return isToday(scheduledDate) && !["completed", "cancelled"].includes(t.status);
        case "completed":
          return t.status === "completed";
        case "cancelled":
          return t.status === "cancelled";
        default:
          return true;
      }
    });
  };

  const TransferCard = ({ transfer }: { transfer: any }) => {
    const scheduledDate = transfer.scheduled_datetime || transfer.created_at;
    const driver = transfer.driver;
    const isPending = transfer.status === "pending" || transfer.status === "confirmed";

    return (
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardContent className="p-4 space-y-3">
          {/* Header: status + date */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={STATUS_COLORS[transfer.status] || ""}>
              {transfer.status.replace(/_/g, " ")}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(scheduledDate), "MMM d, HH:mm")}
            </span>
          </div>

          {/* Route */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <div className="w-0.5 h-8 bg-gradient-to-b from-green-500 to-primary" />
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <p className="text-sm font-medium truncate">{transfer.pickup_location}</p>
              <p className="text-sm text-muted-foreground truncate">{transfer.dropoff_location}</p>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{transfer.num_passengers}</span>
            {transfer.num_luggage > 0 && (
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{transfer.num_luggage}</span>
            )}
            <Badge variant="outline" className="text-[10px] capitalize ml-auto">
              {transfer.vehicle_category?.replace(/_/g, " ")}
            </Badge>
            {transfer.price_quoted && (
              <span className="font-semibold text-foreground">{convertPrice(transfer.price_quoted)}</span>
            )}
          </div>

          {/* Driver info or assignment */}
          {driver ? (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{driver.full_name}</span>
              {driver.phone && <span className="text-xs text-muted-foreground ml-auto">{driver.phone}</span>}
            </div>
          ) : isPending && availableDrivers.length > 0 ? (
            assigningId === transfer.id ? (
              <Select onValueChange={(driverId) => assignDriver.mutate({ transferId: transfer.id, driverId })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select driver..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => setAssigningId(transfer.id)}
              >
                <UserCheck className="h-4 w-4" />
                Assign Driver
              </Button>
            )
          ) : null}
        </CardContent>
      </Card>
    );
  };

  const renderTabContent = (tab: string) => {
    const filtered = filterTransfers(tab);
    if (isLoading) {
      return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
    }
    if (filtered.length === 0) {
      const emptyConfig: Record<string, { icon: typeof Clock; title: string; desc: string }> = {
        upcoming: { icon: Clock, title: "No Upcoming Transfers", desc: "Future bookings will appear here" },
        today: { icon: CarTaxiFront, title: "No Transfers Today", desc: "Today's transfers will appear here" },
        completed: { icon: CheckCircle, title: "No Completed Transfers", desc: "Past transfers will appear here" },
        cancelled: { icon: XCircle, title: "No Cancelled Transfers", desc: "Cancelled bookings will appear here" },
      };
      const cfg = emptyConfig[tab] || emptyConfig.upcoming;
      return <PremiumEmptyState icon={cfg.icon} title={cfg.title} description={cfg.desc} />;
    }
    return (
      <div className="space-y-3">
        {filtered.map((t: any) => <TransferCard key={t.id} transfer={t} />)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <PremiumPageHeader title="Bookings" subtitle="Manage your transfer bookings" />
      <PremiumSection delay={0.1}>
        <PremiumTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="mt-4">
          {tabs.map((tab) => (
            <PremiumTabContent key={tab.value} value={tab.value} activeValue={activeTab}>
              {renderTabContent(tab.value)}
            </PremiumTabContent>
          ))}
        </div>
      </PremiumSection>
    </div>
  );
};

export default TransferBookingsPage;
