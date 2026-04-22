import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, Plus, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAllFloatAccounts, loadAgentFloat, getFloatTransactions, type FloatAccount, type FloatTransaction } from "@/services/agentFloatService";
import { format } from "date-fns";

export default function AdminAgentFloatManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [loadAmount, setLoadAmount] = useState("");
  const [loadCurrency, setLoadCurrency] = useState<"USD" | "ZWG">("USD");
  const [loadDescription, setLoadDescription] = useState("");
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);

  // Get all agents (booking_agent type)
  const { data: agents = [] } = useQuery({
    queryKey: ["admin-agents-for-float"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merchant_profiles")
        .select("id, business_name, business_email, agent_code, role")
        .in("role", ["booking_agent", "travel_agent"])
        .eq("verification_status", "verified")
        .order("business_name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: floatAccounts = [], isLoading } = useQuery({
    queryKey: ["admin-float-accounts"],
    queryFn: getAllFloatAccounts,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["admin-float-history", viewingHistory],
    queryFn: () => (viewingHistory ? getFloatTransactions(viewingHistory, 100) : Promise.resolve([])),
    enabled: !!viewingHistory,
  });

  const loadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedAgentId || !loadAmount) throw new Error("Missing fields");
      return loadAgentFloat(selectedAgentId, parseFloat(loadAmount), loadCurrency, user.id, loadDescription || "Admin float load");
    },
    onSuccess: () => {
      toast.success("Float loaded successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-float-accounts"] });
      setLoadAmount("");
      setLoadDescription("");
      setSelectedAgentId("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to load float");
    },
  });

  const floatAccountMap = new Map(floatAccounts.map((fa: any) => [fa.agent_profile_id, fa]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agent Float Management</h1>
        <p className="text-sm text-muted-foreground">Load and monitor agent pre-funded float accounts</p>
      </div>

      {/* Load Float Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Load Float
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2 lg:col-span-2">
              <Label>Agent</Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger><SelectValue placeholder="Select agent..." /></SelectTrigger>
                <SelectContent>
                  {agents.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.agent_code} — {a.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={loadAmount}
                onChange={(e) => setLoadAmount(e.target.value)}
                placeholder="0.00"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={loadCurrency} onValueChange={(v) => setLoadCurrency(v as "USD" | "ZWG")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ZWG">ZWG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input
                value={loadDescription}
                onChange={(e) => setLoadDescription(e.target.value)}
                placeholder="Payment ref..."
              />
            </div>
          </div>
          <Button
            className="mt-4"
            onClick={() => loadMutation.mutate()}
            disabled={loadMutation.isPending || !selectedAgentId || !loadAmount}
          >
            {loadMutation.isPending ? "Loading..." : "Load Float"}
          </Button>
        </CardContent>
      </Card>

      {/* Float Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Agent Float Balances
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">USD Balance</TableHead>
                <TableHead className="text-right">ZWG Balance</TableHead>
                <TableHead className="text-right">Total Loaded (USD)</TableHead>
                <TableHead className="text-right">Total Deducted (USD)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent: any) => {
                const fa = floatAccountMap.get(agent.id) as any;
                const usdLow = fa && fa.balance_usd < fa.low_balance_threshold_usd;
                const usdZero = fa && fa.balance_usd <= 0;
                return (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.business_name}</TableCell>
                    <TableCell className="font-mono text-xs">{agent.agent_code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {agent.role === "booking_agent" ? "External" : "Internal"}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${usdZero ? "text-destructive" : usdLow ? "text-yellow-600" : ""}`}>
                      ${(fa?.balance_usd || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ZWG {(fa?.balance_zwg || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${(fa?.total_loaded_usd || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${(fa?.total_deducted_usd || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {usdZero ? (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" /> Empty
                        </Badge>
                      ) : usdLow ? (
                        <Badge className="text-xs gap-1 bg-yellow-500/15 text-yellow-700 border-yellow-200">
                          <AlertTriangle className="h-3 w-3" /> Low
                        </Badge>
                      ) : fa ? (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">No Account</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {fa && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingHistory(viewingHistory === fa.id ? null : fa.id)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {agents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No verified agents found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction History */}
      {viewingHistory && transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs">{format(new Date(tx.created_at), "dd MMM HH:mm")}</TableCell>
                    <TableCell>
                      <Badge variant={tx.transaction_type === "load" ? "default" : "secondary"} className="text-xs capitalize">
                        {tx.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.currency}</TableCell>
                    <TableCell className={`text-right font-bold ${tx.transaction_type === "load" ? "text-green-600" : "text-destructive"}`}>
                      {tx.transaction_type === "load" ? "+" : "-"}{tx.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{tx.balance_after.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{tx.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
