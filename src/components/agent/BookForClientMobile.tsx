import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
import { useIsMobile } from "@/hooks/use-mobile";

interface BookForClientMobileProps {
  open: boolean;
  onClose: () => void;
  onClientSelected: (client: AgentClient) => void;
}

export const BookForClientMobile = ({ open, onClose, onClientSelected }: BookForClientMobileProps) => {
  const { merchantProfile } = useMerchantAuth();
  const isMobile = useIsMobile();
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
        const newClient = await createAgentClient(merchantProfile.id, newClientData);
        toast.success("Client created successfully");
        await refetch();
        onClientSelected(newClient);
      } else {
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

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Select or Add Client</SheetTitle>
            <SheetDescription>
              Choose an existing client or add a new one
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={!isNewClient ? "default" : "outline"}
                onClick={() => setIsNewClient(false)}
                className="w-full"
              >
                Existing
              </Button>
              <Button
                type="button"
                variant={isNewClient ? "default" : "outline"}
                onClick={() => setIsNewClient(true)}
                className="w-full"
              >
                New
              </Button>
            </div>

            {!isNewClient ? (
              <div className="space-y-2">
                <Label>Select Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Full Name *</Label>
                  <Input
                    id="client_name"
                    className="h-12"
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
                    className="h-12"
                    value={newClientData.client_email}
                    onChange={(e) => setNewClientData({ ...newClientData, client_email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_phone">Phone Number</Label>
                  <Input
                    id="client_phone"
                    className="h-12"
                    value={newClientData.client_phone}
                    onChange={(e) => setNewClientData({ ...newClientData, client_phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_passport">Passport Number</Label>
                  <Input
                    id="client_passport"
                    className="h-12"
                    value={newClientData.client_passport}
                    onChange={(e) => setNewClientData({ ...newClientData, client_passport: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_company">Company</Label>
                  <Input
                    id="client_company"
                    className="h-12"
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
                    placeholder="Special requirements"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-12">
                {isNewClient ? "Add Client" : "Select"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    );
  }

  return null;
};