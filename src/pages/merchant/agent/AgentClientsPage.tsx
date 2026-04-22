import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { getAgentClients, deleteAgentClient } from "@/services/agentService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Calendar, Download } from "lucide-react";
import { BookForClient } from "@/components/agent/BookForClient";
import { ClientEditDialog } from "@/components/agent/ClientEditDialog";
import { AgentClient } from "@/types/merchant";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AgentClientsPage() {
  const { merchantProfile } = useMerchantAuth();
  const navigate = useNavigate();
  const [showAddClient, setShowAddClient] = useState(false);
  const [editingClient, setEditingClient] = useState<AgentClient | null>(null);
  const [deletingClient, setDeletingClient] = useState<AgentClient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ['agent-clients', merchantProfile?.id],
    queryFn: () => merchantProfile ? getAgentClients(merchantProfile.id) : Promise.resolve([]),
    enabled: !!merchantProfile?.id,
  });

  const filteredClients = clients.filter(client =>
    client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.client_company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deletingClient) return;

    try {
      await deleteAgentClient(deletingClient.id);
      toast.success("Client deleted successfully");
      refetch();
      setDeletingClient(null);
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      "Name,Email,Phone,Company,Total Bookings,Total Revenue,Last Booking",
      ...filteredClients.map(c =>
        `${c.client_name},${c.client_email},${c.client_phone || ''},${c.client_company || ''},${c.total_bookings},${c.total_revenue},${c.last_booking_date ? format(new Date(c.last_booking_date), 'yyyy-MM-dd') : ''}`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your client relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAddClient(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search clients by name, email, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            {filteredClients.length} of {clients.length} client{clients.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Total Bookings</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead>Last Booking</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No clients found matching your search.' : 'No clients yet. Add your first client to get started!'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.client_name}</TableCell>
                    <TableCell>{client.client_email}</TableCell>
                    <TableCell>{client.client_phone || 'N/A'}</TableCell>
                    <TableCell>{client.client_company || 'N/A'}</TableCell>
                    <TableCell>{client.total_bookings}</TableCell>
                    <TableCell>R {Number(client.total_revenue).toFixed(2)}</TableCell>
                    <TableCell>
                      {client.last_booking_date 
                        ? format(new Date(client.last_booking_date), 'MMM dd, yyyy')
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate('/bus-results')}
                          title="Quick Book"
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingClient(client)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingClient(client)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BookForClient
        open={showAddClient}
        onClose={() => {
          setShowAddClient(false);
          refetch();
        }}
        onClientSelected={() => {
          setShowAddClient(false);
          refetch();
        }}
      />

      <ClientEditDialog
        open={!!editingClient}
        onClose={() => setEditingClient(null)}
        client={editingClient}
        onSuccess={refetch}
      />

      <AlertDialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingClient?.client_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
