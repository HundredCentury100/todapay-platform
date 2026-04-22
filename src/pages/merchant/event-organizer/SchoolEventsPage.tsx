import { useEffect, useState } from "react";
import MerchantLayout from "@/components/merchant/layout/MerchantLayout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getSchoolEvents } from "@/services/organizerService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, School, Users, Calendar, MapPin } from "lucide-react";

const SchoolEventsPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSchoolEvents();
  }, []);

  const loadSchoolEvents = async () => {
    try {
      const data = await getSchoolEvents();
      setEvents(data);
    } catch (error) {
      console.error("Error loading school events:", error);
      toast({
        title: "Error",
        description: "Failed to load school events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = events.reduce(
    (sum, event) => sum + (event.bookings?.[0]?.count || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">School Events</h1>
          <p className="text-muted-foreground">
            Manage school trips, excursions, and educational events
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <School className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">School Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Events</p>
                <p className="text-2xl font-bold">
                  {events.filter((e) => new Date(e.event_date) > new Date()).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">School Events List</h2>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Grade Levels</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Supervision</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No school events found
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>{event.school_name}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {event.grade_levels?.map((grade: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {grade}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(event.event_date).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">{event.event_time}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="text-sm">{event.venue}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {event.bookings?.[0]?.count || 0} students
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{event.supervision_ratio || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={event.status === "active" ? "default" : "secondary"}
                          >
                            {event.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">School Event Features</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Permission Slips</h3>
              <p className="text-sm text-muted-foreground">
                Automated permission slip generation and tracking for student attendance
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Supervision Management</h3>
              <p className="text-sm text-muted-foreground">
                Track teacher-to-student ratios and supervision requirements
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Group Bookings</h3>
              <p className="text-sm text-muted-foreground">
                Special pricing and management for school group bookings
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Check-out System</h3>
              <p className="text-sm text-muted-foreground">
                Secure student pick-up verification with guardian authentication
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SchoolEventsPage;
