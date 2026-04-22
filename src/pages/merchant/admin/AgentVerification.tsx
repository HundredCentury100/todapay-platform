import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye } from "lucide-react";

export default function AgentVerification() {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [commissionRate, setCommissionRate] = useState("10");
  const [agentTier, setAgentTier] = useState<'standard' | 'silver' | 'gold' | 'platinum'>('standard');
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: pendingAgents = [], isLoading } = useQuery({
    queryKey: ['pending-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_profiles')
        .select('*')
        .in('role', ['travel_agent', 'booking_agent'])
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ agentId, status }: { agentId: string; status: 'verified' | 'rejected' }) => {
      const updates: any = {
        verification_status: status,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
      };

      if (status === 'verified') {
        updates.commission_rate = parseFloat(commissionRate);
        updates.agent_tier = agentTier;
      }

      const { error } = await supabase
        .from('merchant_profiles')
        .update(updates)
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-agents'] });
      toast.success(`Agent ${variables.status === 'verified' ? 'verified' : 'rejected'} successfully`);
      setShowReviewDialog(false);
      setSelectedAgent(null);
      setCommissionRate("10");
      setAgentTier('standard');
      setReviewNotes("");
    },
    onError: (error) => {
      toast.error("Failed to update agent status");
      console.error(error);
    },
  });

  const handleReview = (agent: any) => {
    setSelectedAgent(agent);
    setCommissionRate(agent.commission_rate?.toString() || "10");
    setAgentTier(agent.agent_tier || 'standard');
    setShowReviewDialog(true);
  };

  const handleVerify = () => {
    if (selectedAgent) {
      verifyMutation.mutate({ agentId: selectedAgent.id, status: 'verified' });
    }
  };

  const handleReject = () => {
    if (selectedAgent) {
      verifyMutation.mutate({ agentId: selectedAgent.id, status: 'rejected' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Agent Verification</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve agent applications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Agent Applications</CardTitle>
          <CardDescription>
            {pendingAgents.length} agent{pendingAgents.length !== 1 ? 's' : ''} waiting for approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingAgents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No pending agent applications
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Agent Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>License #</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.business_name}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={agent.role === 'travel_agent' ? 'border-primary text-primary' : 'border-orange-500 text-orange-600'}
                      >
                        {agent.role === 'travel_agent' ? 'Internal' : 'External'}
                      </Badge>
                    </TableCell>
                    <TableCell>{agent.business_email}</TableCell>
                    <TableCell>{agent.business_phone || 'N/A'}</TableCell>
                    <TableCell>{agent.agent_license_number || 'N/A'}</TableCell>
                    <TableCell>
                      {format(new Date(agent.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(agent)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Agent Application</DialogTitle>
            <DialogDescription>
              Review the agent details and set commission terms
            </DialogDescription>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Business Name</Label>
                  <p className="font-medium">{selectedAgent.business_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Agent Type</Label>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline"
                      className={selectedAgent.role === 'travel_agent' ? 'border-primary text-primary' : 'border-orange-500 text-orange-600'}
                    >
                      {selectedAgent.role === 'travel_agent' ? 'Internal' : 'External'}
                    </Badge>
                    {selectedAgent.agent_code && (
                      <span className="font-mono text-sm text-muted-foreground">{selectedAgent.agent_code}</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedAgent.business_email}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedAgent.business_phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">License Number</Label>
                  <p className="font-medium">{selectedAgent.agent_license_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Applied Date</Label>
                  <p className="font-medium">
                    {format(new Date(selectedAgent.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">Commission Settings</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agent_tier">Agent Tier</Label>
                    <select
                      id="agent_tier"
                      value={agentTier}
                      onChange={(e) => setAgentTier(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="standard">Standard (8-10%)</option>
                      <option value="silver">Silver (10-12%)</option>
                      <option value="gold">Gold (12-15%)</option>
                      <option value="platinum">Platinum (15-18%)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Review Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add any notes about this verification"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={verifyMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={verifyMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Verify
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
