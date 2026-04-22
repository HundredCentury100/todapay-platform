import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw, Settings2, Layers, Info } from "lucide-react";
import { PAYOUT_DAY } from "@/config/agentCommissionConfig";

interface CommissionConfigRow {
  id: string;
  config_type: string;
  config_key: string;
  rate_type: string;
  rate_value: number;
  multiplier: number;
  min_bookings: number;
  is_active: boolean;
  updated_at: string;
}

const VERTICAL_LABELS: Record<string, string> = {
  bus: "Bus",
  event: "Events",
  stay: "Stays / Property",
  property: "Property",
  car_rental: "Car Rental",
  flight: "Flights",
  workspace: "Workspaces",
  transfer: "Transfers",
  experience: "Experiences",
  venue: "Venues",
  bill_payment: "Bill Payments",
};

const TIER_LABELS: Record<string, string> = {
  standard: "Standard",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

export default function CommissionConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verticalRates, setVerticalRates] = useState<CommissionConfigRow[]>([]);
  const [tierMultipliers, setTierMultipliers] = useState<CommissionConfigRow[]>([]);
  const [editedRows, setEditedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("commission_config" as any)
        .select("*")
        .order("config_key");

      if (error) throw error;

      const rows = (data || []) as unknown as CommissionConfigRow[];
      setVerticalRates(rows.filter((r) => r.config_type === "vertical_rate"));
      setTierMultipliers(rows.filter((r) => r.config_type === "tier_multiplier"));
      setEditedRows(new Set());
    } catch (error) {
      console.error("Error loading commission config:", error);
      toast.error("Failed to load commission configuration");
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (id: string, field: string, value: number | string) => {
    const updateList = (list: CommissionConfigRow[], setter: (v: CommissionConfigRow[]) => void) => {
      const idx = list.findIndex((r) => r.id === id);
      if (idx >= 0) {
        const updated = [...list];
        updated[idx] = { ...updated[idx], [field]: value };
        setter(updated);
        setEditedRows((prev) => new Set(prev).add(id));
      }
    };
    updateList(verticalRates, setVerticalRates);
    updateList(tierMultipliers, setTierMultipliers);
  };

  const saveChanges = async () => {
    if (editedRows.size === 0) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const allRows = [...verticalRates, ...tierMultipliers];
      const changedRows = allRows.filter((r) => editedRows.has(r.id));

      for (const row of changedRows) {
        const { error } = await supabase
          .from("commission_config" as any)
          .update({
            rate_value: row.rate_value,
            rate_type: row.rate_type,
            multiplier: row.multiplier,
            min_bookings: row.min_bookings,
            is_active: row.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);

        if (error) throw error;
      }

      toast.success(`Saved ${changedRows.length} configuration change(s)`);
      setEditedRows(new Set());
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Commission Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Configure vertical commission rates and tier multipliers for agents. Payout day: {PAYOUT_DAY}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConfig} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveChanges} disabled={saving || editedRows.size === 0}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes {editedRows.size > 0 && `(${editedRows.size})`}
          </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Changes here override the default code-level configuration. Effective commission = Base Rate × Tier Multiplier.
          External agents are capped at Gold tier. Only internal agents earn referral override commissions.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="verticals">
        <TabsList>
          <TabsTrigger value="verticals" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Vertical Rates
          </TabsTrigger>
          <TabsTrigger value="tiers" className="gap-2">
            <Layers className="h-4 w-4" />
            Tier Multipliers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verticals">
          <Card>
            <CardHeader>
              <CardTitle>Vertical Commission Rates</CardTitle>
              <CardDescription>
                Base commission rate per booking vertical. Agents earn this rate multiplied by their tier multiplier.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vertical</TableHead>
                    <TableHead>Rate Type</TableHead>
                    <TableHead>Base Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verticalRates.map((row) => (
                    <TableRow key={row.id} className={editedRows.has(row.id) ? "bg-accent/30" : ""}>
                      <TableCell className="font-medium">
                        {VERTICAL_LABELS[row.config_key] || row.config_key}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.rate_type}
                          onValueChange={(v) => updateRow(row.id, "rate_type", v)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="flat">Flat ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-24"
                            value={row.rate_value}
                            onChange={(e) => updateRow(row.id, "rate_value", parseFloat(e.target.value) || 0)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {row.rate_type === "percentage" ? "%" : "$"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={row.is_active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => updateRow(row.id, "is_active", !row.is_active ? 1 : 0)}
                        >
                          {row.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers">
          <Card>
            <CardHeader>
              <CardTitle>Tier Multipliers</CardTitle>
              <CardDescription>
                Multiplier applied on top of vertical base rates. Higher tiers reward more active agents.
                External agents are automatically capped at Gold.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Multiplier</TableHead>
                    <TableHead>Min Monthly Bookings</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tierMultipliers.map((row) => (
                    <TableRow key={row.id} className={editedRows.has(row.id) ? "bg-accent/30" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {TIER_LABELS[row.config_key] || row.config_key}
                          {row.config_key === "gold" && (
                            <Badge variant="outline" className="text-xs">
                              External cap
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            className="w-24"
                            value={row.multiplier}
                            onChange={(e) => updateRow(row.id, "multiplier", parseFloat(e.target.value) || 1)}
                          />
                          <span className="text-sm text-muted-foreground">×</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          className="w-24"
                          value={row.min_bookings}
                          onChange={(e) => updateRow(row.id, "min_bookings", parseInt(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={row.is_active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => updateRow(row.id, "is_active", !row.is_active ? 1 : 0)}
                        >
                          {row.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Example calculation */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                <h4 className="text-sm font-semibold mb-2">Example Calculation</h4>
                <p className="text-sm text-muted-foreground">
                  A <strong>Gold</strong> internal agent books a <strong>Stay</strong> worth $1,000:
                </p>
                <p className="text-sm mt-1">
                  Commission = $1,000 × 5% (base) × 1.5× (Gold) = <strong>$75.00</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
