import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Save, Laptop } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const WorkspacePricingPage = () => {
  const { merchantProfile } = useMerchantAuth();
  const queryClient = useQueryClient();
  const { convertPrice } = useCurrency();
  const [editedRates, setEditedRates] = useState<Record<string, any>>({});

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspace-pricing', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type, hourly_rate, daily_rate, weekly_rate, monthly_rate, status')
        .eq('merchant_profile_id', merchantProfile.id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, rates }: { id: string; rates: any }) => {
      const { error } = await supabase
        .from('workspaces')
        .update(rates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-pricing'] });
      toast.success("Rates updated");
    },
    onError: () => toast.error("Failed to update rates"),
  });

  const handleRateChange = (wsId: string, field: string, value: string) => {
    setEditedRates(prev => ({
      ...prev,
      [wsId]: { ...prev[wsId], [field]: value === '' ? null : parseFloat(value) },
    }));
  };

  const handleSave = async (wsId: string) => {
    const rates = editedRates[wsId];
    if (!rates) return;
    await updateMutation.mutateAsync({ id: wsId, rates });
    setEditedRates(prev => { const n = { ...prev }; delete n[wsId]; return n; });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pricing</h1>
        <p className="text-muted-foreground">Manage rates for all your workspaces</p>
      </div>

      {workspaces && workspaces.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Rate Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Hourly</TableHead>
                  <TableHead>Daily</TableHead>
                  <TableHead>Weekly</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspaces.map(ws => {
                  const edited = editedRates[ws.id] || {};
                  const hasChanges = Object.keys(edited).length > 0;
                  return (
                    <TableRow key={ws.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ws.name}</span>
                          <Badge variant={ws.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {ws.status}
                          </Badge>
                        </div>
                      </TableCell>
                      {['hourly_rate', 'daily_rate', 'weekly_rate', 'monthly_rate'].map(field => (
                        <TableCell key={field}>
                          <Input
                            type="number"
                            className="w-24"
                            placeholder="—"
                            defaultValue={ws[field as keyof typeof ws] as number || ''}
                            onChange={(e) => handleRateChange(ws.id, field, e.target.value)}
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          size="sm"
                          disabled={!hasChanges || updateMutation.isPending}
                          onClick={() => handleSave(ws.id)}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Laptop className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workspaces</h3>
            <p className="text-muted-foreground">Add workspaces first to manage pricing</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkspacePricingPage;
