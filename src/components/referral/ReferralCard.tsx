import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Gift, Users, Copy, Check, Share2, 
  DollarSign, Clock, ChevronRight 
} from "lucide-react";
import { toast } from "sonner";
import { 
  getUserReferralCode, 
  getMyReferrals, 
  getReferralStats,
  UserReferral,
  ReferralStats
} from "@/services/referralService";
import { format } from "date-fns";

export function ReferralCard() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<UserReferral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [code, refs, st] = await Promise.all([
      getUserReferralCode(),
      getMyReferrals(),
      getReferralStats()
    ]);
    setReferralCode(code);
    setReferrals(refs);
    setStats(st);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!referralCode) return;
    
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralCode) return;
    
    const shareText = `Join me on this amazing travel app! Use my referral code ${referralCode} to get $25 off your first booking.`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join with my referral",
          text: shareText
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Share message copied!");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Invite Friends, Earn Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code */}
        <div className="bg-primary/5 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">Your referral code</p>
          <div className="flex items-center justify-center gap-2">
            <Input
              value={referralCode || "Loading..."}
              readOnly
              className="max-w-[200px] text-center font-mono text-lg font-bold tracking-wider"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            onClick={handleShare}
            className="mt-3 w-full"
            variant="default"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share with Friends
          </Button>
        </div>

        {/* How it works */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">How it works</h4>
          <div className="grid gap-3 text-sm">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">1</div>
              <p className="text-muted-foreground">Share your code with friends</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">2</div>
              <p className="text-muted-foreground">They get $25 off their first booking</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">3</div>
              <p className="text-muted-foreground">You earn $50 when they complete a booking</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.total_referrals}</div>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.completed_referrals}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">${stats.total_earnings}</div>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
          </div>
        )}

        {/* Recent Referrals */}
        {referrals.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recent Referrals
              </h4>
              <div className="space-y-2">
                {referrals.slice(0, 5).map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Friend invited</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(ref.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={ref.status === 'completed' ? 'default' : 'secondary'}
                      className={ref.status === 'completed' ? 'bg-green-600' : ''}
                    >
                      {ref.status === 'completed' ? (
                        <>
                          <DollarSign className="h-3 w-3 mr-1" />
                          +${ref.referrer_reward_amount}
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
