import { useState, useEffect } from "react";
import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, Tag, Calendar, Clock, Copy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getUserVouchers, UserVoucher } from "@/services/voucherService";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const verticalLabels: Record<string, string> = {
  bus: "Buses", rides: "Rides", event: "Events", stay: "Stays",
  car_rental: "Car Rental", transfer: "Transfers", workspace: "Workspaces",
  experience: "Experiences", flight: "Flights",
};

const sourceLabels: Record<string, string> = {
  promo: "Promo Code", referral: "Referral", reward: "Rewards",
  gift: "Gift", campaign: "Campaign",
};

const VoucherCard = ({ voucher }: { voucher: UserVoucher }) => {
  const isExpired = voucher.expires_at && new Date(voucher.expires_at) < new Date();
  const effectiveStatus = isExpired && voucher.status === 'active' ? 'expired' : voucher.status;

  const copyCode = () => {
    navigator.clipboard.writeText(voucher.code);
    toast.success("Voucher code copied!");
  };

  return (
    <Card className={`rounded-2xl border-0 shadow-sm overflow-hidden ${effectiveStatus !== 'active' ? 'opacity-60' : ''}`}>
      <div className={`px-4 py-3 ${effectiveStatus === 'active' ? 'bg-primary/10' : 'bg-muted'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            <span className="font-bold text-primary">
              {voucher.discount_type === 'percentage' ? `${voucher.discount_value}% OFF` : `$${voucher.discount_value} OFF`}
            </span>
          </div>
          <Badge variant={effectiveStatus === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">
            {effectiveStatus}
          </Badge>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm font-medium">{voucher.description || sourceLabels[voucher.source] || 'Discount voucher'}</p>

        <div className="flex items-center justify-between">
          <div className="font-mono text-sm bg-muted px-3 py-1.5 rounded-lg">{voucher.code}</div>
          {effectiveStatus === 'active' && (
            <Button variant="ghost" size="sm" onClick={copyCode} className="h-8">
              <Copy className="w-3.5 h-3.5 mr-1" /> Copy
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {voucher.applicable_verticals.length > 0 ? (
            voucher.applicable_verticals.map(v => (
              <Badge key={v} variant="outline" className="text-xs">{verticalLabels[v] || v}</Badge>
            ))
          ) : (
            <Badge variant="outline" className="text-xs">All services</Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {voucher.min_order_amount > 0 && (
            <span>Min. order: ${voucher.min_order_amount}</span>
          )}
          {voucher.expires_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {effectiveStatus === 'expired' ? 'Expired' : `Expires ${format(new Date(voucher.expires_at), 'MMM d, yyyy')}`}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

const Vouchers = () => {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadVouchers();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadVouchers = async () => {
    setIsLoading(true);
    const data = await getUserVouchers();
    setVouchers(data);
    setIsLoading(false);
  };

  const activeVouchers = vouchers.filter(v => v.status === 'active' && (!v.expires_at || new Date(v.expires_at) >= new Date()));
  const usedVouchers = vouchers.filter(v => v.status === 'used');
  const expiredVouchers = vouchers.filter(v => v.status === 'expired' || (v.status === 'active' && v.expires_at && new Date(v.expires_at) < new Date()));

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-background border-b safe-area-pt">
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath="/" />
            <div className="flex-1">
              <h1 className="font-bold text-lg">My Vouchers</h1>
              <p className="text-xs text-muted-foreground">{activeVouchers.length} active voucher{activeVouchers.length !== 1 ? 's' : ''}</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="rounded-xl">
              <Link to="/promo">
                <Tag className="w-4 h-4 mr-1" />
                Add Code
              </Link>
            </Button>
          </div>
        </header>

        <main className="px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : vouchers.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-8 text-center rounded-2xl border-0 shadow-md">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <Ticket className="w-10 h-10 text-pink-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Vouchers Yet</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Claim promo codes or redeem reward points to get vouchers!
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1 rounded-xl">
                    <Link to="/promo">Enter Code</Link>
                  </Button>
                  <Button asChild className="flex-1 rounded-xl">
                    <Link to="/promos">View Promos</Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <Tabs defaultValue="active">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="active" className="flex-1">Active ({activeVouchers.length})</TabsTrigger>
                <TabsTrigger value="used" className="flex-1">Used ({usedVouchers.length})</TabsTrigger>
                <TabsTrigger value="expired" className="flex-1">Expired ({expiredVouchers.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-3">
                {activeVouchers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No active vouchers</p>
                ) : activeVouchers.map((v, i) => (
                  <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <VoucherCard voucher={v} />
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="used" className="space-y-3">
                {usedVouchers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No used vouchers</p>
                ) : usedVouchers.map(v => <VoucherCard key={v.id} voucher={v} />)}
              </TabsContent>

              <TabsContent value="expired" className="space-y-3">
                {expiredVouchers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No expired vouchers</p>
                ) : expiredVouchers.map(v => <VoucherCard key={v.id} voucher={v} />)}
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default Vouchers;
