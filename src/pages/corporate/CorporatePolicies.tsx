import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { 
  getCurrentEmployeeAccount, 
  getPolicies, 
  createPolicy, 
  updatePolicy, 
  deletePolicy 
} from '@/services/corporateService';
import type { CorporateAccount, CorporateEmployee, CorporateTravelPolicy } from '@/types/corporate';


import { toast } from 'sonner';

const BOOKING_TYPES = ['bus', 'event', 'stay', 'workspace', 'venue', 'experience'];
const TRAVEL_TIERS = ['standard', 'executive', 'vip'];
const BUS_TIERS = ['budget', 'standard', 'premium'];

const CorporatePolicies = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [policies, setPolicies] = useState<CorporateTravelPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CorporateTravelPolicy | null>(null);
  const [formData, setFormData] = useState({
    policy_name: '',
    is_default: false,
    max_bus_price: '',
    max_event_price: '',
    max_stay_price_per_night: '',
    max_workspace_price_per_hour: '',
    max_venue_price: '',
    max_experience_price: '',
    approval_required_above: '',
    allowed_bus_tiers: ['budget', 'standard', 'premium'],
    allowed_booking_types: BOOKING_TYPES,
    advance_booking_days: '0',
    max_trip_duration_days: '',
    require_purpose: true,
    require_project_code: false,
    apply_to_tiers: TRAVEL_TIERS
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/corporate/policies');
      return;
    }

    const loadData = async () => {
      try {
        const result = await getCurrentEmployeeAccount();
        if (!result || !result.employee.is_admin) {
          navigate('/corporate');
          return;
        }

        setAccount(result.account);
        const policyList = await getPolicies(result.account.id);
        setPolicies(policyList);
      } catch (error) {
        console.error('Error loading policies:', error);
        toast.error('Failed to load policies');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async () => {
    if (!account) return;

    try {
      const policyData = {
        policy_name: formData.policy_name,
        corporate_account_id: account.id,
        is_default: formData.is_default,
        max_bus_price: formData.max_bus_price ? parseFloat(formData.max_bus_price) : null,
        max_event_price: formData.max_event_price ? parseFloat(formData.max_event_price) : null,
        max_stay_price_per_night: formData.max_stay_price_per_night ? parseFloat(formData.max_stay_price_per_night) : null,
        max_workspace_price_per_hour: formData.max_workspace_price_per_hour ? parseFloat(formData.max_workspace_price_per_hour) : null,
        max_venue_price: formData.max_venue_price ? parseFloat(formData.max_venue_price) : null,
        max_experience_price: formData.max_experience_price ? parseFloat(formData.max_experience_price) : null,
        approval_required_above: formData.approval_required_above ? parseFloat(formData.approval_required_above) : null,
        allowed_bus_tiers: formData.allowed_bus_tiers,
        allowed_stay_ratings: [1, 2, 3, 4, 5],
        allowed_booking_types: formData.allowed_booking_types,
        advance_booking_days: parseInt(formData.advance_booking_days) || 0,
        max_trip_duration_days: formData.max_trip_duration_days ? parseInt(formData.max_trip_duration_days) : null,
        require_purpose: formData.require_purpose,
        require_project_code: formData.require_project_code,
        apply_to_tiers: formData.apply_to_tiers
      };

      if (editingPolicy) {
        const updated = await updatePolicy(editingPolicy.id, policyData);
        setPolicies(policies.map(p => p.id === updated.id ? updated : p));
        toast.success('Policy updated successfully');
      } else {
        const created = await createPolicy(policyData as any);
        setPolicies([...policies, created]);
        toast.success('Policy created successfully');
      }
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save policy');
    }
  };

  const handleEdit = (policy: CorporateTravelPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      policy_name: policy.policy_name,
      is_default: policy.is_default,
      max_bus_price: policy.max_bus_price?.toString() || '',
      max_event_price: policy.max_event_price?.toString() || '',
      max_stay_price_per_night: policy.max_stay_price_per_night?.toString() || '',
      max_workspace_price_per_hour: policy.max_workspace_price_per_hour?.toString() || '',
      max_venue_price: policy.max_venue_price?.toString() || '',
      max_experience_price: policy.max_experience_price?.toString() || '',
      approval_required_above: policy.approval_required_above?.toString() || '',
      allowed_bus_tiers: policy.allowed_bus_tiers || BUS_TIERS,
      allowed_booking_types: policy.allowed_booking_types || BOOKING_TYPES,
      advance_booking_days: policy.advance_booking_days.toString(),
      max_trip_duration_days: policy.max_trip_duration_days?.toString() || '',
      require_purpose: policy.require_purpose,
      require_project_code: policy.require_project_code,
      apply_to_tiers: policy.apply_to_tiers || TRAVEL_TIERS
    });
    setDialogOpen(true);
  };

  const handleDelete = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      await deletePolicy(policyId);
      setPolicies(policies.filter(p => p.id !== policyId));
      toast.success('Policy deleted successfully');
    } catch (error) {
      toast.error('Failed to delete policy');
    }
  };

  const resetForm = () => {
    setEditingPolicy(null);
    setFormData({
      policy_name: '',
      is_default: false,
      max_bus_price: '',
      max_event_price: '',
      max_stay_price_per_night: '',
      max_workspace_price_per_hour: '',
      max_venue_price: '',
      max_experience_price: '',
      approval_required_above: '',
      allowed_bus_tiers: BUS_TIERS,
      allowed_booking_types: BOOKING_TYPES,
      advance_booking_days: '0',
      max_trip_duration_days: '',
      require_purpose: true,
      require_project_code: false,
      apply_to_tiers: TRAVEL_TIERS
    });
  };

  const toggleArrayItem = (array: string[], item: string, setter: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Travel Policies</h1>
            <p className="text-muted-foreground">Configure travel rules and spending limits</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPolicy ? 'Edit Policy' : 'Create New Policy'}</DialogTitle>
                <DialogDescription>
                  Define travel rules and spending limits for your employees
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="policy_name">Policy Name *</Label>
                  <Input
                    id="policy_name"
                    value={formData.policy_name}
                    onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
                    placeholder="e.g., Standard Travel Policy"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Set as Default Policy</Label>
                    <p className="text-xs text-muted-foreground">Applied to all bookings by default</p>
                  </div>
                  <Switch
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Budget Limits</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Bus Ticket Price (R)</Label>
                      <Input
                        type="number"
                        value={formData.max_bus_price}
                        onChange={(e) => setFormData({ ...formData, max_bus_price: e.target.value })}
                        placeholder="No limit"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Event Ticket Price (R)</Label>
                      <Input
                        type="number"
                        value={formData.max_event_price}
                        onChange={(e) => setFormData({ ...formData, max_event_price: e.target.value })}
                        placeholder="No limit"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Stay Price/Night (R)</Label>
                      <Input
                        type="number"
                        value={formData.max_stay_price_per_night}
                        onChange={(e) => setFormData({ ...formData, max_stay_price_per_night: e.target.value })}
                        placeholder="No limit"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Workspace Price/Hour (R)</Label>
                      <Input
                        type="number"
                        value={formData.max_workspace_price_per_hour}
                        onChange={(e) => setFormData({ ...formData, max_workspace_price_per_hour: e.target.value })}
                        placeholder="No limit"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Approval Settings</h4>
                  <div className="space-y-2">
                    <Label>Require Approval Above (R)</Label>
                    <Input
                      type="number"
                      value={formData.approval_required_above}
                      onChange={(e) => setFormData({ ...formData, approval_required_above: e.target.value })}
                      placeholder="e.g., 5000"
                    />
                    <p className="text-xs text-muted-foreground">Bookings above this amount require admin approval</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Allowed Booking Types</h4>
                  <div className="flex flex-wrap gap-4">
                    {BOOKING_TYPES.map((type) => (
                      <label key={type} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.allowed_booking_types.includes(type)}
                          onCheckedChange={() => toggleArrayItem(
                            formData.allowed_booking_types,
                            type,
                            (arr) => setFormData({ ...formData, allowed_booking_types: arr })
                          )}
                        />
                        <span className="capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Apply to Employee Tiers</h4>
                  <div className="flex flex-wrap gap-4">
                    {TRAVEL_TIERS.map((tier) => (
                      <label key={tier} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.apply_to_tiers.includes(tier)}
                          onCheckedChange={() => toggleArrayItem(
                            formData.apply_to_tiers,
                            tier,
                            (arr) => setFormData({ ...formData, apply_to_tiers: arr })
                          )}
                        />
                        <span className="capitalize">{tier}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Requirements</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Require Travel Purpose</Label>
                      <Switch
                        checked={formData.require_purpose}
                        onCheckedChange={(checked) => setFormData({ ...formData, require_purpose: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Require Project Code</Label>
                      <Switch
                        checked={formData.require_project_code}
                        onCheckedChange={(checked) => setFormData({ ...formData, require_project_code: checked })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Advance Booking (Days)</Label>
                      <Input
                        type="number"
                        value={formData.advance_booking_days}
                        onChange={(e) => setFormData({ ...formData, advance_booking_days: e.target.value })}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!formData.policy_name}>
                  {editingPolicy ? 'Update' : 'Create'} Policy
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {policies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No travel policies configured yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                Create Your First Policy
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {policies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle>{policy.policy_name}</CardTitle>
                      {policy.is_default && (
                        <Badge>Default</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(policy)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(policy.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {policy.max_bus_price && (
                      <div>
                        <span className="text-muted-foreground">Max Bus:</span>
                        <span className="ml-2 font-medium">R{policy.max_bus_price}</span>
                      </div>
                    )}
                    {policy.max_stay_price_per_night && (
                      <div>
                        <span className="text-muted-foreground">Max Stay/Night:</span>
                        <span className="ml-2 font-medium">R{policy.max_stay_price_per_night}</span>
                      </div>
                    )}
                    {policy.approval_required_above && (
                      <div>
                        <span className="text-muted-foreground">Approval Above:</span>
                        <span className="ml-2 font-medium">R{policy.approval_required_above}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Applies to:</span>
                      <span className="ml-2 font-medium">{policy.apply_to_tiers?.join(', ')}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {policy.allowed_booking_types?.map((type) => (
                      <Badge key={type} variant="outline" className="capitalize">{type}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
};

export default CorporatePolicies;
