import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Phone, Mail, MessageCircle, Mic } from "lucide-react";
import { AgentClient } from "@/types/merchant";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface QuickClientSearchProps {
  open: boolean;
  onClose: () => void;
  clients: AgentClient[];
  onSelectClient: (client: AgentClient) => void;
}

export const QuickClientSearch = ({ open, onClose, clients, onSelectClient }: QuickClientSearchProps) => {
  const [search, setSearch] = useState("");
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  const filteredClients = clients.filter(client =>
    client.client_name.toLowerCase().includes(search.toLowerCase()) ||
    client.client_email.toLowerCase().includes(search.toLowerCase()) ||
    client.client_phone?.toLowerCase().includes(search.toLowerCase()) ||
    client.client_company?.toLowerCase().includes(search.toLowerCase()) ||
    client.client_passport?.toLowerCase().includes(search.toLowerCase())
  );

  const recentClients = [...clients]
    .sort((a, b) => new Date(b.last_booking_date || 0).getTime() - new Date(a.last_booking_date || 0).getTime())
    .slice(0, 5);

  const frequentClients = [...clients]
    .sort((a, b) => (b.total_bookings || 0) - (a.total_bookings || 0))
    .slice(0, 10);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
    };

    recognition.start();
  };

  const handleQuickAction = (client: AgentClient, action: 'call' | 'email' | 'whatsapp') => {
    switch (action) {
      case 'call':
        window.location.href = `tel:${client.client_phone}`;
        break;
      case 'email':
        window.location.href = `mailto:${client.client_email}`;
        break;
      case 'whatsapp':
        window.open(`https://wa.me/${client.client_phone?.replace(/\D/g, '')}`, '_blank');
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Quick Client Search</DialogTitle>
        </DialogHeader>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, company, or passport..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-12 h-12"
            />
            {('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute right-1 top-1/2 -translate-y-1/2",
                  isListening && "text-primary animate-pulse"
                )}
                onClick={startVoiceSearch}
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {search ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Search Results</h3>
              {filteredClients.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No clients found</p>
              ) : (
                filteredClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onSelect={onSelectClient}
                    onQuickAction={handleQuickAction}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {recentClients.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Recent Clients</h3>
                  {recentClients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onSelect={onSelectClient}
                      onQuickAction={handleQuickAction}
                    />
                  ))}
                </div>
              )}

              {frequentClients.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Frequent Clients</h3>
                  {frequentClients.slice(0, 5).map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onSelect={onSelectClient}
                      onQuickAction={handleQuickAction}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ClientCardProps {
  client: AgentClient;
  onSelect: (client: AgentClient) => void;
  onQuickAction: (client: AgentClient, action: 'call' | 'email' | 'whatsapp') => void;
}

const ClientCard = ({ client, onSelect, onQuickAction }: ClientCardProps) => (
  <div
    className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary cursor-pointer transition-colors min-h-[68px]"
    onClick={() => onSelect(client)}
  >
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
      <span className="text-lg font-semibold text-primary">
        {client.client_name.charAt(0).toUpperCase()}
      </span>
    </div>
    
    <div className="flex-1 min-w-0">
      <p className="font-medium truncate">{client.client_name}</p>
      <p className="text-xs text-muted-foreground truncate">
        {client.client_company && `${client.client_company} · `}
        {client.total_bookings || 0} bookings
      </p>
      <p className="text-xs text-muted-foreground truncate">
        {client.client_phone} · {client.client_email}
      </p>
    </div>

    <div className="flex gap-1 flex-shrink-0">
      {client.client_phone && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction(client, 'call');
            }}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction(client, 'whatsapp');
            }}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={(e) => {
          e.stopPropagation();
          onQuickAction(client, 'email');
        }}
      >
        <Mail className="h-4 w-4" />
      </Button>
    </div>
  </div>
);