import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getOrganizerEvents } from "@/services/organizerService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, List, Mail, CheckCircle } from "lucide-react";

interface WaitlistEntry {
  id: string;
  email: string;
  event_id: string;
  ticket_tier_id: string | null;
  notified: boolean;
  created_at: string;
  user_id: string | null;
}

const WaitlistPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadWaitlist();
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      const data = await getOrganizerEvents();
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    }
  };

  const loadWaitlist = async () => {
    setLoading(true);
    try {
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, organizer')
        .eq('organizer', (await supabase.auth.getUser()).data.user?.id || '');

      if (!eventsData || eventsData.length === 0) {
        setWaitlist([]);
        return;
      }

      const eventIds = eventsData.map(e => e.id);

      let query = supabase
        .from('event_waitlist')
        .select('*')
        .in('event_id', eventIds);

      if (selectedEvent !== "all") {
        query = query.eq('event_id', selectedEvent);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setWaitlist(data || []);
    } catch (error) {
      console.error("Error loading waitlist:", error);
      toast({
        title: "Error",
        description: "Failed to load waitlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('event_waitlist')
        .update({ notified: true })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Notification Sent",
        description: "Customer has been notified about ticket availability",
      });
      await loadWaitlist();
    } catch (error) {
      console.error("Error notifying customer:", error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  const notifiedCount = waitlist.filter(w => w.notified).length;
  const pendingCount = waitlist.filter(w => !w.notified).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Waitlist Management</h1>
        <p className="text-muted-foreground">
          Manage customers waiting for sold-out events
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <List className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Waitlist</p>
              <p className="text-2xl font-bold">{waitlist.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Mail className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Notified</p>
              <p className="text-2xl font-bold">{notifiedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name} - {new Date(event.event_date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitlist.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No waitlist entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  waitlist.map((entry) => {
                    const event = events.find(e => e.id === entry.event_id);
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.email}</TableCell>
                        <TableCell>{event?.name || "Unknown Event"}</TableCell>
                        <TableCell>
                          {new Date(entry.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {entry.notified ? (
                            <Badge className="bg-green-600">Notified</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!entry.notified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleNotify(entry.id)}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Notify
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Waitlist Features</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Automatic Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Automatically notify customers when tickets become available
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Priority Access</h3>
            <p className="text-sm text-muted-foreground">
              Give waitlist customers first access to newly released tickets
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Tier-Specific Waitlist</h3>
            <p className="text-sm text-muted-foreground">
              Customers can join waitlists for specific ticket tiers
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Email Templates</h3>
            <p className="text-sm text-muted-foreground">
              Customize notification emails with your branding
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WaitlistPage;
