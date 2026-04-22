import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllMerchantProfiles, updateMerchantVerificationStatus } from "@/services/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { format, subDays } from "date-fns";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";

import { AdminTodaySnapshot } from "@/components/admin/AdminTodaySnapshot";
import { AdminVerticalGrid, VERTICALS, type VerticalStats } from "@/components/admin/AdminVerticalGrid";
import { AdminRecentActivity } from "@/components/admin/AdminRecentActivity";
import { AdminMerchantApplications } from "@/components/admin/AdminMerchantApplications";
import { AdminPlatformMetrics } from "@/components/admin/AdminPlatformMetrics";

interface RecentBooking {
  id: string;
  booking_reference: string;
  item_name: string;
  passenger_name: string;
  total_price: number;
  status: string;
  payment_status: string;
  vertical: string | null;
  created_at: string;
  booking_type: string;
}

interface TodayStats {
  bookingsToday: number;
  revenueToday: number;
  newUsersToday: number;
  pendingVerifications: number;
  billPaymentsToday: number;
  billRevenueToday: number;
  activePromos: number;
  vouchersIssued: number;
  escrowHeld: number;
  escrowReleased: number;
  totalBillVolume: number;
  totalBillCount: number;
}

const getRoleDashboardPath = (role: string) => {
  const map: Record<string, string> = {
    bus_operator: "/merchant/bus-operator",
    event_organizer: "/merchant/event-organizer",
    venue_owner: "/merchant/venue-owner",
    property_owner: "/merchant/property-owner",
    car_rental_company: "/merchant/car-rental",
    transfer_provider: "/merchant/transfers",
    workspace_provider: "/merchant/workspace",
    experience_host: "/merchant/experiences",
    airline_partner: "/merchant/airline",
    travel_agent: "/merchant/agent",
    booking_agent: "/merchant/agent",
  };
  return map[role] || "/merchant/bus-operator";
};

const getRoleLabel = (role: string) => {
  const map: Record<string, string> = {
    bus_operator: "Bus Operator",
    event_organizer: "Event Organizer",
    venue_owner: "Venue Owner",
    property_owner: "Property Owner",
    car_rental_company: "Car Rental",
    transfer_provider: "Transfers",
    workspace_provider: "Workspace",
    experience_host: "Experiences",
    airline_partner: "Airline",
    travel_agent: "Travel Agent",
    booking_agent: "Booking Agent",
  };
  return map[role] || role;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();
  const { convertPrice } = useCurrency();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [verticalStats, setVerticalStats] = useState<VerticalStats[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [activeVertical, setActiveVertical] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<"7d" | "30d">("7d");
  const [chartData, setChartData] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats>({
    bookingsToday: 0, revenueToday: 0, newUsersToday: 0, pendingVerifications: 0,
    billPaymentsToday: 0, billRevenueToday: 0, activePromos: 0, vouchersIssued: 0,
    escrowHeld: 0, escrowReleased: 0, totalBillVolume: 0, totalBillCount: 0,
  });
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0, monthlyRevenue: 0, weeklyRevenue: 0, outstandingFees: 0,
  });

  const formatCurrency = (amount: number) => convertPrice(amount);

  // --- Data Fetching ---
  const loadMerchants = async () => {
    try {
      const data = await getAllMerchantProfiles();
      setMerchants(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load merchants");
    } finally {
      setLoading(false);
    }
  };

  const loadTodayStats = async (pendingCount?: number) => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [bookingsRes, usersRes, billsRes, promosRes, vouchersRes, escrowRes, allBillsRes] = await Promise.all([
        supabase.from("bookings").select("total_price, payment_status").gte("created_at", todayStart.toISOString()),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
        supabase.from("bill_payments").select("amount, status").gte("created_at", todayStart.toISOString()),
        (supabase as any).from("promo_codes").select("id", { count: "exact", head: true }).eq("is_active", true),
        (supabase as any).from("user_vouchers").select("id", { count: "exact", head: true }),
        supabase.from("escrow_holds" as any).select("merchant_amount, status"),
        supabase.from("bill_payments").select("amount", { count: "exact" }),
      ]);

      const todayBookings = bookingsRes.data || [];
      const billPayments = billsRes.data || [];
      const escrowData = (escrowRes.data || []) as any[];
      const allBills = (allBillsRes.data || []) as any[];

      const escrowHeld = escrowData.filter((e: any) => e.status === 'pending').reduce((sum: number, e: any) => sum + (e.merchant_amount || 0), 0);
      const escrowReleased = escrowData.filter((e: any) => e.status === 'released').reduce((sum: number, e: any) => sum + (e.merchant_amount || 0), 0);
      const totalBillVolume = allBills.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);

      setTodayStats({
        bookingsToday: todayBookings.length,
        revenueToday: todayBookings
          .filter((b: any) => b.payment_status === "paid")
          .reduce((sum: number, b: any) => sum + (Number(b.total_price) || 0), 0),
        newUsersToday: usersRes.count || 0,
        pendingVerifications: pendingCount ?? 0,
        billPaymentsToday: billPayments.length,
        billRevenueToday: billPayments.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0),
        activePromos: promosRes.count || 0,
        vouchersIssued: vouchersRes.count || 0,
        escrowHeld,
        escrowReleased,
        totalBillVolume,
        totalBillCount: allBillsRes.count || 0,
      });
    } catch (error) {
      console.error("Error loading today stats:", error);
    }
  };

  const loadChartData = async () => {
    try {
      const days = chartPeriod === "7d" ? 7 : 30;
      const startDate = subDays(new Date(), days);

      const { data: bookings } = await supabase
        .from("bookings")
        .select("total_price, payment_status, created_at")
        .gte("created_at", startDate.toISOString());

      const grouped: Record<string, { date: string; revenue: number; bookings: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = subDays(new Date(), days - 1 - i);
        const key = format(d, "MMM dd");
        grouped[key] = { date: key, revenue: 0, bookings: 0 };
      }

      (bookings || []).forEach((b: any) => {
        const key = format(new Date(b.created_at), "MMM dd");
        if (grouped[key]) {
          grouped[key].bookings++;
          if (b.payment_status === "paid") {
            grouped[key].revenue += Number(b.total_price) || 0;
          }
        }
      });

      setChartData(Object.values(grouped));
    } catch (error) {
      console.error("Error loading chart data:", error);
    }
  };

  const loadRevenueStats = async () => {
    try {
      const monthAgo = subDays(new Date(), 30);
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("platform_fee_amount, created_at")
        .eq("payment_status", "completed")
        .gte("created_at", monthAgo.toISOString());
      if (error) throw error;

      const weekAgo = subDays(new Date(), 7);
      const stats = { totalRevenue: 0, monthlyRevenue: 0, weeklyRevenue: 0, outstandingFees: 0 };
      (transactions || []).forEach((tx: any) => {
        const fee = tx.platform_fee_amount || 0;
        const d = new Date(tx.created_at);
        stats.totalRevenue += fee;
        stats.monthlyRevenue += fee;
        if (d >= weekAgo) stats.weeklyRevenue += fee;
      });

      // Also get all-time total for platform fees display
      const { data: allTimeFees } = await supabase
        .from("transactions")
        .select("platform_fee_amount")
        .eq("payment_status", "completed");
      if (allTimeFees) {
        stats.totalRevenue = allTimeFees.reduce((sum: number, tx: any) => sum + (tx.platform_fee_amount || 0), 0);
      }

      setRevenueStats(stats);
    } catch (error) {
      console.error("Error loading revenue stats:", error);
    }
  };

  const loadVerticalStats = async () => {
    try {
      // Use count-based queries per vertical instead of fetching all rows
      const grouped: Record<string, VerticalStats> = {};
      VERTICALS.forEach((v) => {
        grouped[v.key] = {
          vertical: v.key, totalBookings: 0, confirmed: 0, pending: 0, cancelled: 0, totalRevenue: 0, paidCount: 0,
        };
      });

      // Fetch recent bookings (last 90 days) to avoid unbounded queries
      const ninetyDaysAgo = subDays(new Date(), 90);
      const { data, error } = await supabase
        .from("bookings")
        .select("vertical, status, payment_status, total_price")
        .gte("created_at", ninetyDaysAgo.toISOString());
      if (error) throw error;

      (data || []).forEach((b: any) => {
        const vKey = b.vertical || "bus";
        if (!grouped[vKey]) {
          grouped[vKey] = { vertical: vKey, totalBookings: 0, confirmed: 0, pending: 0, cancelled: 0, totalRevenue: 0, paidCount: 0 };
        }
        const s = grouped[vKey];
        s.totalBookings++;
        if (b.status === "confirmed") s.confirmed++;
        if (b.status === "pending") s.pending++;
        if (b.status === "cancelled") s.cancelled++;
        if (b.payment_status === "paid") {
          s.totalRevenue += Number(b.total_price) || 0;
          s.paidCount++;
        }
      });

      setVerticalStats(Object.values(grouped));
    } catch (error) {
      console.error("Error loading vertical stats:", error);
    }
  };

  const loadRecentBookings = async (vertical?: string) => {
    try {
      let query = supabase
        .from("bookings")
        .select("id, booking_reference, item_name, passenger_name, total_price, status, payment_status, vertical, created_at, booking_type")
        .order("created_at", { ascending: false })
        .limit(50);

      if (vertical) query = query.eq("vertical", vertical);
      const { data, error } = await query;
      if (error) throw error;
      setRecentBookings(data || []);
    } catch (error) {
      console.error("Error loading recent bookings:", error);
    }
  };

  // --- Initial Load ---
  useEffect(() => {
    const init = async () => {
      const data = await getAllMerchantProfiles().catch(() => []);
      setMerchants(data);
      setLoading(false);

      const pendingCount = data.filter((m: any) => m.verification_status === "pending").length;
      // Load today stats with pending count to avoid flicker
      loadTodayStats(pendingCount);
      loadRevenueStats();
      loadVerticalStats();
      loadRecentBookings();
      loadChartData();
    };
    init();
  }, []);

  useEffect(() => { loadChartData(); }, [chartPeriod]);
  useEffect(() => { loadRecentBookings(activeVertical || undefined); }, [activeVertical]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const search = async () => {
        const { data } = await supabase
          .from("merchant_profiles")
          .select("*")
          .or(`business_name.ilike.%${searchQuery}%,business_email.ilike.%${searchQuery}%`)
          .limit(10);
        setSearchResults(data || []);
      };
      search();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleImpersonate = async (merchant: any) => {
    try {
      const reason = prompt("Enter reason for impersonation:");
      if (!reason) return;
      await startImpersonation(merchant, reason);
      navigate(getRoleDashboardPath(merchant.role));
    } catch (error) {
      console.error("Error starting impersonation:", error);
    }
  };

  const handleVerify = async (merchantId: string, status: "verified" | "rejected") => {
    try {
      await updateMerchantVerificationStatus(merchantId, status);
      toast.success(`Merchant ${status === "verified" ? "approved" : "rejected"} successfully`);
      const data = await getAllMerchantProfiles();
      setMerchants(data);
      setTodayStats(prev => ({
        ...prev,
        pendingVerifications: data.filter((m: any) => m.verification_status === "pending").length,
      }));
    } catch (error: any) {
      toast.error(error.message || "Failed to update merchant status");
    }
  };

  // Pie chart data
  const pieData = useMemo(() => {
    return verticalStats
      .filter(v => v.totalBookings > 0)
      .map(v => {
        const vert = VERTICALS.find(x => x.key === v.vertical);
        return { name: vert?.label || v.vertical, value: v.totalBookings, color: vert?.color || "hsl(var(--muted))" };
      });
  }, [verticalStats]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Master Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time platform overview across all {VERTICALS.length} verticals
          </p>
        </div>
        <div className="relative w-full sm:w-80 lg:w-96">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search merchants..." className="pl-10" />
          </div>
          {searchResults.length > 0 && (
            <Card className="absolute top-full mt-2 w-full z-50 max-h-80 overflow-y-auto shadow-md">
              <CardContent className="p-2">
                {searchResults.map((merchant) => (
                  <div key={merchant.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{merchant.business_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{merchant.business_email}</p>
                      <Badge variant="outline" className="text-xs mt-1">{getRoleLabel(merchant.role)}</Badge>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleImpersonate(merchant)} className="w-full sm:w-auto">
                      <Eye className="h-4 w-4 mr-2" />Access
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Today's Snapshot */}
      <AdminTodaySnapshot stats={todayStats} formatCurrency={formatCurrency} />

      {/* Revenue & Booking Trends + Vertical Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Revenue & Booking Trends</CardTitle>
              <div className="flex gap-1">
                <Button size="sm" variant={chartPeriod === "7d" ? "default" : "outline"} onClick={() => setChartPeriod("7d")} className="text-xs h-7 px-2">7D</Button>
                <Button size="sm" variant={chartPeriod === "30d" ? "default" : "outline"} onClick={() => setChartPeriod("30d")} className="text-xs h-7 px-2">30D</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Legend />
                <Bar yAxisId="left" dataKey="bookings" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Bookings" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vertical Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data yet</p>
            )}
            <div className="mt-2 space-y-1">
              {pieData.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground truncate">{d.name}</span>
                  </div>
                  <span className="font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Metrics */}
      <AdminPlatformMetrics
        verticalStats={verticalStats}
        merchants={merchants}
        revenueStats={revenueStats}
        formatCurrency={formatCurrency}
      />

      {/* Vertical Services Grid */}
      <AdminVerticalGrid
        verticalStats={verticalStats}
        activeVertical={activeVertical}
        onVerticalClick={setActiveVertical}
        formatCurrency={formatCurrency}
      />

      {/* Recent Activity */}
      <AdminRecentActivity
        bookings={recentBookings}
        activeVertical={activeVertical}
        onClearFilter={() => setActiveVertical(null)}
        formatCurrency={formatCurrency}
      />

      {/* Merchant Applications (replaces duplicate verification status cards) */}
      <AdminMerchantApplications
        merchants={merchants}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onVerify={handleVerify}
        onImpersonate={handleImpersonate}
        getRoleLabel={getRoleLabel}
      />
    </div>
  );
};

export default AdminDashboard;
