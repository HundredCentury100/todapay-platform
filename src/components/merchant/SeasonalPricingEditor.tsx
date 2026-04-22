import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SeasonalRule {
  id: string;
  name: string;
  rule_type: string;
  adjustment: number;
  price_multiplier: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface SeasonalPricingEditorProps {
  propertyId: string;
  roomIds?: string[];
}

export const SeasonalPricingEditor = ({ propertyId, roomIds }: SeasonalPricingEditorProps) => {
  const [rules, setRules] = useState<SeasonalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    rule_type: "percentage",
    adjustment: 0,
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    fetchRules();
  }, [propertyId]);

  const fetchRules = async () => {
    const { data, error } = await supabase
      .from('seasonal_pricing_rules')
      .select('*')
      .eq('property_id', propertyId)
      .order('start_date');

    if (!error && data) {
      setRules(data as any[]);
    }
    setLoading(false);
  };

  const handleAddRule = async () => {
    if (!newRule.name || !newRule.start_date || !newRule.end_date) {
      toast.error("Please fill all fields");
      return;
    }

    const { error } = await supabase.from('seasonal_pricing_rules').insert({
      property_id: propertyId,
      name: newRule.name,
      rule_type: newRule.rule_type,
      adjustment: newRule.adjustment,
      price_multiplier: newRule.rule_type === 'percentage' ? 1 + (newRule.adjustment / 100) : 1,
      start_date: newRule.start_date,
      end_date: newRule.end_date,
      room_ids: roomIds || [],
      is_active: true,
    } as any);

    if (error) {
      toast.error("Failed to add pricing rule");
      console.error(error);
    } else {
      toast.success("Pricing rule added");
      setShowDialog(false);
      setNewRule({ name: "", rule_type: "percentage", adjustment: 0, start_date: "", end_date: "" });
      fetchRules();
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from('seasonal_pricing_rules').update({ is_active: active }).eq('id', id);
    fetchRules();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('seasonal_pricing_rules').delete().eq('id', id);
    toast.success("Rule deleted");
    fetchRules();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seasonal Pricing Rules
          </CardTitle>
          <Button size="sm" onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : rules.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No seasonal pricing rules yet. Add rules to automatically adjust prices for holidays, weekends, or peak seasons.
          </p>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{rule.name}</span>
                    <Badge variant={rule.adjustment > 0 ? "default" : "secondary"} className="text-xs">
                      {rule.adjustment > 0 ? '+' : ''}{rule.adjustment}%
                    </Badge>
                    {!rule.is_active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rule.start_date} → {rule.end_date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={rule.is_active} onCheckedChange={(v) => handleToggle(rule.id, v)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(rule.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Seasonal Pricing Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                placeholder="e.g., Holiday Season, Weekend Premium"
                value={newRule.name}
                onChange={(e) => setNewRule(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Adjustment (%)</Label>
              <Input
                type="number"
                placeholder="e.g., 30 for +30%"
                value={newRule.adjustment}
                onChange={(e) => setNewRule(p => ({ ...p, adjustment: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">
                Positive values increase price, negative decrease
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newRule.start_date}
                  onChange={(e) => setNewRule(p => ({ ...p, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newRule.end_date}
                  onChange={(e) => setNewRule(p => ({ ...p, end_date: e.target.value }))}
                />
              </div>
            </div>
            <Button onClick={handleAddRule} className="w-full">
              Add Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
