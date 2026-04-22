import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Image as ImageIcon, Target, DollarSign } from 'lucide-react';
import { Advertisement, createAdvertisement, updateAdvertisement } from '@/services/advertisingService';
import { toast } from 'sonner';

interface AdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantProfileId: string;
  existingAd?: Advertisement;
  onSuccess: () => void;
}

const LOCATIONS = [
  'Harare', 'Bulawayo', 'Victoria Falls', 'Mutare', 'Gweru',
  'Masvingo', 'Chinhoyi', 'Kadoma', 'Kwekwe', 'Hwange',
  'Kariba', 'Nyanga', 'Marondera', 'Chegutu', 'Rusape'
];

const EVENT_TYPES = [
  'Concert', 'Sports', 'Theater', 'Festival', 'Conference', 'Comedy', 'Exhibition', 'Workshop'
];

const ROUTE_TYPES = [
  'Long Distance', 'Regional', 'City-to-City', 'Airport Transfer', 'Cross-Border', 'Express'
];

const PROPERTY_TYPES = [
  'Hotel', 'Lodge', 'Guesthouse', 'Resort', 'Apartment', 'Villa', 'Hostel'
];

const WORKSPACE_TYPES = [
  'Co-working', 'Private Office', 'Meeting Room', 'Conference Room', 'Hot Desk', 'Event Space'
];

const VENUE_TYPES = [
  'Conference Center', 'Wedding Venue', 'Corporate Event', 'Party Venue', 'Exhibition Hall', 'Outdoor Venue'
];

export const AdDialog = ({ 
  open, 
  onOpenChange, 
  merchantProfileId, 
  existingAd,
  onSuccess 
}: AdDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ad_type: existingAd?.ad_type || 'sponsored_card' as 'sponsored_card' | 'banner' | 'featured_listing' | 'notification',
    title: existingAd?.title || '',
    description: existingAd?.description || '',
    image_url: existingAd?.image_url || '',
    destination_type: existingAd?.destination_type || 'external' as 'bus' | 'event' | 'stay' | 'workspace' | 'venue' | 'external',
    destination_url: existingAd?.destination_url || '',
    destination_id: existingAd?.destination_id || '',
    target_locations: existingAd?.target_locations || [] as string[],
    target_event_types: existingAd?.target_event_types || [] as string[],
    target_route_types: existingAd?.target_route_types || [] as string[],
    target_property_types: (existingAd as any)?.target_property_types || [] as string[],
    target_workspace_types: (existingAd as any)?.target_workspace_types || [] as string[],
    target_venue_types: (existingAd as any)?.target_venue_types || [] as string[],
    daily_budget: existingAd?.daily_budget || 10,
    cost_per_click: existingAd?.cost_per_click || 0.50,
    total_budget: existingAd?.total_budget || undefined,
    start_date: existingAd?.start_date || '',
    end_date: existingAd?.end_date || '',
  });

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error('Please enter an ad title');
      return;
    }

    setLoading(true);
    try {
      if (existingAd) {
        await updateAdvertisement(existingAd.id, {
          ...formData,
          total_budget: formData.total_budget || undefined,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
        });
        toast.success('Advertisement updated');
      } else {
        await createAdvertisement({
          ...formData,
          merchant_profile_id: merchantProfileId,
          status: 'draft',
          total_budget: formData.total_budget || undefined,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
        });
        toast.success('Advertisement created as draft');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save ad:', error);
      toast.error('Failed to save advertisement');
    } finally {
      setLoading(false);
    }
  };

  const addTarget = (type: 'locations' | 'event_types' | 'route_types', value: string) => {
    const key = `target_${type}` as keyof typeof formData;
    const current = formData[key] as string[];
    if (!current.includes(value)) {
      setFormData({ ...formData, [key]: [...current, value] });
    }
  };

  const removeTarget = (type: 'locations' | 'event_types' | 'route_types', value: string) => {
    const key = `target_${type}` as keyof typeof formData;
    const current = formData[key] as string[];
    setFormData({ ...formData, [key]: current.filter(v => v !== value) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingAd ? 'Edit Advertisement' : 'Create New Advertisement'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basics" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="targeting">
              <Target className="h-4 w-4 mr-1" />
              Targeting
            </TabsTrigger>
            <TabsTrigger value="budget">
              <DollarSign className="h-4 w-4 mr-1" />
              Budget
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ad Type</Label>
                <Select
                  value={formData.ad_type}
                  onValueChange={(v) => setFormData({ ...formData, ad_type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sponsored_card">Sponsored Card</SelectItem>
                    <SelectItem value="banner">Banner Ad</SelectItem>
                    <SelectItem value="featured_listing">Featured Listing</SelectItem>
                    <SelectItem value="notification">Push Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Destination Type</Label>
                <Select
                  value={formData.destination_type}
                  onValueChange={(v) => setFormData({ ...formData, destination_type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bus">Bus Route</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="stay">Property / Stay</SelectItem>
                    <SelectItem value="workspace">Workspace</SelectItem>
                    <SelectItem value="venue">Event Venue</SelectItem>
                    <SelectItem value="external">External URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Catchy headline for your ad"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description (optional)"
                maxLength={200}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Image URL
              </Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              {formData.image_url && (
                <div className="mt-2 h-24 w-40 rounded overflow-hidden border">
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                </div>
              )}
            </div>

            {formData.destination_type === 'external' && (
              <div className="space-y-2">
                <Label>Destination URL</Label>
                <Input
                  value={formData.destination_url}
                  onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
                  placeholder="https://your-website.com"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="targeting" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Target Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.target_locations.map((loc) => (
                    <Badge key={loc} variant="secondary" className="gap-1">
                      {loc}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTarget('locations', loc)}
                      />
                    </Badge>
                  ))}
                  {formData.target_locations.length === 0 && (
                    <span className="text-xs text-muted-foreground">All locations (no filter)</span>
                  )}
                </div>
                <Select onValueChange={(v) => addTarget('locations', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.filter(l => !formData.target_locations.includes(l)).map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Target Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.target_event_types.map((type) => (
                    <Badge key={type} variant="secondary" className="gap-1">
                      {type}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTarget('event_types', type)}
                      />
                    </Badge>
                  ))}
                  {formData.target_event_types.length === 0 && (
                    <span className="text-xs text-muted-foreground">All event types (no filter)</span>
                  )}
                </div>
                <Select onValueChange={(v) => addTarget('event_types', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add event type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.filter(t => !formData.target_event_types.includes(t)).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Target Route Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.target_route_types.map((type) => (
                    <Badge key={type} variant="secondary" className="gap-1">
                      {type}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTarget('route_types', type)}
                      />
                    </Badge>
                  ))}
                  {formData.target_route_types.length === 0 && (
                    <span className="text-xs text-muted-foreground">All route types (no filter)</span>
                  )}
                </div>
                <Select onValueChange={(v) => addTarget('route_types', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add route type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTE_TYPES.filter(t => !formData.target_route_types.includes(t)).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Property Types */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Target Property Types (Stays)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.target_property_types.map((type) => (
                    <Badge key={type} variant="secondary" className="gap-1">
                      {type}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setFormData({ ...formData, target_property_types: formData.target_property_types.filter(t => t !== type) })}
                      />
                    </Badge>
                  ))}
                  {formData.target_property_types.length === 0 && (
                    <span className="text-xs text-muted-foreground">All property types (no filter)</span>
                  )}
                </div>
                <Select onValueChange={(v) => {
                  if (!formData.target_property_types.includes(v)) {
                    setFormData({ ...formData, target_property_types: [...formData.target_property_types, v] });
                  }
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add property type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.filter(t => !formData.target_property_types.includes(t)).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Workspace Types */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Target Workspace Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.target_workspace_types.map((type) => (
                    <Badge key={type} variant="secondary" className="gap-1">
                      {type}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setFormData({ ...formData, target_workspace_types: formData.target_workspace_types.filter(t => t !== type) })}
                      />
                    </Badge>
                  ))}
                  {formData.target_workspace_types.length === 0 && (
                    <span className="text-xs text-muted-foreground">All workspace types (no filter)</span>
                  )}
                </div>
                <Select onValueChange={(v) => {
                  if (!formData.target_workspace_types.includes(v)) {
                    setFormData({ ...formData, target_workspace_types: [...formData.target_workspace_types, v] });
                  }
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add workspace type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKSPACE_TYPES.filter(t => !formData.target_workspace_types.includes(t)).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Venue Types */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Target Venue Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.target_venue_types.map((type) => (
                    <Badge key={type} variant="secondary" className="gap-1">
                      {type}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setFormData({ ...formData, target_venue_types: formData.target_venue_types.filter(t => t !== type) })}
                      />
                    </Badge>
                  ))}
                  {formData.target_venue_types.length === 0 && (
                    <span className="text-xs text-muted-foreground">All venue types (no filter)</span>
                  )}
                </div>
                <Select onValueChange={(v) => {
                  if (!formData.target_venue_types.includes(v)) {
                    setFormData({ ...formData, target_venue_types: [...formData.target_venue_types, v] });
                  }
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add venue type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {VENUE_TYPES.filter(t => !formData.target_venue_types.includes(t)).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daily Budget ($)</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.daily_budget}
                  onChange={(e) => setFormData({ ...formData, daily_budget: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Maximum spend per day</p>
              </div>

              <div className="space-y-2">
                <Label>Cost Per Click ($)</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.cost_per_click}
                  onChange={(e) => setFormData({ ...formData, cost_per_click: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">You pay this amount per click</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Total Budget (Optional)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.total_budget || ''}
                onChange={(e) => setFormData({ ...formData, total_budget: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Leave empty for unlimited"
              />
              <p className="text-xs text-muted-foreground">Ad stops when this budget is reached</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="text-sm">
                  <p className="font-medium mb-2">Estimated Performance</p>
                  <p className="text-muted-foreground">
                    With a ${formData.daily_budget}/day budget at ${formData.cost_per_click}/click, 
                    you could receive up to <strong>{Math.floor(formData.daily_budget / formData.cost_per_click)} clicks</strong> per day.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : existingAd ? 'Update Ad' : 'Create Ad'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
