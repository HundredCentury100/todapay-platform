import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Megaphone, BarChart3, MousePointer, Eye, DollarSign,
  Play, Pause, Send, Trash2, Edit, AlertCircle
} from 'lucide-react';
import { 
  Advertisement, 
  getMerchantAds, 
  getAdPerformance, 
  submitForApproval,
  activateAd,
  pauseAd,
  deleteAdvertisement,
  AdPerformance
} from '@/services/advertisingService';
import { useMerchantAuth } from '@/hooks/useMerchantAuth';
import { AdDialog } from '@/components/merchant/AdDialog';
import { toast } from 'sonner';

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

export default function AdvertisingPage() {
  const { merchantProfile } = useMerchantAuth();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | undefined>();
  const [performances, setPerformances] = useState<Record<string, AdPerformance>>({});

  const fetchAds = async () => {
    if (!merchantProfile?.id) return;
    try {
      const data = await getMerchantAds(merchantProfile.id);
      setAds(data);
      
      // Fetch performance for each ad
      const perfData: Record<string, AdPerformance> = {};
      await Promise.all(
        data.map(async (ad) => {
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
  }, [merchantProfile?.id]);

  const handleSubmitForApproval = async (adId: string) => {
    try {
      await submitForApproval(adId);
      toast.success('Ad submitted for approval');
      fetchAds();
    } catch (error) {
      toast.error('Failed to submit ad');
    }
  };

  const handleActivate = async (adId: string) => {
    try {
      await activateAd(adId);
      toast.success('Ad activated');
      fetchAds();
    } catch (error) {
      toast.error('Failed to activate ad');
    }
  };

  const handlePause = async (adId: string) => {
    try {
      await pauseAd(adId);
      toast.success('Ad paused');
      fetchAds();
    } catch (error) {
      toast.error('Failed to pause ad');
    }
  };

  const handleDelete = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    try {
      await deleteAdvertisement(adId);
      toast.success('Ad deleted');
      fetchAds();
    } catch (error) {
      toast.error('Failed to delete ad');
    }
  };

  const totalSpend = ads.reduce((sum, ad) => sum + (ad.amount_spent || 0), 0);
  const totalImpressions = Object.values(performances).reduce((sum, p) => sum + p.impressions, 0);
  const totalClicks = Object.values(performances).reduce((sum, p) => sum + p.clicks, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const activeAds = ads.filter(a => a.status === 'active');
  const pendingAds = ads.filter(a => a.status === 'pending_approval');
  const draftAds = ads.filter(a => a.status === 'draft');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Advertising
          </h1>
          <p className="text-muted-foreground">Promote your buses and events</p>
        </div>
        <Button onClick={() => { setEditingAd(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Ad
        </Button>
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
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-xl font-bold">${totalSpend.toFixed(2)}</p>
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
                <p className="text-sm text-muted-foreground">Impressions</p>
                <p className="text-xl font-bold">{totalImpressions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MousePointer className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clicks</p>
                <p className="text-xl font-bold">{totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg CTR</p>
                <p className="text-xl font-bold">{avgCtr.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ads List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({ads.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeAds.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingAds.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({draftAds.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : ads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No advertisements yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first ad to start promoting your business
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Ad
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {ads.map((ad) => (
                <AdCard 
                  key={ad.id} 
                  ad={ad} 
                  performance={performances[ad.id]}
                  onEdit={() => { setEditingAd(ad); setDialogOpen(true); }}
                  onSubmit={() => handleSubmitForApproval(ad.id)}
                  onActivate={() => handleActivate(ad.id)}
                  onPause={() => handlePause(ad.id)}
                  onDelete={() => handleDelete(ad.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeAds.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No active ads</p>
          ) : (
            <div className="grid gap-4">
              {activeAds.map((ad) => (
                <AdCard 
                  key={ad.id} 
                  ad={ad} 
                  performance={performances[ad.id]}
                  onEdit={() => { setEditingAd(ad); setDialogOpen(true); }}
                  onSubmit={() => handleSubmitForApproval(ad.id)}
                  onActivate={() => handleActivate(ad.id)}
                  onPause={() => handlePause(ad.id)}
                  onDelete={() => handleDelete(ad.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingAds.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending ads</p>
          ) : (
            <div className="grid gap-4">
              {pendingAds.map((ad) => (
                <AdCard 
                  key={ad.id} 
                  ad={ad} 
                  performance={performances[ad.id]}
                  onEdit={() => { setEditingAd(ad); setDialogOpen(true); }}
                  onSubmit={() => handleSubmitForApproval(ad.id)}
                  onActivate={() => handleActivate(ad.id)}
                  onPause={() => handlePause(ad.id)}
                  onDelete={() => handleDelete(ad.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {draftAds.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No draft ads</p>
          ) : (
            <div className="grid gap-4">
              {draftAds.map((ad) => (
                <AdCard 
                  key={ad.id} 
                  ad={ad} 
                  performance={performances[ad.id]}
                  onEdit={() => { setEditingAd(ad); setDialogOpen(true); }}
                  onSubmit={() => handleSubmitForApproval(ad.id)}
                  onActivate={() => handleActivate(ad.id)}
                  onPause={() => handlePause(ad.id)}
                  onDelete={() => handleDelete(ad.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AdDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        merchantProfileId={merchantProfile?.id || ''}
        existingAd={editingAd}
        onSuccess={fetchAds}
      />
    </div>
  );
}

interface AdCardProps {
  ad: Advertisement;
  performance?: AdPerformance;
  onEdit: () => void;
  onSubmit: () => void;
  onActivate: () => void;
  onPause: () => void;
  onDelete: () => void;
}

function AdCard({ ad, performance, onEdit, onSubmit, onActivate, onPause, onDelete }: AdCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {ad.image_url && (
            <div className="h-20 w-28 rounded overflow-hidden flex-shrink-0">
              <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium truncate">{ad.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{ad.description}</p>
              </div>
              <Badge className={statusColors[ad.status]}>
                {ad.status.replace('_', ' ')}
              </Badge>
            </div>

            {ad.status === 'rejected' && ad.rejection_reason && (
              <div className="mt-2 p-2 rounded bg-red-500/10 text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {ad.rejection_reason}
              </div>
            )}

            {performance && (
              <div className="flex gap-4 mt-3 text-sm">
                <span className="text-muted-foreground">
                  <Eye className="h-3 w-3 inline mr-1" />
                  {performance.impressions} views
                </span>
                <span className="text-muted-foreground">
                  <MousePointer className="h-3 w-3 inline mr-1" />
                  {performance.clicks} clicks
                </span>
                <span className="text-muted-foreground">
                  CTR: {performance.ctr.toFixed(2)}%
                </span>
                <span className="text-primary font-medium">
                  ${ad.amount_spent.toFixed(2)} spent
                </span>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              {ad.status === 'draft' && (
                <>
                  <Button size="sm" variant="outline" onClick={onEdit}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" onClick={onSubmit}>
                    <Send className="h-3 w-3 mr-1" />
                    Submit for Approval
                  </Button>
                  <Button size="sm" variant="destructive" onClick={onDelete}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
              
              {ad.status === 'approved' && (
                <Button size="sm" onClick={onActivate}>
                  <Play className="h-3 w-3 mr-1" />
                  Activate
                </Button>
              )}
              
              {ad.status === 'active' && (
                <Button size="sm" variant="outline" onClick={onPause}>
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </Button>
              )}
              
              {ad.status === 'paused' && (
                <Button size="sm" onClick={onActivate}>
                  <Play className="h-3 w-3 mr-1" />
                  Resume
                </Button>
              )}

              {ad.status === 'rejected' && (
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit & Resubmit
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
