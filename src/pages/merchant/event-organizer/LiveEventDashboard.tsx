import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getOrganizerEvents } from "@/services/organizerService";
import { toast } from "sonner";
import { Loader2, Radio, Users, DollarSign, TrendingUp, AlertTriangle, Clock, RefreshCw, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { AnimatedCounter } from "@/components/ui/micro-interactions";

const LiveEventDashboard = () => {
  const { eventId: routeEventId } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(routeEventId || "");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Live data
  const [totalBookings, setTotalBookings] = useState(0);
  const [checkedIn, setCheckedIn] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);
  const [staffOnline, setStaffOnline] = useState(0);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => {
    if (selectedEventId) {
      const ev = events.find(e => e.id === selectedEventId);
      setSelectedEvent(ev);
      fetchLiveData();
    }
  }, [selectedEventId, events]);

  // Auto-refresh every 10s
  useEffect(() => {
    if (!selectedEventId) return;
    const interval = setInterval(() => {
      fetchLiveData();
      setLastRefresh(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const data = await getOrganizerEvents();
      setEvents(data || []);
      if (routeEventId) {
        setSelectedEventId(routeEventId);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchLiveData = useCallback(async () => {
    if (!selectedEventId) return;

    // Get bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, total_price, checked_in, checked_in_at, passenger_name, status, ticket_quantity")
      .eq("item_id", selectedEventId)
      .eq("booking_type", "event");

    const confirmedBookings = bookings?.filter(b => b.status === "confirmed") || [];
    setTotalBookings(confirmedBookings.length);
    setCheckedIn(confirmedBookings.filter(b => b.checked_in).length);
    setTotalRevenue(confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0));

    // Recent check-ins (last 30 mins)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60000).toISOString();
    const recent = confirmedBookings
      .filter(b => b.checked_in && b.checked_in_at && b.checked_in_at >= thirtyMinsAgo)
      .sort((a, b) => (b.checked_in_at || "").localeCompare(a.checked_in_at || ""))
      .slice(0, 10);
    setRecentCheckIns(recent);

    // Capacity from tiers
    const { data: tiers } = await supabase
      .from("event_ticket_tiers")
      .select("total_tickets")
      .eq("event_id", selectedEventId);
    const cap = tiers?.reduce((sum, t) => sum + (t.total_tickets || 0), 0) || 0;
    setTotalCapacity(cap);

    // Staff count
    const { count: staffCount } = await supabase
      .from("event_staff")
      .select("id", { count: "exact", head: true })
      .eq("event_id", selectedEventId)
      .eq("status", "checked_in");
    setStaffOnline(staffCount || 0);

    // Alerts
    const newAlerts: string[] = [];
    const capacityPct = cap > 0 ? (confirmedBookings.length / cap) * 100 : 0;
    if (capacityPct >= 90) newAlerts.push("⚠️ Venue at 90%+ capacity!");
    if (capacityPct >= 75 && capacityPct < 90) newAlerts.push("📊 75%+ capacity reached");
    if ((staffCount || 0) === 0) newAlerts.push("👥 No staff checked in yet");
    setAlerts(newAlerts);
  }, [selectedEventId]);

  const capacityPct = totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0;
  const checkInRate = totalBookings > 0 ? Math.round((checkedIn / totalBookings) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-6 h-6 text-red-500" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Live Event Dashboard</h1>
            <p className="text-xs text-muted-foreground">Auto-refreshes every 10s • Last: {format(lastRefresh, "HH:mm:ss")}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchLiveData(); setLastRefresh(new Date()); }}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {!routeEventId && (
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="max-w-md"><SelectValue placeholder="Select event" /></SelectTrigger>
          <SelectContent>
            {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {selectedEventId && (
        <>
          {/* Alerts */}
          <AnimatePresence>
            {alerts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {alerts.map((alert, i) => (
                  <Card key={i} className="p-3 border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>{alert}</span>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Attendees</span>
              </div>
              <p className="text-2xl font-bold"><AnimatedCounter value={totalBookings} /></p>
              <p className="text-xs text-muted-foreground">of {totalCapacity} capacity</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Checked In</span>
              </div>
              <p className="text-2xl font-bold"><AnimatedCounter value={checkedIn} /></p>
              <p className="text-xs text-muted-foreground">{checkInRate}% rate</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Revenue</span>
              </div>
              <p className="text-2xl font-bold">$<AnimatedCounter value={totalRevenue} /></p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-violet-500" />
                <span className="text-xs text-muted-foreground">Capacity</span>
              </div>
              <p className="text-2xl font-bold">{capacityPct}%</p>
              <Progress value={capacityPct} className="mt-1 h-2" />
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Staff Online</span>
              </div>
              <p className="text-2xl font-bold"><AnimatedCounter value={staffOnline} /></p>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Recent Check-Ins
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentCheckIns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent check-ins</p>
                ) : (
                  <div className="space-y-2">
                    {recentCheckIns.map((ci, i) => (
                      <motion.div
                        key={ci.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between py-1.5 border-b last:border-0"
                      >
                        <span className="text-sm font-medium">{ci.passenger_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {ci.checked_in_at ? format(new Date(ci.checked_in_at), "HH:mm") : ""}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Check-in Progress Ring */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Check-in Progress</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-6">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <motion.circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${checkInRate * 2.64} ${264 - checkInRate * 2.64}`}
                      initial={{ strokeDasharray: "0 264" }}
                      animate={{ strokeDasharray: `${checkInRate * 2.64} ${264 - checkInRate * 2.64}` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{checkInRate}%</span>
                    <span className="text-xs text-muted-foreground">{checkedIn}/{totalBookings}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default LiveEventDashboard;
