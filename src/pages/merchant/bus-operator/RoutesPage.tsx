import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getOperatorSchedules, getOperatorFleet, deleteBus } from "@/services/operatorService";
import { toast } from "sonner";
import { Loader2, Bus, MapPin, Calendar, Plus, Pencil, Trash2, Route, LayoutGrid } from "lucide-react";
import { formatCurrency } from "@/utils/dateFormatters";
import { BusDialog } from "@/components/merchant/BusDialog";
import { RouteDialog } from "@/components/merchant/RouteDialog";
import { SeatLayoutEditor } from "@/components/merchant/SeatLayoutEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RoutesPage = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busDialogOpen, setBusDialogOpen] = useState(false);
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<any>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [busToDelete, setBusToDelete] = useState<string | null>(null);
  const [seatLayoutOpen, setSeatLayoutOpen] = useState(false);
  const [seatLayoutBus, setSeatLayoutBus] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedulesData, fleetData] = await Promise.all([
        getOperatorSchedules(),
        getOperatorFleet(),
      ]);
      setSchedules(schedulesData);
      setFleet(fleetData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load routes and fleet");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBus = () => {
    setSelectedBus(undefined);
    setBusDialogOpen(true);
  };

  const handleEditBus = (bus: any) => {
    setSelectedBus(bus);
    setBusDialogOpen(true);
  };

  const handleDeleteBus = async () => {
    if (!busToDelete) return;

    try {
      await deleteBus(busToDelete);
      toast.success('Bus deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting bus:', error);
      toast.error('Failed to delete bus');
    } finally {
      setDeleteDialogOpen(false);
      setBusToDelete(null);
    }
  };

  const uniqueRoutes = Array.from(
    new Set(schedules.map((s) => `${s.from_location} → ${s.to_location}`))
  );

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Routes & Fleet Management</h1>
          <p className="text-muted-foreground">Manage your routes and bus fleet</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <MapPin className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Active Routes</p>
                <p className="text-2xl font-bold">{uniqueRoutes.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Bus className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Fleet</p>
                <p className="text-2xl font-bold">{fleet.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Active Schedules</p>
                <p className="text-2xl font-bold">{schedules.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="routes" className="w-full">
          <TabsList>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="fleet">Fleet</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
          </TabsList>

          <TabsContent value="routes">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Route Management</h3>
                <Button onClick={() => setRouteDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Route
                </Button>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {uniqueRoutes.map((route, index) => {
                    const routeSchedules = schedules.filter(
                      (s) => `${s.from_location} → ${s.to_location}` === route
                    );
                    const avgPrice =
                      routeSchedules.reduce((sum, s) => sum + Number(s.base_price), 0) /
                      routeSchedules.length;

                    return (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{route}</h3>
                            <p className="text-sm text-muted-foreground">
                              {routeSchedules.length} active schedules
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Average Price</p>
                            <p className="font-semibold">{formatCurrency(avgPrice)}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="fleet">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Fleet Management</h3>
                <Button onClick={handleAddBus}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bus
                </Button>
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
                        <TableHead>Operator</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Total Seats</TableHead>
                        <TableHead>Amenities</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fleet.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No buses found
                          </TableCell>
                        </TableRow>
                      ) : (
                        fleet.map((bus) => (
                          <TableRow key={bus.id}>
                            <TableCell className="font-medium">{bus.operator}</TableCell>
                            <TableCell>{bus.type}</TableCell>
                            <TableCell>{bus.total_seats}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {bus.amenities?.map((amenity: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {amenity}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEditBus(bus)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSeatLayoutBus(bus);
                                    setSeatLayoutOpen(true);
                                  }}
                                  title="Configure seat layout"
                                >
                                  <LayoutGrid className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setBusToDelete(bus.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="schedules">
            <Card className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead>Arrival</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Available Seats</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No schedules found
                          </TableCell>
                        </TableRow>
                      ) : (
                        schedules.map((schedule) => (
                          <TableRow key={schedule.id}>
                            <TableCell className="font-medium">
                              {schedule.from_location} → {schedule.to_location}
                            </TableCell>
                            <TableCell>
                              {new Date(schedule.available_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{schedule.departure_time}</TableCell>
                            <TableCell>{schedule.arrival_time}</TableCell>
                            <TableCell>{schedule.duration}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{schedule.available_seats}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(schedule.base_price)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BusDialog
        open={busDialogOpen}
        onOpenChange={setBusDialogOpen}
        bus={selectedBus}
        operatorName={fleet[0]?.operator || ''}
        onSuccess={loadData}
      />

      <RouteDialog
        open={routeDialogOpen}
        onOpenChange={setRouteDialogOpen}
        onSuccess={loadData}
      />

      {seatLayoutBus && (
        <SeatLayoutEditor
          open={seatLayoutOpen}
          onOpenChange={setSeatLayoutOpen}
          busId={seatLayoutBus.id}
          currentSeats={seatLayoutBus.total_seats}
          onSuccess={loadData}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bus</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bus? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBus}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoutesPage;
