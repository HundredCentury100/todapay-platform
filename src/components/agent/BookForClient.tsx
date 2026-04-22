import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createAgentClient, getAgentClients } from "@/services/agentService";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { AgentClient } from "@/types/merchant";
import { useQuery } from "@tanstack/react-query";

interface BookForClientProps {
  open: boolean;
  onClose: () => void;
  onClientSelected: (client: AgentClient) => void;
}

export const BookForClient = ({ open, onClose, onClientSelected }: BookForClientProps) => {
  const { merchantProfile } = useMerchantAuth();
  const [isNewClient, setIsNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [newClientData, setNewClientData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    client_company: "",
    client_passport: "",
    notes: "",
  });

  const { data: clients = [], refetch } = useQuery({
    queryKey: ['agent-clients', merchantProfile?.id],
    queryFn: () => merchantProfile ? getAgentClients(merchantProfile.id) : Promise.resolve([]),
    enabled: !!merchantProfile?.id,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!merchantProfile) return;

    try {
      if (isNewClient) {
        // Create new client
        const newClient = await createAgentClient(merchantProfile.id, newClientData);
        toast.success("Client created successfully");
        await refetch();
        onClientSelected(newClient);
      } else {
        // Use existing client
        const client = clients.find(c => c.id === selectedClientId);
        if (client) {
          onClientSelected(client);
        }
      }
      onClose();
    } catch (error) {
      console.error('Error handling client:', error);
      toast.error("Failed to process client");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select or Add Client</DialogTitle>
          <DialogDescription>
            Choose an existing client or add a new one to book on their behalf
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!isNewClient ? "default" : "outline"}
              onClick={() => setIsNewClient(false)}
              className="flex-1"
            >
              Existing Client
            </Button>
            <Button
              type="button"
              variant={isNewClient ? "default" : "outline"}
              onClick={() => setIsNewClient(true)}
              className="flex-1"
            >
              New Client
            </Button>
          </div>

          {!isNewClient ? (
            <div className="space-y-2">
              <Label>Select Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.client_name} ({client.client_email})
                      {client.client_company && ` - ${client.client_company}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Full Name *</Label>
                  <Input
                    id="client_name"
                    value={newClientData.client_name}
                    onChange={(e) => setNewClientData({ ...newClientData, client_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_email">Email *</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={newClientData.client_email}
                    onChange={(e) => setNewClientData({ ...newClientData, client_email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_phone">Phone Number</Label>
                  <Input
                    id="client_phone"
                    value={newClientData.client_phone}
                    onChange={(e) => setNewClientData({ ...newClientData, client_phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_passport">Passport Number</Label>
                  <Input
                    id="client_passport"
                    value={newClientData.client_passport}
                    onChange={(e) => setNewClientData({ ...newClientData, client_passport: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_company">Company/Organization</Label>
                <Input
                  id="client_company"
                  value={newClientData.client_company}
                  onChange={(e) => setNewClientData({ ...newClientData, client_company: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newClientData.notes}
                  onChange={(e) => setNewClientData({ ...newClientData, notes: e.target.value })}
                  placeholder="Any special requirements or notes about this client"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isNewClient ? "Add Client & Continue" : "Select Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
