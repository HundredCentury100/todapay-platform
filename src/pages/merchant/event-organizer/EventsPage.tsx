import { useEffect, useState } from "react";
import { getOrganizerEvents, updateEvent } from "@/services/organizerService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Calendar, MapPin, Ticket, Edit, Trash2, ExternalLink, LayoutGrid, List, Image } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { EventDialog } from "@/components/merchant/EventDialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const EventsPage = () => {
  const { convertPrice } = useCurrency();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const loadEvents = async () => {
    try {
      const data = await getOrganizerEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const handleEdit = (event: any) => { setSelectedEvent(event); setDialogOpen(true); };
  const handleAdd = () => { setSelectedEvent(undefined); setDialogOpen(true); };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventToDelete);
      if (error) throw error;
      toast.success("Event deleted successfully");
      loadEvents();
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete event");
    }
  };

  const handleStatusToggle = async (eventId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateEvent(eventId, { status: newStatus });
      toast.success(`Event ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      loadEvents();
    } catch (error: any) {
      toast.error(error.message || "Failed to update event");
    }
  };

  // Listing quality score calculation
  const getQualityScore = (event: any) => {
    const checks = [
      { done: (event.images?.length || (event.image ? 1 : 0)) >= 1 },
      { done: (event.description?.length || 0) >= 50 },
      { done: (event.event_ticket_tiers?.length || 0) >= 1 },
      { done: !!event.venue },
      { done: !!event.location },
    ];
    const completed = checks.filter(c => c.done).length;
    return Math.round((completed / checks.length) * 100);
  };

  if (loading) return <div>Loading events...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage your events and ticket sales</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg">
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('table')}>
              <List className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'card' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('card')}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">Create your first event to start selling tickets</p>
            <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-2" />Create Event</Button>
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const totalTickets = event.event_ticket_tiers?.reduce((s: number, t: any) => s + t.total_tickets, 0) || 0;
            const availableTickets = event.event_ticket_tiers?.reduce((s: number, t: any) => s + t.available_tickets, 0) || 0;
            const score = getQualityScore(event);

            return (
              <Card key={event.id} className="overflow-hidden">
                <div className="h-40 bg-muted relative">
                  {event.image || event.images?.[0] ? (
                    <img src={event.images?.[0] || event.image} alt={event.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2" variant={event.status === 'active' ? 'default' : 'secondary'}>
                    {event.status}
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold">{event.name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{format(new Date(event.event_date), 'MMM dd, yyyy')}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{event.venue}</div>
                    <div className="flex items-center gap-1.5"><Ticket className="w-3.5 h-3.5" />{availableTickets}/{totalTickets} tickets</div>
                  </div>
                  {/* Quality Score */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Listing quality</span>
                      <span className={score >= 80 ? "text-green-600 font-semibold" : score >= 50 ? "text-amber-600 font-semibold" : "text-red-500 font-semibold"}>{score}%</span>
                    </div>
                    <Progress value={score} className="h-1.5" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(event)}>
                      <Edit className="w-3.5 h-3.5 mr-1" />Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(`/events/${event.id}`, '_blank')}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => { setEventToDelete(event.id); setDeleteDialogOpen(true); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Events</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const totalTickets = event.event_ticket_tiers?.reduce((s: number, t: any) => s + t.total_tickets, 0) || 0;
                  const availableTickets = event.event_ticket_tiers?.reduce((s: number, t: any) => s + t.available_tickets, 0) || 0;
                  const score = getQualityScore(event);

                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">{event.name}</div>
                        <div className="text-sm text-muted-foreground">{event.type}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div>{format(new Date(event.event_date), 'MMM dd, yyyy')}</div>
                            <div className="text-sm text-muted-foreground">{event.event_time}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div>{event.venue}</div>
                            <div className="text-sm text-muted-foreground">{event.location}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-muted-foreground" />
                          <span>{availableTickets}/{totalTickets}</span>
                          {availableTickets === 0 && <Badge variant="destructive" className="text-xs">Sold Out</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={score} className="h-1.5 w-16" />
                          <span className="text-xs font-medium">{score}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>{event.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>
                            <Edit className="w-4 h-4 mr-1" />Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => window.open(`/events/${event.id}`, '_blank')}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button variant={event.status === 'active' ? 'secondary' : 'default'} size="sm" onClick={() => handleStatusToggle(event.id, event.status)}>
                            {event.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => { setEventToDelete(event.id); setDeleteDialogOpen(true); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <EventDialog open={dialogOpen} onOpenChange={setDialogOpen} event={selectedEvent} onSuccess={loadEvents} />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventsPage;
