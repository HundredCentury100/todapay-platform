import { useState } from "react";
import { Compass, Clock, CheckCircle, XCircle } from "lucide-react";
import { PremiumPageHeader, PremiumSection, PremiumTabs, PremiumTabContent, PremiumEmptyState } from "@/components/premium";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format, isAfter, isBefore } from "date-fns";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const ExperienceBookingsPage = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();

  const { data: bookings = [] } = useQuery({
    queryKey: ['experience-bookings', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];

      const { data: experiences } = await supabase
        .from('experiences')
        .select('id')
        .eq('merchant_profile_id', merchantProfile.id);

      const ids = experiences?.map(e => e.id) || [];
      if (ids.length === 0) return [];

      const { data: rawBookings } = await supabase
        .from('experience_bookings')
        .select('id, experience_id, booking_id, num_participants, created_at, schedule_id')
        .in('experience_id', ids)
        .order('created_at', { ascending: false });

      // Enrich with joined data
      const enriched = [];
      for (const eb of rawBookings || []) {
        const { data: exp } = await supabase.from('experiences').select('name, city').eq('id', eb.experience_id).single();
        const { data: bk } = await supabase.from('bookings').select('booking_reference, passenger_name, passenger_email, total_price, status').eq('id', eb.booking_id).single();
        enriched.push({ ...eb, experience: exp, booking: bk });
      }

      return enriched;
    },
    enabled: !!merchantProfile?.id,
  });

  const now = new Date();

  const categorized = {
    upcoming: bookings.filter((b: any) => b.schedule_id && isAfter(new Date(b.created_at), now) && b.booking?.status !== 'cancelled' && b.booking?.status !== 'completed'),
    today: bookings.filter((b: any) => {
      const d = new Date(b.created_at);
      return d.toDateString() === now.toDateString() && b.booking?.status !== 'cancelled';
    }),
    completed: bookings.filter((b: any) => b.booking?.status === 'completed' || (b.booking?.status === 'confirmed' && isBefore(new Date(b.created_at), now))),
    cancelled: bookings.filter((b: any) => b.booking?.status === 'cancelled'),
  };
  
  const tabs = [
    { value: "upcoming", label: `Upcoming (${categorized.upcoming.length})` },
    { value: "today", label: `Today (${categorized.today.length})` },
    { value: "completed", label: `Completed (${categorized.completed.length})` },
    { value: "cancelled", label: `Cancelled (${categorized.cancelled.length})` },
  ];

  const renderTable = (list: any[]) => {
    if (list.length === 0) return null;
    return (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((b: any) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-sm">{b.booking?.booking_reference}</TableCell>
                <TableCell>
                  <p className="font-medium">{b.booking?.passenger_name}</p>
                  <p className="text-xs text-muted-foreground">{b.booking?.passenger_email}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{b.experience?.name}</p>
                  <p className="text-xs text-muted-foreground">{b.experience?.city}</p>
                </TableCell>
                <TableCell>{b.num_participants}</TableCell>
                <TableCell className="font-medium">{convertPrice(b.booking?.total_price || 0)}</TableCell>
                <TableCell>
                  <Badge variant={b.booking?.status === 'confirmed' ? 'default' : b.booking?.status === 'cancelled' ? 'destructive' : 'secondary'}>
                    {b.booking?.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <PremiumPageHeader
        title="Bookings"
        subtitle="Manage your experience bookings"
      />

      <PremiumSection delay={0.1}>
        <PremiumTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="mt-4">
          <PremiumTabContent value="upcoming" activeValue={activeTab}>
            {categorized.upcoming.length > 0 ? renderTable(categorized.upcoming) : (
              <PremiumEmptyState icon={Clock} title="No Upcoming Bookings" description="Future bookings will appear here" />
            )}
          </PremiumTabContent>

          <PremiumTabContent value="today" activeValue={activeTab}>
            {categorized.today.length > 0 ? renderTable(categorized.today) : (
              <PremiumEmptyState icon={Compass} title="No Experiences Today" description="Today's experiences will appear here" />
            )}
          </PremiumTabContent>

          <PremiumTabContent value="completed" activeValue={activeTab}>
            {categorized.completed.length > 0 ? renderTable(categorized.completed) : (
              <PremiumEmptyState icon={CheckCircle} title="No Completed Experiences" description="Past experiences will appear here" />
            )}
          </PremiumTabContent>

          <PremiumTabContent value="cancelled" activeValue={activeTab}>
            {categorized.cancelled.length > 0 ? renderTable(categorized.cancelled) : (
              <PremiumEmptyState icon={XCircle} title="No Cancelled Bookings" description="Cancelled bookings will appear here" />
            )}
          </PremiumTabContent>
        </div>
      </PremiumSection>
    </div>
  );
};

export default ExperienceBookingsPage;
