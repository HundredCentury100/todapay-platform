import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Hotel, MapPin, Bed, Star, Edit, Trash2, MoreVertical, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PropertyDialog } from "@/components/merchant/PropertyDialog";
import { Property } from "@/types/stay";
import { getMerchantProperties, createProperty, updateProperty, deleteProperty } from "@/services/stayService";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ListingQualityScore } from "@/components/merchant/ListingQualityScore";

const PropertiesPage = () => {
  const { merchantProfile, loading: authLoading } = useMerchantAuth('property_owner');
  const navigate = useNavigate();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  useEffect(() => {
    if (merchantProfile?.id) {
      fetchProperties();
    }
  }, [merchantProfile?.id]);

  const fetchProperties = async () => {
    if (!merchantProfile?.id) return;
    
    setLoading(true);
    try {
      const data = await getMerchantProperties(merchantProfile.id);
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProperty = async (data: Partial<Property>) => {
    if (!merchantProfile?.id) return;

    if (editingProperty) {
      await updateProperty(editingProperty.id, data);
    } else {
      await createProperty({
        merchant_profile_id: merchantProfile.id,
        name: data.name!,
        description: data.description,
        property_type: data.property_type!,
        address: data.address!,
        city: data.city!,
        country: data.country!,
        star_rating: data.star_rating,
        amenities: data.amenities,
        policies: data.policies,
        images: data.images,
        check_in_time: data.check_in_time,
        check_out_time: data.check_out_time,
      });
    }
    
    await fetchProperties();
    setEditingProperty(null);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setDialogOpen(true);
  };

  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;
    
    try {
      await deleteProperty(propertyToDelete.id);
      toast.success('Property deleted successfully');
      await fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    } finally {
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  const handleAddNew = () => {
    setEditingProperty(null);
    setDialogOpen(true);
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Properties</h1>
            <p className="text-muted-foreground">Manage your hotels, lodges, and accommodations</p>
          </div>
        </div>
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
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Properties</h1>
          <p className="text-muted-foreground">Manage your hotels, lodges, and accommodations</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Hotel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
            <p className="text-muted-foreground mb-4">Add your first property to start accepting bookings</p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {/* Property Image */}
                <div className="relative h-40 bg-muted">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Hotel className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                    <div className="absolute top-2 right-2 flex gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditProperty(property)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/stays/${property.id}`, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Preview as Guest
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(property)}
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
                      {property.property_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg line-clamp-1">{property.name}</h3>
                  
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="line-clamp-1">{property.city}, {property.country}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Bed className="h-4 w-4" />
                      <span>{property.rooms?.length || 0} room types</span>
                    </div>
                    {property.star_rating && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{property.star_rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Listing Quality Score */}
                  <ListingQualityScore property={property} />

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/merchant/property-owner/rooms?property=${property.id}`)}
                    >
                      <Bed className="h-4 w-4 mr-1" />
                      Manage Rooms
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PropertyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        property={editingProperty}
        onSave={handleSaveProperty}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{propertyToDelete?.name}"? This will also delete all rooms associated with this property. This action cannot be undone.
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

export default PropertiesPage;