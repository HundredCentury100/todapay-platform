import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Megaphone, CheckCircle, XCircle, Eye, MousePointer, DollarSign,
  AlertCircle, Building2, Calendar
} from 'lucide-react';
import { 
  Advertisement, 
  getAllAds, 
  getPendingAds,
  approveAd,
  rejectAd,
  getAdPerformance,
  AdPerformance
} from '@/services/advertisingService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_approval: 'bg-yellow-500/20 text-yellow-600',
  approved: 'bg-green-500/20 text-green-600',
  rejected: 'bg-red-500/20 text-red-600',
  active: 'bg-primary/20 text-primary',
  paused: 'bg-orange-500/20 text-orange-600',
  completed: 'bg-muted text-muted-foreground',
  archived: 'bg-muted text-muted-foreground'
};

export default function AdManagement() {
  const { user } = useAuth();
  const [allAds, setAllAds] = useState<Advertisement[]>([]);
  const [pendingAds, setPendingAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [performances, setPerformances] = useState<Record<string, AdPerformance>>({});

  const fetchAds = async () => {
    try {
      const [all, pending] = await Promise.all([
        getAllAds(),
        getPendingAds()
      ]);
      setAllAds(all);
      setPendingAds(pending);

      // Fetch performance for active ads
      const activeAds = all.filter(a => a.status === 'active');
      const perfData: Record<string, AdPerformance> = {};
      await Promise.all(
        activeAds.map(async (ad) => {
          try {
            perfData[ad.id] = await getAdPerformance(ad.id);
          } catch (e) {
            perfData[ad.id] = { impressions: 0, clicks: 0, ctr: 0, spend: 0, avgCpc: 0 };
          }
        })
      );
      setPerformances(perfData);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
      toast.error('Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleApprove = async (ad: Advertisement) => {
    if (!user?.id) return;
    try {
      await approveAd(ad.id, user.id);
      toast.success('Ad approved successfully');
      fetchAds();
    } catch (error) {
      toast.error('Failed to approve ad');
    }
  };

  const handleReject = async () => {
    if (!selectedAd || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await rejectAd(selectedAd.id, rejectionReason);
      toast.success('Ad rejected');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedAd(null);
      fetchAds();
    } catch (error) {
      toast.error('Failed to reject ad');
    }
  };

  const totalRevenue = allAds.reduce((sum, ad) => sum + (ad.amount_spent || 0), 0);
  const activeCount = allAds.filter(a => a.status === 'active').length;
  const totalImpressions = Object.values(performances).reduce((sum, p) => sum + p.impressions, 0);
  const totalClicks = Object.values(performances).reduce((sum, p) => sum + p.clicks, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          Ad Management
        </h1>
        <p className="text-muted-foreground">Review and manage merchant advertisements</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ad Revenue</p>
                <p className="text-xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Megaphone className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Ads</p>
                <p className="text-xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-xl font-bold">{pendingAds.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Impressions</p>
                <p className="text-xl font-bold">{totalImpressions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending Review
            {pendingAds.length > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 justify-center">
                {pendingAds.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Ads ({allAds.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : pendingAds.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground">No ads pending review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingAds.map((ad) => (
                <PendingAdCard
                  key={ad.id}
                  ad={ad}
                  onApprove={() => handleApprove(ad)}
                  onReject={() => {
                    setSelectedAd(ad);
                    setRejectDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : (
            <div className="grid gap-4">
              {allAds.map((ad) => (
                <AdminAdCard
                  key={ad.id}
                  ad={ad}
                  performance={performances[ad.id]}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Advertisement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting "{selectedAd?.title}"
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Rejection reason (will be shown to merchant)"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Ad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PendingAdCardProps {
  ad: Advertisement & { merchant_profiles?: { business_name: string } };
  onApprove: () => void;
  onReject: () => void;
}

function PendingAdCard({ ad, onApprove, onReject }: PendingAdCardProps) {
  return (
    <Card className="border-yellow-500/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {ad.image_url && (
            <div className="h-24 w-32 rounded overflow-hidden flex-shrink-0">
              <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-medium">{ad.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{ad.description}</p>
              </div>
              <Badge className={statusColors[ad.status]}>
                Pending
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {(ad as any).merchant_profiles?.business_name || 'Unknown'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(ad.created_at), 'MMM d, yyyy')}
              </span>
              <span>Budget: ${ad.daily_budget}/day</span>
              <span>CPC: ${ad.cost_per_click}</span>
            </div>

            {ad.destination_url && (
              <p className="text-xs text-muted-foreground mb-3">
                Links to: {ad.destination_url}
              </p>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={onApprove}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={onReject}>
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AdminAdCardProps {
  ad: Advertisement & { merchant_profiles?: { business_name: string } };
  performance?: AdPerformance;
}

function AdminAdCard({ ad, performance }: AdminAdCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {ad.image_url && (
            <div className="h-16 w-24 rounded overflow-hidden flex-shrink-0">
              <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium truncate">{ad.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {(ad as any).merchant_profiles?.business_name || 'Unknown Merchant'}
                </p>
              </div>
              <Badge className={statusColors[ad.status]}>
                {ad.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="flex gap-4 mt-2 text-sm">
              {performance ? (
                <>
                  <span className="text-muted-foreground">
                    <Eye className="h-3 w-3 inline mr-1" />
                    {performance.impressions}
                  </span>
                  <span className="text-muted-foreground">
                    <MousePointer className="h-3 w-3 inline mr-1" />
                    {performance.clicks}
                  </span>
                  <span className="text-primary font-medium">
                    ${ad.amount_spent.toFixed(2)} revenue
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  Budget: ${ad.daily_budget}/day @ ${ad.cost_per_click}/click
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
