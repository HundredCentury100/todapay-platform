import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getOrganizerEvents } from "@/services/organizerService";
import { toast } from "sonner";
import { Loader2, Plus, Trophy, DollarSign, Edit, Trash2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface Sponsor {
  id: string;
  event_id: string;
  sponsor_name: string;
  logo_url: string | null;
  tier: string;
  website_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  placement: string[];
  amount_paid: number;
  payment_status: string;
  status: string;
  notes: string | null;
}

const TIERS = [
  { value: "title", label: "Title Sponsor", color: "bg-amber-400 text-amber-900" },
  { value: "gold", label: "Gold", color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" },
  { value: "silver", label: "Silver", color: "bg-gray-400/20 text-gray-700 dark:text-gray-300" },
  { value: "bronze", label: "Bronze", color: "bg-orange-600/20 text-orange-700 dark:text-orange-300" },
  { value: "partner", label: "Partner", color: "bg-primary/20 text-primary" },
];

const PLACEMENTS = ["stage_banner", "program", "ticket", "digital", "entrance", "vip_area", "wristband"];

const SponsorsPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);

  // Form
  const [sponsorName, setSponsorName] = useState("");
  const [tier, setTier] = useState("bronze");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => { if (selectedEventId) loadSponsors(); }, [selectedEventId]);

  const loadEvents = async () => {
    try { const data = await getOrganizerEvents(); setEvents(data || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadSponsors = async () => {
    const { data } = await supabase
      .from("event_sponsors")
      .select("*")
      .eq("event_id", selectedEventId)
      .order("created_at", { ascending: false });
    setSponsors((data as Sponsor[]) || []);
  };

  const openDialog = (sponsor?: Sponsor) => {
    if (sponsor) {
      setEditing(sponsor);
      setSponsorName(sponsor.sponsor_name);
      setTier(sponsor.tier);
      setWebsiteUrl(sponsor.website_url || "");
      setContactName(sponsor.contact_name || "");
      setContactEmail(sponsor.contact_email || "");
      setContactPhone(sponsor.contact_phone || "");
      setAmountPaid(sponsor.amount_paid?.toString() || "0");
      setPaymentStatus(sponsor.payment_status);
      setStatus(sponsor.status);
      setNotes(sponsor.notes || "");
    } else {
      setEditing(null);
      setSponsorName(""); setTier("bronze"); setWebsiteUrl(""); setContactName("");
      setContactEmail(""); setContactPhone(""); setAmountPaid("0"); setPaymentStatus("pending");
      setStatus("pending"); setNotes("");
    }
    setDialogOpen(true);
  };

  const save = async () => {
    const payload = {
      event_id: selectedEventId,
      sponsor_name: sponsorName,
      tier,
      website_url: websiteUrl || null,
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      amount_paid: Number(amountPaid) || 0,
      payment_status: paymentStatus,
      status,
      notes: notes || null,
    };

    if (editing) {
      const { error } = await supabase.from("event_sponsors").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Sponsor updated");
    } else {
      const { error } = await supabase.from("event_sponsors").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Sponsor added");
    }
    setDialogOpen(false);
    loadSponsors();
  };

  const deleteSponsor = async (id: string) => {
    await supabase.from("event_sponsors").delete().eq("id", id);
    toast.success("Sponsor removed");
    loadSponsors();
  };

  const totalRevenue = sponsors.reduce((sum, s) => sum + (s.amount_paid || 0), 0);
  const getTierInfo = (t: string) => TIERS.find(x => x.value === t) || TIERS[3];

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sponsor Management</h1>
          <p className="text-muted-foreground">Manage sponsors, tiers, and deliverables</p>
        </div>
        {selectedEventId && (
          <Button onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" /> Add Sponsor
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
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Total Sponsors</p>
              <p className="text-2xl font-bold">{sponsors.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Confirmed</p>
              <p className="text-2xl font-bold">{sponsors.filter(s => s.status === "confirmed").length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Sponsorship Revenue</p>
              <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Pending Payment</p>
              <p className="text-2xl font-bold">${sponsors.filter(s => s.payment_status === "pending").reduce((s, x) => s + x.amount_paid, 0).toLocaleString()}</p>
            </Card>
          </div>

          {/* Sponsor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsors.map((sponsor, i) => {
              const tierInfo = getTierInfo(sponsor.tier);
              return (
                <motion.div
                  key={sponsor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <div className={`h-2 ${tierInfo.color.split(" ")[0]}`} />
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold">{sponsor.sponsor_name}</h3>
                          <Badge className={`text-xs mt-1 ${tierInfo.color}`}>{tierInfo.label}</Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog(sponsor)}><Edit className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteSponsor(sponsor.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>

                      {sponsor.contact_name && <p className="text-sm text-muted-foreground">{sponsor.contact_name}</p>}
                      {sponsor.contact_email && <p className="text-xs text-muted-foreground">{sponsor.contact_email}</p>}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="font-semibold">${sponsor.amount_paid.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={sponsor.payment_status === "paid" ? "default" : "secondary"} className="text-xs">
                            {sponsor.payment_status}
                          </Badge>
                          <Badge variant={sponsor.status === "confirmed" ? "default" : "outline"} className="text-xs">
                            {sponsor.status}
                          </Badge>
                        </div>
                      </div>

                      {sponsor.website_url && (
                        <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline">
                          <ExternalLink className="w-3 h-3" /> Website
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {sponsors.length === 0 && (
              <Card className="col-span-full p-8 text-center text-muted-foreground">
                <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No sponsors added yet</p>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Sponsor" : "Add Sponsor"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div><Label>Sponsor Name</Label><Input value={sponsorName} onChange={e => setSponsorName(e.target.value)} /></div>
            <div><Label>Tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Website URL</Label><Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Contact Name</Label><Input value={contactName} onChange={e => setContactName(e.target.value)} /></div>
              <div><Label>Contact Email</Label><Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} /></div>
            </div>
            <div><Label>Contact Phone</Label><Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount ($)</Label><Input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} /></div>
              <div><Label>Payment Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="invoiced">Invoiced</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={save} disabled={!sponsorName}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SponsorsPage;
