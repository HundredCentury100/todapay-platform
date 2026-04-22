import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, MapPin, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { VenueDialog } from "@/components/merchant/venue-owner/VenueDialog";
import { createVenue, updateVenue, deleteVenue as deleteVenueService } from "@/services/venueService";
import type { Venue, VenueType, CateringOption, VenueEquipment } from "@/types/venue";

interface VenueFormData {
  id?: string;
  name: string;
  description: string;
  venue_type: VenueType;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  size_sqm?: number;
  capacity_standing?: number;
  capacity_seated?: number;
  capacity_theater?: number;
  capacity_banquet?: number;
  hourly_rate?: number;
  half_day_rate?: number;
  full_day_rate?: number;
  min_hours: number;
  amenities: string[];
  catering_options: CateringOption[];
  equipment_available: VenueEquipment[];
  images: string[];
  status: 'active' | 'inactive';
}

const VenuesPage = () => {
  const { user } = useAuth();
  const { convertPrice } = useCurrency();
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantProfileId, setMerchantProfileId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<VenueFormData | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenues = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('merchant_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) return;

        setMerchantProfileId(profile.id);

        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .eq('merchant_profile_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform data to match Venue type
        const transformedVenues = (data || []).map(venue => ({
          ...venue,
          amenities: venue.amenities || [],
          catering_options: Array.isArray(venue.catering_options) ? venue.catering_options : [],
          equipment_available: Array.isArray(venue.equipment_available) ? venue.equipment_available : [],
          images: Array.isArray(venue.images) ? venue.images : [],
        })) as unknown as Venue[];
        
        setVenues(transformedVenues);
      } catch (error) {
        console.error('Error fetching venues:', error);
        toast.error('Failed to load venues');
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [user]);

  const handleAddVenue = () => {
    setEditingVenue(null);
    setDialogOpen(true);
  };

  const handleEditVenue = (venue: Venue) => {
    setEditingVenue({
      id: venue.id,
      name: venue.name,
      description: venue.description || '',
      venue_type: venue.venue_type,
      address: venue.address,
      city: venue.city,
      country: venue.country,
      latitude: venue.latitude,
      longitude: venue.longitude,
      size_sqm: venue.size_sqm,
      capacity_standing: venue.capacity_standing,
      capacity_seated: venue.capacity_seated,
      capacity_theater: venue.capacity_theater,
      capacity_banquet: venue.capacity_banquet,
      hourly_rate: venue.hourly_rate,
      half_day_rate: venue.half_day_rate,
      full_day_rate: venue.full_day_rate,
      min_hours: venue.min_hours,
      amenities: venue.amenities,
      catering_options: venue.catering_options,
      equipment_available: venue.equipment_available,
      images: venue.images,
      status: venue.status,
    });
    setDialogOpen(true);
  };

  const handleSaveVenue = async (data: VenueFormData) => {
    if (!merchantProfileId) {
      toast.error('Merchant profile not found');
      return;
    }

    try {
      if (data.id) {
        // Update existing venue
        const updated = await updateVenue(data.id, {
          name: data.name,
          description: data.description,
          venue_type: data.venue_type,
          address: data.address,
          city: data.city,
          country: data.country,
          latitude: data.latitude,
          longitude: data.longitude,
          size_sqm: data.size_sqm,
          capacity_standing: data.capacity_standing,
          capacity_seated: data.capacity_seated,
          capacity_theater: data.capacity_theater,
          capacity_banquet: data.capacity_banquet,
          hourly_rate: data.hourly_rate,
          half_day_rate: data.half_day_rate,
          full_day_rate: data.full_day_rate,
          min_hours: data.min_hours,
          amenities: data.amenities,
          catering_options: data.catering_options,
          equipment_available: data.equipment_available,
          images: data.images,
          status: data.status,
        });
        setVenues(venues.map(v => v.id === updated.id ? updated : v));
        toast.success('Venue updated successfully');
      } else {
        // Create new venue
        const created = await createVenue({
          merchant_profile_id: merchantProfileId,
          name: data.name,
          description: data.description,
          venue_type: data.venue_type,
          address: data.address,
          city: data.city,
          country: data.country,
          latitude: data.latitude,
          longitude: data.longitude,
          size_sqm: data.size_sqm,
          capacity_standing: data.capacity_standing,
          capacity_seated: data.capacity_seated,
          capacity_theater: data.capacity_theater,
          capacity_banquet: data.capacity_banquet,
          hourly_rate: data.hourly_rate,
          half_day_rate: data.half_day_rate,
          full_day_rate: data.full_day_rate,
          min_hours: data.min_hours,
          amenities: data.amenities,
          catering_options: data.catering_options,
          equipment_available: data.equipment_available,
          images: data.images,
        });
        setVenues([created, ...venues]);
        toast.success('Venue created successfully');
      }
    } catch (error: any) {
      console.error('Error saving venue:', error);
      toast.error(error.message || 'Failed to save venue');
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this venue? This action cannot be undone.')) return;

    setDeleting(id);
    try {
      await deleteVenueService(id);
      setVenues(venues.filter(v => v.id !== id));
      toast.success('Venue deleted successfully');
    } catch (error: any) {
      console.error('Error deleting venue:', error);
      toast.error(error.message || 'Failed to delete venue');
    } finally {
      setDeleting(null);
    }
  };

  const handleViewVenue = (venueId: string) => {
    navigate(`/venues/${venueId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Venues</h1>
          <p className="text-muted-foreground">Manage your venue listings</p>
        </div>
        <Button className="gap-2" onClick={handleAddVenue}>
          <Plus className="h-4 w-4" />
          Add Venue
        </Button>
      </div>

      {venues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No venues yet</p>
            <Button className="gap-2" onClick={handleAddVenue}>
              <Plus className="h-4 w-4" />
              Add Your First Venue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <Card key={venue.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{venue.name}</CardTitle>
                    <Badge variant={venue.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                      {venue.status}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs">
                    {venue.venue_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{venue.city}, {venue.country}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  Capacity: {venue.capacity_seated || venue.capacity_standing || 'N/A'}
                </div>
                <div className="text-sm">
                  <span className="font-medium">
                    {venue.hourly_rate ? `${convertPrice(venue.hourly_rate)}/hr` : venue.full_day_rate ? `${convertPrice(venue.full_day_rate)}/day` : 'Contact for pricing'}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => handleViewVenue(venue.id)}
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => handleEditVenue(venue)}
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDelete(venue.id)}
                    disabled={deleting === venue.id}
                  >
                    {deleting === venue.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <VenueDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        venue={editingVenue}
        onSave={handleSaveVenue}
      />
    </div>
  );
};

export default VenuesPage;
