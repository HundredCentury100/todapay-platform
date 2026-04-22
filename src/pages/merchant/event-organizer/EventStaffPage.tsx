import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getOrganizerEvents } from "@/services/organizerService";
import { toast } from "sonner";
import { Loader2, Plus, UserPlus, Shield, QrCode, Trash2, Edit, CheckCircle, Copy } from "lucide-react";
import QRCode from "react-qr-code";
import { motion, AnimatePresence } from "framer-motion";

interface StaffMember {
  id: string;
  event_id: string;
  user_email: string | null;
  name: string;
  phone: string | null;
  role: string;
  assigned_gate: string | null;
  credential_code: string | null;
  status: string;
  checked_in_at: string | null;
  notes: string | null;
}

const ROLES = [
  { value: "coordinator", label: "Coordinator" },
  { value: "stage_manager", label: "Stage Manager" },
  { value: "gate_security", label: "Gate Security" },
  { value: "ticket_scanner", label: "Ticket Scanner" },
  { value: "volunteer", label: "Volunteer" },
  { value: "medic", label: "Medic" },
  { value: "vendor_liaison", label: "Vendor Liaison" },
];

const STATUS_COLORS: Record<string, string> = {
  invited: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  confirmed: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  checked_in: "bg-primary/20 text-primary",
  declined: "bg-destructive/20 text-destructive",
};

const EventStaffPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("volunteer");
  const [gate, setGate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => { if (selectedEventId) loadStaff(); }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const data = await getOrganizerEvents();
      setEvents(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadStaff = async () => {
    const { data } = await supabase
      .from("event_staff")
      .select("*")
      .eq("event_id", selectedEventId)
      .order("created_at", { ascending: false });
    setStaff((data as StaffMember[]) || []);
  };

  const openDialog = (member?: StaffMember) => {
    if (member) {
      setEditingStaff(member);
      setName(member.name);
      setEmail(member.user_email || "");
      setPhone(member.phone || "");
      setRole(member.role);
      setGate(member.assigned_gate || "");
      setNotes(member.notes || "");
    } else {
      setEditingStaff(null);
      setName(""); setEmail(""); setPhone(""); setRole("volunteer"); setGate(""); setNotes("");
    }
    setDialogOpen(true);
  };

  const save = async () => {
    const payload = {
      event_id: selectedEventId,
      name,
      user_email: email || null,
      phone: phone || null,
      role,
      assigned_gate: gate || null,
      notes: notes || null,
    };

    if (editingStaff) {
      const { error } = await supabase.from("event_staff").update(payload).eq("id", editingStaff.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Staff updated");
    } else {
      const { error } = await supabase.from("event_staff").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Staff added");
    }
    setDialogOpen(false);
    loadStaff();
  };

  const deleteStaff = async (id: string) => {
    await supabase.from("event_staff").delete().eq("id", id);
    toast.success("Staff removed");
    loadStaff();
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "checked_in") updates.checked_in_at = new Date().toISOString();
    await supabase.from("event_staff").update(updates).eq("id", id);
    toast.success(`Status updated to ${status}`);
    loadStaff();
  };

  const showCredential = (member: StaffMember) => {
    setSelectedStaff(member);
    setCredentialDialogOpen(true);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Credential code copied");
  };

  const stats = {
    total: staff.length,
    confirmed: staff.filter(s => s.status === "confirmed" || s.status === "checked_in").length,
    checkedIn: staff.filter(s => s.status === "checked_in").length,
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff & Volunteers</h1>
          <p className="text-muted-foreground">Manage your event team, assign roles, and issue credentials</p>
        </div>
        {selectedEventId && (
          <Button onClick={() => openDialog()}>
            <UserPlus className="w-4 h-4 mr-2" /> Add Staff
          </Button>
        )}
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
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Staff", value: stats.total, icon: Shield },
              { label: "Confirmed", value: stats.confirmed, icon: CheckCircle },
              { label: "Checked In", value: stats.checkedIn, icon: QrCode },
            ].map(s => (
              <Card key={s.label} className="p-4">
                <div className="flex items-center gap-3">
                  <s.icon className="w-8 h-8 text-primary opacity-60" />
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Staff Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Gate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credential</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          {member.user_email && <p className="text-xs text-muted-foreground">{member.user_email}</p>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs capitalize">{member.role.replace("_", " ")}</Badge></TableCell>
                      <TableCell className="text-sm">{member.assigned_gate || "—"}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[member.status] || ""}`}>
                          {member.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => showCredential(member)}>
                          <QrCode className="w-3 h-3 mr-1" /> View
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {member.status === "invited" && (
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => updateStatus(member.id, "confirmed")}>Confirm</Button>
                          )}
                          {member.status === "confirmed" && (
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => updateStatus(member.id, "checked_in")}>Check In</Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog(member)}><Edit className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteStaff(member.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {staff.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No staff added yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingStaff ? "Edit Staff" : "Add Staff"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Assigned Gate / Area</Label><Input value={gate} onChange={e => setGate(e.target.value)} placeholder="Gate A" /></div>
            <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={save} disabled={!name}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credential Dialog */}
      <Dialog open={credentialDialogOpen} onOpenChange={setCredentialDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Staff Credential</DialogTitle></DialogHeader>
          {selectedStaff && (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block mx-auto">
                <QRCode value={selectedStaff.credential_code || selectedStaff.id} size={180} />
              </div>
              <div>
                <p className="font-bold text-lg">{selectedStaff.name}</p>
                <Badge className="capitalize">{selectedStaff.role.replace("_", " ")}</Badge>
                {selectedStaff.assigned_gate && <p className="text-sm text-muted-foreground mt-1">Gate: {selectedStaff.assigned_gate}</p>}
              </div>
              <div className="flex items-center gap-2 justify-center">
                <code className="text-sm bg-muted px-3 py-1 rounded">{selectedStaff.credential_code}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(selectedStaff.credential_code || "")}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventStaffPage;
