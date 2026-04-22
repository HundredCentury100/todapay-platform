import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Participant {
  name: string;
  account_number: string;
  amount: number;
}

export default function SplitBill() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([{ name: "", account_number: "", amount: 0 }]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("split_bills").select("*").eq("creator_user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setBills(data || []);
    });
  }, [user]);

  const splitEqually = () => {
    const t = parseFloat(total) || 0;
    const per = t / (participants.length + 1);
    setParticipants(participants.map((p) => ({ ...p, amount: parseFloat(per.toFixed(2)) })));
  };

  const create = async () => {
    if (!user || !title || !total) return;
    setBusy(true);
    const { data: bill, error } = await supabase.from("split_bills").insert({
      creator_user_id: user.id,
      title,
      total_amount: parseFloat(total),
      currency: "USD",
    }).select().single();
    if (error || !bill) { toast.error("Failed"); setBusy(false); return; }

    const validParts = participants.filter((p) => p.name && p.amount > 0);
    if (validParts.length) {
      await supabase.from("split_bill_participants").insert(
        validParts.map((p) => ({
          split_bill_id: bill.id,
          participant_name: p.name,
          participant_account_number: p.account_number || null,
          amount_owed: p.amount,
        }))
      );
    }
    toast.success("Split bill created");
    setShowCreate(false);
    setTitle(""); setTotal(""); setParticipants([{ name: "", account_number: "", amount: 0 }]);
    setBills([bill, ...bills]);
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--revolut-bg))] text-[hsl(var(--revolut-text))]">
      <div className="px-4 pt-12 pb-24 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="revolut-action-btn h-10 w-10 rounded-full flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Split Bills</h1>
          <button onClick={() => setShowCreate(!showCreate)} className="revolut-action-btn h-10 w-10 rounded-full flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {showCreate && (
          <div className="revolut-card rounded-3xl p-5 mb-4 space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Dinner at Joe's" className="bg-[hsl(var(--revolut-bg))] border-[hsl(var(--revolut-border))]" />
            </div>
            <div>
              <Label>Total amount</Label>
              <Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} className="bg-[hsl(var(--revolut-bg))] border-[hsl(var(--revolut-border))]" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Participants</Label>
                <Button size="sm" variant="ghost" onClick={splitEqually}>Split equally</Button>
              </div>
              {participants.map((p, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 mb-2">
                  <Input placeholder="Name" value={p.name} onChange={(e) => { const np = [...participants]; np[i].name = e.target.value; setParticipants(np); }} className="bg-[hsl(var(--revolut-bg))] border-[hsl(var(--revolut-border))]" />
                  <Input type="number" placeholder="$" value={p.amount || ""} onChange={(e) => { const np = [...participants]; np[i].amount = parseFloat(e.target.value) || 0; setParticipants(np); }} className="w-20 bg-[hsl(var(--revolut-bg))] border-[hsl(var(--revolut-border))]" />
                  <button onClick={() => setParticipants(participants.filter((_, idx) => idx !== i))} className="h-9 w-9 rounded-full flex items-center justify-center text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setParticipants([...participants, { name: "", account_number: "", amount: 0 }])} className="border-[hsl(var(--revolut-border))] bg-transparent text-[hsl(var(--revolut-text))]">
                <Plus className="h-3 w-3 mr-1" /> Add person
              </Button>
            </div>

            <Button onClick={create} disabled={busy || !title || !total} className="w-full bg-[hsl(var(--revolut-accent))] text-white rounded-full">
              Create split
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {bills.map((b) => (
            <div key={b.id} className="revolut-card rounded-2xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-pink-500/15 flex items-center justify-center">
                <Users className="h-5 w-5 text-pink-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{b.title}</p>
                <p className="text-xs text-[hsl(var(--revolut-text-muted))] capitalize">{b.status}</p>
              </div>
              <p className="font-bold">${b.total_amount.toFixed(2)}</p>
            </div>
          ))}
          {bills.length === 0 && !showCreate && (
            <div className="revolut-card rounded-3xl p-8 text-center">
              <Users className="h-10 w-10 mx-auto text-[hsl(var(--revolut-text-muted))] mb-2" />
              <p className="text-sm text-[hsl(var(--revolut-text-muted))]">No split bills yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
