import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getOrganizerEvents } from "@/services/organizerService";
import { toast } from "sonner";
import { Loader2, FileText, Download, Users, DollarSign, Star, BarChart3, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";

interface ReportData {
  event: any;
  totalBookings: number;
  totalRevenue: number;
  checkedIn: number;
  noShows: number;
  tierBreakdown: { name: string; count: number; revenue: number }[];
  avgRating: number;
  reviewCount: number;
  peakCheckInHour: string;
  refundedCount: number;
  refundedAmount: number;
}

const PostEventReportPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => { if (selectedEventId) generateReport(); }, [selectedEventId]);

  const loadEvents = async () => {
    try { const data = await getOrganizerEvents(); setEvents(data || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const event = events.find(e => e.id === selectedEventId);
      if (!event) return;

      // Bookings
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("item_id", selectedEventId)
        .eq("booking_type", "event");

      const confirmed = bookings?.filter(b => b.status === "confirmed") || [];
      const refunded = bookings?.filter(b => b.status === "cancelled" || b.refund_status === "refunded") || [];

      // Tiers
      const { data: tiers } = await supabase
        .from("event_ticket_tiers")
        .select("id, name, price")
        .eq("event_id", selectedEventId);

      const tierBreakdown = (tiers || []).map(tier => {
        const tierBookings = confirmed.filter(b => {
          const catData = b.category_specific_data as any;
          return catData?.ticket_tier_id === tier.id;
        });
        return {
          name: tier.name,
          count: tierBookings.length,
          revenue: tierBookings.reduce((s, b) => s + (b.total_price || 0), 0),
        };
      });

      // Reviews
      const { data: reviews } = await supabase
        .from("event_reviews")
        .select("rating")
        .eq("event_id", selectedEventId);

      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;

      // Check-in analysis
      const checkedInBookings = confirmed.filter(b => b.checked_in);
      let peakHour = "N/A";
      if (checkedInBookings.length > 0) {
        const hourCounts: Record<string, number> = {};
        checkedInBookings.forEach(b => {
          if (b.checked_in_at) {
            const hour = format(new Date(b.checked_in_at), "HH:00");
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
          }
        });
        const maxHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
        if (maxHour) peakHour = maxHour[0];
      }

      setReportData({
        event,
        totalBookings: confirmed.length,
        totalRevenue: confirmed.reduce((s, b) => s + (b.total_price || 0), 0),
        checkedIn: checkedInBookings.length,
        noShows: confirmed.length - checkedInBookings.length,
        tierBreakdown,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews?.length || 0,
        peakCheckInHour: peakHour,
        refundedCount: refunded.length,
        refundedAmount: refunded.reduce((s, b) => s + (b.total_price || 0), 0),
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const { event } = reportData;
    let y = 20;

    doc.setFontSize(20);
    doc.text("Post-Event Report", 20, y);
    y += 12;

    doc.setFontSize(14);
    doc.text(event.name, 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${event.event_date} • Location: ${event.location || "N/A"} • Venue: ${event.venue || "N/A"}`, 20, y);
    y += 12;

    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text("Summary", 20, y); y += 8;

    doc.setFontSize(10);
    const summaryLines = [
      `Total Attendees: ${reportData.totalBookings}`,
      `Checked In: ${reportData.checkedIn} (${reportData.totalBookings > 0 ? Math.round((reportData.checkedIn / reportData.totalBookings) * 100) : 0}%)`,
      `No-Shows: ${reportData.noShows}`,
      `Total Revenue: $${reportData.totalRevenue.toLocaleString()}`,
      `Average Rating: ${reportData.avgRating}/5 (${reportData.reviewCount} reviews)`,
      `Peak Check-In Hour: ${reportData.peakCheckInHour}`,
      `Refunds: ${reportData.refundedCount} ($${reportData.refundedAmount.toLocaleString()})`,
    ];
    summaryLines.forEach(line => { doc.text(line, 25, y); y += 6; });
    y += 6;

    doc.setFontSize(12);
    doc.text("Ticket Tier Breakdown", 20, y); y += 8;
    doc.setFontSize(10);
    reportData.tierBreakdown.forEach(tier => {
      doc.text(`${tier.name}: ${tier.count} tickets — $${tier.revenue.toLocaleString()}`, 25, y);
      y += 6;
    });

    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated on ${format(new Date(), "PPpp")} by FulTicket`, 20, y);

    doc.save(`${event.name.replace(/\s+/g, "_")}_Report.pdf`);
    toast.success("PDF downloaded");
  };

  const checkInRate = reportData && reportData.totalBookings > 0
    ? Math.round((reportData.checkedIn / reportData.totalBookings) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Post-Event Reports</h1>
          <p className="text-muted-foreground">Generate analytics summaries for completed events</p>
        </div>
        {reportData && (
          <Button onClick={downloadPDF}>
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
        )}
      </div>

      <div>
        <Label>Event</Label>
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="max-w-md"><SelectValue placeholder="Select event" /></SelectTrigger>
          <SelectContent>
            {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {generating && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Generating report...</span>
        </div>
      )}

      {reportData && !generating && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Attendees", value: reportData.totalBookings, icon: Users, color: "text-primary" },
              { label: "Revenue", value: `$${reportData.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500" },
              { label: "Check-in Rate", value: `${checkInRate}%`, icon: CheckCircle, color: "text-amber-500" },
              { label: "Avg Rating", value: `${reportData.avgRating}/5`, icon: Star, color: "text-violet-500" },
            ].map(kpi => (
              <Card key={kpi.label} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </Card>
            ))}
          </div>

          {/* Tier Breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-base">Ticket Tier Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.tierBreakdown.map(tier => {
                  const pct = reportData.totalBookings > 0 ? (tier.count / reportData.totalBookings) * 100 : 0;
                  return (
                    <div key={tier.name} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-32 truncate">{tier.name}</span>
                      <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-16 text-right">{tier.count}</span>
                      <span className="text-sm text-muted-foreground w-24 text-right">${tier.revenue.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-3">Check-in Analytics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Checked In</span><span className="font-medium">{reportData.checkedIn}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">No-Shows</span><span className="font-medium">{reportData.noShows}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Peak Hour</span><span className="font-medium">{reportData.peakCheckInHour}</span></div>
              </div>
            </Card>
            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-3">Financial Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Gross Revenue</span><span className="font-medium">${reportData.totalRevenue.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Refunds</span><span className="font-medium text-destructive">-${reportData.refundedAmount.toLocaleString()}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="font-semibold">Net Revenue</span><span className="font-bold">${(reportData.totalRevenue - reportData.refundedAmount).toLocaleString()}</span></div>
              </div>
            </Card>
          </div>
        </>
      )}

      {!selectedEventId && (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Select an event to generate its post-event report</p>
        </Card>
      )}
    </div>
  );
};

export default PostEventReportPage;
