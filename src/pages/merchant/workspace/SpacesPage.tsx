import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Laptop, MoreHorizontal, Pencil, Trash2, Eye, Users, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WorkspaceDialog } from "@/components/merchant/WorkspaceDialog";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const WORKSPACE_TYPE_LABELS: Record<string, string> = {
  hot_desk: 'Hot Desk',
  dedicated_desk: 'Dedicated Desk',
  private_office: 'Private Office',
  meeting_room: 'Meeting Room',
  conference_room: 'Conference Room',
  virtual_office: 'Virtual Office',
  event_space: 'Event Space',
  podcast_studio: 'Podcast Studio',
  photo_studio: 'Photo Studio',
};

const getListingQuality = (workspace: any) => {
  const checks = [
    { label: "Photos", done: (workspace.images?.length || 0) >= 3 },
    { label: "Description", done: (workspace.description?.length || 0) >= 50 },
    { label: "Amenities", done: (workspace.amenities?.length || 0) >= 5 },
    { label: "Address", done: !!workspace.address && !!workspace.city },
    { label: "Hourly Rate", done: !!workspace.hourly_rate || !!workspace.daily_rate },
    { label: "Operating Hours", done: Object.keys(workspace.operating_hours || {}).length >= 5 },
  ];
  const completed = checks.filter(c => c.done).length;
  return Math.round((completed / checks.length) * 100);
};

const SpacesPage = () => {
  const { merchantProfile } = useMerchantAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null);

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['merchant-workspaces', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('merchant_profile_id', merchantProfile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('workspaces').insert({ ...data, merchant_profile_id: merchantProfile?.id });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['merchant-workspaces'] }); toast.success("Workspace created"); },
    onError: () => toast.error("Failed to create workspace"),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...rest } = data;
      const { error } = await supabase.from('workspaces').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['merchant-workspaces'] }); toast.success("Workspace updated"); },
    onError: () => toast.error("Failed to update workspace"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspaces').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['merchant-workspaces'] }); toast.success("Workspace deleted"); setDeleteDialogOpen(false); },
    onError: () => toast.error("Failed to delete workspace"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('workspaces').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['merchant-workspaces'] }); toast.success("Status updated"); },
    onError: () => toast.error("Failed to update status"),
  });

  const handleSave = async (data: any) => {
    if (data.id) await updateMutation.mutateAsync(data);
    else await createMutation.mutateAsync(data);
  };

  const getLowestPrice = (workspace: any) => {
    const prices = [workspace.hourly_rate, workspace.daily_rate, workspace.weekly_rate, workspace.monthly_rate].filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">Manage your coworking and remote workspace listings</p>
        </div>
        <Button onClick={() => { setSelectedWorkspace(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Workspace
        </Button>
      </div>

      {workspaces && workspaces.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workspace</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>From Price</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaces.map((workspace) => {
                const quality = getListingQuality(workspace);
                const qualityColor = quality >= 80 ? "text-green-600" : quality >= 50 ? "text-amber-600" : "text-red-500";
                return (
                  <TableRow key={workspace.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {workspace.images?.[0] ? (
                          <img src={workspace.images[0]} alt={workspace.name} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <Laptop className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{workspace.name}</p>
                          <p className="text-sm text-muted-foreground">{workspace.amenities?.length || 0} amenities</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{WORKSPACE_TYPE_LABELS[workspace.workspace_type] || workspace.workspace_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3" />{workspace.city}, {workspace.country}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1"><Users className="h-4 w-4 text-muted-foreground" />{workspace.capacity}</div>
                    </TableCell>
                    <TableCell>${getLowestPrice(workspace)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={quality} className="h-1.5 w-16" />
                        <span className={`text-xs font-semibold ${qualityColor}`}>{quality}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={workspace.status === 'active'}
                        onCheckedChange={(checked) => toggleStatusMutation.mutate({ id: workspace.id, status: checked ? 'active' : 'inactive' })}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(`/workspaces/${workspace.id}`, '_blank')}>
                            <Eye className="h-4 w-4 mr-2" />Preview as Guest
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedWorkspace(workspace); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setWorkspaceToDelete(workspace.id); setDeleteDialogOpen(true); }} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Laptop className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workspaces Yet</h3>
            <p className="text-muted-foreground mb-4">Add your first workspace to start accepting bookings</p>
            <Button onClick={() => { setSelectedWorkspace(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />Add Your First Workspace
            </Button>
          </CardContent>
        </Card>
      )}

      <WorkspaceDialog open={dialogOpen} onOpenChange={setDialogOpen} workspace={selectedWorkspace} onSave={handleSave} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => workspaceToDelete && deleteMutation.mutate(workspaceToDelete)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SpacesPage;
