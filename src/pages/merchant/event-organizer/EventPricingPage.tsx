import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Save, Tag, Percent, Users } from "lucide-react";
import { toast } from "sonner";
import { getOrganizerEvents } from "@/services/organizerService";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";

const EventPricingPage = () => {
  const { convertPrice } = useCurrency();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getOrganizerEvents();
      setEvents(data);
    } catch (e) {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (tierId: string, price: number) => {
    setEditedPrices(prev => ({ ...prev, [tierId]: price }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [tierId, price] of Object.entries(editedPrices)) {
        const { error } = await supabase
          .from('event_ticket_tiers')
          .update({ price })
          .eq('id', tierId);
        if (error) throw error;
      }
      toast.success("Prices updated successfully");
      setEditedPrices({});
      loadEvents();
    } catch (e: any) {
      toast.error(e.message || "Failed to save prices");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading pricing...</div>;

  const allTiers = events.flatMap(event =>
    (event.event_ticket_tiers || []).map((tier: any) => ({
      ...tier,
      eventName: event.name,
      eventDate: event.event_date,
      eventId: event.id,
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground">Manage ticket prices across all your events</p>
        </div>
        {Object.keys(editedPrices).length > 0 && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes ({Object.keys(editedPrices).length})
          </Button>
        )}
      </div>

      {/* Tier Price Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Ticket Tier Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allTiers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No ticket tiers found. Create events with ticket tiers first.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>New Price</TableHead>
                  <TableHead>Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell>
                      <div className="font-medium">{tier.eventName}</div>
                      <div className="text-xs text-muted-foreground">{tier.eventDate}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tier.name}</Badge>
                    </TableCell>
                    <TableCell>{convertPrice(tier.price)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-24"
                        defaultValue={tier.price}
                        onChange={(e) => handlePriceChange(tier.id, Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      {tier.available_tickets}/{tier.total_tickets}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Discount Codes Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Discount Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Promo codes used in bookings are tracked automatically. Share discount codes with your audience to boost ticket sales.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Early Bird Pricing</span>
              </div>
              <p className="text-xs text-muted-foreground">Automatically lower prices for early purchasers by adjusting tier prices before the event.</p>
            </Card>
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Group Discounts</span>
              </div>
              <p className="text-xs text-muted-foreground">Groups of 5+ automatically receive discounts at checkout (10% for 5+, 20% for 10+).</p>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventPricingPage;
