import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Calendar, Pause, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ScheduledPayments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [nextRun, setNextRun] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!user) return;
    supabase.from("scheduled_payments").select("*").eq("user_id", user.id).order("next_run").then(({ data }) => setItems(data || []));
  };

  useEffect(load, [user]);

  const create = async () => {
    if (!user || !name || !amount || !nextRun) return;
    setBusy(true);
    const { error } = await supabase.from("scheduled_payments").insert({
      user_id: user.id,
      recipient_name: name,
      amount: parseFloat(amount),
      currency: "USD",
      frequency,
      next_run: new Date(nextRun).toISOString(),
    });
    setBusy(false);
    if (error) return toast.error("Failed");
    toast.success("Scheduled");
    setShowCreate(false); setName(""); setAmount(""); setNextRun("");
    load();
  };

  const toggle = async (item: any) => {
    await supabase.from("scheduled_payments").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("scheduled_payments").delete().eq("id", id);
    load();
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--revolut-bg))] text-[hsl(var(--revolut-text))]">
      <div className="px-4 pt-12 pb-24 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="revolut-action-btn h-10 w-10 rounded-full flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Scheduled</h1>
          <button onClick={() => setShowCreate(!showCreate)} className="revolut-action-btn h-10 w-10 rounded-full flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {showCreate && (
          <div className="revolut-card rounded-3xl p-5 mb-4 space-y-3">
            <div><Label>Recipient name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-[hsl(var(--revolut-bg))] border-[hsl(var(--revolut-border))]" /></div>
            <div><Label>Amount (USD)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-[hsl(var(--revolut-bg))] border-[hsl(var(--revolut-border))]" /></div>
            <div>
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="bg-[hsl(var(--revolut-bg))] border-[hsl(var(--revolut-border))]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Start date</Label><Input type="datetime-local" value={nextRun} onChange={(e) => setNextRun(e.target.value)} className="bg-[hsl(var(--revolut-bg))] border-[hsl(var(--revolut-border))]" /></div>
            <Button onClick={create} disabled={busy || !name || !amount || !nextRun} className="w-full bg-[hsl(var(--revolut-accent))] text-white rounded-full">Create</Button>
          </div>
        )}

        <div className="space-y-3">
          {items.map((s) => (
            <div key={s.id} className="revolut-card rounded-2xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-500/15 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{s.recipient_name}</p>
                <p className="text-xs text-[hsl(var(--revolut-text-muted))]">${s.amount.toFixed(2)} · {s.frequency} · next {new Date(s.next_run).toLocaleDateString()}</p>
              </div>
              <button onClick={() => toggle(s)} className="h-8 w-8 rounded-full flex items-center justify-center text-[hsl(var(--revolut-text-muted))]">
                {s.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button onClick={() => remove(s.id)} className="h-8 w-8 rounded-full flex items-center justify-center text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && !showCreate && (
            <div className="revolut-card rounded-3xl p-8 text-center">
              <Calendar className="h-10 w-10 mx-auto text-[hsl(var(--revolut-text-muted))] mb-2" />
              <p className="text-sm text-[hsl(var(--revolut-text-muted))]">No scheduled payments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
