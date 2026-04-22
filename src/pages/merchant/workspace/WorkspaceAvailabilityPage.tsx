import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, Plus, Ban, Clock, Repeat } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { WorkspaceBlockDateDialog } from "@/components/merchant/workspace/WorkspaceBlockDateDialog";

interface Workspace {
  id: string;
  name: string;
  workspace_type: string;
}

interface BlockedDate {
  id: string;
  workspace_id: string;
  start_datetime: string;
  end_datetime: string;
  reason: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_day_of_week: number | null;
  created_at: string;
}

interface BookedSlot {
  id: string;
  start_datetime: string;
  end_datetime: string;
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WorkspaceAvailabilityPage = () => {
  const { toast } = useToast();
  const { merchantProfile } = useMerchantAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookings, setBookings] = useState<BookedSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockedDate | null>(null);

  useEffect(() => {
    if (merchantProfile?.id) {
      loadWorkspaces();
    }
  }, [merchantProfile]);

  useEffect(() => {
    if (selectedWorkspace) {
      loadBlockedDates();
      loadBookings();
    }
  }, [selectedWorkspace]);

  const loadWorkspaces = async () => {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id, name, workspace_type')
      .eq('merchant_profile_id', merchantProfile!.id)
      .eq('status', 'active');

    if (!error && data) {
      setWorkspaces(data);
      if (data.length > 0) {
        setSelectedWorkspace(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadBlockedDates = async () => {
    const { data, error } = await supabase
      .from('workspace_blocked_dates')
      .select('*')
      .eq('workspace_id', selectedWorkspace)
      .order('start_datetime', { ascending: true });

    if (!error && data) {
      setBlockedDates(data);
    }
  };

  const loadBookings = async () => {
    const { data, error } = await supabase
      .from('workspace_bookings')
      .select('id, start_datetime, end_datetime')
      .eq('workspace_id', selectedWorkspace)
      .gte('end_datetime', new Date().toISOString());

    if (!error && data) {
      setBookings(data);
    }
  };

  const handleEditBlock = (block: BlockedDate) => {
    setEditingBlock(block);
    setDialogOpen(true);
  };

  const handleDeleteBlock = async (blockId: string) => {
    const { error } = await supabase
      .from('workspace_blocked_dates')
      .delete()
      .eq('id', blockId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete block",
        variant: "destructive"
      });
    } else {
      toast({ title: "Block deleted" });
      loadBlockedDates();
    }
  };

  const handleDialogSuccess = () => {
    loadBlockedDates();
    setEditingBlock(null);
  };

  const getDateModifiers = () => {
    const blocked: Date[] = [];
    const booked: Date[] = [];
    const recurring: Date[] = [];
    
    // Non-recurring blocked dates
    blockedDates.filter(b => !b.is_recurring).forEach(block => {
      const date = parseISO(block.start_datetime);
      blocked.push(date);
    });

    // Recurring blocks - mark next 3 months
    blockedDates.filter(b => b.is_recurring && b.recurrence_day_of_week !== null).forEach(block => {
      const today = new Date();
      for (let i = 0; i < 90; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        if (checkDate.getDay() === block.recurrence_day_of_week) {
          recurring.push(new Date(checkDate));
        }
      }
    });

    // Bookings
    bookings.forEach(booking => {
      const date = parseISO(booking.start_datetime);
      booked.push(date);
    });
    
    return { blocked, booked, recurring };
  };

  const modifiers = getDateModifiers();

  const getSelectedDateBlocks = () => {
    if (!selectedDate) return [];
    
    return blockedDates.filter(block => {
      if (block.is_recurring && block.recurrence_day_of_week !== null) {
        return selectedDate.getDay() === block.recurrence_day_of_week;
      }
      return isSameDay(parseISO(block.start_datetime), selectedDate);
    });
  };

  const selectedDateBlocks = getSelectedDateBlocks();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Availability</h1>
          <p className="text-muted-foreground">Manage workspace availability and block-out dates</p>
        </div>
        <Button onClick={() => { setEditingBlock(null); setDialogOpen(true); }} disabled={!selectedWorkspace}>
          <Plus className="h-4 w-4 mr-2" />
          Block Dates
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <Card className="p-8 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Workspaces</h3>
          <p className="text-muted-foreground mb-4">Add workspaces first to manage availability</p>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Calendar</CardTitle>
                <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map(ws => (
                      <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  blocked: modifiers.blocked,
                  booked: modifiers.booked,
                  recurring: modifiers.recurring
                }}
                modifiersStyles={{
                  blocked: { 
                    backgroundColor: 'hsl(var(--destructive) / 0.2)',
                    color: 'hsl(var(--destructive))',
                    textDecoration: 'line-through'
                  },
                  booked: {
                    backgroundColor: 'hsl(var(--primary) / 0.2)',
                    color: 'hsl(var(--primary))'
                  },
                  recurring: {
                    backgroundColor: 'hsl(var(--chart-3) / 0.2)',
                    color: 'hsl(var(--chart-3))'
                  }
                }}
              />
              
              <div className="flex gap-4 mt-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary/20" />
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-destructive/20" />
                  <span>Blocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-3) / 0.2)' }} />
                  <span>Recurring Block</span>
                </div>
              </div>

              {/* Selected date info */}
              {selectedDate && selectedDateBlocks.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">{format(selectedDate, 'MMMM d, yyyy')}</h4>
                  <div className="space-y-2">
                    {selectedDateBlocks.map(block => (
                      <div key={block.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {block.is_recurring ? (
                            <Repeat className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Ban className="h-4 w-4 text-destructive" />
                          )}
                          <span>{block.reason || 'Blocked'}</span>
                          {block.is_recurring && (
                            <Badge variant="outline" className="text-xs">
                              Every {DAYS_OF_WEEK[block.recurrence_day_of_week!]}
                            </Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleEditBlock(block)}>
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blocked Dates List */}
          <Card>
            <CardHeader>
              <CardTitle>Blocked Dates</CardTitle>
            </CardHeader>
            <CardContent>
              {blockedDates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No blocked dates configured
                </p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {blockedDates.map(block => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        {block.is_recurring ? (
                          <div className="flex items-center gap-2">
                            <Repeat className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">
                                Every {DAYS_OF_WEEK[block.recurrence_day_of_week!]}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {block.reason || 'Recurring block'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-sm">
                              {format(parseISO(block.start_datetime), 'MMM d, yyyy')}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="destructive" className="text-xs">
                                <Ban className="h-3 w-3 mr-1" />
                                {block.reason || 'Blocked'}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBlock(block)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBlock(block.id)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Block Date Dialog */}
      {selectedWorkspace && (
        <WorkspaceBlockDateDialog
          workspaceId={selectedWorkspace}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingBlock(null);
          }}
          onSuccess={handleDialogSuccess}
          editingBlock={editingBlock}
        />
      )}
    </div>
  );
};

export default WorkspaceAvailabilityPage;
