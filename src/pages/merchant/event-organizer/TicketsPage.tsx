import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getOrganizerEvents } from "@/services/organizerService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Ticket, Plus, Edit, Package } from "lucide-react";
import { formatCurrency } from "@/utils/dateFormatters";
import { TicketTierDialog } from "@/components/merchant/TicketTierDialog";
import { EventAddonDialog } from "@/components/merchant/EventAddonDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TicketsPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [ticketTiers, setTicketTiers] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<any>(undefined);
  const [selectedAddon, setSelectedAddon] = useState<any>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      const event = events.find((e) => e.id === selectedEvent);
      setTicketTiers(event?.event_ticket_tiers || []);
      loadAddons();
    }
  }, [selectedEvent, events]);

  const loadAddons = async () => {
    if (!selectedEvent) return;
    
    try {
      const { data, error } = await supabase
        .from('event_addons')
        .select('*')
        .eq('event_id', selectedEvent);

      if (error) throw error;
      setAddons(data || []);
    } catch (error) {
      console.error("Error loading addons:", error);
    }
  };

  const loadEvents = async () => {
    try {
      const data = await getOrganizerEvents();
      setEvents(data);
      if (data.length > 0) {
        setSelectedEvent(data[0].id);
      }
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedEventData = events.find((e) => e.id === selectedEvent);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ticket Management</h1>
          <p className="text-muted-foreground">Create and manage ticket tiers and add-ons for your events</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setSelectedTier(undefined); setTierDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Ticket Tier
          </Button>
          <Button variant="outline" onClick={() => { setSelectedAddon(undefined); setAddonDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event Add-On
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <Label className="mb-2 block">Select Event</Label>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name} - {new Date(event.event_date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEventData && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">{selectedEventData.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(selectedEventData.event_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Time</p>
                <p className="font-medium">{selectedEventData.event_time}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Venue</p>
                <p className="font-medium">{selectedEventData.venue}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={selectedEventData.status === "active" ? "default" : "secondary"}>
                  {selectedEventData.status}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="tiers" className="w-full">
            <TabsList>
              <TabsTrigger value="tiers">Ticket Tiers</TabsTrigger>
              <TabsTrigger value="addons">Event Add-Ons</TabsTrigger>
            </TabsList>

            <TabsContent value="tiers" className="space-y-4">
              <div className="mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Ticket Tiers</h2>
              </div>
              <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketTiers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No ticket tiers found for this event
                      </TableCell>
                    </TableRow>
                  ) : (
                    ticketTiers.map((tier) => {
                      const sold = tier.total_tickets - tier.available_tickets;
                      const soldPercentage = (sold / tier.total_tickets) * 100;

                      return (
                        <TableRow key={tier.id}>
                          <TableCell className="font-medium">{tier.name}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {tier.description || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(tier.price)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={tier.available_tickets > 0 ? "default" : "destructive"}>
                              {tier.available_tickets}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{tier.total_tickets}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium">{sold}</span>
                              <span className="text-xs text-muted-foreground">
                                {soldPercentage.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedTier(tier);
                                setTierDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            </TabsContent>

            <TabsContent value="addons" className="space-y-4">
              <div className="mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Event Add-Ons</h2>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Add-On Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Available Qty</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No add-ons found for this event
                        </TableCell>
                      </TableRow>
                    ) : (
                      addons.map((addon) => (
                        <TableRow key={addon.id}>
                          <TableCell className="font-medium">{addon.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{addon.type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {addon.description || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(addon.price)}
                          </TableCell>
                          <TableCell className="text-right">
                            {addon.available_quantity || "Unlimited"}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedAddon(addon);
                                setAddonDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Ticket Tier Features</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Dynamic Pricing</h3>
            <p className="text-sm text-muted-foreground">
              Set different prices for early bird, regular, and last-minute tickets
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Seat Mapping</h3>
            <p className="text-sm text-muted-foreground">
              Assign specific seating sections or areas to each ticket tier
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Family Pricing</h3>
            <p className="text-sm text-muted-foreground">
              Offer special rates for families and group bookings
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Student Discounts</h3>
            <p className="text-sm text-muted-foreground">
              Create student-only tiers with verification requirements
            </p>
          </div>
        </div>
      </Card>

      <TicketTierDialog
        open={tierDialogOpen}
        onOpenChange={setTierDialogOpen}
        eventId={selectedEvent}
        tier={selectedTier}
        onSuccess={() => {
          loadEvents();
          loadAddons();
        }}
      />

      <EventAddonDialog
        open={addonDialogOpen}
        onOpenChange={setAddonDialogOpen}
        eventId={selectedEvent}
        addon={selectedAddon}
        onSuccess={loadAddons}
      />
    </div>
  );
};

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={className}>{children}</label>
);

export default TicketsPage;
