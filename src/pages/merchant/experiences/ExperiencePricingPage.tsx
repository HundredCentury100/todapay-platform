import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, Percent, Tag, Save } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const ExperiencePricingPage = () => {
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();

  const { data: experiences, isLoading } = useQuery({
    queryKey: ['experience-pricing', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];
      const { data, error } = await supabase
        .from('experiences')
        .select('id, name, price_per_person, private_group_price, max_participants, min_participants, status')
        .eq('merchant_profile_id', merchantProfile.id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  const handleSavePrice = async (id: string, field: string, value: number) => {
    try {
      const { error } = await supabase.from('experiences').update({ [field]: value }).eq('id', id);
      if (error) throw error;
      toast.success('Price updated');
    } catch {
      toast.error('Failed to update price');
    }
  };

  if (isLoading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Experience Pricing</h1>
        <p className="text-muted-foreground">Manage pricing for all your experiences</p>
      </div>

      {/* Price Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Price Matrix</CardTitle>
          <CardDescription>Edit prices inline for all experiences</CardDescription>
        </CardHeader>
        <CardContent>
          {!experiences || experiences.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No experiences found. Add experiences first.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Experience</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">Per Person</th>
                    <th className="text-left py-3 px-2 font-medium">Private Group</th>
                    <th className="text-left py-3 px-2 font-medium">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {experiences.map(exp => (
                    <tr key={exp.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{exp.name}</td>
                      <td className="py-3 px-2">
                        <Badge variant={exp.status === 'active' ? 'default' : 'secondary'}>{exp.status}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Input
                          type="number"
                          defaultValue={exp.price_per_person}
                          className="w-28 h-8"
                          onBlur={(e) => handleSavePrice(exp.id, 'price_per_person', Number(e.target.value))}
                        />
                      </td>
                      <td className="py-3 px-2">
                        <Input
                          type="number"
                          defaultValue={exp.private_group_price || ''}
                          placeholder="N/A"
                          className="w-28 h-8"
                          onBlur={(e) => e.target.value && handleSavePrice(exp.id, 'private_group_price', Number(e.target.value))}
                        />
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {exp.min_participants}-{exp.max_participants}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Discount Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5" /> Group Discounts</CardTitle>
          <CardDescription>Automatic discounts for larger groups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { min: 5, discount: 10, label: "Small Group" },
              { min: 10, discount: 15, label: "Medium Group" },
              { min: 20, discount: 20, label: "Large Group" },
            ].map(rule => (
              <div key={rule.min} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Users className="h-4 w-4 text-primary" /></div>
                  <div>
                    <p className="font-medium text-sm">{rule.label}</p>
                    <p className="text-xs text-muted-foreground">{rule.min}+ participants</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">{rule.discount}% off</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Early Bird Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> Early Bird & Promo Codes</CardTitle>
          <CardDescription>Time-based pricing and discount codes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Early Bird (30+ days before)</p>
                <p className="text-xs text-muted-foreground">Encourage advance bookings</p>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" defaultValue={15} className="w-20 h-8" />
                <span className="text-sm text-muted-foreground">% off</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Last Minute (48h before)</p>
                <p className="text-xs text-muted-foreground">Fill remaining spots</p>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" defaultValue={10} className="w-20 h-8" />
                <span className="text-sm text-muted-foreground">% off</span>
              </div>
            </div>
          </div>
          <Button className="mt-4 gap-2"><Save className="h-4 w-4" /> Save Pricing Rules</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExperiencePricingPage;
