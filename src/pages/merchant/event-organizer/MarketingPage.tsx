import { useEffect, useState } from "react";
import MerchantLayout from "@/components/merchant/layout/MerchantLayout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMarketingMetrics } from "@/services/organizerService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, DollarSign, Tag, Star } from "lucide-react";
import { formatCurrency } from "@/utils/dateFormatters";

const MarketingPage = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMarketingMetrics();
  }, []);

  const loadMarketingMetrics = async () => {
    try {
      const data = await getMarketingMetrics();
      setMetrics(data);
    } catch (error) {
      console.error("Error loading marketing metrics:", error);
      toast({
        title: "Error",
        description: "Failed to load marketing metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate metrics
  const discountCodeUsage = metrics?.bookings?.reduce((acc: any, booking: any) => {
    const code = booking.discount_code || "No Code";
    if (!acc[code]) {
      acc[code] = { count: 0, revenue: 0 };
    }
    acc[code].count++;
    acc[code].revenue += Number(booking.total_price);
    return acc;
  }, {});

  const avgRating =
    metrics?.reviews?.length > 0
      ? metrics.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        metrics.reviews.length
      : 0;

  const totalDiscountRevenue = metrics?.bookings?.reduce(
    (sum: number, b: any) => sum + Number(b.total_price),
    0
  );

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Marketing Dashboard</h1>
          <p className="text-muted-foreground">
            Track promotional campaigns and marketing performance
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Tag className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Discount Codes</p>
                <p className="text-2xl font-bold">
                  {discountCodeUsage ? Object.keys(discountCodeUsage).length : 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Code Usage</p>
                <p className="text-2xl font-bold">{metrics?.bookings?.length || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Discount Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalDiscountRevenue || 0)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Star className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating (30d)</p>
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Discount Code Performance</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Discount Code</TableHead>
                  <TableHead className="text-right">Usage Count</TableHead>
                  <TableHead className="text-right">Revenue Generated</TableHead>
                  <TableHead className="text-right">Avg Order Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountCodeUsage && Object.keys(discountCodeUsage).length > 0 ? (
                  Object.entries(discountCodeUsage).map(([code, data]: [string, any]) => (
                    <TableRow key={code}>
                      <TableCell className="font-medium">{code}</TableCell>
                      <TableCell className="text-right">{data.count}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.revenue / data.count)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No discount codes used yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Top Performing Events</h2>
            <div className="space-y-3">
              {metrics?.bookings
                ?.reduce((acc: any[], booking: any) => {
                  const existing = acc.find((b) => b.item_name === booking.item_name);
                  if (existing) {
                    existing.count++;
                    existing.revenue += Number(booking.total_price);
                  } else {
                    acc.push({
                      item_name: booking.item_name,
                      count: 1,
                      revenue: Number(booking.total_price),
                    });
                  }
                  return acc;
                }, [])
                ?.sort((a: any, b: any) => b.revenue - a.revenue)
                ?.slice(0, 5)
                ?.map((event: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{event.item_name}</p>
                      <p className="text-sm text-muted-foreground">{event.count} bookings</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(event.revenue)}</p>
                  </div>
                )) || (
                <p className="text-center text-muted-foreground">No data available</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Marketing Tips</h2>
            <div className="space-y-3">
              <div className="p-3 bg-primary/5 rounded">
                <h3 className="font-semibold text-sm mb-1">Create Urgency</h3>
                <p className="text-sm text-muted-foreground">
                  Use limited-time discount codes to drive immediate bookings
                </p>
              </div>
              <div className="p-3 bg-primary/5 rounded">
                <h3 className="font-semibold text-sm mb-1">Track Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor which codes perform best and replicate success
                </p>
              </div>
              <div className="p-3 bg-primary/5 rounded">
                <h3 className="font-semibold text-sm mb-1">Customer Reviews</h3>
                <p className="text-sm text-muted-foreground">
                  Encourage reviews to build trust and attract new customers
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketingPage;
