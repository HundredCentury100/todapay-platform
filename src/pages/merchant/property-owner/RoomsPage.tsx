import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Bed, Users, MoreVertical, Edit, Trash2, DollarSign, Square } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RoomDialog } from "@/components/merchant/RoomDialog";
import { Property, Room } from "@/types/stay";
import { getMerchantProperties, getPropertyRooms, createRoom, updateRoom, deleteRoom } from "@/services/stayService";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { toast } from "sonner";

const RoomsPage = () => {
  const { merchantProfile, loading: authLoading } = useMerchantAuth('property_owner');
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // Load properties
  useEffect(() => {
    if (merchantProfile?.id) {
      fetchProperties();
    }
  }, [merchantProfile?.id]);

  // Handle property selection from URL or first property
  useEffect(() => {
    const propertyParam = searchParams.get('property');
    if (propertyParam && properties.some(p => p.id === propertyParam)) {
      setSelectedPropertyId(propertyParam);
    } else if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, searchParams]);

  // Load rooms when property changes
  useEffect(() => {
    if (selectedPropertyId) {
      fetchRooms(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const fetchProperties = async () => {
    if (!merchantProfile?.id) return;
    
    try {
      const data = await getMerchantProperties(merchantProfile.id);
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    }
  };

  const fetchRooms = async (propertyId: string) => {
    setLoading(true);
    try {
      const data = await getPropertyRooms(propertyId);
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setSearchParams({ property: propertyId });
  };

  const handleSaveRoom = async (data: Partial<Room>) => {
    if (!selectedPropertyId) return;

    if (editingRoom) {
      await updateRoom(editingRoom.id, data);
    } else {
      await createRoom({
        property_id: selectedPropertyId,
        name: data.name!,
        description: data.description,
        room_type: data.room_type!,
        max_guests: data.max_guests!,
        bed_configuration: data.bed_configuration,
        size_sqm: data.size_sqm,
        amenities: data.amenities,
        base_price: data.base_price!,
        images: data.images,
        quantity: data.quantity,
      });
    }
    
    await fetchRooms(selectedPropertyId);
    setEditingRoom(null);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setDialogOpen(true);
  };

  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    
    try {
      await deleteRoom(roomToDelete.id);
      toast.success('Room deleted successfully');
      await fetchRooms(selectedPropertyId);
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    } finally {
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    }
  };

  const handleAddNew = () => {
    setEditingRoom(null);
    setDialogOpen(true);
  };

  const formatBedConfig = (config: Room['bed_configuration']) => {
    const parts: string[] = [];
    if (config?.king_beds) parts.push(`${config.king_beds} King`);
    if (config?.queen_beds) parts.push(`${config.queen_beds} Queen`);
    if (config?.double_beds) parts.push(`${config.double_beds} Double`);
    if (config?.single_beds) parts.push(`${config.single_beds} Single`);
    if (config?.sofa_beds) parts.push(`${config.sofa_beds} Sofa`);
    if (config?.bunk_beds) parts.push(`${config.bunk_beds} Bunk`);
    return parts.length > 0 ? parts.join(', ') : 'Not specified';
  };

  if (authLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Room Inventory</h1>
            <p className="text-muted-foreground">Manage rooms and room types</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <Bed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
            <p className="text-muted-foreground mb-4">Add a property first, then configure room types</p>
            <Button onClick={() => window.location.href = '/merchant/property-owner/properties'}>
              Go to Properties
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Room Inventory</h1>
          <p className="text-muted-foreground">Manage rooms and room types</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPropertyId} onValueChange={handlePropertyChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map(property => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew} disabled={!selectedPropertyId}>
            <Plus className="h-4 w-4 mr-2" />
            Add Room Type
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Rooms Configured</h3>
            <p className="text-muted-foreground mb-4">Add room types to this property</p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Room Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {/* Room Image */}
                <div className="relative h-32 bg-muted">
                  {room.images && room.images.length > 0 ? (
                    <img
                      src={room.images[0]}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bed className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRoom(room)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(room)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 bg-background/90 rounded text-xs font-medium capitalize">
                      {room.room_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Room Info */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold line-clamp-1">{room.name}</h3>
                    <span className="text-sm font-medium text-primary">
                      R{room.base_price}/night
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Max {room.max_guests} guests</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      <span>{room.quantity} rooms</span>
                    </div>
                    {room.size_sqm && (
                      <div className="flex items-center gap-1">
                        <Square className="h-4 w-4" />
                        <span>{room.size_sqm} m²</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Beds:</span> {formatBedConfig(room.bed_configuration)}
                  </div>

                  {room.amenities && room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {room.amenities.slice(0, 4).map(amenity => (
                        <span 
                          key={amenity} 
                          className="px-2 py-0.5 bg-muted rounded text-xs capitalize"
                        >
                          {amenity.replace('_', ' ')}
                        </span>
                      ))}
                      {room.amenities.length > 4 && (
                        <span className="px-2 py-0.5 bg-muted rounded text-xs">
                          +{room.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedPropertyId && (
        <RoomDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          room={editingRoom}
          propertyId={selectedPropertyId}
          onSave={handleSaveRoom}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{roomToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoomsPage;