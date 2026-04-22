import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getOrganizerEvents } from "@/services/organizerService";
import { toast } from "sonner";
import { Loader2, Plus, Calendar, Clock, Music, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

interface Stage {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  location_within_venue: string | null;
  capacity: number | null;
  sort_order: number;
}

interface ScheduleItem {
  id: string;
  event_id: string;
  stage_id: string | null;
  title: string;
  description: string | null;
  performer_name: string | null;
  performer_image: string | null;
  start_time: string;
  end_time: string;
  day_number: number;
  item_type: string;
}

const ITEM_TYPES = [
  { value: "performance", label: "Performance", icon: "🎵" },
  { value: "keynote", label: "Keynote", icon: "🎤" },
  { value: "workshop", label: "Workshop", icon: "🔧" },
  { value: "break", label: "Break", icon: "☕" },
  { value: "ceremony", label: "Ceremony", icon: "🏆" },
  { value: "panel", label: "Panel Discussion", icon: "💬" },
];

const TYPE_COLORS: Record<string, string> = {
  performance: "bg-primary/20 text-primary border-primary/30",
  keynote: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
  workshop: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  break: "bg-muted text-muted-foreground border-border",
  ceremony: "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30",
  panel: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
};

const FestivalSchedulePage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState("1");

  // Dialogs
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Stage form
  const [stageName, setStageName] = useState("");
  const [stageDesc, setStageDesc] = useState("");
  const [stageLocation, setStageLocation] = useState("");
  const [stageCapacity, setStageCapacity] = useState("");

  // Item form
  const [itemTitle, setItemTitle] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPerformer, setItemPerformer] = useState("");
  const [itemStageId, setItemStageId] = useState("");
  const [itemStartTime, setItemStartTime] = useState("");
  const [itemEndTime, setItemEndTime] = useState("");
  const [itemType, setItemType] = useState("performance");
  const [itemDay, setItemDay] = useState(1);

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => {
    if (selectedEventId) {
      const ev = events.find(e => e.id === selectedEventId);
      setSelectedEvent(ev);
      loadStages();
      loadScheduleItems();
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const data = await getOrganizerEvents();
      setEvents(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadStages = async () => {
    const { data } = await supabase
      .from("event_stages")
      .select("*")
      .eq("event_id", selectedEventId)
      .order("sort_order");
    setStages((data as Stage[]) || []);
  };

  const loadScheduleItems = async () => {
    const { data } = await supabase
      .from("event_schedule_items")
      .select("*")
      .eq("event_id", selectedEventId)
      .order("start_time");
    setScheduleItems((data as ScheduleItem[]) || []);
  };

  const openStageDialog = (stage?: Stage) => {
    if (stage) {
      setEditingStage(stage);
      setStageName(stage.name);
      setStageDesc(stage.description || "");
      setStageLocation(stage.location_within_venue || "");
      setStageCapacity(stage.capacity?.toString() || "");
    } else {
      setEditingStage(null);
      setStageName(""); setStageDesc(""); setStageLocation(""); setStageCapacity("");
    }
    setStageDialogOpen(true);
  };

  const saveStage = async () => {
    const payload = {
      event_id: selectedEventId,
      name: stageName,
      description: stageDesc || null,
      location_within_venue: stageLocation || null,
      capacity: stageCapacity ? Number(stageCapacity) : null,
      sort_order: stages.length,
    };

    if (editingStage) {
      const { error } = await supabase.from("event_stages").update(payload).eq("id", editingStage.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Stage updated");
    } else {
      const { error } = await supabase.from("event_stages").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Stage added");
    }
    setStageDialogOpen(false);
    loadStages();
  };

  const deleteStage = async (id: string) => {
    await supabase.from("event_stages").delete().eq("id", id);
    toast.success("Stage deleted");
    loadStages();
  };

  const openItemDialog = (item?: ScheduleItem) => {
    if (item) {
      setEditingItem(item);
      setItemTitle(item.title);
      setItemDesc(item.description || "");
      setItemPerformer(item.performer_name || "");
      setItemStageId(item.stage_id || "");
      setItemStartTime(item.start_time ? format(new Date(item.start_time), "HH:mm") : "");
      setItemEndTime(item.end_time ? format(new Date(item.end_time), "HH:mm") : "");
      setItemType(item.item_type);
      setItemDay(item.day_number);
    } else {
      setEditingItem(null);
      setItemTitle(""); setItemDesc(""); setItemPerformer(""); setItemStageId(stages[0]?.id || "");
      setItemStartTime("09:00"); setItemEndTime("10:00"); setItemType("performance");
      setItemDay(Number(activeDay));
    }
    setItemDialogOpen(true);
  };

  const saveItem = async () => {
    const eventDate = selectedEvent?.event_date || new Date().toISOString().split("T")[0];
    const payload = {
      event_id: selectedEventId,
      stage_id: itemStageId || null,
      title: itemTitle,
      description: itemDesc || null,
      performer_name: itemPerformer || null,
      start_time: `${eventDate}T${itemStartTime}:00`,
      end_time: `${eventDate}T${itemEndTime}:00`,
      day_number: itemDay,
      item_type: itemType,
    };

    if (editingItem) {
      const { error } = await supabase.from("event_schedule_items").update(payload).eq("id", editingItem.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Schedule item updated");
    } else {
      const { error } = await supabase.from("event_schedule_items").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Schedule item added");
    }
    setItemDialogOpen(false);
    loadScheduleItems();
  };

  const deleteItem = async (id: string) => {
    await supabase.from("event_schedule_items").delete().eq("id", id);
    toast.success("Item deleted");
    loadScheduleItems();
  };

  const numDays = selectedEvent?.number_of_days || 1;
  const dayItems = scheduleItems.filter(i => i.day_number === Number(activeDay));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Festival & Schedule Builder</h1>
          <p className="text-muted-foreground">Create multi-day schedules with stages and performers</p>
        </div>
      </div>

      <div>
        <Label>Event</Label>
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="max-w-md"><SelectValue placeholder="Select event" /></SelectTrigger>
          <SelectContent>
            {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedEventId && (
        <>
          {/* Stages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Stages</CardTitle>
              <Button size="sm" onClick={() => openStageDialog()}>
                <Plus className="w-4 h-4 mr-1" /> Add Stage
              </Button>
            </CardHeader>
            <CardContent>
              {stages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stages yet. Add your first stage.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {stages.map(stage => (
                    <Card key={stage.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-sm">{stage.name}</h4>
                          {stage.location_within_venue && <p className="text-xs text-muted-foreground">{stage.location_within_venue}</p>}
                          {stage.capacity && <Badge variant="secondary" className="text-xs mt-1">Cap: {stage.capacity}</Badge>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openStageDialog(stage)}><Edit className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteStage(stage.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Schedule</CardTitle>
              <Button size="sm" onClick={() => openItemDialog()}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs value={activeDay} onValueChange={setActiveDay}>
                <TabsList>
                  {Array.from({ length: numDays }, (_, i) => (
                    <TabsTrigger key={i + 1} value={String(i + 1)}>Day {i + 1}</TabsTrigger>
                  ))}
                </TabsList>

                {Array.from({ length: numDays }, (_, dayIdx) => (
                  <TabsContent key={dayIdx + 1} value={String(dayIdx + 1)}>
                    {stages.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">Add stages first to organize your schedule.</p>
                    ) : (
                      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
                        {stages.map(stage => {
                          const stageItems = dayItems.filter(i => i.stage_id === stage.id).sort((a, b) => a.start_time.localeCompare(b.start_time));
                          return (
                            <div key={stage.id}>
                              <h4 className="font-semibold text-sm mb-2 text-center">{stage.name}</h4>
                              <div className="space-y-2">
                                {stageItems.map(item => (
                                  <Card key={item.id} className={`p-2 border ${TYPE_COLORS[item.item_type] || "bg-card"}`}>
                                    <div className="flex justify-between items-start">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold truncate">{item.title}</p>
                                        {item.performer_name && <p className="text-xs opacity-80">{item.performer_name}</p>}
                                        <p className="text-[10px] opacity-70 mt-0.5">
                                          <Clock className="w-3 h-3 inline mr-0.5" />
                                          {format(new Date(item.start_time), "HH:mm")} – {format(new Date(item.end_time), "HH:mm")}
                                        </p>
                                      </div>
                                      <div className="flex gap-0.5 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openItemDialog(item)}><Edit className="w-3 h-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteItem(item.id)}><Trash2 className="w-3 h-3" /></Button>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                                {stageItems.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No items</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Stage Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingStage ? "Edit Stage" : "Add Stage"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={stageName} onChange={e => setStageName(e.target.value)} placeholder="Main Stage" /></div>
            <div><Label>Description</Label><Textarea value={stageDesc} onChange={e => setStageDesc(e.target.value)} /></div>
            <div><Label>Location in Venue</Label><Input value={stageLocation} onChange={e => setStageLocation(e.target.value)} placeholder="North End" /></div>
            <div><Label>Capacity</Label><Input type="number" value={stageCapacity} onChange={e => setStageCapacity(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={saveStage} disabled={!stageName}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? "Edit Schedule Item" : "Add Schedule Item"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={itemTitle} onChange={e => setItemTitle(e.target.value)} placeholder="Opening Act" /></div>
            <div><Label>Type</Label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Stage</Label>
              <Select value={itemStageId} onValueChange={setItemStageId}>
                <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Performer / Speaker</Label><Input value={itemPerformer} onChange={e => setItemPerformer(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Time</Label><Input type="time" value={itemStartTime} onChange={e => setItemStartTime(e.target.value)} /></div>
              <div><Label>End Time</Label><Input type="time" value={itemEndTime} onChange={e => setItemEndTime(e.target.value)} /></div>
            </div>
            <div><Label>Day</Label><Input type="number" min={1} max={numDays} value={itemDay} onChange={e => setItemDay(Number(e.target.value))} /></div>
          </div>
          <DialogFooter><Button onClick={saveItem} disabled={!itemTitle || !itemStartTime || !itemEndTime}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FestivalSchedulePage;
